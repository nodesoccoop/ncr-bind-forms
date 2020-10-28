/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { isDevMode } from '@angular/core';

import { BindFormArray, BindFormControl, BindFormGroup } from '../model';
import { BindValidators } from '../validators';

import { AbstractBindControlDirective } from './abstract_control_directive';
import { AbstractBindFormGroupDirective } from './abstract_form_group_directive';
import { CheckboxControlBindValueAccessor } from './checkbox_value_accessor';
import { BindControlContainer } from './control_container';
import { ControlBindValueAccessor } from './control_value_accessor';
import { DefaultBindValueAccessor } from './default_value_accessor';
import { NgBindControl } from './ng_control';
import { normalizeAsyncValidator, normalizeValidator } from './normalize_validator';
import { NumberBindValueAccessor } from './number_value_accessor';
import { RadioControlBindValueAccessor } from './radio_control_value_accessor';
import { RangeBindValueAccessor } from './range_value_accessor';
import { BindFormArrayName } from './reactive_directives/form_group_name';
import { ReactiveBindErrors } from './reactive_errors';
import { SelectControlBindValueAccessor } from './select_control_value_accessor';
import { SelectMultipleControlBindValueAccessor } from './select_multiple_control_value_accessor';
import { AsyncBindValidator, AsyncBindValidatorFn, BindValidator, BindValidatorFn } from './validators';
import { BindTransformers, BindTransformerFn } from './../transformers';

export function controlPath(name: string | null, parent: BindControlContainer): string[] {
    return [...parent.path!, name!];
}

export function setUpControl(control: BindFormControl, dir: NgBindControl): void {
    if (!control) {
        _throwError(dir, 'Cannot find control with');
    }
    if (!dir.valueAccessor) {
        _throwError(dir, 'No value accessor for form control with');
    }

    control.validator = BindValidators.compose([control.validator!, dir.validator]);
    control.asyncValidator = BindValidators.composeAsync([control.asyncValidator!, dir.asyncValidator]);
    dir.valueAccessor!.writeValue(control.value);

    setUpViewChangePipeline(control, dir);
    setUpModelChangePipeline(control, dir);

    setUpBlurPipeline(control, dir);

    if (dir.valueAccessor!.setDisabledState) {
        control.registerOnDisabledChange((isDisabled: boolean) => {
            dir.valueAccessor!.setDisabledState!(isDisabled);
        });
    }

    // re-run validation when validator binding changes, e.g. minlength=3 -> minlength=4
    dir._rawValidators.forEach((validator: BindValidator | BindValidatorFn) => {
        if ((validator as BindValidator).registerOnValidatorChange) {
            (validator as BindValidator).registerOnValidatorChange!(() => control.updateValueAndValidity());
        }
    });

    dir._rawAsyncValidators.forEach((validator: AsyncBindValidator | AsyncBindValidatorFn) => {
        if ((validator as BindValidator).registerOnValidatorChange) {
            (validator as BindValidator).registerOnValidatorChange!(() => control.updateValueAndValidity());
        }
    });
}

export function cleanUpControl(control: BindFormControl, dir: NgBindControl) {
    dir.valueAccessor!.registerOnChange(() => _noControlError(dir));
    dir.valueAccessor!.registerOnTouched(() => _noControlError(dir));

    dir._rawValidators.forEach((validator: any) => {
        if (validator.registerOnValidatorChange) {
            validator.registerOnValidatorChange(null);
        }
    });

    dir._rawAsyncValidators.forEach((validator: any) => {
        if (validator.registerOnValidatorChange) {
            validator.registerOnValidatorChange(null);
        }
    });

    if (control) {
        control._clearChangeFns();
    }
}

function setUpViewChangePipeline(control: BindFormControl, dir: NgBindControl): void {
    dir.valueAccessor!.registerOnChange((newValue: any) => {
        let transformedValue = newValue;
        if (control.transformer) {
            transformedValue = control.transformer.apply(undefined, [newValue]);
            if (transformedValue !== newValue) {
                dir.valueAccessor.writeValue(transformedValue);
            }
        }

        control._pendingValue = transformedValue;
        control._pendingChange = true;
        control._pendingDirty = true;

        if (control.updateOn === 'change') {
            updateControl(control, dir);
        }
    });
}

function setUpBlurPipeline(control: BindFormControl, dir: NgBindControl): void {
    dir.valueAccessor!.registerOnTouched(() => {
        control._pendingTouched = true;

        if (control.updateOn === 'blur' && control._pendingChange) {
            updateControl(control, dir);
        }
        if (control.updateOn !== 'submit') {
            control.markAsTouched();
        }
    });
}

function updateControl(control: BindFormControl, dir: NgBindControl): void {
    if (control._pendingDirty) {
        control.markAsDirty();
    }

    if (control.transformer) {
        control._pendingValue = control.transformer.apply(undefined, [control._pendingChange]);
    }

    control.setValue(control._pendingValue, { emitModelToViewChange: false });
    dir.viewToModelUpdate(control._pendingValue);
    control._pendingChange = false;
}

