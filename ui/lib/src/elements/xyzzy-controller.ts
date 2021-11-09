import { html, css, LitElement } from "lit";
import { state, property, query } from "lit/decorators.js";

import { contextProvided } from "@lit-labs/context";
import { StoreSubscriber } from "lit-svelte-stores";
import { Unsubscriber } from "svelte/store";

import { sharedStyles } from "../sharedStyles";
import {xyzzyContext, Zthing, Dictionary, Signal} from "../types";
import { XyzzyStore } from "../xyzzy.store";
import { XyzzyZthing } from "./xyzzy-zthing";
import { XyzzyZthingDialog } from "./xyzzy-zthing-dialog";
import { SlAvatar } from '@scoped-elements/shoelace';
import { ScopedElementsMixin } from "@open-wc/scoped-elements";
import {
  ListItem,
  Select,
  IconButton,
  Button, TextField, TopAppBar, Drawer, List, Icon, Switch, Formfield, Menu,
} from "@scoped-elements/material-web";
import {
  profilesStoreContext,
  ProfilesStore,
  Profile,
} from "@holochain-open-dev/profiles";
import {EntryHashB64} from "@holochain-open-dev/core-types";

/**
 * @element xyzzy-controller
 */
export class XyzzyController extends ScopedElementsMixin(LitElement) {
  constructor() {
    super();
  }

  /** Public attributes */
  @property({ type: Boolean, attribute: 'dummy' })
  canLoadDummy = false;

  /** Dependencies */

  @contextProvided({ context: xyzzyContext })
  _store!: XyzzyStore;

  @contextProvided({ context: profilesStoreContext })
  _profiles!: ProfilesStore;

  _myProfile = new StoreSubscriber(this, () => this._profiles.myProfile);
  _knownProfiles = new StoreSubscriber(this, () => this._profiles.knownProfiles);
  _zthings = new StoreSubscriber(this, () => this._store.zthings);

  /** Private properties */

  @query('#my-drawer')
  private _drawer!: Drawer;

  @state() _currentZthingEh = "";
  @state() _currentTemplateEh = "";

  private initialized = false;
  private initializing = false;


  async createDummyProfile() {
    const nickname = "Cam";
    const avatar = "https://cdn3.iconfinder.com/data/icons/avatars-9/145/Avatar_Cat-512.png";

    try {
      const fields: Dictionary<string> = {};
       if (avatar) {
         fields['avatar'] = avatar;
       }
      await this._profiles.createProfile({
        nickname,
        fields,
      });

    } catch (e) {
      //this._existingUsernames[nickname] = true;
      //this._nicknameField.reportValidity();
    }
  }


  get myNickName(): string {
    return this._myProfile.value.nickname;
  }
  get myAvatar(): string {
    return this._myProfile.value.fields.avatar;
  }

  private subscribeProfile() {
    let unsubscribe: Unsubscriber;
    unsubscribe = this._profiles.myProfile.subscribe(async (profile) => {
      if (profile) {
        await this.checkInit();
      }
      // unsubscribe()
    });
  }

  async firstUpdated() {
    if (this.canLoadDummy) {
      await this.createDummyProfile()
    }
    this.subscribeProfile()
  }
 
  private _getFirst(zthings: Dictionary<Zthing>): EntryHashB64 {
    if (Object.keys(zthings).length == 0) {
      return "";
    }
    for (let zthingEh in zthings) {
//      const zthing = zthings[zthingEh]
//      if (zthing.visible) {
        return zthingEh
//      }
    }
    return "";
  }

  async checkInit() {
    if (this.initialized || this.initializing) {
      this.initialized = true;
      return;
    }
    this.initializing = true  // because checkInit gets call whenever profiles changes...
    let zthings = await this._store.pullZthings();

    /** load up a zthing if there are none */
    if (Object.keys(zthings).length == 0) {
      console.log("no zthings found, initializing")
      await this.addHardcodedZthings();
      zthings = await this._store.pullZthings();
    }
    if (Object.keys(zthings).length == 0) {
      console.error("No zthings found")
    }
    this._currentZthingEh = this._getFirst(zthings);

    console.log("   current zthing: ",  zthings[this._currentZthingEh].name, this._currentZthingEh);

    // request the update so the drawer will be findable
    await this.requestUpdate();

    /** Drawer */
    if (this._drawer) {
      const container = this._drawer.parentNode!;
      container.addEventListener('MDCTopAppBar:nav', () => {
        this._drawer.open = !this._drawer.open;
      });
    }
    /** Menu */
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    const button = this.shadowRoot!.getElementById("menu-button") as IconButton;
    menu.anchor = button
    // - Done
    this.initializing = false
    this.initialized = true
  }

  async addHardcodedZthings() {
 
    /** Zthings */
    await this._store.addZthing({
      name: "Funky",
      meta: {
        foo: `bar`,
      },
    });
  }

  async refresh() {
    console.log("refresh: Pulling data from DHT")
    await this._store.pullZthings();
    await this._profiles.fetchAllProfiles()
  }

  get zthingElem(): XyzzyZthing {
    return this.shadowRoot!.getElementById("xyzzy-zthing") as XyzzyZthing;
  }

  async openZthingDialog(zthing?: any) {
    this.zthingDialogElem.resetAllFields();
    this.zthingDialogElem.open(zthing);
  }

  get zthingDialogElem() : XyzzyZthingDialog {
    return this.shadowRoot!.getElementById("zthing-dialog") as XyzzyZthingDialog;
  }

