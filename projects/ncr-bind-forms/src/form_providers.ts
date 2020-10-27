/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { ModuleWithProviders, NgModule } from '@angular/core';

// tslint:disable-next-line: max-line-length
import { InternalBindFormsSharedModule, NG_MODEL_WITH_FORM_CONTROL_WARNING, BIND_REACTIVE_DRIVEN_DIRECTIVES, BIND_TEMPLATE_DRIVEN_DIRECTIVES } from './directives';
import { RadioControlRegistry } from './directives/radio_control_value_accessor';
import { BindFormBuilder } from './form_builder';

/**
 * Exports the required providers and directives for template-driven forms,
 * making them available for import by NgModules that import this module.
 *
 * @see [Forms Guide](/guide/forms)
 *
 * @publicApi
 */
@NgModule({
    declarations: BIND_TEMPLATE_DRIVEN_DIRECTIVES,
    providers: [RadioControlRegistry],
    exports: [InternalBindFormsSharedModule, BIND_TEMPLATE_DRIVEN_DIRECTIVES],
})
export class BindFormsModule {}

/**
 * Exports the required infrastructure and directives for reactive forms,
 * making them available for import by NgModules that import this module.
 * @see [Forms](guide/reactive-forms)
 *
 * @see [Reactive Forms Guide](/guide/reactive-forms)
 *
 * @publicApi
 */
@NgModule({
    declarations: [BIND_REACTIVE_DRIVEN_DIRECTIVES],
    providers: [BindFormBuilder, RadioControlRegistry],
    exports: [InternalBindFormsSharedModule, BIND_REACTIVE_DRIVEN_DIRECTIVES],
})
export class BindReactiveFormsModule {
    /**
     * @description
     * Provides options for configuring the reactive forms module.
     *
     * @param opts An object of configuration options
     * * `warnOnNgModelWithFormControl` Configures when to emit a warning when an `ngBindModel`
     * binding is used with reactive form directives.
     */
    static withConfig(opts: { /** @deprecated as of v6 */ warnOnNgModelWithFormControl: 'never' | 'once' | 'always' }): ModuleWithProviders<BindReactiveFormsModule> {
        return {
            ngModule: BindReactiveFormsModule,
            providers: [
                {
                    provide: NG_MODEL_WITH_FORM_CONTROL_WARNING,
                    useValue: opts.warnOnNgModelWithFormControl,
                },
            ],
        };
    }
}
