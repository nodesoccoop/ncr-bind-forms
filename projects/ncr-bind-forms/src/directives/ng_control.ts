/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {
    AbstractBindControlDirective,
    BindControlContainer,
    ControlBindValueAccessor,
    AsyncBindValidator,
    AsyncBindValidatorFn,
    BindValidator,
    BindValidatorFn,
} from './public_api';

function unimplemented(): any {
    throw new Error('unimplemented');
}

/**
 * @description
 * A base class that all control `BindFormControl`-based directives extend. It binds a `BindFormControl`
 * object to a DOM element.
 *
 * @publicApi
 */
export abstract class NgBindControl extends AbstractBindControlDirective {
    /**
     * @description
     * The parent form for the control.
     *
     * @internal
     */
    _parent: BindControlContainer | null = null;

    /**
     * @description
     * The name for the control
     */
    name: string | number | null = null;

    /**
     * @description
     * The value accessor for the control
     */
    valueAccessor: ControlBindValueAccessor | null = null;

    /**
     * @description
     * The uncomposed array of synchronous validators for the control
     *
     * @internal
     */
    _rawValidators: Array<BindValidator | BindValidatorFn> = [];

    /**
     * @description
     * The uncomposed array of async validators for the control
     *
     * @internal
     */
    _rawAsyncValidators: Array<AsyncBindValidator | AsyncBindValidatorFn> = [];

    /**
     * @description
     * The registered synchronous validator function for the control
     *
     * @throws An exception that this method is not implemented
     */
    get validator(): BindValidatorFn | null {
        return <BindValidatorFn>unimplemented();
    }

    /**
     * @description
     * The registered async validator function for the control
     *
     * @throws An exception that this method is not implemented
     */
    get asyncValidator(): AsyncBindValidatorFn | null {
        return <AsyncBindValidatorFn>unimplemented();
    }

    /**
     * @description
     * The callback method to update the model from the view when requested
     *
     * @param newValue The new value for the view
     */
    abstract viewToModelUpdate(newValue: any): void;
}
