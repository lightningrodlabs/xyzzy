// TODO: add globally available interfaces for your elements

import { EntryHashB64 } from "@holochain-open-dev/core-types";
import { createContext, Context } from "@holochain-open-dev/context";
import { XyzzyStore } from "./xyzzy.store";

export const xyzzyContext : Context<XyzzyStore> = createContext('hc_zome_xyzzy/service');

export type Dictionary<T> = { [key: string]: T };


export interface ZthingEntry {
  name: string;
  meta?: Dictionary<string>;
}

export interface Zthing  {
  name: string;
  meta?: Dictionary<string>;
}


export type Signal =
  | {
    zthingHash: EntryHashB64, message: {type: "NewZthing", content:  ZthingEntry}
  }
  
