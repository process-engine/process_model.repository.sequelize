import * as Sequelize from 'sequelize';

export interface IProcessDefinitionAttributes {
  name: string;
  xml: string;
  hash: string;
  // This field is auto-generated by sequelize.
  // Making this property optional will remove the need to for us
  // to manually declare it in the schema.
  createdAt?: Date;
  // Same as createdAt.
  updatedAt?: Date;
}

export type ProcessDefinitionModel = Sequelize.Instance<IProcessDefinitionAttributes> & IProcessDefinitionAttributes;

export function defineProcessDefinition(sequelize: Sequelize.Sequelize): any {
  const attributes: SequelizeAttributes<IProcessDefinitionAttributes> = {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    xml: {
      // NOTE: "Sequelize.STRING" equals varchar(255), which is far too short for this.
      type: Sequelize.TEXT,
      allowNull: false,
    },
    hash: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
  };

  return sequelize.define<ProcessDefinitionModel, IProcessDefinitionAttributes>('ProcessDefinition', attributes);
}
