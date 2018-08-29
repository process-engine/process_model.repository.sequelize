import * as bcrypt from 'bcrypt';
import * as Sequelize from 'sequelize';

import {ConflictError} from '@essential-projects/errors_ts';
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

    const query: Sequelize.FindOptions<IProcessDefinitionAttributes> = {
      where: {
        name: name,
      },
    };

    const existingDefinition: ProcessDefinition = await this.processDefinition.findOne(query);

    if (existingDefinition) {
      if (!overwriteExisting) {
        throw new ConflictError(`Process definition with the name '${name}' already exists!`);
      } else {
        existingDefinition.xml = xml;
        await existingDefinition.save();
      }
    } else {
      await this.processDefinition.create(<any> {
        name: name,
        xml: xml,
      });
    }
  }

  public async getProcessDefinitions(): Promise<Array<Runtime.Types.ProcessDefinitionFromRepository>> {
    const result: Array<ProcessDefinition> = await this.processDefinition.findAll();

    const runtimeProcessDefinitions: Array<Runtime.Types.ProcessDefinitionFromRepository> = result.map(this._convertToProcessDefinitionRuntimeObject);

    return runtimeProcessDefinitions;
  }

  public async getProcessDefinitionByName(name: string): Promise<Runtime.Types.ProcessDefinitionFromRepository> {

    const query: Sequelize.FindOptions<IProcessDefinitionAttributes> = {
      where: {
        name: name,
      },
    };

    const definition: ProcessDefinition = await this.processDefinition.findOne(query);

    return definition;
  }

  public async getByHash(hash: string): Promise<any> {

    const query: Sequelize.FindOptions<IProcessDefinitionAttributes> = {
      where: {
        hash: hash,
      },
    };

    const definition: ProcessDefinition = await this.processDefinition.findOne(query);

    return definition;
  }

  private _convertToProcessDefinitionRuntimeObject(dataModel: ProcessDefinition): Runtime.Types.ProcessDefinitionFromRepository {

    const processDefinition: Runtime.Types.ProcessDefinitionFromRepository = new Runtime.Types.ProcessDefinitionFromRepository();
    processDefinition.name = dataModel.name;
    processDefinition.xml = dataModel.xml;

    return processDefinition;
  }
}
