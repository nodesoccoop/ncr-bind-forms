/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { InjectionToken } from '@angular/core';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { AsyncBindValidatorFn, ValidationBindErrors, BindValidator, BindValidatorFn } from './directives/public_api';
import { AbstractBindControl } from './model';
import { toObservable } from './shared';

function isEmptyInputValue(value: any): boolean {
    // we don't check for string here so it also works with arrays
    return value == null || value.length === 0;
}

/**
 * @description
 * An `InjectionToken` for registering additional synchronous validators used with `AbstractBindControl`s.
 *
 * @see `NG_ASYNC_BIND_VALIDATORS`
 *
 * @usageNotes
 *
 * ### Providing a custom validator
 *
 * The following example registers a custom validator directive. Adding the validator to the
 * existing collection of validators requires the `multi: true` option.
 *
 * ```typescript
 * @Directive({
 *   selector: '[customValidator]',
 *   providers: [{provide: NG_BIND_VALIDATORS, useExisting: CustomValidatorDirective, multi: true}]
 * })
 * class CustomValidatorDirective implements BindValidator {
 *   validate(control: AbstractBindControl): ValidationBindErrors | null {
 *     return { 'custom': true };
 *   }
 * }
 * ```
 *
 * @publicApi
 */
export const NG_BIND_VALIDATORS = new InjectionToken<Array<BindValidator | Function>>('NgValidators');

/**
 * @description
 * An `InjectionToken` for registering additional asynchronous validators used with `AbstractBindControl`s.
 *
 * @see `NG_BIND_VALIDATORS`
 *
 * @publicApi
 */
export const NG_ASYNC_BIND_VALIDATORS = new InjectionToken<Array<BindValidator | Function>>('NgAsyncValidators');

/**
 * A regular expression that matches valid e-mail addresses.
 *
 * At a high level, this regexp matches e-mail addresses of the format `local-part@tld`, where:
 * - `local-part` consists of one or more of the allowed characters (alphanumeric and some
 *   punctuation symbols).
 * - `local-part` cannot begin or end with a period (`.`).
 * - `local-part` cannot be longer than 64 characters.
 * - `tld` consists of one or more `labels` separated by periods (`.`). For example `localhost` or
 *   `foo.com`.
 * - A `label` consists of one or more of the allowed characters (alphanumeric, dashes (`-`) and
 *   periods (`.`)).
 * - A `label` cannot begin or end with a dash (`-`) or a period (`.`).
 * - A `label` cannot be longer than 63 characters.
 * - The whole address cannot be longer than 254 characters.
 *
 * ## Implementation background
 *
 * This regexp was ported over from AngularJS (see there for git history):
 * https://github.com/angular/angular.js/blob/c133ef836/src/ng/directive/input.js#L27
 * It is based on the
 * [WHATWG version](https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address) with
 * some enhancements to incorporate more RFC rules (such as rules related to domain names and the
 * lengths of different parts of the address). The main differences from the WHATWG version are:
 *   - Disallow `local-part` to begin or end with a period (`.`).
 *   - Disallow `local-part` length to exceed 64 characters.
 *   - Disallow total address length to exceed 254 characters.
 *
 * See [this commit](https://github.com/angular/angular.js/commit/f3f5cf72e) for more details.
 */
const EMAIL_REGEXP = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * @description
 * Provides a set of built-in validators that can be used by form controls.
 *
 * A validator is a function that processes a `BindFormControl` or collection of
 * controls and returns an error map or null. A null map means that validation has passed.
 *
 * @see [BindForm Validation](/guide/form-validation)
 *
 * @publicApi
 * @dynamic
 */
