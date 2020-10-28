/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, EventEmitter, Inject, Input, OnChanges, Optional, Output, Self, SimpleChanges, forwardRef, HostListener } from '@angular/core';
import { BindFormArray, BindFormControl, BindFormGroup } from '../../model';
import { removeDir } from '../../shared';
import { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS, BindValidators } from '../../validators';

import {
    BindForm,
    BindControlContainer,
    ReactiveBindErrors,
    cleanUpControl,
    composeAsyncValidators,
    composeValidators,
    setUpControl,
    setUpFormContainer,
    syncPendingControls,
} from '../public_api';

import { BindFormControlName } from './form_control_name';
import { BindFormArrayName, BindFormGroupName } from './form_group_name';

export const bindFormDirectiveProvider: any = {
    provide: BindControlContainer,
    useExisting: forwardRef(() => BindFormGroupDirective),
};

/**
 * @description
 *
 * Binds an existing `BindFormGroup` to a DOM element.
 *
 * This directive accepts an existing `BindFormGroup` instance. It will then use this
 * `BindFormGroup` instance to match any child `BindFormControl`, `BindFormGroup`,
 * and `BindFormArray` instances to child `BindFormControlName`, `BindFormGroupName`,
 * and `BindFormArrayName` directives.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `AbstractBindControl`
 *
 * ### Register BindForm Group
 *
 * The following example registers a `BindFormGroup` with first name and last name controls,
 * and listens for the *ngSubmit* event when the button is clicked.
 *
 * {@example forms/ts/simpleFormGroup/simple_form_group_example.ts region='Component'}
 *
 * @ngModule BindReactiveFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[bindFormGroup]',
    providers: [bindFormDirectiveProvider],
    exportAs: 'ngBindForm',
})
export class BindFormGroupDirective extends BindControlContainer implements BindForm, OnChanges {
    /**
     * @description
     * Reports whether the form submission has been triggered.
     */
    public readonly submitted: boolean = false;

    // TODO(issue/24571): remove '!'.
    private _oldForm!: BindFormGroup;

    /**
     * @description
     * Tracks the list of added `BindFormControlName` instances
     */
    directives: BindFormControlName[] = [];

    /**
     * @description
     * Tracks the `BindFormGroup` bound to this directive.
     */
    @Input('bindFormGroup') form: BindFormGroup = null!;

    /**
     * @description
     * Emits an event when the form submission has been triggered.
     */
    @Output() ngSubmit = new EventEmitter();

    constructor(@Optional() @Self() @Inject(NG_BIND_VALIDATORS) private _validators: any[], @Optional() @Self() @Inject(NG_ASYNC_BIND_VALIDATORS) private _asyncValidators: any[]) {
        super();
    }

    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges): void {
        this._checkFormPresent();
        if (changes.hasOwnProperty('form')) {
            this._updateValidators();
            this._updateDomValue();
            this._updateRegistrations();
        }
    }

    /**
     * @description
     * Returns this directive's instance.
     */
    get formDirective(): BindForm {
        return this;
    }

    /**
     * @description
     * Returns the `BindFormGroup` bound to this directive.
     */
    get control(): BindFormGroup {
        return this.form;
    }

    /**
     * @description
     * Returns an array representing the path to this group. Because this directive
     * always lives at the top level of a form, it always an empty array.
     */
    get path(): string[] {
        return [];
    }

    /**
     * @description
     * Method that sets up the control directive in this group, re-calculates its value
     * and validity, and adds the instance to the internal list of directives.
     *
     * @param dir The `BindFormControlName` directive instance.
     */
    addControl(dir: BindFormControlName): BindFormControl {
        const ctrl: any = this.form.get(dir.path);
        setUpControl(ctrl, dir);
        ctrl.updateValueAndValidity({ emitEvent: false });
        this.directives.push(dir);
        return ctrl;
    }

    /**
     * @description
     * Retrieves the `BindFormControl` instance from the provided `BindFormControlName` directive
     *
     * @param dir The `BindFormControlName` directive instance.
     */
    getControl(dir: BindFormControlName): BindFormControl {
        return this.form.get(dir.path) as BindFormControl;
    }

    /**
     * @description
     * Removes the `BindFormControlName` instance from the internal list of directives
     *
     * @param dir The `BindFormControlName` directive instance.
     */
    removeControl(dir: BindFormControlName): void {
        removeDir<BindFormControlName>(this.directives, dir);
    }

    /**
     * Adds a new `BindFormGroupName` directive instance to the form.
     *
     * @param dir The `BindFormGroupName` directive instance.
     */
    addFormGroup(dir: BindFormGroupName): void {
        const ctrl: any = this.form.get(dir.path);
        setUpFormContainer(ctrl, dir);
        ctrl.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * No-op method to remove the form group.
     *
     * @param dir The `BindFormGroupName` directive instance.
     */
    removeFormGroup(dir: BindFormGroupName): void {}

    /**
     * @description
     * Retrieves the `BindFormGroup` for a provided `BindFormGroupName` directive instance
     *
     * @param dir The `BindFormGroupName` directive instance.
     */
    getFormGroup(dir: BindFormGroupName): BindFormGroup {
        return this.form.get(dir.path) as BindFormGroup;
    }

    /**
     * Adds a new `BindFormArrayName` directive instance to the form.
     *
     * @param dir The `BindFormArrayName` directive instance.
     */
    addFormArray(dir: BindFormArrayName): void {
        const ctrl: any = this.form.get(dir.path);
        setUpFormContainer(ctrl, dir);
        ctrl.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * No-op method to remove the form array.
     *
     * @param dir The `BindFormArrayName` directive instance.
     */
    removeFormArray(dir: BindFormArrayName): void {}

    /**
     * @description
     * Retrieves the `BindFormArray` for a provided `BindFormArrayName` directive instance.
     *
     * @param dir The `BindFormArrayName` directive instance.
     */
    getFormArray(dir: BindFormArrayName): BindFormArray {
        return this.form.get(dir.path) as BindFormArray;
    }

    /**
     * Sets the new value for the provided `BindFormControlName` directive.
     *
     * @param dir The `BindFormControlName` directive instance.
     * @param value The new value for the directive's control.
     */
    updateModel(dir: BindFormControlName, value: any): void {
        const ctrl = this.form.get(dir.path) as BindFormControl;
        ctrl.setValue(value);
    }

    /**
     * @description
     * Method called with the "submit" event is triggered on the form.
     * Triggers the `ngSubmit` emitter to emit the "submit" event as its payload.
     *
     * @param $event The "submit" event object
     */
    @HostListener('submit', ['$event'])
    onSubmit($event: Event): boolean {
        (this as { submitted: boolean }).submitted = true;
        syncPendingControls(this.form, this.directives);
        this.ngSubmit.emit($event);
        return false;
    }

    /**
     * @description
     * Method called when the "reset" event is triggered on the form.
     */
    @HostListener('reset')
    onReset(): void {
        this.resetForm();
    }

    /**
     * @description
     * Resets the form to an initial value and resets its submitted status.
     *
     * @param value The new value for the form.
     */
    resetForm(value: any = undefined): void {
        this.form.reset(value);
        (this as { submitted: boolean }).submitted = false;
    }

    /** @internal */
    _updateDomValue() {
        this.directives.forEach((dir) => {
            const newCtrl: any = this.form.get(dir.path);
            if (dir.control !== newCtrl) {
                cleanUpControl(dir.control, dir);
                if (newCtrl) setUpControl(newCtrl, dir);
                (dir as { control: BindFormControl }).control = newCtrl;
            }
        });

        this.form._updateTreeValidity({ emitEvent: false });
    }

    private _updateRegistrations() {
        this.form._registerOnCollectionChange(() => this._updateDomValue());
        if (this._oldForm) this._oldForm._registerOnCollectionChange(() => {});
        this._oldForm = this.form;
    }

    private _updateValidators() {
        const sync = composeValidators(this._validators);
        this.form.validator = BindValidators.compose([this.form.validator!, sync!]);

        const async = composeAsyncValidators(this._asyncValidators);
        this.form.asyncValidator = BindValidators.composeAsync([this.form.asyncValidator!, async!]);
    }

    private _checkFormPresent() {
        if (!this.form) {
            ReactiveBindErrors.missingFormException();
        }
    }
}
