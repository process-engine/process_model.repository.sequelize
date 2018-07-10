import {IProcessDefinitionRepository, ProcessDefinitionFromRepository} from '@process-engine/process_engine_contracts';

import {getConnection} from '@essential-projects/sequelize_connection_manager';

import * as Sequelize from 'sequelize';

import {loadModels} from './model_loader';
import {IProcessDefinitionAttributes, ProcessDefinition} from './schemas';

export class ProcessDefinitionRepository implements IProcessDefinitionRepository {

  public config: any;
  // {
  //   "username": "admin",
  //   "password": "admin",
  //   "database": "processengine",
  //   "host": "localhost",
  //   "port": 45678,
  //   "dialect": "postgres",
  //   "supportBigNumbers": true,
  //   "resetPasswordRequestTimeToLive": 12
  // }

  private _processDefinition: Sequelize.Model<ProcessDefinition, IProcessDefinitionAttributes>;

  private sequelize: Sequelize.Sequelize;

  private get processDefinition(): Sequelize.Model<ProcessDefinition, IProcessDefinitionAttributes> {
    return this._processDefinition;
  }

  public async initialize(): Promise<void> {
    this.sequelize = await getConnection(this.config.database, this.config.username, this.config.password, this.config);
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
        throw new Error(`Process definition with the name '${name}' already exists!`);
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

  public async getProcessDefinitions(): Promise<Array<ProcessDefinitionFromRepository>> {
    const result: Array<ProcessDefinition> = await this.processDefinition.findAll();

    const runtimeProcessDefinitions: Array<ProcessDefinitionFromRepository> = result.map(this._convertToProcessDefinitionRuntimeObject);

    return runtimeProcessDefinitions;
  }

  private _convertToProcessDefinitionRuntimeObject(dataModel: ProcessDefinition): ProcessDefinitionFromRepository {

    const processDefinition: ProcessDefinitionFromRepository = new ProcessDefinitionFromRepository();
    processDefinition.name = dataModel.name;
    processDefinition.xml = dataModel.xml;

    return processDefinition;
  }
}