export class BindValidators {
    /**
     * @description
     * BindValidator that requires the control's value to be greater than or equal to the provided number.
     * The validator exists only as a function and not as a directive.
     *
     * @usageNotes
     *
     * ### Validate against a minimum of 3
     *
     * ```typescript
     * const control = new BindFormControl(2, BindValidators.min(3));
     *
     * console.log(control.errors); // {min: {min: 3, actual: 2}}
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `min` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static min(min: number): BindValidatorFn {
        return (control: AbstractBindControl): ValidationBindErrors | null => {
            if (isEmptyInputValue(control.value) || isEmptyInputValue(min)) {
                return null; // don't validate empty values to allow optional controls
            }
            const value = parseFloat(control.value);
            // Controls with NaN values after parsing should be treated as not having a
            // minimum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-min
            return !isNaN(value) && value < min ? { min: { min, actual: control.value } } : null;
        };
    }

    /**
     * @description
     * BindValidator that requires the control's value to be less than or equal to the provided number.
     * The validator exists only as a function and not as a directive.
     *
     * @usageNotes
     *
     * ### Validate against a maximum of 15
     *
     * ```typescript
     * const control = new BindFormControl(16, BindValidators.max(15));
     *
     * console.log(control.errors); // {max: {max: 15, actual: 16}}
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `max` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static max(max: number): BindValidatorFn {
        return (control: AbstractBindControl): ValidationBindErrors | null => {
            if (isEmptyInputValue(control.value) || isEmptyInputValue(max)) {
                return null; // don't validate empty values to allow optional controls
            }
            const value = parseFloat(control.value);
            // Controls with NaN values after parsing should be treated as not having a
            // maximum, per the HTML forms spec: https://www.w3.org/TR/html5/forms.html#attr-input-max
            return !isNaN(value) && value > max ? { max: { max, actual: control.value } } : null;
        };
    }

    /**
     * @description
     * BindValidator that requires the control have a non-empty value.
     *
     * @usageNotes
     *
     * ### Validate that the field is non-empty
     *
     * ```typescript
     * const control = new BindFormControl('', BindValidators.required);
     *
     * console.log(control.errors); // {required: true}
     * ```
     *
     * @returns An error map with the `required` property
     * if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static required(control: AbstractBindControl): ValidationBindErrors | null {
        return isEmptyInputValue(control.value) ? { required: true } : null;
    }

    /**
     * @description
     * BindValidator that requires the control's value be true. This validator is commonly
     * used for required checkboxes.
     *
     * @usageNotes
     *
     * ### Validate that the field value is true
     *
     * ```typescript
     * const control = new BindFormControl('', BindValidators.requiredTrue);
     *
     * console.log(control.errors); // {required: true}
     * ```
     *
     * @returns An error map that contains the `required` property
     * set to `true` if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static requiredTrue(control: AbstractBindControl): ValidationBindErrors | null {
        return control.value === true ? null : { required: true };
    }

    /**
     * @description
     * BindValidator that requires the control's value pass an email validation test.
     *
     * Tests the value using a [regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
     * pattern suitable for common usecases. The pattern is based on the definition of a valid email
     * address in the [WHATWG HTML specification](https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address)
     * with some enhancements to incorporate more RFC rules (such as rules related to domain names and
     * the lengths of different parts of the address).
     *
     * The differences from the WHATWG version include:
     * - Disallow `local-part` (the part before the `@` symbol) to begin or end with a period (`.`).
     * - Disallow `local-part` to be longer than 64 characters.
     * - Disallow the whole address to be longer than 254 characters.
     *
     * If this pattern does not satisfy your business needs, you can use `BindValidators.pattern()` to
     * validate the value against a different pattern.
     *
     * @usageNotes
     *
     * ### Validate that the field matches a valid email pattern
     *
     * ```typescript
     * const control = new BindFormControl('bad@', BindValidators.email);
     *
     * console.log(control.errors); // {email: true}
     * ```
     *
     * @returns An error map with the `email` property
     * if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static email(control: AbstractBindControl): ValidationBindErrors | null {
        if (isEmptyInputValue(control.value)) {
            return null; // don't validate empty values to allow optional controls
        }
        return EMAIL_REGEXP.test(control.value) ? null : { email: true };
    }

    /**
     * @description
     * BindValidator that requires the length of the control's value to be greater than or equal
     * to the provided minimum length. This validator is also provided by default if you use the
     * the HTML5 `minlength` attribute.
     *
     * @usageNotes
     *
     * ### Validate that the field has a minimum of 3 characters
     *
     * ```typescript
     * const control = new BindFormControl('ng', BindValidators.minLength(3));
     *
     * console.log(control.errors); // {minlength: {requiredLength: 3, actualLength: 2}}
     * ```
     *
     * ```html
     * <input minlength="5">
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `minlength` if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static minLength(minLength: number): BindValidatorFn {
        return (control: AbstractBindControl): ValidationBindErrors | null => {
            if (isEmptyInputValue(control.value)) {
                return null; // don't validate empty values to allow optional controls
            }
            const length: number = control.value ? control.value.length : 0;
            return length < minLength ? { minlength: { requiredLength: minLength, actualLength: length } } : null;
        };
    }

    /**
     * @description
     * BindValidator that requires the length of the control's value to be less than or equal
     * to the provided maximum length. This validator is also provided by default if you use the
     * the HTML5 `maxlength` attribute.
     *
     * @usageNotes
     *
     * ### Validate that the field has maximum of 5 characters
     *
     * ```typescript
     * const control = new BindFormControl('Angular', BindValidators.maxLength(5));
     *
     * console.log(control.errors); // {maxlength: {requiredLength: 5, actualLength: 7}}
     * ```
     *
     * ```html
     * <input maxlength="5">
     * ```
     *
     * @returns A validator function that returns an error map with the
     * `maxlength` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static maxLength(maxLength: number): BindValidatorFn {
        return (control: AbstractBindControl): ValidationBindErrors | null => {
            const length: number = control.value ? control.value.length : 0;
            return length > maxLength ? { maxlength: { requiredLength: maxLength, actualLength: length } } : null;
        };
    }

    /**
     * @description
     * BindValidator that requires the control's value to match a regex pattern. This validator is also
     * provided by default if you use the HTML5 `pattern` attribute.
     *
     * @usageNotes
     *
     * ### Validate that the field only contains letters or spaces
     *
     * ```typescript
     * const control = new BindFormControl('1', BindValidators.pattern('[a-zA-Z ]*'));
     *
     * console.log(control.errors); // {pattern: {requiredPattern: '^[a-zA-Z ]*$', actualValue: '1'}}
     * ```
     *
     * ```html
     * <input pattern="[a-zA-Z ]*">
     * ```
     *
     * @param pattern A regular expression to be used as is to test the values, or a string.
     * If a string is passed, the `^` character is prepended and the `$` character is
     * appended to the provided string (if not already present), and the resulting regular
     * expression is used to test the values.
     *
     * @returns A validator function that returns an error map with the
     * `pattern` property if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static pattern(pattern: string | RegExp): BindValidatorFn {
        if (!pattern) {
            return BindValidators.nullValidator;
        }
        let regex: RegExp;
        let regexStr: string;
        if (typeof pattern === 'string') {
            regexStr = '';

            if (pattern.charAt(0) !== '^') {
                regexStr += '^';
            }

            regexStr += pattern;

            if (pattern.charAt(pattern.length - 1) !== '$') {
                regexStr += '$';
            }

            regex = new RegExp(regexStr);
        } else {
            regexStr = pattern.toString();
            regex = pattern;
        }
        return (control: AbstractBindControl): ValidationBindErrors | null => {
            if (isEmptyInputValue(control.value)) {
                return null; // don't validate empty values to allow optional controls
            }
            const value: string = control.value;
            return regex.test(value) ? null : { pattern: { requiredPattern: regexStr, actualValue: value } };
        };
    }

    /**
     * @description
     * BindValidator that performs no operation.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static nullValidator(control: AbstractBindControl): ValidationBindErrors | null {
        return null;
    }

    /**
     * @description
     * Compose multiple validators into a single function that returns the union
     * of the individual error maps for the provided control.
     *
     * @returns A validator function that returns an error map with the
     * merged error maps of the validators if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static compose(validators: null): null;
    static compose(validators: (BindValidatorFn | null | undefined)[]): BindValidatorFn | null;
    static compose(validators: (BindValidatorFn | null | undefined)[] | null): BindValidatorFn | null {
        if (!validators) {
            return null;
        }
        const presentValidators: BindValidatorFn[] = validators.filter(isPresent) as any;
        if (presentValidators.length === 0) {
            return null;
        }

        return (control: AbstractBindControl) => {
            return _mergeErrors(_executeValidators(control, presentValidators));
        };
    }

    /**
     * @description
     * Compose multiple async validators into a single function that returns the union
     * of the individual error objects for the provided control.
     *
     * @returns A validator function that returns an error map with the
     * merged error objects of the async validators if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static composeAsync(validators: (AsyncBindValidatorFn | null)[]): AsyncBindValidatorFn | null {
        if (!validators) {
            return null;
        }
        const presentValidators: AsyncBindValidatorFn[] = validators.filter(isPresent) as any;
        if (presentValidators.length === 0) {
            return null;
        }

        return (control: AbstractBindControl) => {
            const observables = _executeAsyncValidators(control, presentValidators).map(toObservable);
            return forkJoin(observables).pipe(map(_mergeErrors));
        };
    }
}

function isPresent(o: any): boolean {
    return o != null;
}

function _executeValidators(control: AbstractBindControl, validators: BindValidatorFn[]): any[] {
    return validators.map((v) => v(control));
}

function _executeAsyncValidators(control: AbstractBindControl, validators: AsyncBindValidatorFn[]): any[] {
    return validators.map((v) => v(control));
}

function _mergeErrors(arrayOfErrors: ValidationBindErrors[]): ValidationBindErrors | null {
    let res: { [key: string]: any } = {};

    // Not using Array.reduce here due to a Chrome 80 bug
    // https://bugs.chromium.org/p/chromium/issues/detail?id=1049982
    arrayOfErrors.forEach((errors: ValidationBindErrors | null) => {
        res = errors != null ? { ...res!, ...errors } : res!;
    });

    return Object.keys(res).length === 0 ? null : res;
}
