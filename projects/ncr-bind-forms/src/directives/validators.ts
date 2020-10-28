/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, Input, OnChanges, SimpleChanges, StaticProvider, forwardRef, HostBinding } from '@angular/core';
import { Observable } from 'rxjs';

import { AbstractBindControl } from '../model';
import { NG_BIND_VALIDATORS, BindValidators } from '../validators';

/**
 * @description
 * Defines the map of errors returned from failed validation checks.
 *
 * @publicApi
 */
export type ValidationBindErrors = {
    [key: string]: any;
};

export enum ErrorItemType {
    error = 0,
    alert = 10,
    help = 20,
    info = 30,
    ok = 40,
}

/**
 * @description
 * An interface implemented by classes that perform synchronous validation.
 *
 * @usageNotes
 *
 * ### Provide a custom validator
 *
 * The following example implements the `BindValidator` interface to create a
 * validator directive with a custom error key.
 *
 * ```typescript
 * @Directive({
 *   selector: '[customValidator]',
 *   providers: [{provide: NG_BIND_VALIDATORS, useExisting: CustomValidatorDirective, multi: true}]
 * })
 * class CustomValidatorDirective implements BindValidator {
 *   validate(control: AbstractBindControl): ValidationBindErrors|null {
 *     return {'custom': true};
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export interface BindValidator {
    /**
     * @description
     * Method that performs synchronous validation against the provided control.
     *
     * @param control The control to validate against.
     *
     * @returns A map of validation errors if validation fails,
     * otherwise null.
     */
    validate(control: AbstractBindControl): ValidationBindErrors | null;

    /**
     * @description
     * Registers a callback function to call when the validator inputs change.
     *
     * @param fn The callback function
     */
    registerOnValidatorChange?(fn: () => void): void;
}

/**
 * @description
 * An interface implemented by classes that perform asynchronous validation.
 *
 * @usageNotes
 *
 * ### Provide a custom async validator directive
 *
 * The following example implements the `AsyncBindValidator` interface to create an
 * async validator directive with a custom error key.
 *
 * ```typescript
 * import { of as observableOf } from 'rxjs';
 *
 * @Directive({
 *   selector: '[customAsyncValidator]',
 *   providers: [{provide: NG_ASYNC_BIND_VALIDATORS, useExisting: CustomAsyncValidatorDirective, multi:
 * true}]
 * })
 * class CustomAsyncValidatorDirective implements AsyncBindValidator {
 *   validate(control: AbstractBindControl): Observable<ValidationBindErrors|null> {
 *     return observableOf({'custom': true});
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export interface AsyncBindValidator extends BindValidator {
    /**
     * @description
     * Method that performs async validation against the provided control.
     *
     * @param control The control to validate against.
     *
     * @returns A promise or observable that resolves a map of validation errors
     * if validation fails, otherwise null.
     */
    validate(control: AbstractBindControl): Promise<ValidationBindErrors | null> | Observable<ValidationBindErrors | null>;
}

/**
 * @description
 * Provider which adds `RequiredValidator` to the `NG_BIND_VALIDATORS` multi-provider list.
 */
export const REQUIRED_VALIDATOR: StaticProvider = {
    provide: NG_BIND_VALIDATORS,
    useExisting: forwardRef(() => RequiredValidator),
    multi: true,
};

/**
 * @description
 * Provider which adds `CheckboxRequiredValidator` to the `NG_BIND_VALIDATORS` multi-provider list.
 */
export const CHECKBOX_REQUIRED_VALIDATOR: StaticProvider = {
    provide: NG_BIND_VALIDATORS,
    useExisting: forwardRef(() => CheckboxRequiredValidator),
    multi: true,
};

/**
 * @description
 * A directive that adds the `required` validator to any controls marked with the
 * `required` attribute. The directive is provided with the `NG_BIND_VALIDATORS` multi-provider list.
 *
 * @see [BindForm Validation](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a required validator using template-driven forms
 *
 * ```
 * <input name="fullName" ngBindModel required>
 * ```
 *
 * @ngModule BindFormsModule
 * @ngModule BindReactiveFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: ':not([type=checkbox])[required][formBindControlName],:not([type=checkbox])[required][formBindControl],:not([type=checkbox])[required][ngBindModel]',
    providers: [REQUIRED_VALIDATOR],
})
export class RequiredValidator implements BindValidator {
    private _required: boolean;

    private _onChange: () => void;

    /**
     * @description
     * Tracks changes to the required attribute bound to this directive.
     */
    @HostBinding('attr.required')
    @Input()
    get required(): boolean | string {
        return this._required;
    }

    set required(value: boolean | string) {
        this._required = value != null && value !== false && `${value}` !== 'false';
        if (this._onChange) this._onChange();
    }

    /**
     * @description
     * Method that validates whether the control is empty.
     * Returns the validation result if enabled, otherwise null.
     */
    validate(control: AbstractBindControl): ValidationBindErrors | null {
        return this.required ? BindValidators.required(control) : null;
    }

    /**
     * @description
     * Registers a callback function to call when the validator inputs change.
     *
     * @param fn The callback function
     */
    registerOnValidatorChange(fn: () => void): void {
        this._onChange = fn;
    }
}

