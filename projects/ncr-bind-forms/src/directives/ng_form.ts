/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { AfterViewInit, Directive, EventEmitter, Inject, Input, Optional, Self, forwardRef } from '@angular/core';

import { AbstractBindControl, BindFormControl, BindFormGroup, BindFormHooks } from '../model';
import { removeDir } from '../shared';
import { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS } from '../validators';

import {
    BindControlContainer,
    BindForm,
    NgBindControl,
    NgBindModel,
    NgBindModelGroup,
    composeAsyncValidators,
    composeValidators,
    setUpControl,
    setUpFormContainer,
    syncPendingControls,
} from './public_api';

export const bindFormDirectiveProvider: any = {
    provide: BindControlContainer,
    useExisting: forwardRef(() => NgBindFormDirective),
};

const resolvedPromise = (() => Promise.resolve(null))();

/**
 * @description
 * Creates a top-level `BindFormGroup` instance and binds it to a form
 * to track aggregate form value and validation status.
 *
 * As soon as you import the `BindFormsModule`, this directive becomes active by default on
 * all `<form>` tags.  You don't need to add a special selector.
 *
 * You optionally export the directive into a local template variable using `ngBindForm` as the key
 * (ex: `#myForm="ngBindForm"`). This is optional, but useful.  Many properties from the underlying
 * `BindFormGroup` instance are duplicated on the directive itself, so a reference to it
 * gives you access to the aggregate value and validity status of the form, as well as
 * user interaction properties like `dirty` and `touched`.
 *
 * To register child controls with the form, use `NgBindModel` with a `name`
 * attribute. You may use `NgBindModelGroup` to create sub-groups within the form.
 *
 * If necessary, listen to the directive's `ngSubmit` event to be notified when the user has
 * triggered a form submission. The `ngSubmit` event emits the original form
 * submission event.
 *
 * In template driven forms, all `<form>` tags are automatically tagged as `NgBindFormDirective`.
 * To import the `BindFormsModule` but skip its usage in some forms,
 * for example, to use native HTML5 validation, add the `ngNoForm` and the `<form>`
 * tags won't create an `NgBindFormDirective` directive. In reactive forms, using `ngNoForm` is
 * unnecessary because the `<form>` tags are inert. In that case, you would
 * refrain from using the `bindFormGroup` directive.
 *
 * @usageNotes
 *
 * ### Listening for form submission
 *
 * The following example shows how to capture the form values from the "ngSubmit" event.
 *
 * {@example forms/ts/simpleForm/simple_form_example.ts region='Component'}
 *
 * ### Setting the update options
 *
 * The following example shows you how to change the "updateOn" option from its default using
 * ngFormOptions.
 *
 * ```html
 * <form [ngFormOptions]="{updateOn: 'blur'}">
 *    <input name="one" ngBindModel>  <!-- this ngBindModel will update on blur -->
 * </form>
 * ```
 *
 * ### Native DOM validation UI
 *
 * In order to prevent the native DOM form validation UI from interfering with Angular's form
 * validation, Angular automatically adds the `novalidate` attribute on any `<form>` whenever
 * `FormModule` or `ReactiveFormModule` are imported into the application.
 * If you want to explicitly enable native DOM validation UI with Angular forms, you can add the
 * `ngNativeValidate` attribute to the `<form>` element:
 *
 * ```html
 * <form ngNativeValidate>
 *   ...
 * </form>
 * ```
 *
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    selector: 'form:not([ngNoBindForm]):not([bindFormGroup]),ng-bind-form,[ngBindForm]',
    providers: [bindFormDirectiveProvider],
    host: { '(submit)': 'onSubmit($event)', '(reset)': 'onReset()' },
    outputs: ['ngSubmit'],
    exportAs: 'ngBindForm',
})
export class NgBindFormDirective extends BindControlContainer implements BindForm, AfterViewInit {
    /**
     * @description
     * Returns whether the form submission has been triggered.
     */
    public readonly submitted: boolean = false;

    private _directives: NgBindModel[] = [];

    /**
     * @description
     * The `BindFormGroup` instance created for this form.
     */
    form: BindFormGroup;

    /**
     * @description
     * Event emitter for the "ngSubmit" event
     */
    ngSubmit = new EventEmitter();

    /**
     * @description
     * Tracks options for the `NgBindFormDirective` instance.
     *
     * **updateOn**: Sets the default `updateOn` value for all child `NgModels` below it
     * unless explicitly set by a child `NgBindModel` using `ngModelOptions`). Defaults to 'change'.
     * Possible values: `'change'` | `'blur'` | `'submit'`.
     *
     */
    // TODO(issue/24571): remove '!'.
    @Input('ngFormOptions') options!: { updateOn?: BindFormHooks };

    constructor(@Optional() @Self() @Inject(NG_BIND_VALIDATORS) validators: any[], @Optional() @Self() @Inject(NG_ASYNC_BIND_VALIDATORS) asyncValidators: any[]) {
        super();
        this.form = new BindFormGroup({}, composeValidators(validators), composeAsyncValidators(asyncValidators));
    }

    /**
     * @description
     * Lifecycle method called after the view is initialized. For internal use only.
     */
    ngAfterViewInit() {
        this._setUpdateStrategy();
    }

    /**
     * @description
     * The directive instance.
     */
    get formDirective(): BindForm {
        return this;
    }

    /**
     * @description
     * The internal `BindFormGroup` instance.
     */
    get control(): BindFormGroup {
        return this.form;
    }

    /**
     * @description
     * Returns an array representing the path to this group. Because this directive
     * always lives at the top level of a form, it is always an empty array.
     */
    get path(): string[] {
        return [];
    }

    /**
     * @description
     * Returns a map of the controls in this group.
     */
    get controls(): { [key: string]: AbstractBindControl } {
        return this.form.controls;
    }

    /**
     * @description
     * Method that sets up the control directive in this group, re-calculates its value
     * and validity, and adds the instance to the internal list of directives.
     *
     * @param dir The `NgBindModel` directive instance.
     */
    addControl(dir: NgBindModel): void {
        resolvedPromise.then(() => {
            const container = this._findContainer(dir.path);
            (dir as { control: BindFormControl }).control = container.registerControl(dir.name, dir.control) as BindFormControl;
            setUpControl(dir.control, dir);
            dir.control.updateValueAndValidity({ emitEvent: false });
            this._directives.push(dir);
        });
    }

    /**
     * @description
     * Retrieves the `BindFormControl` instance from the provided `NgBindModel` directive.
     *
     * @param dir The `NgBindModel` directive instance.
     */
    getControl(dir: NgBindModel): BindFormControl {
        return this.form.get(dir.path) as BindFormControl;
    }

    /**
     * @description
     * Removes the `NgBindModel` instance from the internal list of directives
     *
     * @param dir The `NgBindModel` directive instance.
     */
    removeControl(dir: NgBindModel): void {
        resolvedPromise.then(() => {
            const container = this._findContainer(dir.path);
            if (container) {
                container.removeControl(dir.name);
            }
            removeDir<NgBindModel>(this._directives, dir);
        });
    }

    /**
     * @description
     * Adds a new `NgBindModelGroup` directive instance to the form.
     *
     * @param dir The `NgBindModelGroup` directive instance.
     */
    addFormGroup(dir: NgBindModelGroup): void {
        resolvedPromise.then(() => {
            const container = this._findContainer(dir.path);
            const group = new BindFormGroup({});
            setUpFormContainer(group, dir);
            container.registerControl(dir.name, group);
            group.updateValueAndValidity({ emitEvent: false });
        });
    }

    /**
     * @description
     * Removes the `NgBindModelGroup` directive instance from the form.
     *
     * @param dir The `NgBindModelGroup` directive instance.
     */
    removeFormGroup(dir: NgBindModelGroup): void {
        resolvedPromise.then(() => {
            const container = this._findContainer(dir.path);
            if (container) {
                container.removeControl(dir.name);
            }
        });
    }

    /**
     * @description
     * Retrieves the `BindFormGroup` for a provided `NgBindModelGroup` directive instance
     *
     * @param dir The `NgBindModelGroup` directive instance.
     */
    getFormGroup(dir: NgBindModelGroup): BindFormGroup {
        return this.form.get(dir.path) as BindFormGroup;
    }

    /**
     * Sets the new value for the provided `NgBindControl` directive.
     *
     * @param dir The `NgBindControl` directive instance.
     * @param value The new value for the directive's control.
     */
    updateModel(dir: NgBindControl, value: any): void {
        resolvedPromise.then(() => {
            const ctrl = this.form.get(dir.path!) as BindFormControl;
            ctrl.setValue(value);
        });
    }

    /**
     * @description
     * Sets the value for this `BindFormGroup`.
     *
     * @param value The new value
     */
    setValue(value: { [key: string]: any }): void {
        console.log('NgBindFormDirective setValue: ', value);
        this.control.setValue(value);
    }

    /**
     * @description
     * Method called when the "submit" event is triggered on the form.
     * Triggers the `ngSubmit` emitter to emit the "submit" event as its payload.
     *
     * @param $event The "submit" event object
     */
    onSubmit($event: Event): boolean {
        (this as { submitted: boolean }).submitted = true;
        syncPendingControls(this.form, this._directives);
        this.ngSubmit.emit($event);
        return false;
    }

    /**
     * @description
     * Method called when the "reset" event is triggered on the form.
     */
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

    private _setUpdateStrategy() {
        if (this.options && this.options.updateOn != null) {
            this.form._updateOn = this.options.updateOn;
        }
    }

    /** @internal */
    _findContainer(path: string[]): BindFormGroup {
        path.pop();
        return path.length ? (this.form.get(path) as BindFormGroup) : this.form;
    }
}
