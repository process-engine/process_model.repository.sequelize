import {AllowNull, Column, CreatedAt, DataType, Model, Table, UpdatedAt} from 'sequelize-typescript';

@Table({modelName: 'ProcessDefinition', tableName: 'ProcessDefinition', version: true})
export class ProcessDefinitionModel extends Model<ProcessDefinitionModel> {

  @Column
  @AllowNull(false)
  public name: string;

  @Column({type: DataType.TEXT})
  @AllowNull(false)
  public xml: string;

  @Column({type: DataType.TEXT})
  @AllowNull(false)
  public hash: string;

  @CreatedAt
  public createdAt?: Date;

  @UpdatedAt
  public updatedAt?: Date;
}
