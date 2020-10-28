/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { NgModule, Type } from '@angular/core';

import { CheckboxControlBindValueAccessor } from './directives/checkbox_value_accessor';
import { DefaultBindValueAccessor } from './directives/default_value_accessor';
import { NgControlStatus, NgBindControlStatusGroup } from './directives/ng_control_status';
import { NgBindFormDirective } from './directives/ng_form';
import { NgBindModel } from './directives/ng_model';
import { NgBindModelGroup } from './directives/ng_model_group';
import { NgNoValidate } from './directives/ng_no_validate_directive';
import { NumberBindValueAccessor } from './directives/number_value_accessor';
import { RadioControlBindValueAccessor } from './directives/radio_control_value_accessor';
import { RangeBindValueAccessor } from './directives/range_value_accessor';
import { BindFormControlDirective } from './directives/reactive_directives/form_control_directive';
import { BindFormControlName } from './directives/reactive_directives/form_control_name';
import { BindFormGroupDirective } from './directives/reactive_directives/form_group_directive';
import { BindFormArrayName, BindFormGroupName } from './directives/reactive_directives/form_group_name';
import { NgSelectOption, SelectControlBindValueAccessor } from './directives/select_control_value_accessor';
import { NgSelectMultipleOption, SelectMultipleControlBindValueAccessor } from './directives/select_multiple_control_value_accessor';
import { CheckboxRequiredValidator, EmailValidator, MaxLengthValidator, MinLengthValidator, PatternValidator, RequiredValidator } from './directives/validators';

export { CheckboxControlBindValueAccessor } from './directives/checkbox_value_accessor';
export { ControlBindValueAccessor } from './directives/control_value_accessor';
export { DefaultBindValueAccessor } from './directives/default_value_accessor';
export { NgBindControl } from './directives/ng_control';
export { NgControlStatus, NgBindControlStatusGroup } from './directives/ng_control_status';
export { NgBindFormDirective } from './directives/ng_form';
export { NgBindModel } from './directives/ng_model';
export { NgBindModelGroup } from './directives/ng_model_group';
export { NumberBindValueAccessor } from './directives/number_value_accessor';
export { RadioControlBindValueAccessor } from './directives/radio_control_value_accessor';
export { RangeBindValueAccessor } from './directives/range_value_accessor';
export { BindFormControlDirective, NG_MODEL_WITH_FORM_CONTROL_WARNING } from './directives/reactive_directives/form_control_directive';
export { BindFormControlName } from './directives/reactive_directives/form_control_name';
export { BindFormGroupDirective } from './directives/reactive_directives/form_group_directive';
export { BindFormArrayName, BindFormGroupName } from './directives/reactive_directives/form_group_name';
export { NgSelectOption, SelectControlBindValueAccessor } from './directives/select_control_value_accessor';
export { NgSelectMultipleOption, SelectMultipleControlBindValueAccessor } from './directives/select_multiple_control_value_accessor';

export const BIND_SHARED_FORM_DIRECTIVES: Type<any>[] = [
    NgNoValidate,
    NgSelectOption,
    NgSelectMultipleOption,
    DefaultBindValueAccessor,
    NumberBindValueAccessor,
    RangeBindValueAccessor,
    CheckboxControlBindValueAccessor,
    SelectControlBindValueAccessor,
    SelectMultipleControlBindValueAccessor,
    RadioControlBindValueAccessor,
    NgControlStatus,
    NgBindControlStatusGroup,
    RequiredValidator,
    MinLengthValidator,
    MaxLengthValidator,
    PatternValidator,
    CheckboxRequiredValidator,
    EmailValidator,
];

export const BIND_TEMPLATE_DRIVEN_DIRECTIVES: Type<any>[] = [NgBindModel, NgBindModelGroup, NgBindFormDirective];

export const BIND_REACTIVE_DRIVEN_DIRECTIVES: Type<any>[] = [BindFormControlDirective, BindFormGroupDirective, BindFormControlName, BindFormGroupName, BindFormArrayName];

/**
 * Internal module used for sharing directives between BindFormsModule and BindReactiveFormsModule
 */
@NgModule({
    declarations: BIND_SHARED_FORM_DIRECTIVES,
    exports: BIND_SHARED_FORM_DIRECTIVES,
})
export class ɵInternalBindFormsSharedModule {}

export { ɵInternalBindFormsSharedModule as InternalBindFormsSharedModule };
