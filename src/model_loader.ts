import * as Sequelize from 'sequelize';

import {
  defineProcessModel,
  IProcessModelAttributes,
  ProcessModel,
} from './schemas/index';

export async function loadModels(sequelizeInstance: Sequelize.Sequelize): Promise<Sequelize.Model<ProcessModel, IProcessModelAttributes>> {

  const processModel: Sequelize.Model<ProcessModel, IProcessModelAttributes> = defineProcessModel(sequelizeInstance);

  await sequelizeInstance.sync();

  return processModel;
}
