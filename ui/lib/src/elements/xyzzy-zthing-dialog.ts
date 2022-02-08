import {css, html, LitElement} from "lit";
import {property, query, state} from "lit/decorators.js";

import {sharedStyles} from "../sharedStyles";
import {contextProvided} from "@holochain-open-dev/context";
import {ScopedElementsMixin} from "@open-wc/scoped-elements";
import {XyzzyStore} from "../xyzzy.store";
import {Zthing, xyzzyContext} from "../types";
import {EntryHashB64} from "@holochain-open-dev/core-types";
import {
  Button,
  Dialog,
  TextField
} from "@scoped-elements/material-web";
import {Profile} from "@holochain-open-dev/profiles";

/**
 * @element xyzzy-zthing-dialog
 */
export class XyzzyZthingDialog extends ScopedElementsMixin(LitElement) {

  @property() myProfile: Profile| undefined = undefined;

  /** Dependencies */
  @contextProvided({ context: xyzzyContext })
  _store!: XyzzyStore;

  _zthingToPreload?: EntryHashB64;

  @query('#name-field')
  _nameField!: TextField;

  /**
   *
   */
  open(zthingToPreload?: EntryHashB64) {
    this._zthingToPreload = zthingToPreload;
    this.requestUpdate();
    const dialog = this.shadowRoot!.getElementById("zthing-dialog") as Dialog
    dialog.open = true
  }

  /**
   *
   */
  private async handleOk(e: any) {
    /** Check validity */
    // nameField
    let isValid = this._nameField.validity.valid

    if (!this._nameField.validity.valid) {
      this._nameField.reportValidity()
    }
    const zthing: Zthing = {
      name: this._nameField.value,
      meta: {
        foo: "bar",
      },
    };

    // - Add zthing to commons
    const newZthing = await this._store.addZthing(zthing);
    this.dispatchEvent(new CustomEvent('zthing-added', { detail: newZthing, bubbles: true, composed: true }));
    // - Clear all fields
    // this.resetAllFields();
    // - Close dialog
    const dialog = this.shadowRoot!.getElementById("zthing-dialog") as Dialog;
    dialog.close()
  }

  resetAllFields() {
    this._nameField.value = ''
  }

  private async handleDialogOpened(e: any) {
    if (this._zthingToPreload) {
      const zthing = this._store.zthing(this._zthingToPreload);
      if (zthing) {
        this._nameField.value = zthing.name;
      }
      this._zthingToPreload = undefined;
    }
    this.requestUpdate()
  }

  private async handleDialogClosing(e: any) {
    this.resetAllFields();
  }

  render() {

    return html`
<mwc-dialog id="zthing-dialog" heading="New zthing" @closing=${this.handleDialogClosing} @opened=${this.handleDialogOpened}>
  <mwc-textfield dialogInitialFocus type="text"
                 @input=${() => (this.shadowRoot!.getElementById("name-field") as TextField).reportValidity()}
                 id="name-field" minlength="3" maxlength="64" label="Name" autoValidate=true required></mwc-textfield>
  <mwc-button id="primary-action-button" slot="primaryAction" @click=${this.handleOk}>ok</mwc-button>
  <mwc-button slot="secondaryAction"  dialogAction="cancel">cancel</mwc-button>
</mwc-dialog>
`
  }


  static get scopedElements() {
    return {
      "mwc-button": Button,
      "mwc-dialog": Dialog,
      "mwc-textfield": TextField,
    };
  }
  static get styles() {
    return [
      sharedStyles,
      css`
        mwc-dialog div {
          display: flex;
        }
        #zthing-dialog {
          --mdc-dialog-min-width: 600px;
        }
        mwc-textfield {
          margin-top: 10px;
          display: flex;
        }
        .ui-item {
          position: absolute;
          pointer-events: none;
          text-align: center;
          flex-shrink: 0;
        }
`,
    ];
  }
}
