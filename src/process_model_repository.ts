import {Definitions, IProcessModelRepository, Model, ProcessDefinitionFromRepository} from '@process-engine/process_engine_contracts';

import {getConnection} from '@essential-projects/sequelize_connection_manager';

import * as Sequelize from 'sequelize';

import {loadModels} from './model_loader';
import {IProcessModelAttributes, ProcessModel} from './schemas';

export class ProcessModelRepository implements IProcessModelRepository {

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

  private _processModel: Sequelize.Model<ProcessModel, IProcessModelAttributes>;

  private sequelize: Sequelize.Sequelize;

  private get processModel(): Sequelize.Model<ProcessModel, IProcessModelAttributes> {
    return this._processModel;
  }

  public async initialize(): Promise<void> {
    this.sequelize = await getConnection(this.config.database, this.config.username, this.config.password, this.config);
    this._processModel = await loadModels(this.sequelize);
  }

  public async persistProcessDefinitions(definitions: Definitions): Promise<void> {
    throw new Error('Not implemented.');
  }

  public async getProcessModels(): Promise<Array<ProcessDefinitionFromRepository>> {
    const result: Array<ProcessModel> = await this.processModel.findAll();

    const runtimeProcessModels: Array<ProcessDefinitionFromRepository> = result.map(this._convertToProcessModelRuntimeObject);

    return runtimeProcessModels;
  }

  public async getProcessModelById(processModelId: string): Promise<ProcessDefinitionFromRepository> {
    const result: ProcessModel = await this.processModel.findOne({
      where: {
        processModelId: processModelId,
      },
    });

    const runtimeProcessModel: ProcessDefinitionFromRepository = this._convertToProcessModelRuntimeObject(result);

    return runtimeProcessModel;
  }

  private _convertToProcessModelRuntimeObject(dataModel: ProcessModel): ProcessDefinitionFromRepository {

    const processModel: ProcessDefinitionFromRepository = new ProcessDefinitionFromRepository();
    processModel.id = dataModel.processModelId;
    processModel.xml = dataModel.xml;

    return processModel;
  }
}
