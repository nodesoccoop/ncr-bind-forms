/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BindFormErrorExamples as Examples } from './error_examples';

export class TemplateDrivenBindErrors {
    static modelParentException(): void {
        throw new Error(`
      ngBindModel cannot be used to register form controls with a parent bindFormGroup directive.  Try using
      bindFormGroup's partner directive "formBindControlName" instead.  Example:

      ${Examples.formBindControlName}

      Or, if you'd like to avoid registering this form control, indicate that it's standalone in ngModelOptions:

      Example:

      ${Examples.ngModelWithFormGroup}`);
    }

    static formGroupNameException(): void {
        throw new Error(`
      ngBindModel cannot be used to register form controls with a parent bindFormGroupName or formArrayName directive.

      Option 1: Use formBindControlName instead of ngBindModel (reactive strategy):

      ${Examples.bindFormGroupName}

      Option 2:  Update ngBindModel's parent be ngBindModelGroup (template-driven strategy):

      ${Examples.ngBindModelGroup}`);
    }

    static missingNameException() {
        throw new Error(
            `If ngBindModel is used within a form tag, either the name attribute must be set or the form
      control must be defined as 'standalone' in ngModelOptions.

      Example 1: <input [(ngBindModel)]="person.firstName" name="first">
      Example 2: <input [(ngBindModel)]="person.firstName" [ngModelOptions]="{standalone: true}">`
        );
    }

    static modelGroupParentException() {
        throw new Error(`
      ngBindModelGroup cannot be used with a parent bindFormGroup directive.

      Option 1: Use bindFormGroupName instead of ngBindModelGroup (reactive strategy):

      ${Examples.bindFormGroupName}

      Option 2:  Use a regular form tag instead of the bindFormGroup directive (template-driven strategy):

      ${Examples.ngBindModelGroup}`);
    }
}
