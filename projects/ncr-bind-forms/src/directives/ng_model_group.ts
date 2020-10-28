/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, Host, Inject, Input, OnDestroy, OnInit, Optional, Self, SkipSelf, forwardRef } from '@angular/core';

import { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS } from '../validators';

import { AbstractBindFormGroupDirective } from './abstract_form_group_directive';
import { BindControlContainer } from './control_container';
import { NgBindFormDirective } from './ng_form';
import { TemplateDrivenBindErrors } from './template_driven_errors';

export const modelGroupProvider: any = {
    provide: BindControlContainer,
    useExisting: forwardRef(() => NgBindModelGroup),
};

/**
 * @description
 * Creates and binds a `BindFormGroup` instance to a DOM element.
 *
 * This directive can only be used as a child of `NgBindFormDirective` (within `<form>` tags).
 *
 * Use this directive to validate a sub-group of your form separately from the
 * rest of your form, or if some values in your domain model make more sense
 * to consume together in a nested object.
 *
 * Provide a name for the sub-group and it will become the key
 * for the sub-group in the form's full value. If you need direct access, export the directive into
 * a local template variable using `ngBindModelGroup` (ex: `#myGroup="ngBindModelGroup"`).
 *
 * @usageNotes
 *
 * ### Consuming controls in a grouping
 *
 * The following example shows you how to combine controls together in a sub-group
 * of the form.
 *
 * {@example forms/ts/ngBindModelGroup/ng_model_group_example.ts region='Component'}
 *
 * @ngModule BindFormsModule
 * @publicApi
 */
// tslint:disable-next-line: directive-selector
@Directive({ selector: '[ngBindModelGroup]', providers: [modelGroupProvider], exportAs: 'ngBindModelGroup' })
export class NgBindModelGroup extends AbstractBindFormGroupDirective implements OnInit, OnDestroy {
    /**
     * @description
     * Tracks the name of the `NgBindModelGroup` bound to the directive. The name corresponds
     * to a key in the parent `NgBindFormDirective`.
     */
    // TODO(issue/24571): remove '!'.
    @Input('ngBindModelGroup') name!: string;

    constructor(
        @Host() @SkipSelf() parent: BindControlContainer,
        @Optional() @Self() @Inject(NG_BIND_VALIDATORS) validators: any[],
        @Optional() @Self() @Inject(NG_ASYNC_BIND_VALIDATORS) asyncValidators: any[]
    ) {
        super();
        this._parent = parent;
        this._validators = validators;
        this._asyncValidators = asyncValidators;
    }

    /** @internal */
    _checkParentType(): void {
        if (!(this._parent instanceof NgBindModelGroup) && !(this._parent instanceof NgBindFormDirective)) {
            TemplateDrivenBindErrors.modelGroupParentException();
        }
    }
}
