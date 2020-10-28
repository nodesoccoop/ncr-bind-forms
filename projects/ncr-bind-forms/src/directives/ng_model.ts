/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, EventEmitter, Host, Inject, Input, OnChanges, OnDestroy, Optional, Output, Self, SimpleChanges, forwardRef } from '@angular/core';

import { BindFormControl, BindFormHooks } from '../model';
import { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS } from '../validators';

import {
    AbstractBindFormGroupDirective,
    BindControlContainer,
    ControlBindValueAccessor,
    NG_BIND_VALUE_ACCESSOR,
    NgBindControl,
    NgBindFormDirective,
    NgBindModelGroup,
    composeAsyncValidators,
    composeValidators,
    controlPath,
    isPropertyUpdated,
    selectValueAccessor,
    setUpControl,
    TemplateDrivenBindErrors,
    AsyncBindValidator,
    AsyncBindValidatorFn,
    BindValidator,
    BindValidatorFn,
} from './public_api';

export const formControlBinding: any = {
    provide: NgBindControl,
    useExisting: forwardRef(() => NgBindModel),
};

/**
 * `ngBindModel` forces an additional change detection run when its inputs change:
 * E.g.:
 * ```
 * <div>{{myModel.valid}}</div>
 * <input [(ngBindModel)]="myValue" #myModel="ngBindModel">
 * ```
 * I.e. `ngBindModel` can export itself on the element and then be used in the template.
 * Normally, this would result in expressions before the `input` that use the exported directive
 * to have and old value as they have been
 * dirty checked before. As this is a very common case for `ngBindModel`, we added this second change
 * detection run.
 *
 * Notes:
 * - this is just one extra run no matter how many `ngBindModel` have been changed.
 * - this is a general problem when using `exportAs` for directives!
 */
const resolvedPromise = (() => Promise.resolve(null))();

