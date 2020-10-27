/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { AbstractBindControlDirective, BindForm } from './public_api';

/**
 * @description
 * A base class for directives that contain multiple registered instances of `NgBindControl`.
 * Only used by the forms module.
 *
 * @publicApi
 */
export abstract class BindControlContainer extends AbstractBindControlDirective {
    /**
     * @description
     * The name for the control
     */
    // TODO(issue/24571): remove '!'.
    name!: string | number | null;

    /**
     * @description
     * The top-level form directive for the control.
     */
    get formDirective(): BindForm | null {
        return null;
    }

    /**
     * @description
     * The path to this group.
     */
    get path(): string[] | null {
        return null;
    }
}
