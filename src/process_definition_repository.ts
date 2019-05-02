import * as bcrypt from 'bcryptjs';
import * as bluebird from 'bluebird';
import {Logger} from 'loggerhythm';

import {DestroyOptions, FindOptions} from 'sequelize';
import {Sequelize, SequelizeOptions} from 'sequelize-typescript';

import {IDisposable} from '@essential-projects/bootstrapper_contracts';
import {ConflictError, NotFoundError} from '@essential-projects/errors_ts';
import {SequelizeConnectionManager} from '@essential-projects/sequelize_connection_manager';

import {IProcessDefinitionRepository, ProcessDefinitionFromRepository} from '@process-engine/process_model.contracts';

import {ProcessDefinitionModel} from './schemas';

const logger: Logger = new Logger('processengine:persistence:process_definition_repository');

export class ProcessDefinitionRepository implements IProcessDefinitionRepository, IDisposable {

  public config: SequelizeOptions;

  private _sequelize: Sequelize;
  private _connectionManager: SequelizeConnectionManager;

  constructor(connectionManager: SequelizeConnectionManager) {
    this._connectionManager = connectionManager;
  }

  public async initialize(): Promise<void> {
    logger.verbose('Initializing Sequelize connection and loading models...');
    const connectionAlreadyEstablished: boolean = this._sequelize !== undefined;
    if (connectionAlreadyEstablished) {
      logger.verbose('Repository already initialized. Done.');

      return;
    }
    this._sequelize = await this._connectionManager.getConnection(this.config);

    this._sequelize.addModels([ProcessDefinitionModel]);
    await this._sequelize.sync();

    logger.verbose('Done.');
  }

  public async dispose(): Promise<void> {
    logger.verbose('Disposing connection');
    await this._connectionManager.destroyConnection(this.config);
    this._sequelize = undefined;
    logger.verbose('Done.');
  }

  public async persistProcessDefinitions(name: string, xml: string, overwriteExisting: boolean = true): Promise<void> {

    // Note:
    // Unfortunately, sequelize doesn't have MIN/MAX operators for WHERE clauses.
    // So in order to get the latest matching entry, we have to sort by the creation date and
    // then cherry-pick the first entry.
    const findExistingDefinitionsQuery: FindOptions = {
      limit: 1,
      where: {
        name: name,
      },
      order: [ [ 'createdAt', 'DESC' ]],
    };

    const newProcessDefinitionHash: string = await this._createHashForProcessDefinition(xml);

    const existingDefinitions: Array<ProcessDefinitionModel> = await ProcessDefinitionModel.findAll(findExistingDefinitionsQuery);
    const existingDefinition: ProcessDefinitionModel = existingDefinitions.length > 0
      ? existingDefinitions[0]
      : undefined;

    const definitionAlreadyExists: boolean = existingDefinition !== undefined;
    if (definitionAlreadyExists) {
      if (!overwriteExisting) {
        throw new ConflictError(`Process definition with the name '${name}' already exists!`);
      }

      const hashesMatch: boolean = newProcessDefinitionHash === existingDefinition.hash;
      if (hashesMatch) {
        // Hashes match: No changes were made.
        // Just call "save" to update the "updatedAt" timestamp and move on.
        await existingDefinition.save();

        return;
      }

      // Hashes do not match: Changes were made.
      // Create a new entry with the updated hash.
      await ProcessDefinitionModel.create({
        name: name,
        xml: xml,
        hash: newProcessDefinitionHash,
      });
    } else {

      await ProcessDefinitionModel.create({
        name: name,
        xml: xml,
        hash: newProcessDefinitionHash,
      });
    }
  }

  public async getProcessDefinitions(): Promise<Array<ProcessDefinitionFromRepository>> {

    // Get all unique names
    const names: Array<ProcessDefinitionModel> = await ProcessDefinitionModel.findAll({
      attributes: ['name'],
      group: 'name',
    });

    const namesAsString: Array<string> = names.map((entry: ProcessDefinitionModel): string => {
      return entry.name;
    });

    // Get the most recent definiton for each name.
    //
    // NOTE:
    // We cannot simply use something like "GROUP BY name", because Postgres won't allow it on non-index columns.
    const processDefinitions: Array<ProcessDefinitionModel> =
      await bluebird.map<any, ProcessDefinitionModel>(namesAsString, this.getProcessDefinitionByName.bind(this));

    const runtimeProcessDefinitions: Array<ProcessDefinitionFromRepository> =
      processDefinitions.map(this._convertToProcessDefinitionRuntimeObject);

    return runtimeProcessDefinitions;
  }