  private async handleZthingSelected(e: any): Promise<void> {
    const index = e.detail.index;
    const zthingList = this.shadowRoot!.getElementById("zthings-list") as List;
    const value = zthingList.items[index].value;
    console.log("zthing value: " + value);
    this.handleZthingSelect(value);
  }

  private async handleZthingSelect(zthingEh: string): Promise<void> {
    this._currentZthingEh = zthingEh;
    this.zthingElem.currentZthingEh = zthingEh;
  }

  openTopMenu() {
    const menu = this.shadowRoot!.getElementById("top-menu") as Menu;
    menu.open = true;
  }

  handleMenuSelect(e: any) {
    console.log("handleMenuSelect: " + e.originalTarget.innerHTML)
    //console.log({e})
    switch (e.originalTarget.innerHTML) {
      case "Duplicate Zthing":
        this.openZthingDialog(this._currentZthingEh)
        break;
      default:
        break;
    }
  }

  render() {
    if (!this._currentZthingEh) {
      return;
    }

    /** Build agent list */
    const folks = Object.entries(this._knownProfiles.value).map(([key, profile])=>{
      return html`
        <li class="folk">
          <sl-avatar .image=${profile.fields.avatar}></sl-avatar>
          <div>${profile.nickname}</div>
        </li>`
    })

    /** Build zthing list */
    const zthings = Object.entries(this._zthings.value).map(
      ([key, zthing]) => {
        return html`
          <mwc-list-item class="zthing-li" .selected=${key == this._currentZthingEh} value="${key}">
            <span>${zthing.name}</span>
          </mwc-list-item>
          `
      }
    )


    return html`
<!--  DRAWER -->
<mwc-drawer type="dismissible" id="my-drawer">
  <div>
    <mwc-list>
    <mwc-list-item twoline graphic="avatar" noninteractive>
      <span>${this.myNickName}</span>
      <span slot="secondary">${this._profiles.myAgentPubKey}</span>
      <sl-avatar style="margin-left:-22px;" slot="graphic" .image=${this.myAvatar}></sl-avatar>
    </mwc-list-item>
    <li divider role="separator"></li>
    </mwc-list>
    <mwc-button icon="add_circle" @click=${() => this.openZthingDialog()}>Zthing</mwc-button>

    <!-- Zthing List -->
    <mwc-list id="zthings-list" activatable @selected=${this.handleZthingSelected}>
      ${zthings}
    </mwc-list>

  </div>
<!-- END DRAWER -->

  <div slot="appContent">
    <!-- TOP APP BAR -->
    <mwc-top-app-bar id="app-bar" dense style="position: relative;">
      <mwc-icon-button icon="menu" slot="navigationIcon"></mwc-icon-button>
      <div slot="title">Xyzzy - ${this._zthings.value[this._currentZthingEh].name}</div>
      <mwc-icon-button slot="actionItems" icon="autorenew" @click=${() => this.refresh()} ></mwc-icon-button>
      <mwc-icon-button id="menu-button" slot="actionItems" icon="more_vert" @click=${() => this.openTopMenu()}></mwc-icon-button>
      <mwc-menu id="top-menu" @click=${this.handleMenuSelect}>
        <mwc-list-item graphic="icon" value="fork_zthing"><span>Duplicate Zthing</span><mwc-icon slot="graphic">edit</mwc-icon></mwc-list-item>
      </mwc-menu>
    </mwc-top-app-bar>

    <div class="appBody">
      <xyzzy-zthing id="xyzzy-zthing" .currentZthingEh=${this._currentZthingEh}></xyzzy-zthing>
      <div class="folks">
        ${folks}
      </div>
    </div>

    <xyzzy-zthing-dialog id="zthing-dialog"
                        .myProfile=${this._myProfile.value}
                        @zthing-added=${(e:any) => this._currentZthingEh = e.detail}>
    </xyzzy-zthing-dialog>
  </div>
</mwc-drawer>
`;
  }


  static get scopedElements() {
    return {
      "mwc-menu": Menu,
      "mwc-switch": Switch,
      "mwc-drawer": Drawer,
      "mwc-top-app-bar": TopAppBar,
      "mwc-textfield": TextField,
      "mwc-select": Select,
      "mwc-list": List,
      "mwc-list-item": ListItem,
      "mwc-icon": Icon,
      "mwc-icon-button": IconButton,
      "mwc-button": Button,
      "xyzzy-zthing-dialog" : XyzzyZthingDialog,
      "xyzzy-zthing": XyzzyZthing,
      "mwc-formfield": Formfield,
      'sl-avatar': SlAvatar,
    };
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          margin: 10px;
        }

        .mdc-drawer__header {
          display:none;
        }

        mwc-top-app-bar {
          /**--mdc-theme-primary: #00ffbb;*/
          /**--mdc-theme-on-primary: black;*/
        }

        #app-bar {
          /*margin-top: -15px;*/
        }

        #my-drawer {
          margin-top: -15px;
        }

        .appBody {
          width: 100%;
          margin-top: 2px;
          display:flex;
        }

        .folk {
          list-style: none;
          margin: 2px;
          text-align: center;
          font-size: 70%;
        }

        .folk > img {
          width: 50px;
          border-radius: 10000px;
        }

        mwc-textfield.rounded {
          --mdc-shape-small: 20px;
          width: 7em;
          margin-top:10px;
        }

        mwc-textfield label {
          padding: 0px;
        }

        @media (min-width: 640px) {
          main {
            max-width: none;
          }
        }
      `,
    ];
  }
}
