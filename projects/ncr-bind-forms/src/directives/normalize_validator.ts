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
    if ((<BindValidator>validator).validate) {
        return (c: AbstractBindControl) => (<BindValidator>validator).validate(c);
    } else {
        return <BindValidatorFn>validator;
    }
}

export function normalizeAsyncValidator(validator: AsyncBindValidatorFn | AsyncBindValidator): AsyncBindValidatorFn {
    if ((<AsyncBindValidator>validator).validate) {
        return (c: AbstractBindControl) => (<AsyncBindValidator>validator).validate(c);
    } else {
        return <AsyncBindValidatorFn>validator;
    }
}
