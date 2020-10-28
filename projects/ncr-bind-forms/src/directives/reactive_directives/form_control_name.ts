/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, EventEmitter, Host, Inject, Input, OnChanges, OnDestroy, Optional, Output, Self, SimpleChanges, SkipSelf, forwardRef } from '@angular/core';

import { BindFormControl } from '../../model';
import { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS } from '../../validators';
import { AbstractBindFormGroupDirective } from '../abstract_form_group_directive';
import { BindControlContainer } from '../control_container';
import { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from '../control_value_accessor';
import { NgBindControl } from '../ng_control';
import { ReactiveBindErrors } from '../reactive_errors';
import { _ngModelWarning, composeAsyncValidators, composeValidators, controlPath, isPropertyUpdated, selectValueAccessor } from '../shared';
import { AsyncBindValidator, AsyncBindValidatorFn, BindValidator, BindValidatorFn } from '../validators';

import { NG_MODEL_WITH_FORM_CONTROL_WARNING } from './form_control_directive';
import { BindFormGroupDirective } from './form_group_directive';
import { BindFormArrayName, BindFormGroupName } from './form_group_name';

export const controlNameBinding: any = {
    provide: NgBindControl,
    useExisting: forwardRef(() => BindFormControlName),
};

/**
 * @description
 * Syncs a `BindFormControl` in an existing `BindFormGroup` to a form control
 * element by name.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `BindFormControl`
 * @see `AbstractBindControl`
 *
 * @usageNotes
 *
 * ### Register `BindFormControl` within a group
 *
 * The following example shows how to register multiple form controls within a form group
 * and set their value.
 *
 * {@example forms/ts/simpleFormGroup/simple_form_group_example.ts region='Component'}
 *
 * To see `formBindControlName` examples with different form control types, see:
 *
 * * Radio buttons: `RadioControlBindValueAccessor`
 * * Selects: `SelectControlBindValueAccessor`
 *
 * ### Use with ngBindModel
 *
 * Support for using the `ngBindModel` input property and `ngModelChange` event with reactive
 * form directives has been deprecated in Angular v6 and will be removed in a future
 * version of Angular.
 *
 * Now deprecated:
 *
 * ```html
 * <form [bindFormGroup]="form">
 *   <input formBindControlName="first" [(ngBindModel)]="value">
 * </form>
 * ```
 *
 * ```ts
 * this.value = 'some value';
 * ```
 *
 * This has been deprecated for a few reasons. First, developers have found this pattern
 * confusing. It seems like the actual `ngBindModel` directive is being used, but in fact it's
 * an input/output property named `ngBindModel` on the reactive form directive that simply
 * approximates (some of) its behavior. Specifically, it allows getting/setting the value
 * and intercepting value events. However, some of `ngBindModel`'s other features - like
 * delaying updates with `ngModelOptions` or exporting the directive - simply don't work,
 * which has understandably caused some confusion.
 *
 * In addition, this pattern mixes template-driven and reactive forms strategies, which
 * we generally don't recommend because it doesn't take advantage of the full benefits of
 * either strategy. Setting the value in the template violates the template-agnostic
 * principles behind reactive forms, whereas adding a `BindFormControl`/`BindFormGroup` layer in
 * the class removes the convenience of defining forms in the template.
 *
 * To update your code before support is removed, you'll want to decide whether to stick with
 * reactive form directives (and get/set values using reactive forms patterns) or switch over to
 * template-driven directives.
 *
 * After (choice 1 - use reactive forms):
 *
 * ```html
 * <form [bindFormGroup]="form">
 *   <input formBindControlName="first">
 * </form>
 * ```
 *
 * ```ts
 * this.form.get('first').setValue('some value');
 * ```
 *
 * After (choice 2 - use template-driven forms):
 *
 * ```html
 * <input [(ngBindModel)]="value">
 * ```
 *
 * ```ts
 * this.value = 'some value';
 * ```
 *
 * By default, when you use this pattern, you will see a deprecation warning once in dev
 * mode. You can choose to silence this warning by providing a config for
 * `BindReactiveFormsModule` at import time:
 *
 * ```ts
 * imports: [
 *   BindReactiveFormsModule.withConfig({warnOnNgModelWithFormControl: 'never'})
 * ]
 * ```
 *
 * Alternatively, you can choose to surface a separate warning for each instance of this
 * pattern with a config value of `"always"`. This may help to track down where in the code
 * the pattern is being used as the code is being updated.
 *
 * @ngModule BindReactiveFormsModule
 * @publicApi
 */
// tslint:disable-next-line: directive-selector
@Directive({ selector: '[formBindControlName]', providers: [controlNameBinding] })
export class BindFormControlName extends NgBindControl implements OnChanges, OnDestroy {
    /**
     * @description
     * Triggers a warning that this input should not be used with reactive forms.
     */
    @Input('disabled')
    set isDisabled(isDisabled: boolean) {
        ReactiveBindErrors.disabledAttrWarning();
    }

    constructor(
        @Optional() @Host() @SkipSelf() parent: BindControlContainer,
        @Optional() @Self() @Inject(NG_BIND_VALIDATORS) validators: Array<BindValidator | BindValidatorFn>,
        @Optional() @Self() @Inject(NG_ASYNC_BIND_VALIDATORS) asyncValidators: Array<AsyncBindValidator | AsyncBindValidatorFn>,
        @Optional() @Self() @Inject(NG_BIND_VALUE_ACCESSOR) valueAccessors: ControlBindValueAccessor[],
        @Optional() @Inject(NG_MODEL_WITH_FORM_CONTROL_WARNING) private _ngModelWarningConfig: string | null
    ) {
        super();
        this._parent = parent;
        this._rawValidators = validators || [];
        this._rawAsyncValidators = asyncValidators || [];
        this.valueAccessor = selectValueAccessor(this, valueAccessors);
    }

    /**
     * @description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     */
    get path(): string[] {
        return controlPath(this.name.toString(), this._parent!);
    }

    /**
     * @description
     * The top-level directive for this group if present, otherwise null.
     */
    get formDirective(): any {
        return this._parent ? this._parent.formDirective : null;
    }

    /**
     * @description
     * Synchronous validator function composed of all the synchronous validators
     * registered with this directive.
     */
    get validator(): BindValidatorFn | null {
        return composeValidators(this._rawValidators);
    }

    /**
     * @description
     * Async validator function composed of all the async validators registered with this
     * directive.
     */
    get asyncValidator(): AsyncBindValidatorFn {
        return composeAsyncValidators(this._rawAsyncValidators)!;
    }

    /**
     * @description
     * Static property used to track whether any ngBindModel warnings have been sent across
     * all instances of BindFormControlName. Used to support warning config of "once".
     *
     * @internal
     */
    static _ngModelWarningSentOnce = false;
    private _added = false;
    /**
     * @description
     * Internal reference to the view model value.
     * @internal
     */
    viewModel: any;

    /**
     * @description
     * Tracks the `BindFormControl` instance bound to the directive.
     */
    // TODO(issue/24571): remove '!'.
    readonly control!: BindFormControl;

    /**
     * @description
     * Tracks the name of the `BindFormControl` bound to the directive. The name corresponds
     * to a key in the parent `BindFormGroup` or `BindFormArray`.
     * Accepts a name as a string or a number.
     * The name in the form of a string is useful for individual forms,
     * while the numerical form allows for form controls to be bound
     * to indices when iterating over controls in a `BindFormArray`.
     */
    // TODO(issue/24571): remove '!'.
    @Input('formBindControlName') name!: string | number | null;

    // TODO(kara): remove next 4 properties once deprecation period is over

    /** @deprecated as of v6 */
    // tslint:disable-next-line: no-input-rename
    @Input('ngBindModel') model: any;

    /** @deprecated as of v6 */
    // tslint:disable-next-line: no-output-rename
    @Output('ngModelChange') update = new EventEmitter();

    /**
     * @description
     * Instance property used to track whether an ngBindModel warning has been sent out for this
     * particular BindFormControlName instance. Used to support warning config of "always".
     *
     * @internal
     */
    _ngModelWarningSent = false;

    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges) {
        if (!this._added) this._setUpControl();
        if (isPropertyUpdated(changes, this.viewModel)) {
            _ngModelWarning('formBindControlName', BindFormControlName, this, this._ngModelWarningConfig);
            this.viewModel = this.model;
            this.formDirective.updateModel(this, this.model);
        }
    }

    /**
     * @description
     * Lifecycle method called before the directive's instance is destroyed. For internal use only.
     */
    ngOnDestroy(): void {
        if (this.formDirective) {
            this.formDirective.removeControl(this);
        }
    }

    /**
     * @description
     * Sets the new value for the view model and emits an `ngModelChange` event.
     *
     * @param newValue The new value for the view model.
     */
    viewToModelUpdate(newValue: any): void {
        this.viewModel = newValue;
        this.update.emit(newValue);
    }

    private _checkParentType(): void {
        if (!(this._parent instanceof BindFormGroupName) && this._parent instanceof AbstractBindFormGroupDirective) {
            ReactiveBindErrors.ngModelGroupException();
        } else if (!(this._parent instanceof BindFormGroupName) && !(this._parent instanceof BindFormGroupDirective) && !(this._parent instanceof BindFormArrayName)) {
            ReactiveBindErrors.controlParentException();
        }
    }

    private _setUpControl() {
        this._checkParentType();
        (this as { control: BindFormControl }).control = this.formDirective.addControl(this);
        if (this.control.disabled && this.valueAccessor!.setDisabledState) {
            this.valueAccessor!.setDisabledState!(true);
        }
        this._added = true;
    }
}
