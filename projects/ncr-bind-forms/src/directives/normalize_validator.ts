/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { AbstractBindControl } from '../model';
import { AsyncBindValidator, AsyncBindValidatorFn, BindValidator, BindValidatorFn } from './validators';

export function normalizeValidator(validator: BindValidatorFn | BindValidator): BindValidatorFn {
    if ((validator as BindValidator).validate) {
        return (c: AbstractBindControl) => (validator as BindValidator).validate(c);
    } else {
        return validator as BindValidatorFn;
    }
}

export function normalizeAsyncValidator(validator: AsyncBindValidatorFn | AsyncBindValidator): AsyncBindValidatorFn {
    if ((validator as AsyncBindValidator).validate) {
        return (c: AbstractBindControl) => (validator as AsyncBindValidator).validate(c);
    } else {
        return validator as AsyncBindValidatorFn;
    }
}
