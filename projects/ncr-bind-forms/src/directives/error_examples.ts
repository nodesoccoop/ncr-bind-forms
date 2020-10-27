/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export const BindFormErrorExamples = {
    formBindControlName: `
    <div [bindFormGroup]="myGroup">
      <input formBindControlName="firstName">
    </div>

    In your class:

    this.myGroup = new BindFormGroup({
       firstName: new BindFormControl()
    });`,

    bindFormGroupName: `
    <div [bindFormGroup]="myGroup">
       <div bindFormGroupName="person">
          <input formBindControlName="firstName">
       </div>
    </div>

    In your class:

    this.myGroup = new BindFormGroup({
       person: new BindFormGroup({ firstName: new BindFormControl() })
    });`,

    formArrayName: `
    <div [bindFormGroup]="myGroup">
      <div formArrayName="cities">
        <div *ngFor="let city of cityArray.controls; index as i">
          <input [formBindControlName]="i">
        </div>
      </div>
    </div>

    In your class:

    this.cityArray = new BindFormArray([new BindFormControl('SF')]);
    this.myGroup = new BindFormGroup({
      cities: this.cityArray
    });`,

    ngBindModelGroup: `
    <form>
       <div ngBindModelGroup="person">
          <input [(ngBindModel)]="person.name" name="firstName">
       </div>
    </form>`,

    ngModelWithFormGroup: `
    <div [bindFormGroup]="myGroup">
       <input formBindControlName="firstName">
       <input [(ngBindModel)]="showMoreControls" [ngModelOptions]="{standalone: true}">
    </div>
  `
};
