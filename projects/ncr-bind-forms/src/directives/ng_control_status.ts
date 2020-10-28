/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, HostBinding, Self } from '@angular/core';

import { AbstractBindControlDirective } from './abstract_control_directive';
import { BindControlContainer } from './control_container';
import { NgBindControl } from './ng_control';

@Directive()
export class AbstractBindControlStatus {
    private _cd: AbstractBindControlDirective;

    constructor(cd: AbstractBindControlDirective) {
        this._cd = cd;
    }

    @HostBinding('class.ng-untouched')
    get ngClassUntouched(): boolean {
        return this._cd.control ? this._cd.control.untouched : false;
    }

    @HostBinding('class.ng-touched')
    get ngClassTouched(): boolean {
        return this._cd.control ? this._cd.control.touched : false;
    }

    @HostBinding('class.ng-pristine')
    get ngClassPristine(): boolean {
        return this._cd.control ? this._cd.control.pristine : false;
    }

    @HostBinding('class.ng-dirty')
    get ngClassDirty(): boolean {
        return this._cd.control ? this._cd.control.dirty : false;
    }

    @HostBinding('class.ng-valid')
    get ngClassValid(): boolean {
        return this._cd.control ? this._cd.control.valid : false;
    }

    @HostBinding('class.ng-invalid')
    get ngClassInvalid(): boolean {
        return this._cd.control ? this._cd.control.invalid : false;
    }

    @HostBinding('class.ng-warned')
    get ngClassWarned(): boolean {
        return this._cd.control ? this._cd.control.warned : false;
    }

    @HostBinding('class.ng-pending')
    get ngClassPending(): boolean {
        return this._cd.control ? this._cd.control.pending : false;
    }
}

/**
 * @description
 * Directive automatically applied to Angular form controls that sets CSS classes
 * based on control status.
 *
 * @usageNotes
 *
 * ### CSS classes applied
 *
 * The following classes are applied as the properties become true:
 *
 * * ng-valid
 * * ng-invalid
 * * ng-warned
 * * ng-pending
 * * ng-pristine
 * * ng-dirty
 * * ng-untouched
 * * ng-touched
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
// tslint:disable-next-line: directive-selector
@Directive({ selector: '[formBindControlName],[ngBindModel],[formBindControl]' })
export class NgControlStatus extends AbstractBindControlStatus {
    constructor(@Self() cd: NgBindControl) {
        super(cd);
    }
}

/**
 * @description
 * Directive automatically applied to Angular form groups that sets CSS classes
 * based on control status (valid/invalid/dirty/etc).
 *
 * @see `NgControlStatus`
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[bindFormGroupName],[formArrayName],[ngBindModelGroup],[bindFormGroup],form:not([ngNoBindForm]),[ngBindForm]',
})
export class NgBindControlStatusGroup extends AbstractBindControlStatus {
    constructor(@Self() cd: BindControlContainer) {
        super(cd);
    }
}
