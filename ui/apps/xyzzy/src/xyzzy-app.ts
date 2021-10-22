import { ContextProvider } from "@lit-labs/context";
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
import { AppWebsocket } from "@holochain/conductor-api";
import { HolochainClient } from "@holochain-open-dev/cell-client";
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import { LitElement, html } from "lit";

export class XyzzyApp extends ScopedElementsMixin(LitElement) {
  @state()
  loaded = false;

  async firstUpdated() {
    const appWebsocket = await AppWebsocket.connect(
      `ws://localhost:${process.env.HC_PORT}`
    );
    const appInfo = await appWebsocket.appInfo({
      installed_app_id: "xyzzy",
    });

    const cellData = appInfo.cell_data[0];
    const cellClient = new HolochainClient(appWebsocket, cellData);

    const store = new ProfilesStore(cellClient, {avatarMode: "avatar"})

    store.fetchAllProfiles()

    new ContextProvider(
      this,
      profilesStoreContext,
      store
    );

    new ContextProvider(this, xyzzyContext, new XyzzyStore(cellClient, store));

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