/**
 * A Directive that adds the `required` validator to checkbox controls marked with the
 * `required` attribute. The directive is provided with the `NG_BIND_VALIDATORS` multi-provider list.
 *
 * @see [BindForm Validation](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a required checkbox validator using template-driven forms
 *
 * The following example shows how to add a checkbox required validator to an input attached to an ngBindModel binding.
 *
 * ```
 * <input type="checkbox" name="active" ngBindModel required>
 * ```
 *
 * @publicApi
 * @ngModule BindFormsModule
 * @ngModule BindReactiveFormsModule
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: 'input[type=checkbox][required][formBindControlName],input[type=checkbox][required][formBindControl],input[type=checkbox][required][ngBindModel]',
    providers: [CHECKBOX_REQUIRED_VALIDATOR],
})
export class CheckboxRequiredValidator extends RequiredValidator {
    /**
     * @description
     * Method that validates whether or not the checkbox has been checked.
     * Returns the validation result if enabled, otherwise null.
     */
    validate(control: AbstractBindControl): ValidationBindErrors | null {
        return this.required ? BindValidators.requiredTrue(control) : null;
    }
}

/**
 * @description
 * Provider which adds `EmailValidator` to the `NG_BIND_VALIDATORS` multi-provider list.
 */
export const EMAIL_VALIDATOR: any = {
    provide: NG_BIND_VALIDATORS,
    useExisting: forwardRef(() => EmailValidator),
    multi: true,
};

/**
 * A directive that adds the `email` validator to controls marked with the
 * `email` attribute. The directive is provided with the `NG_BIND_VALIDATORS` multi-provider list.
 *
 * @see [BindForm Validation](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding an email validator
 *
 * The following example shows how to add an email validator to an input attached to an ngBindModel binding.
 *
 * ```
 * <input type="email" name="email" ngBindModel email>
 * <input type="email" name="email" ngBindModel email="true">
 * <input type="email" name="email" ngBindModel [email]="true">
 * ```
 *
 * @publicApi
 * @ngModule BindFormsModule
 * @ngModule BindReactiveFormsModule
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[email][formBindControlName],[email][formBindControl],[email][ngBindModel]',
    providers: [EMAIL_VALIDATOR],
})
export class EmailValidator implements BindValidator {
    private _enabled: boolean;

    private _onChange: () => void;

    /**
     * @description
     * Tracks changes to the email attribute bound to this directive.
     */
    @Input()
    set email(value: boolean | string) {
        this._enabled = value === '' || value === true || value === 'true';
        if (this._onChange) this._onChange();
    }

    /**
     * @description
     * Method that validates whether an email address is valid.
     * Returns the validation result if enabled, otherwise null.
     */
    validate(control: AbstractBindControl): ValidationBindErrors | null {
        return this._enabled ? BindValidators.email(control) : null;
    }

    /**
     * @description
     * Registers a callback function to call when the validator inputs change.
     *
     * @param fn The callback function
     */
    registerOnValidatorChange(fn: () => void): void {
        this._onChange = fn;
    }
}

/**
 * @description
 * A function that receives a control and synchronously returns a map of
 * validation errors if present, otherwise null.
 *
 * @publicApi
 */
export type BindValidatorFn = (control: AbstractBindControl) => ValidationBindErrors | null;

/**
 * @description
 * A function that receives a control and returns a Promise or observable
 * that emits validation errors if present, otherwise null.
 *
 * @publicApi
 */
export type AsyncBindValidatorFn = (control: AbstractBindControl) => Promise<ValidationBindErrors | null> | Observable<ValidationBindErrors | null>;

/**
 * @description
 * Provider which adds `MinLengthValidator` to the `NG_BIND_VALIDATORS` multi-provider list.
 */
export const MIN_LENGTH_VALIDATOR: any = {
    provide: NG_BIND_VALIDATORS,
    useExisting: forwardRef(() => MinLengthValidator),
    multi: true,
};

/**
 * A directive that adds minimum length validation to controls marked with the
 * `minlength` attribute. The directive is provided with the `NG_BIND_VALIDATORS` multi-provider list.
 *
 * @see [BindForm Validation](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a minimum length validator
 *
 * The following example shows how to add a minimum length validator to an input attached to an
 * ngBindModel binding.
 *
 * ```html
 * <input name="firstName" ngBindModel minlength="4">
 * ```
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[minlength][formBindControlName],[minlength][formBindControl],[minlength][ngBindModel]',
    providers: [MIN_LENGTH_VALIDATOR],
})
export class MinLengthValidator implements BindValidator, OnChanges {
    private _validator: BindValidatorFn;

    private _onChange: () => void;

    /**
     * @description
     * Tracks changes to the the minimum length bound to this directive.
     */
    @HostBinding('attr.minlength')
    @Input()
    minlength: string | number;

    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use
     * only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges): void {
        if ('minlength' in changes) {
            this._createValidator();
            if (this._onChange) this._onChange();
        }
    }

    /**
     * @description
     * Method that validates whether the value meets a minimum length
     * requirement. Returns the validation result if enabled, otherwise null.
     */
    validate(control: AbstractBindControl): ValidationBindErrors | null {
        return this.minlength == null ? null : this._validator(control);
    }

    /**
     * @description
     * Registers a callback function to call when the validator inputs change.
     *
     * @param fn The callback function
     */
    registerOnValidatorChange(fn: () => void): void {
        this._onChange = fn;
    }

    private _createValidator(): void {
        this._validator = BindValidators.minLength(typeof this.minlength === 'number' ? this.minlength : parseInt(this.minlength, 10));
    }
}

