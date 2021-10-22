import { CellClient } from '@holochain-open-dev/cell-client';
import { HoloHashed, serializeHash, EntryHashB64, AgentPubKeyB64 } from '@holochain-open-dev/core-types';
import {ZthingEntry, Zthing, Signal} from './types';

export class XyzzyService {
  constructor(
    public cellClient: CellClient,
    protected zomeName = 'hc_zome_xyzzy'
  ) {}

  get myAgentPubKey() : AgentPubKeyB64 {
    return serializeHash(this.cellClient.cellId[1]);
  }

  async createZthing(zthing: ZthingEntry): Promise<EntryHashB64> {
    return this.callZome('create_zthing', zthing);
  }

  async getZthings(): Promise<Array<HoloHashed<ZthingEntry>>> {
    return this.callZome('get_zthings', null);
  }

  async notify(signal: Signal, folks: Array<AgentPubKeyB64>): Promise<void> {
    return this.callZome('notify', {signal, folks});
  }

  async zthingFromEntry(hash: EntryHashB64, entry: ZthingEntry): Promise<Zthing> {
    return {
      name : entry.name,
      meta : entry.meta,
    }
  }

  private callZome(fn_name: string, payload: any) {
    return this.cellClient.callZome(this.zomeName, fn_name, payload);
  }
}
