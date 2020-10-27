/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, EventEmitter, Inject, InjectionToken, Input, OnChanges, Optional, Output, Self, SimpleChanges, forwardRef } from '@angular/core';

import { BindFormControl } from '../../model';
import { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS } from '../../validators';
import { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from '../control_value_accessor';
import { NgBindControl } from '../ng_control';
import { ReactiveBindErrors } from '../reactive_errors';
import { _ngModelWarning, composeAsyncValidators, composeValidators, isPropertyUpdated, selectValueAccessor, setUpControl } from '../shared';
import { AsyncBindValidator, AsyncBindValidatorFn, BindValidator, BindValidatorFn } from '../validators';

/**
 * Token to provide to turn off the ngBindModel warning on formBindControl and formBindControlName.
 */
export const NG_MODEL_WITH_FORM_CONTROL_WARNING = new InjectionToken('NgModelWithFormControlWarning');

export const formControlBinding: any = {
    provide: NgBindControl,
    useExisting: forwardRef(() => BindFormControlDirective)
};

/**
 * @description
 * * Syncs a standalone `BindFormControl` instance to a form control element.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `BindFormControl`
 * @see `AbstractBindControl`
 *
 * @usageNotes
 *
 * ### Registering a single form control
 *
 * The following examples shows how to register a standalone control and set its value.
 *
 * {@example forms/ts/simpleFormControl/simple_form_control_example.ts region='Component'}
 *
 * ### Use with ngBindModel
 *
 * Support for using the `ngBindModel` input property and `ngModelChange` event with reactive
 * form directives has been deprecated in Angular v6 and will be removed in a future version
 * of Angular.
 *
 * Now deprecated:
 *
 * ```html
 * <input [formBindControl]="control" [(ngBindModel)]="value">
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
 * delaying updates with`ngModelOptions` or exporting the directive - simply don't work,
 * which has understandably caused some confusion.
 *
 * In addition, this pattern mixes template-driven and reactive forms strategies, which
 * we generally don't recommend because it doesn't take advantage of the full benefits of
 * either strategy. Setting the value in the template violates the template-agnostic
 * principles behind reactive forms, whereas adding a `BindFormControl`/`BindFormGroup` layer in
 * the class removes the convenience of defining forms in the template.
 *
 * To update your code before support is removed, you'll want to decide whether to stick
 * with reactive form directives (and get/set values using reactive forms patterns) or
 * switch over to template-driven directives.
 *
 * After (choice 1 - use reactive forms):
 *
 * ```html
 * <input [formBindControl]="control">
 * ```
 *
 * ```ts
 * this.control.setValue('some value');
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
 *   BindReactiveFormsModule.withConfig({warnOnNgModelWithFormControl: 'never'});
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
@Directive({ selector: '[formBindControl]', providers: [formControlBinding], exportAs: 'ngBindForm' })
export class BindFormControlDirective extends NgBindControl implements OnChanges {
    /**
     * @description
     * Internal reference to the view model value.
     */
    viewModel: any;

    /**
     * @description
     * Tracks the `BindFormControl` instance bound to the directive.
     */
    // TODO(issue/24571): remove '!'.
    @Input('formBindControl') form!: BindFormControl;

    /**
     * @description
     * Triggers a warning that this input should not be used with reactive forms.
     */
    @Input('disabled')
    set isDisabled(isDisabled: boolean) {
        ReactiveBindErrors.disabledAttrWarning();
    }

    // TODO(kara): remove next 4 properties once deprecation period is over

    /** @deprecated as of v6 */
    @Input('ngBindModel') model: any;

    /** @deprecated as of v6 */
    @Output('ngModelChange') update = new EventEmitter();

    /**
     * @description
     * Static property used to track whether any ngBindModel warnings have been sent across
     * all instances of BindFormControlDirective. Used to support warning config of "once".
     *
     * @internal
     */
    static _ngModelWarningSentOnce = false;

    /**
     * @description
     * Instance property used to track whether an ngBindModel warning has been sent out for this
     * particular `BindFormControlDirective` instance. Used to support warning config of "always".
     *
     * @internal
     */
    _ngModelWarningSent = false;

    constructor(
        @Optional() @Self() @Inject(NG_BIND_VALIDATORS) validators: Array<BindValidator | BindValidatorFn>,
        @Optional() @Self() @Inject(NG_ASYNC_BIND_VALIDATORS) asyncValidators: Array<AsyncBindValidator | AsyncBindValidatorFn>,
        @Optional()
        @Self()
        @Inject(NG_BIND_VALUE_ACCESSOR)
        valueAccessors: ControlBindValueAccessor[],
        @Optional() @Inject(NG_MODEL_WITH_FORM_CONTROL_WARNING) private _ngModelWarningConfig: string | null
    ) {
        super();
        this._rawValidators = validators || [];
        this._rawAsyncValidators = asyncValidators || [];
        this.valueAccessor = selectValueAccessor(this, valueAccessors);
    }

    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use
     * only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges): void {
        if (this._isControlChanged(changes)) {
            setUpControl(this.form, this);
            if (this.control.disabled && this.valueAccessor!.setDisabledState) {
                this.valueAccessor!.setDisabledState!(true);
            }
            this.form.updateValueAndValidity({ emitEvent: false });
        }
        if (isPropertyUpdated(changes, this.viewModel)) {
            _ngModelWarning('formBindControl', BindFormControlDirective, this, this._ngModelWarningConfig);
            this.form.setValue(this.model);
            this.viewModel = this.model;
        }
    }

    /**
     * @description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     */
    get path(): string[] {
        return [];
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
    get asyncValidator(): AsyncBindValidatorFn | null {
        return composeAsyncValidators(this._rawAsyncValidators);
    }

    /**
     * @description
     * The `BindFormControl` bound to this directive.
     */
    get control(): BindFormControl {
        return this.form;
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

    private _isControlChanged(changes: { [key: string]: any }): boolean {
        return changes.hasOwnProperty('form');
    }
}
