/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BindFormControl, BindFormGroup } from '../model';

import { AbstractBindFormGroupDirective } from './abstract_form_group_directive';
import { NgBindControl } from './ng_control';

/**
 * @description
 * An interface implemented by `BindFormGroupDirective` and `NgBindFormDirective` directives.
 *
 * Only used by the `BindReactiveFormsModule` and `BindFormsModule`.
 *
 * @publicApi
 */
export interface BindForm {
    /**
     * @description
     * Add a control to this form.
     *
     * @param dir The control directive to add to the form.
     */
    addControl(dir: NgBindControl): void;

    /**
     * @description
     * Remove a control from this form.
     *
     * @param dir: The control directive to remove from the form.
     */
    removeControl(dir: NgBindControl): void;

    /**
     * @description
     * The control directive from which to get the `BindFormControl`.
     *
     * @param dir: The control directive.
     */
    getControl(dir: NgBindControl): BindFormControl;

    /**
     * @description
     * Add a group of controls to this form.
     *
     * @param dir: The control group directive to add.
     */
    addFormGroup(dir: AbstractBindFormGroupDirective): void;

    /**
     * @description
     * Remove a group of controls to this form.
     *
     * @param dir: The control group directive to remove.
     */
    removeFormGroup(dir: AbstractBindFormGroupDirective): void;

    /**
     * @description
     * The `BindFormGroup` associated with a particular `AbstractBindFormGroupDirective`.
     *
     * @param dir: The form group directive from which to get the `BindFormGroup`.
     */
    getFormGroup(dir: AbstractBindFormGroupDirective): BindFormGroup;

    /**
     * @description
     * Update the model for a particular control with a new value.
     *
     * @param dir: The control directive to update.
     * @param value: The new value for the control.
     */
    updateModel(dir: NgBindControl, value: any): void;
}
