import { EntryHashB64, HeaderHashB64, AgentPubKeyB64, serializeHash } from '@holochain-open-dev/core-types';
import { CellClient } from '@holochain-open-dev/cell-client';
import { writable, Writable, derived, Readable, get } from 'svelte/store';

import { XyzzyService } from './xyzzy.service';
import {
  Dictionary,
  Zthing,
  ZthingEntry,
} from './types';
import {
  ProfilesStore,
} from "@holochain-open-dev/profiles";

const areEqual = (first: Uint8Array, second: Uint8Array) =>
      first.length === second.length && first.every((value, index) => value === second[index]);

export class XyzzyStore {
  /** Private */
  private service : XyzzyService
  private profiles: ProfilesStore

  /** ZthingEh -> Zthing */
  private zthingsStore: Writable<Dictionary<Zthing>> = writable({});
  
  /** Static info */
  myAgentPubKey: AgentPubKeyB64;

  /** Readable stores */
  public zthings: Readable<Dictionary<Zthing>> = derived(this.zthingsStore, i => i)
  
  constructor(
    protected cellClient: CellClient,
  profilesStore: ProfilesStore,
  zomeName = 'hc_zome_xyzzy'
  ) {
    this.myAgentPubKey = serializeHash(cellClient.cellId[1]);
    this.profiles = profilesStore;
    this.service = new XyzzyService(cellClient, zomeName);

    cellClient.addSignalHandler( signal => {
      if (! areEqual(cellClient.cellId[0],signal.data.cellId[0]) || !areEqual(cellClient.cellId[1], signal.data.cellId[1])) {
        return
      }
      console.log("SIGNAL",signal)
      const payload = signal.data.payload
      switch(payload.message.type) {
      case "NewZthing":
        if (!get(this.zthings)[payload.zthingHash]) {
          this.updateZthingFromEntry(payload.zthingHash, payload.message.content)
        }
        break;
      }
    })
  }

  private others(): Array<AgentPubKeyB64> {
    return Object.keys(get(this.profiles.knownProfiles)).filter((key)=> key != this.myAgentPubKey)
  }

  private async updateZthingFromEntry(hash: EntryHashB64, entry: ZthingEntry): Promise<void>   {
    //console.log("updateZthingFromEntry: " + hash)
    const zthing : Zthing = await this.service.zthingFromEntry(hash, entry)
    this.zthingsStore.update(zthings => {
      zthings[hash] = zthing
      return zthings
    })
  }

  async pullZthings() : Promise<Dictionary<Zthing>> {
    const zthings = await this.service.getZthings();
    //console.log({zthings})
    for (const s of zthings) {
      await this.updateZthingFromEntry(s.hash, s.content)
    }
    return get(this.zthingsStore)
  }

  async addZthing(zthing: Zthing) : Promise<EntryHashB64> {
    const s: ZthingEntry = {
      name: zthing.name,
      meta: zthing.meta,
    };
    const zthingEh: EntryHashB64 = await this.service.createZthing(s)
    this.zthingsStore.update(zthings => {
      zthings[zthingEh] = zthing
      return zthings
    })
    this.service.notify({zthingHash:zthingEh, message: {type:"NewZthing", content:s}}, this.others());
    return zthingEh
  }

  zthing(zthingEh: EntryHashB64): Zthing {
    return get(this.zthingsStore)[zthingEh];
  }
}
