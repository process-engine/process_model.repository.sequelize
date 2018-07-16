import * as Sequelize from 'sequelize';

export interface IProcessDefinitionAttributes {
  id: string;
  name: string;
  xml: string;
}

export type ProcessDefinition = Sequelize.Instance<IProcessDefinitionAttributes> & IProcessDefinitionAttributes;

export function defineProcessDefinition(sequelize: Sequelize.Sequelize): any {
  const attributes: SequelizeAttributes<IProcessDefinitionAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    xml: {
      // NOTE: "Sequelize.STRING" equals varchar(255), which is far too short for this.
      type: Sequelize.TEXT,
      allowNull: false,
    },
  };

  return sequelize.define<ProcessDefinition, IProcessDefinitionAttributes>('ProcessDefinition', attributes);
}
