import * as Sequelize from 'sequelize';

interface ProcessModelAttributes {
  id: string;
  processModelId: string;
  xml: string;
}

type ProcessModel = Sequelize.Instance<ProcessModelAttributes> & ProcessModelAttributes;

export function sequelizeProcessModel(sequelize: Sequelize.Sequelize): any {
  const attributes: SequelizeAttributes<ProcessModelAttributes> = {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    processModelId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    xml: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  };

  return sequelize.define<ProcessModel, ProcessModelAttributes>('ProcessModel', attributes);
}