/**
 * @description
 * Provider which adds `MaxLengthValidator` to the `NG_BIND_VALIDATORS` multi-provider list.
 */
export const MAX_LENGTH_VALIDATOR: any = {
    provide: NG_BIND_VALIDATORS,
    useExisting: forwardRef(() => MaxLengthValidator),
    multi: true,
};

/**
 * A directive that adds max length validation to controls marked with the
 * `maxlength` attribute. The directive is provided with the `NG_BIND_VALIDATORS` multi-provider list.
 *
 * @see [BindForm Validation](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a maximum length validator
 *
 * The following example shows how to add a maximum length validator to an input attached to an
 * ngBindModel binding.
 *
 * ```html
 * <input name="firstName" ngBindModel maxlength="25">
 * ```
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[maxlength][formBindControlName],[maxlength][formBindControl],[maxlength][ngBindModel]',
    providers: [MAX_LENGTH_VALIDATOR],
})
export class MaxLengthValidator implements BindValidator, OnChanges {
    private _validator: BindValidatorFn;

    private _onChange: () => void;

    /**
     * @description
     * Tracks changes to the the maximum length bound to this directive.
     */
    @HostBinding('attr.maxlength')
    @Input()
    maxlength!: string | number;

    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use
     * only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges): void {
        if ('maxlength' in changes) {
            this._createValidator();
            if (this._onChange) this._onChange();
        }
    }

    /**
     * @description
     * Method that validates whether the value exceeds
     * the maximum length requirement.
     */
    validate(control: AbstractBindControl): ValidationBindErrors | null {
        return this.maxlength != null ? this._validator(control) : null;
    }

    /**
     * @description
     * Registers a callback function to call when the validator inputs change.
     *
     * @param fn The callback function
     */
    registerOnValidatorChange(fn: () => void): void {
        this._onChange = fn;
    }

    private _createValidator(): void {
        this._validator = BindValidators.maxLength(typeof this.maxlength === 'number' ? this.maxlength : parseInt(this.maxlength, 10));
    }
}

/**
 * @description
 * Provider which adds `PatternValidator` to the `NG_BIND_VALIDATORS` multi-provider list.
 */
export const PATTERN_VALIDATOR: any = {
    provide: NG_BIND_VALIDATORS,
    useExisting: forwardRef(() => PatternValidator),
    multi: true,
};

/**
 * @description
 * A directive that adds regex pattern validation to controls marked with the
 * `pattern` attribute. The regex must match the entire control value.
 * The directive is provided with the `NG_BIND_VALIDATORS` multi-provider list.
 *
 * @see [BindForm Validation](guide/form-validation)
 *
 * @usageNotes
 *
 * ### Adding a pattern validator
 *
 * The following example shows how to add a pattern validator to an input attached to an
 * ngBindModel binding.
 *
 * ```html
 * <input name="firstName" ngBindModel pattern="[a-zA-Z ]*">
 * ```
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[pattern][formBindControlName],[pattern][formBindControl],[pattern][ngBindModel]',
    providers: [PATTERN_VALIDATOR],
})
export class PatternValidator implements BindValidator, OnChanges {
    private _validator: BindValidatorFn;

    private _onChange: () => void;

    /**
     * @description
     * Tracks changes to the pattern bound to this directive.
     */
    @HostBinding('attr.pattern')
    @Input()
    pattern: string | RegExp;

    /**
     * @description
     * A lifecycle method called when the directive's inputs change. For internal use
     * only.
     *
     * @param changes A object of key/value pairs for the set of changed inputs.
     */
    ngOnChanges(changes: SimpleChanges): void {
        if ('pattern' in changes) {
            this._createValidator();
            if (this._onChange) this._onChange();
        }
    }

    /**
     * @description
     * Method that validates whether the value matches the
     * the pattern requirement.
     */
    validate(control: AbstractBindControl): ValidationBindErrors | null {
        return this._validator(control);
    }

    /**
     * @description
     * Registers a callback function to call when the validator inputs change.
     *
     * @param fn The callback function
     */
    registerOnValidatorChange(fn: () => void): void {
        this._onChange = fn;
    }

    private _createValidator(): void {
        this._validator = BindValidators.pattern(this.pattern);
    }
}