  public async getProcessDefinitionByName(name: string): Promise<ProcessDefinitionFromRepository> {

    // Note:
    // For this use case, we only want to get the most up to date version of the process definition.
    //
    // See the comment in "persistProcessDefinitions" as to why we need to do it this way.
    const query: FindOptions = {
      limit: 1,
      where: {
        name: name,
      },
      order: [ [ 'createdAt', 'DESC' ]],
    };

    const definitions: Array<ProcessDefinitionModel> = await ProcessDefinitionModel.findAll(query);

    if (!definitions || definitions.length === 0) {
      throw new NotFoundError(`Process definition with name "${name}" not found.`);
    }

    const definitonRuntime: ProcessDefinitionFromRepository = this._convertToProcessDefinitionRuntimeObject(definitions[0]);

    return definitonRuntime;
  }

  public async deleteProcessDefinitionById(processModelId: string): Promise<void> {
    const queryParams: DestroyOptions = {
      where: {
        name: processModelId,
      },
    };

    await ProcessDefinitionModel.destroy(queryParams);
  }

  public async getHistoryByName(name: string): Promise<Array<ProcessDefinitionFromRepository>> {

    const query: FindOptions = {
      where: {
        name: name,
      },
      order: [ [ 'createdAt', 'DESC' ]],
    };

    const definitions: Array<ProcessDefinitionModel> = await ProcessDefinitionModel.findAll(query);

    const noDefinitionsFound: boolean = !definitions || definitions.length === 0;
    if (noDefinitionsFound) {
      throw new NotFoundError(`Process definition with name "${name}" not found.`);
    }

    const definitonsRuntime: Array<ProcessDefinitionFromRepository> =
      definitions.map(this._convertToProcessDefinitionRuntimeObject.bind(this));

    return definitonsRuntime;
  }

  public async getByHash(hash: string): Promise<any> {

    // Note:
    // Hashes are unique, so there's no need to use that order/limit crutch we have above.
    const query: FindOptions = {
      where: {
        hash: hash,
      },
    };

    const definition: ProcessDefinitionModel = await ProcessDefinitionModel.findOne(query);

    if (!definition) {
      throw new NotFoundError(`Process definition with hash "${hash}" not found.`);
    }

    const definitonRuntime: ProcessDefinitionFromRepository = this._convertToProcessDefinitionRuntimeObject(definition);

    return definitonRuntime;
  }

  /**
   * Creates a hash for the given xml code.
   *
   * @param   xml The xml for which to generate a hash.
   * @returns     The generated hash.
   */
  private async _createHashForProcessDefinition(xml: string): Promise<string> {

    // NOTE:
    // This value is based on the performance notes stated here:
    // https://www.npmjs.com/package/bcrypt#a-note-on-rounds
    //
    // and the fact, that bcryptjs is stated to be about 30% slower:
    // https://www.npmjs.com/package/bcryptjs
    //
    // Process Definitions won't be persisted that often,
    // so 4 rounds should be a reasonable compromise between security and speed.
    const saltRounds: number = 4;

    const hashedXml: string = await bcrypt.hashSync(xml, saltRounds);

    return hashedXml;
  }

  /**
   * Takes a ProcessDefinition object as it was retrieved from the database
   * and convertes it into a Runtime object usable by the ProcessEngine.
   *
   * @param   dataModel The ProcessDefinition data retrieved from the database.
   * @returns           The ProcessEngine runtime object describing a
   *                    ProcessDefinition.
   */
  private _convertToProcessDefinitionRuntimeObject(dataModel: ProcessDefinitionModel): ProcessDefinitionFromRepository {

    const processDefinition: ProcessDefinitionFromRepository = new ProcessDefinitionFromRepository();
    processDefinition.name = dataModel.name;
    processDefinition.xml = dataModel.xml;
    processDefinition.hash = dataModel.hash;
    processDefinition.createdAt = dataModel.createdAt;
    processDefinition.updatedAt = dataModel.updatedAt;

    return processDefinition;
  }
}
