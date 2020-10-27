/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { BindFormErrorExamples as Examples } from './error_examples';

export class ReactiveBindErrors {
    static controlParentException(): void {
        throw new Error(
            `formBindControlName must be used with a parent bindFormGroup directive.  You'll want to add a bindFormGroup
       directive and pass it an existing BindFormGroup instance (you can create one in your class).

      Example:

      ${Examples.formBindControlName}`
        );
    }

    static ngModelGroupException(): void {
        throw new Error(
            `formBindControlName cannot be used with an ngBindModelGroup parent. It is only compatible with parents
       that also have a "form" prefix: bindFormGroupName, formArrayName, or bindFormGroup.

       Option 1:  Update the parent to be bindFormGroupName (reactive form strategy)

        ${Examples.bindFormGroupName}

        Option 2: Use ngBindModel instead of formBindControlName (template-driven strategy)

        ${Examples.ngBindModelGroup}`
        );
    }
    static missingFormException(): void {
        throw new Error(`bindFormGroup expects a BindFormGroup instance. Please pass one in.

       Example:

       ${Examples.formBindControlName}`);
    }

    static groupParentException(): void {
        throw new Error(
            `bindFormGroupName must be used with a parent bindFormGroup directive.  You'll want to add a bindFormGroup
      directive and pass it an existing BindFormGroup instance (you can create one in your class).

      Example:

      ${Examples.bindFormGroupName}`
        );
    }

    static arrayParentException(): void {
        throw new Error(
            `formArrayName must be used with a parent bindFormGroup directive.  You'll want to add a bindFormGroup
       directive and pass it an existing BindFormGroup instance (you can create one in your class).

        Example:

        ${Examples.formArrayName}`
        );
    }

    static disabledAttrWarning(): void {
        console.warn(`
      It looks like you're using the disabled attribute with a reactive form directive. If you set disabled to true
      when you set up this control in your component class, the disabled attribute will actually be set in the DOM for
      you. We recommend using this approach to avoid 'changed after checked' errors.

      Example:
      form = new BindFormGroup({
        first: new BindFormControl({value: 'Nancy', disabled: true}, BindValidators.required),
        last: new BindFormControl('Drew', BindValidators.required)
      });
    `);
    }

    static ngModelWarning(directiveName: string): void {
        console.warn(`
    It looks like you're using ngBindModel on the same form field as ${directiveName}.
    Support for using the ngBindModel input property and ngModelChange event with
    reactive form directives has been deprecated in Angular v6 and will be removed
    in Angular v7.

    For more information on this, see our API docs here:
    https://angular.io/api/forms/${directiveName === 'formBindControl' ? 'BindFormControlDirective' : 'BindFormControlName'}#use-with-ngmodel
    `);
    }
}
