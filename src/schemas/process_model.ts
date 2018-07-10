import * as Sequelize from 'sequelize';

export interface IProcessModelAttributes {
  id: string;
  processModelId: string;
  xml: string;
}

export type ProcessModel = Sequelize.Instance<IProcessModelAttributes> & IProcessModelAttributes;

export function defineProcessModel(sequelize: Sequelize.Sequelize): any {
  const attributes: SequelizeAttributes<IProcessModelAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    processModelId: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
    },
    xml: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  };

  return sequelize.define<ProcessModel, IProcessModelAttributes>('ProcessModel', attributes);
}
