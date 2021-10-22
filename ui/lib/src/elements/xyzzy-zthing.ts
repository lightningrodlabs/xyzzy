import {css, html, LitElement} from "lit";
import {property, query} from "lit/decorators.js";

import {contextProvided} from "@lit-labs/context";
import {StoreSubscriber} from "lit-svelte-stores";

import {sharedStyles} from "../sharedStyles";
import {Zthing, xyzzyContext} from "../types";
import {XyzzyStore} from "../xyzzy.store";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {ProfilesStore, profilesStoreContext,} from "@holochain-open-dev/profiles";
//import {Button, Dialog, TextField, Fab, Slider} from "@scoped-elements/material-web";

/**
 * @element xyzzy-zthing
 */
export class XyzzyZthing extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  @property() currentZthingEh = "";

  @contextProvided({ context: xyzzyContext })
  _store!: XyzzyStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _zthings = new StoreSubscriber(this, () => this._store.zthings);

  get myNickName(): string {
    return this._myProfile.value.nickname;
  }

  render() {
    if (!this.currentZthingEh) {
      return;
    }
    /** Get current zthing and zoom level */
    const zthing: Zthing = this._zthings.value[this.currentZthingEh];
    /** Render layout */
    return html`
      THING: ${zthing.name}
    `;
  }


  static get scopedElements() {
    return {
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
      `,
    ];
  }
}
