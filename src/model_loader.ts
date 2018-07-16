import * as Sequelize from 'sequelize';

import {
  defineProcessDefinition,
  IProcessDefinitionAttributes,
  ProcessDefinition,
} from './schemas/index';

export async function loadModels(sequelizeInstance: Sequelize.Sequelize): Promise<Sequelize.Model<ProcessDefinition, IProcessDefinitionAttributes>> {

  const processDefinition: Sequelize.Model<ProcessDefinition, IProcessDefinitionAttributes> = defineProcessDefinition(sequelizeInstance);

  await sequelizeInstance.sync();

  return processDefinition;
}
