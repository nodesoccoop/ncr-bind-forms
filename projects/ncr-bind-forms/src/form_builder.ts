/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Injectable } from '@angular/core';

import { AsyncBindValidatorFn, BindValidatorFn } from './directives/validators';
import { AbstractBindControl, AbstractBindControlOptions, BindFormArray, BindFormControl, BindFormGroup, BindFormHooks } from './model';
import { BindFormControlType } from './model';

function isAbstractControlOptions(options: AbstractBindControlOptions | { [key: string]: any }): options is AbstractBindControlOptions {
    return (
        (<AbstractBindControlOptions>options).asyncValidators !== undefined ||
        (<AbstractBindControlOptions>options).validators !== undefined ||
        (<AbstractBindControlOptions>options).updateOn !== undefined
    );
}

/**
 * @description
 * Creates an `AbstractBindControl` from a user-specified configuration.
 *
 * The `BindFormBuilder` provides syntactic sugar that shortens creating instances of a `BindFormControl`,
 * `BindFormGroup`, or `BindFormArray`. It reduces the amount of boilerplate needed to build complex
 * forms.
 *
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 *
 * @publicApi
 */
@Injectable()
export class BindFormBuilder {
    /**
     * @description
     * Construct a new `BindFormGroup` instance.
     *
     * @param controlsConfig A collection of child controls. The key for each child is the name
     * under which it is registered.
     *
     * @param options Configuration options object for the `BindFormGroup`. The object can
     * have two shapes:
     *
     * 1) `AbstractBindControlOptions` object (preferred), which consists of:
     * * `validators`: A synchronous validator function, or an array of validator functions
     * * `asyncValidators`: A single async validator or array of async validator functions
     * * `updateOn`: The event upon which the control should be updated (options: 'change' | 'blur' |
     * submit')
     *
     * 2) Legacy configuration object, which consists of:
     * * `validator`: A synchronous validator function, or an array of validator functions
     * * `asyncValidator`: A single async validator or array of async validator functions
     *
     */
    group(controlsConfig: { [key: string]: any }, options: AbstractBindControlOptions | { [key: string]: any } | null = null): BindFormGroup {
        const controls = this._reduceControls(controlsConfig);

        let validators: BindValidatorFn | BindValidatorFn[] | null = null;
        let asyncValidators: AsyncBindValidatorFn | AsyncBindValidatorFn[] | null = null;
        let updateOn: BindFormHooks | undefined = undefined;

        if (options != null) {
            if (isAbstractControlOptions(options)) {
                // `options` are `AbstractBindControlOptions`
                validators = options.validators != null ? options.validators : null;
                asyncValidators = options.asyncValidators != null ? options.asyncValidators : null;
                updateOn = options.updateOn != null ? options.updateOn : undefined;
            } else {
                // `options` are legacy form group options
                validators = options['validator'] != null ? options['validator'] : null;
                asyncValidators = options['asyncValidator'] != null ? options['asyncValidator'] : null;
            }
        }

        return new BindFormGroup(controls, { asyncValidators, updateOn, validators });
    }

    /**
     * @description
     * Construct a new `BindFormControl` with the given state, validators and options.
     *
     * @param formState Initializes the control with an initial state value, or
     * with an object that contains both a value and a disabled status.
     *
     * @param validatorOrOpts A synchronous validator function, or an array of
     * such functions, or an `AbstractBindControlOptions` object that contains
     * validation functions and a validation trigger.
     *
     * @param asyncValidator A single async validator or array of async validator
     * functions.
     *
     * @usageNotes
     *
     * ### Initialize a control as disabled
     *
     * The following example returns a control with an initial value in a disabled state.
     *
     * <code-example path="forms/ts/formBuilder/form_builder_example.ts" region="disabled-control">
     * </code-example>
     */
    control(
        formState: any,
        type?: BindFormControlType,
        disabled?: boolean,
        validatorOrOpts?: BindValidatorFn | BindValidatorFn[] | AbstractBindControlOptions | null,
        asyncValidator?: AsyncBindValidatorFn | AsyncBindValidatorFn[] | null
    ): BindFormControl {
        return new BindFormControl(formState, type, disabled, validatorOrOpts, asyncValidator);
    }

    /**
     * Constructs a new `BindFormArray` from the given array of configurations,
     * validators and options.
     *
     * @param controlsConfig An array of child controls or control configs. Each
     * child control is given an index when it is registered.
     *
     * @param validatorOrOpts A synchronous validator function, or an array of
     * such functions, or an `AbstractBindControlOptions` object that contains
     * validation functions and a validation trigger.
     *
     * @param asyncValidator A single async validator or array of async validator
     * functions.
     */
    array(
        controlsConfig: any[],
        validatorOrOpts?: BindValidatorFn | BindValidatorFn[] | AbstractBindControlOptions | null,
        asyncValidator?: AsyncBindValidatorFn | AsyncBindValidatorFn[] | null
    ): BindFormArray {
        const controls = controlsConfig.map((c) => this._createControl(c));
        return new BindFormArray(controls, validatorOrOpts, asyncValidator);
    }

    /** @internal */
    _reduceControls(controlsConfig: { [k: string]: any }): { [key: string]: AbstractBindControl } {
        const controls: { [key: string]: AbstractBindControl } = {};
        Object.keys(controlsConfig).forEach((controlName) => {
            controls[controlName] = this._createControl(controlsConfig[controlName]);
        });
        return controls;
    }

    /** @internal */
    _createControl(controlConfig: any): AbstractBindControl {
        if (controlConfig instanceof BindFormControl || controlConfig instanceof BindFormGroup || controlConfig instanceof BindFormArray) {
            return controlConfig;
        } else if (Array.isArray(controlConfig)) {
            const value = controlConfig[0];
            const type = controlConfig[1] as BindFormControlType;
            const disabled = controlConfig[2] as boolean;
            const validator: BindValidatorFn = controlConfig.length > 2 ? controlConfig[3] : null;
            const asyncValidator: AsyncBindValidatorFn = controlConfig.length > 3 ? controlConfig[4] : null;
            return this.control(value, type, disabled, validator, asyncValidator);
        } else {
            return this.control(controlConfig);
        }
    }
}
