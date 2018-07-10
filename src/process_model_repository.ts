import {Definitions, IProcessModelFromRepository, IProcessModelRepository, Model} from '@process-engine/process_engine_contracts';

export class ProcessModelRepository implements IProcessModelRepository {

  public async persistProcessDefinitions(definitions: Definitions): Promise<void> {
    throw new Error('Not implemented.');
  }

  public async getProcessModelById(processModelId: string): Promise<Model.Types.Process> {
    throw new Error('Not implemented.');
  }

  public async getProcessModels(): Promise<Array<Model.Types.Process>> {
    throw new Error('Not implemented.');
  }
}
