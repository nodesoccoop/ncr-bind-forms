/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, Host, Inject, Input, OnDestroy, OnInit, Optional, Self, SkipSelf, forwardRef } from '@angular/core';

import { BindFormArray } from '../../model';
import { NG_ASYNC_BIND_VALIDATORS, NG_BIND_VALIDATORS } from '../../validators';

import {
    AbstractBindFormGroupDirective,
    BindControlContainer,
    ReactiveBindErrors,
    composeAsyncValidators,
    composeValidators,
    controlPath,
    AsyncBindValidatorFn,
    BindValidatorFn,
} from '../public_api';

import { BindFormGroupDirective } from './public_api';

export const formGroupNameProvider: any = {
    provide: BindControlContainer,
    useExisting: forwardRef(() => BindFormGroupName),
};

/**
 * @description
 *
 * Syncs a nested `BindFormGroup` to a DOM element.
 *
 * This directive can only be used with a parent `BindFormGroupDirective`.
 *
 * It accepts the string name of the nested `BindFormGroup` to link, and
 * looks for a `BindFormGroup` registered with that name in the parent
 * `BindFormGroup` instance you passed into `BindFormGroupDirective`.
 *
 * Use nested form groups to validate a sub-group of a
 * form separately from the rest or to group the values of certain
 * controls into their own nested object.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 *
 * @usageNotes
 *
 * ### Access the group by name
 *
 * The following example uses the {@link AbstractBindControl#get get} method to access the
 * associated `BindFormGroup`
 *
 * ```ts
 *   this.form.get('name');
 * ```
 *
 * ### Access individual controls in the group
 *
 * The following example uses the {@link AbstractBindControl#get get} method to access
 * individual controls within the group using dot syntax.
 *
 * ```ts
 *   this.form.get('name.first');
 * ```
 *
 * ### Register a nested `BindFormGroup`.
 *
 * The following example registers a nested *name* `BindFormGroup` within an existing `BindFormGroup`,
 * and provides methods to retrieve the nested `BindFormGroup` and individual controls.
 *
 * {@example forms/ts/nestedFormGroup/nested_form_group_example.ts region='Component'}
 *
 * @ngModule BindReactiveFormsModule
 * @publicApi
 */
@Directive({ selector: '[bindFormGroupName]', providers: [formGroupNameProvider] })
export class BindFormGroupName extends AbstractBindFormGroupDirective implements OnInit, OnDestroy {
    /**
     * @description
     * Tracks the name of the `BindFormGroup` bound to the directive. The name corresponds
     * to a key in the parent `BindFormGroup` or `BindFormArray`.
     * Accepts a name as a string or a number.
     * The name in the form of a string is useful for individual forms,
     * while the numerical form allows for form groups to be bound
     * to indices when iterating over groups in a `BindFormArray`.
     */
    // TODO(issue/24571): remove '!'.
    @Input('bindFormGroupName') name!: string | number | null;

    constructor(
        @Optional() @Host() @SkipSelf() parent: BindControlContainer,
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
        if (_hasInvalidParent(this._parent)) {
            ReactiveBindErrors.groupParentException();
        }
    }
}

export const formArrayNameProvider: any = {
    provide: BindControlContainer,
    useExisting: forwardRef(() => BindFormArrayName),
};

/**
 * @description
 *
 * Syncs a nested `BindFormArray` to a DOM element.
 *
 * This directive is designed to be used with a parent `BindFormGroupDirective` (selector:
 * `[bindFormGroup]`).
 *
 * It accepts the string name of the nested `BindFormArray` you want to link, and
 * will look for a `BindFormArray` registered with that name in the parent
 * `BindFormGroup` instance you passed into `BindFormGroupDirective`.
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `AbstractBindControl`
 *
 * @usageNotes
 *
 * ### Example
 *
 * {@example forms/ts/nestedFormArray/nested_form_array_example.ts region='Component'}
 *
 * @ngModule BindReactiveFormsModule
 * @publicApi
 */
@Directive({ selector: '[formArrayName]', providers: [formArrayNameProvider] })
export class BindFormArrayName extends BindControlContainer implements OnInit, OnDestroy {
    /** @internal */
    _parent: BindControlContainer;

    /** @internal */
    _validators: any[];

    /** @internal */
    _asyncValidators: any[];

    /**
     * @description
     * Tracks the name of the `BindFormArray` bound to the directive. The name corresponds
     * to a key in the parent `BindFormGroup` or `BindFormArray`.
     * Accepts a name as a string or a number.
     * The name in the form of a string is useful for individual forms,
     * while the numerical form allows for form arrays to be bound
     * to indices when iterating over arrays in a `BindFormArray`.
     */
    // TODO(issue/24571): remove '!'.
    @Input('formArrayName') name!: string | number | null;

    constructor(
        @Optional() @Host() @SkipSelf() parent: BindControlContainer,
        @Optional() @Self() @Inject(NG_BIND_VALIDATORS) validators: any[],
        @Optional() @Self() @Inject(NG_ASYNC_BIND_VALIDATORS) asyncValidators: any[]
    ) {
        super();
        this._parent = parent;
        this._validators = validators;
        this._asyncValidators = asyncValidators;
    }

    /**
     * @description
     * A lifecycle method called when the directive's inputs are initialized. For internal use only.
     *
     * @throws If the directive does not have a valid parent.
     */
    ngOnInit(): void {
        this._checkParentType();
        this.formDirective!.addFormArray(this);
    }

    /**
     * @description
     * A lifecycle method called before the directive's instance is destroyed. For internal use only.
     */
    ngOnDestroy(): void {
        if (this.formDirective) {
            this.formDirective.removeFormArray(this);
        }
    }

    /**
     * @description
     * The `BindFormArray` bound to this directive.
     */
    get control(): BindFormArray {
        return this.formDirective!.getFormArray(this);
    }

    /**
     * @description
     * The top-level directive for this group if present, otherwise null.
     */
    get formDirective(): BindFormGroupDirective | null {
        return this._parent ? <BindFormGroupDirective>this._parent.formDirective : null;
    }

    /**
     * @description
     * Returns an array that represents the path from the top-level form to this control.
     * Each index is the string name of the control on that level.
     */
    get path(): string[] {
        return controlPath(this.name.toString(), this._parent);
    }

    /**
     * @description
     * Synchronous validator function composed of all the synchronous validators registered with this
     * directive.
     */
    get validator(): BindValidatorFn | null {
        return composeValidators(this._validators);
    }

    /**
     * @description
     * Async validator function composed of all the async validators registered with this directive.
     */
    get asyncValidator(): AsyncBindValidatorFn | null {
        return composeAsyncValidators(this._asyncValidators);
    }

    private _checkParentType(): void {
        if (_hasInvalidParent(this._parent)) {
            ReactiveBindErrors.arrayParentException();
        }
    }
}

function _hasInvalidParent(parent: BindControlContainer): boolean {
    return !(parent instanceof BindFormGroupName) && !(parent instanceof BindFormGroupDirective) && !(parent instanceof BindFormArrayName);
}
