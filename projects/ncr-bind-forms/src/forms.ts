/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

/**
 * @module
 * @description
 * This module is used for handling user input, by defining and building a `BindFormGroup` that
 * consists of `BindFormControl` objects, and mapping them onto the DOM. `BindFormControl`
 * objects can then be used to read information from the form DOM elements.
 *
 * Forms providers are not included in default providers; you must import these providers
 * explicitly.
 */

export * from './directives/public_api';

// export { ɵInternalBindFormsSharedModule } from './directives';
// export { AbstractBindControlDirective } from './directives/abstract_control_directive';
// export { AbstractBindFormGroupDirective } from './directives/abstract_form_group_directive';
// export { CheckboxControlBindValueAccessor } from './directives/checkbox_value_accessor';
// export { BindControlContainer } from './directives/control_container';
// export { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from './directives/control_value_accessor';
// export { COMPOSITION_BUFFER_MODE, DefaultBindValueAccessor } from './directives/default_value_accessor';
// export { BindForm } from './directives/form_interface';
// export { NgBindControl } from './directives/ng_control';
// export { NgControlStatus, NgBindControlStatusGroup } from './directives/ng_control_status';
// export { NgBindFormDirective } from './directives/ng_form';
// export { NgBindModel } from './directives/ng_model';
// export { NgBindModelGroup } from './directives/ng_model_group';
// export { ɵNgNoValidate } from './directives/ng_no_validate_directive';
// export { NumberBindValueAccessor } from './directives/number_value_accessor';
// export { RadioControlBindValueAccessor } from './directives/radio_control_value_accessor';
// export { RangeBindValueAccessor } from './directives/range_value_accessor';
// export { BindFormControlDirective } from './directives/reactive_directives/form_control_directive';
// export { BindFormControlName } from './directives/reactive_directives/form_control_name';
// export { BindFormGroupDirective } from './directives/reactive_directives/form_group_directive';
// export { FormArrayName } from './directives/reactive_directives/form_group_name';
// export { BindFormGroupName } from './directives/reactive_directives/form_group_name';
// export { NgSelectOption, SelectControlBindValueAccessor } from './directives/select_control_value_accessor';
// export { SelectMultipleControlBindValueAccessor } from './directives/select_multiple_control_value_accessor';
// export { ɵNgSelectMultipleOption } from './directives/select_multiple_control_value_accessor';
// export {
//     AsyncBindValidator,
//     AsyncBindValidatorFn,
//     CheckboxRequiredValidator,
//     EmailValidator,
//     MaxLengthValidator,
//     MinLengthValidator,
//     PatternValidator,
//     RequiredValidator,
//     ValidationBindErrors,
//     ErrorItemType,
//     BindValidator,
//     BindValidatorFn,
// } from './directives/validators';
export { BindFormBuilder } from './form_builder';
// tslint:disable-next-line: max-line-length
export { AbstractBindControl, AbstractBindControlOptions, BindFormArray, BindFormControl, BindFormGroup, BindFormControlType } from './model';
export { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS, BindValidators } from './validators';
export { VERSION } from './version';

export * from './form_providers';
