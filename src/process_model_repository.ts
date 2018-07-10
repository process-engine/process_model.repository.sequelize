import {Definitions, IProcessModelRepository, Model, ProcessModelFromRepository} from '@process-engine/process_engine_contracts';

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

  private processModel(): Sequelize.Model<ProcessModel, IProcessModelAttributes> {
    return this._processModel;
  }

  public async initialize(): Promise<void> {
    this.sequelize = await getConnection(this.config.database, this.config.username, this.config.password, this.config);
    this._processModel = await loadModels(this.sequelize);
  }

  public async persistProcessDefinitions(definitions: Definitions): Promise<void> {
    throw new Error('Not implemented.');
  }

  public async getProcessModelById(processModelId: string): Promise<Model.Types.Process> {
    throw new Error('Not implemented.');
  }

  public async getProcessModels(): Promise<Array<Model.Types.Process>> {
    throw new Error('Not implemented.');
  }

  private _convertToProcessModelRuntimeObject(dataModel: ProcessModel): ProcessModelFromRepository {

    const processModel: ProcessModelFromRepository = new ProcessModelFromRepository();
    processModel.id = dataModel.processModelId;
    processModel.xml = dataModel.xml;

    return processModel;
  }
}