function setUpModelChangePipeline(control: BindFormControl, dir: NgBindControl): void {
    control.registerOnChange((newValue: any, emitModelEvent: boolean) => {
        let transformedValue = newValue;
        if (control.transformer && control.transformer) {
            transformedValue = control.transformer.apply(undefined, control);
        }

        // control -> view
        dir.valueAccessor!.writeValue(transformedValue);

        // control -> ngBindModel
        if (emitModelEvent) {
            dir.viewToModelUpdate(transformedValue);
        }
    });
}

export function setUpFormContainer(control: BindFormGroup | BindFormArray, dir: AbstractBindFormGroupDirective | BindFormArrayName) {
    if (control == null) {
        _throwError(dir, 'Cannot find control with');
    }
    control.validator = BindValidators.compose([control.validator, dir.validator]);
    control.asyncValidator = BindValidators.composeAsync([control.asyncValidator, dir.asyncValidator]);
}

function _noControlError(dir: NgBindControl) {
    return _throwError(dir, 'There is no BindFormControl instance attached to form control element with');
}

function _throwError(dir: AbstractBindControlDirective, message: string): void {
    let messageEnd: string;
    if (dir.path!.length > 1) {
        messageEnd = `path: '${dir.path!.join(' -> ')}'`;
    } else if (dir.path![0]) {
        messageEnd = `name: '${dir.path}'`;
    } else {
        messageEnd = 'unspecified name attribute';
    }
    throw new Error(`${message} ${messageEnd}`);
}

export function composeValidators(validators: Array<BindValidator | BindValidatorFn>): BindValidatorFn | null {
    return validators != null ? BindValidators.compose(validators.map(normalizeValidator)) : null;
}

export function composeAsyncValidators(validators: Array<AsyncBindValidator | AsyncBindValidatorFn>): AsyncBindValidatorFn | null {
    return validators != null ? BindValidators.composeAsync(validators.map(normalizeAsyncValidator)) : null;
}

export function composeTransformers(transformers: Array<BindTransformerFn>): BindTransformerFn | null {
    return transformers != null ? BindTransformers.compose(transformers) : null;
}

export function isPropertyUpdated(changes: { [key: string]: any }, viewModel: any): boolean {
    if (!changes.hasOwnProperty('model')) {
        return false;
    }
    const change = changes.model;

    if (change.isFirstChange()) {
        return true;
    }
    return !Object.is(viewModel, change.currentValue);
}

const BUILTIN_ACCESSORS = [
    CheckboxControlBindValueAccessor,
    RangeBindValueAccessor,
    NumberBindValueAccessor,
    SelectControlBindValueAccessor,
    SelectMultipleControlBindValueAccessor,
    RadioControlBindValueAccessor,
];

export function isBuiltInAccessor(valueAccessor: ControlBindValueAccessor): boolean {
    return BUILTIN_ACCESSORS.some((a) => valueAccessor.constructor === a);
}

export function syncPendingControls(form: BindFormGroup, directives: NgBindControl[]): void {
    form._syncPendingControls();
    directives.forEach((dir) => {
        const control = dir.control as BindFormControl;
        if (control.updateOn === 'submit' && control._pendingChange) {
            dir.viewToModelUpdate(control._pendingValue);
            control._pendingChange = false;
        }
    });
}

// TODO: vsavkin remove it once https://github.com/angular/angular/issues/3011 is implemented
export function selectValueAccessor(dir: NgBindControl, valueAccessors: ControlBindValueAccessor[]): ControlBindValueAccessor | null {
    if (!valueAccessors) {
        return null;
    }

    if (!Array.isArray(valueAccessors)) {
        _throwError(dir, 'Value accessor was not provided as an array for form control with');
    }

    let defaultAccessor: ControlBindValueAccessor | undefined;
    let builtinAccessor: ControlBindValueAccessor | undefined;
    let customAccessor: ControlBindValueAccessor | undefined;

    valueAccessors.forEach((v: ControlBindValueAccessor) => {
        if (v.constructor === DefaultBindValueAccessor) {
            defaultAccessor = v;
        } else if (isBuiltInAccessor(v)) {
            if (builtinAccessor) {
                _throwError(dir, 'More than one built-in value accessor matches form control with');
            }
            builtinAccessor = v;
        } else {
            if (customAccessor) {
                _throwError(dir, 'More than one custom value accessor matches form control with');
            }
            customAccessor = v;
        }
    });

    if (customAccessor) {
        return customAccessor;
    }
    if (builtinAccessor) {
        return builtinAccessor;
    }
    if (defaultAccessor) {
        return defaultAccessor;
    }

    _throwError(dir, 'No valid value accessor for form control with');
    return null;
}

// TODO(kara): remove after deprecation period
export function _ngModelWarning(name: string, type: { _ngModelWarningSentOnce: boolean }, instance: { _ngModelWarningSent: boolean }, warningConfig: string | null) {
    if (!isDevMode() || warningConfig === 'never') {
        return;
    }

    if (((warningConfig === null || warningConfig === 'once') && !type._ngModelWarningSentOnce) || (warningConfig === 'always' && !instance._ngModelWarningSent)) {
        ReactiveBindErrors.ngModelWarning(name);
        type._ngModelWarningSentOnce = true;
        instance._ngModelWarningSent = true;
    }
}
