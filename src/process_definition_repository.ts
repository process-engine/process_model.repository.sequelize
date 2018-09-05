import * as bcrypt from 'bcrypt';
import * as Sequelize from 'sequelize';

import {ConflictError, NotFoundError} from '@essential-projects/errors_ts';
import {getConnection} from '@essential-projects/sequelize_connection_manager';

import {IProcessDefinitionRepository, Runtime} from '@process-engine/process_engine_contracts';

import {loadModels} from './model_loader';
import {IProcessDefinitionAttributes, ProcessDefinition} from './schemas';

export class ProcessDefinitionRepository implements IProcessDefinitionRepository {

  public config: Sequelize.Options;

  private _processDefinition: Sequelize.Model<ProcessDefinition, IProcessDefinitionAttributes>;

  private sequelize: Sequelize.Sequelize;

  private get processDefinition(): Sequelize.Model<ProcessDefinition, IProcessDefinitionAttributes> {
    return this._processDefinition;
  }

  public async initialize(): Promise<void> {
    this.sequelize = await getConnection(this.config);
    this._processDefinition = await loadModels(this.sequelize);
  }

  public async persistProcessDefinitions(name: string, xml: string, overwriteExisting: boolean = true): Promise<void> {

    // Note:
    // Unfortunately, sequelize doesn't have MIN/MAX operators for WHERE clauses.
    // So in order to get the latest matching entry, we have to sort by the creation date and
    // then cherry-pick the first entry.
    const query: Sequelize.FindOptions<IProcessDefinitionAttributes> = {
      limit: 1,
      where: {
        name: name,
      },
      order: [ [ 'createdAt', 'DESC' ]],
    };

    const processDefinitionHash: string = await this._createHashForProcessDefinition(xml);

    const existingDefinitions: Array<ProcessDefinition> = await this.processDefinition.findAll(query)[0];
    const existingDefinition: ProcessDefinition = existingDefinitions.length > 0
      ? existingDefinitions[0]
      : undefined;

    if (existingDefinition) {

      if (!overwriteExisting) {
        throw new ConflictError(`Process definition with the name '${name}' already exists!`);
      }

      const hashesMatch = await bcrypt.compare(xml, existingDefinition.hash);
      if (hashesMatch) {
        // Hashes match: No changes were made.
        // Just call "save" to update the "updatedAt" timestamp and move on.
        await existingDefinition.save();

        return;
      }

      // Hashes do not match: Changes were made.
      // Create a new entry with the updated hash.
      const createParams: any = {
        name: name,
        xml: xml,
        hash: processDefinitionHash,
      }

      await this.processDefinition.create(createParams);
    } else {

      await this.processDefinition.create(<any> {
        name: name,
        xml: xml,
        hash: processDefinitionHash,
      });
    }
  }

  public async getProcessDefinitions(): Promise<Array<Runtime.Types.ProcessDefinitionFromRepository>> {
    const result: Array<ProcessDefinition> = await this.processDefinition.findAll();

    const runtimeProcessDefinitions: Array<Runtime.Types.ProcessDefinitionFromRepository> = result.map(this._convertToProcessDefinitionRuntimeObject);

    return runtimeProcessDefinitions;
  }

  public async getProcessDefinitionByName(name: string): Promise<Runtime.Types.ProcessDefinitionFromRepository> {

    // Note:
    // For this use case, we only want to get the most up to date version of the process definition.
    //
    // See the comment in "persistProcessDefinitions" as to why we need to do it this way.
    const query: Sequelize.FindOptions<IProcessDefinitionAttributes> = {
      limit: 1,
      where: {
        name: name,
      },
      order: [ [ 'createdAt', 'DESC' ]],
    };

    const definitions: Array<ProcessDefinition> = await this.processDefinition.findAll(query);

    if (!definitions || definitions.length === 0) {
      throw new NotFoundError(`Process definition with name "${name}" not found.`);
    }

    const definitonRuntime: Runtime.Types.ProcessDefinitionFromRepository = this._convertToProcessDefinitionRuntimeObject(definitions[0]);

    return definitonRuntime;
  }

  public async getByHash(hash: string): Promise<any> {

    // Note:
    // Hashes are unique, so there's no need to use that order/limit crutch we have above.
    const query: Sequelize.FindOptions<IProcessDefinitionAttributes> = {
      where: {
        hash: hash,
      },
    };

    const definition: ProcessDefinition = await this.processDefinition.findOne(query);

    if (!definition) {
      throw new NotFoundError(`Process definition with hash "${hash}" not found.`);
    }

    const definitonRuntime: Runtime.Types.ProcessDefinitionFromRepository = this._convertToProcessDefinitionRuntimeObject(definition);

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
    // Process Definitions won't be persisted that often,
    // so 10 rounds should be a reasonable compromise between security and speed.
    const saltRounds: number = 10;

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
  private _convertToProcessDefinitionRuntimeObject(dataModel: ProcessDefinition): Runtime.Types.ProcessDefinitionFromRepository {

    const processDefinition: Runtime.Types.ProcessDefinitionFromRepository = new Runtime.Types.ProcessDefinitionFromRepository();
    processDefinition.name = dataModel.name;
    processDefinition.xml = dataModel.xml;
    processDefinition.hash = dataModel.hash;
    processDefinition.createdAt = dataModel.createdAt;
    processDefinition.updatedAt = dataModel.updatedAt;

    return processDefinition;
  }
}
