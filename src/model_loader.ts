import * as Sequelize from 'sequelize';

import {
  defineProcessDefinition,
  IProcessDefinitionAttributes,
  ProcessDefinitionModel,
} from './schemas/index';

export async function loadModels(
  sequelizeInstance: Sequelize.Sequelize,
): Promise<Sequelize.Model<ProcessDefinitionModel, IProcessDefinitionAttributes>> {

  const processDefinition: Sequelize.Model<ProcessDefinitionModel, IProcessDefinitionAttributes> = defineProcessDefinition(sequelizeInstance);

  await sequelizeInstance.sync();

  return processDefinition;
}