/**
 * @description
 * Creates a `BindFormControl` instance from a domain model and binds it
 * to a form control element.
 *
 * The `BindFormControl` instance tracks the value, user interaction, and
 * validation status of the control and keeps the view synced with the model. If used
 * within a parent form, the directive also registers itself with the form as a child
 * control.
 *
 * This directive is used by itself or as part of a larger form. Use the
 * `ngBindModel` selector to activate it.
 *
 * It accepts a domain model as an optional `Input`. If you have a one-way binding
 * to `ngBindModel` with `[]` syntax, changing the value of the domain model in the component
 * class sets the value in the view. If you have a two-way binding with `[()]` syntax
 * (also known as 'banana-box syntax'), the value in the UI always syncs back to
 * the domain model in your class.
 *
 * To inspect the properties of the associated `BindFormControl` (like validity state),
 * export the directive into a local template variable using `ngBindModel` as the key (ex: `#myVar="ngBindModel"`).
 * You then access the control using the directive's `control` property,
 * but most properties used (like `valid` and `dirty`) fall through to the control anyway for direct access.
 * See a full list of properties directly available in `AbstractBindControlDirective`.
 *
 * @see `RadioControlBindValueAccessor`
 * @see `SelectControlBindValueAccessor`
 *
 * @usageNotes
 *
 * ### Using ngBindModel on a standalone control
 *
 * The following examples show a simple standalone control using `ngBindModel`:
 *
 * {@example forms/ts/simpleNgModel/simple_ng_model_example.ts region='Component'}
 *
 * When using the `ngBindModel` within `<form>` tags, you'll also need to supply a `name` attribute
 * so that the control can be registered with the parent form under that name.
 *
 * In the context of a parent form, it's often unnecessary to include one-way or two-way binding,
 * as the parent form syncs the value for you. You access its properties by exporting it into a
 * local template variable using `ngBindForm` such as (`#f="ngBindForm"`). Use the variable where
 * needed on form submission.
 *
 * If you do need to populate initial values into your form, using a one-way binding for
 * `ngBindModel` tends to be sufficient as long as you use the exported form's value rather
 * than the domain model's value on submit.
 *
 * ### Using ngBindModel within a form
 *
 * The following example shows controls using `ngBindModel` within a form:
 *
 * {@example forms/ts/simpleForm/simple_form_example.ts region='Component'}
 *
 * ### Using a standalone ngBindModel within a group
 *
 * The following example shows you how to use a standalone ngBindModel control
 * within a form. This controls the display of the form, but doesn't contain form data.
 *
 * ```html
 * <form>
 *   <input name="login" ngBindModel placeholder="Login">
 *   <input type="checkbox" ngBindModel [ngModelOptions]="{standalone: true}"> Show more options?
 * </form>
 * <!-- form value: {login: ''} -->
 * ```
 *
 * ### Setting the ngBindModel name attribute through options
 *
 * The following example shows you an alternate way to set the name attribute. The name attribute is used
 * within a custom form component, and the name `@Input` property serves a different purpose.
 *
 * ```html
 * <form>
 *   <my-person-control name="Nancy" ngBindModel [ngModelOptions]="{name: 'user'}">
 *   </my-person-control>
 * </form>
 * <!-- form value: {user: ''} -->
 * ```
 *
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[ngBindModel]:not([formBindControlName]):not([formBindControl])',
    providers: [formControlBinding],
    exportAs: 'ngBindModel',
})
export class NgBindModel extends NgBindControl implements OnChanges, OnDestroy {
    constructor(
        @Optional() @Host() parent: BindControlContainer,
        @Optional() @Self() @Inject(NG_BIND_VALIDATORS) validators: Array<BindValidator | BindValidatorFn>,
        @Optional() @Self() @Inject(NG_ASYNC_BIND_VALIDATORS) asyncValidators: Array<AsyncBindValidator | AsyncBindValidatorFn>,
        @Optional()
        @Self()
        @Inject(NG_BIND_VALUE_ACCESSOR)
        valueAccessors: ControlBindValueAccessor[]
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
        return this._parent ? controlPath(this.name, this._parent) : [this.name];
    }

    /**
     * @description
     * The top-level directive for this control if present, otherwise null.
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
    get asyncValidator(): AsyncBindValidatorFn | null {
        return composeAsyncValidators(this._rawAsyncValidators);
    }

    // At runtime we coerce arbitrary values assigned to the "disabled" input to a "boolean".
    // This is not reflected in the type of the property because outside of templates, consumers
    // should only deal with booleans. In templates, a string is allowed for convenience and to
    // match the native "disabled attribute" semantics which can be observed on input elements.
    // This static member tells the compiler that values of type "string" can also be assigned
    // to the input in a template.
    /** @nodoc */
    // tslint:disable-next-line: variable-name
    static ngAcceptInputType_isDisabled: boolean | string;
    public readonly control: BindFormControl = new BindFormControl();

    /** @internal */
    _registered = false;

    /**
     * @description
     * Internal reference to the view model value.
     */
    viewModel: any;

    /**
     * @description
     * Tracks the name bound to the directive. The parent form
     * uses this name as a key to retrieve this control's value.
     */
    // TODO(issue/24571): remove '!'.
    @Input() name!: string;

    /**
     * @description
     * Tracks whether the control is disabled.
     */
    // TODO(issue/24571): remove '!'.
    // tslint:disable-next-line: no-input-rename
    @Input('disabled') isDisabled!: boolean;

    /**
     * @description
     * Tracks the value bound to this directive.
     */
    // tslint:disable-next-line: no-input-rename
    @Input('ngBindModel') model: any;

    /**
     * @description
     * Tracks the configuration options for this `ngBindModel` instance.
     *
     * **name**: An alternative to setting the name attribute on the form control element. See
     * the [example](api/forms/NgBindModel#using-ngmodel-on-a-standalone-control) for using `NgBindModel`
     * as a standalone control.
     *
     * **standalone**: When set to true, the `ngBindModel` will not register itself with its parent form,
     * and acts as if it's not in the form. Defaults to false.
     *
     * **updateOn**: Defines the event upon which the form control value and validity update.
     * Defaults to 'change'. Possible values: `'change'` | `'blur'` | `'submit'`.
     *
     */
    // TODO(issue/24571): remove '!'.
    // tslint:disable-next-line: no-input-rename
    @Input('ngModelOptions')
    options!: { name?: string; standalone?: boolean; updateOn?: BindFormHooks };

    /**
     * @description
     * Event emitter for producing the `ngModelChange` event after
     * the view model updates.
     */
    // tslint:disable-next-line: no-output-rename
    @Output('ngModelChange') update = new EventEmitter();

    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use
     * only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges) {
        this._checkForErrors();
        if (!this._registered) this._setUpControl();
        if ('isDisabled' in changes) {
            this._updateDisabled(changes);
        }

        if (isPropertyUpdated(changes, this.viewModel)) {
            this._updateValue(this.model);
            this.viewModel = this.model;
        }
    }

    /**
     * @description
     * Lifecycle method called before the directive's instance is destroyed. For internal
     * use only.
     */
    ngOnDestroy(): void {
        // tslint:disable-next-line: no-unused-expression
        this.formDirective && this.formDirective.removeControl(this);
    }

    /**
     * @description
     * Sets the new value for the view model and emits an `ngModelChange` event.
     *
     * @param newValue The new value emitted by `ngModelChange`.
     */
    viewToModelUpdate(newValue: any): void {
        this.viewModel = newValue;
        this.update.emit(newValue);
    }

    private _setUpControl(): void {
        this._setUpdateStrategy();
        this._isStandalone() ? this._setUpStandalone() : this.formDirective.addControl(this);
        this._registered = true;
    }

    private _setUpdateStrategy(): void {
        if (this.options && this.options.updateOn != null) {
            this.control._updateOn = this.options.updateOn;
        }
    }

    private _isStandalone(): boolean {
        return !this._parent || !!(this.options && this.options.standalone);
    }

    private _setUpStandalone(): void {
        setUpControl(this.control, this);
        this.control.updateValueAndValidity({ emitEvent: false });
    }

    private _checkForErrors(): void {
        if (!this._isStandalone()) {
            this._checkParentType();
        }
        this._checkName();
    }

    private _checkParentType(): void {
        if (!(this._parent instanceof NgBindModelGroup) && this._parent instanceof AbstractBindFormGroupDirective) {
            TemplateDrivenBindErrors.formGroupNameException();
        } else if (!(this._parent instanceof NgBindModelGroup) && !(this._parent instanceof NgBindFormDirective)) {
            TemplateDrivenBindErrors.modelParentException();
        }
    }

    private _checkName(): void {
        if (this.options && this.options.name) this.name = this.options.name;

        if (!this._isStandalone() && !this.name) {
            TemplateDrivenBindErrors.missingNameException();
        }
    }

    private _updateValue(value: any): void {
        resolvedPromise.then(() => {
            this.control.setValue(value, { emitViewToModelChange: false });
        });
    }

    private _updateDisabled(changes: SimpleChanges) {
        const disabledValue = changes?.isDisabled.currentValue;

        const isDisabled = disabledValue === '' || (disabledValue && disabledValue !== 'false');

        resolvedPromise.then(() => {
            if (isDisabled && !this.control.disabled) {
                this.control.disable();
            } else if (!isDisabled && this.control.disabled) {
                this.control.enable();
            }
        });
    }
}
