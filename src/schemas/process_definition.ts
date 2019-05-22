import {
  AllowNull, Column, CreatedAt, DataType, Model, Table, UpdatedAt,
} from 'sequelize-typescript';

@Table({modelName: 'ProcessDefinition', tableName: 'ProcessDefinitions'})
export class ProcessDefinitionModel extends Model<ProcessDefinitionModel> {

  @AllowNull(false)
  @Column
  public name: string;

  @AllowNull(false)
  @Column({type: DataType.TEXT})
  public xml: string;

  @AllowNull(false)
  @Column({type: DataType.TEXT})
  public hash: string;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;

}
