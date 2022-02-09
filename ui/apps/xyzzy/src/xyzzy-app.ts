import { ContextProvider } from "@holochain-open-dev/context";
import { state } from "lit/decorators.js";
import {
  XyzzyController,
  XyzzyZthing,
  XyzzyStore,
  xyzzyContext,
} from "@xyzzy/elements";
import {
  ProfilePrompt,
  ProfilesStore,
  profilesStoreContext,
} from "@holochain-open-dev/profiles";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class XyzzyApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    
    const client = await HolochainClient.connect(`ws://localhost:${process.env.HC_PORT}`, "xyzzy");

    const xyzzyClient = client.forCell(
      client.cellDataByRoleId('xyzzy')!
    );

    const store = new ProfilesStore(xyzzyClient, {avatarMode: "avatar"})

    store.fetchAllProfiles()

    new ContextProvider(
      this,
      profilesStoreContext,
      store
    );

    new ContextProvider(this, xyzzyContext, new XyzzyStore(xyzzyClient, store));

    this.loaded = true;
  }


  render() {
    if (!this.loaded) return html`<span>Loading...</span>`;
    return html`
        <profile-prompt></profile-prompt>
        <xyzzy-controller></xyzzy-controller>
<!--      <xyzzy-controller dummy></xyzzy-controller>-->
    `;
  }

  static get scopedElements() {
    return {
      "profile-prompt": ProfilePrompt,
      "xyzzy-controller": XyzzyController,
      "xyzzy-zthing": XyzzyZthing,
    };
  }
}
