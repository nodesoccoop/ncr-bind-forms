/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, ElementRef, Renderer2, StaticProvider, forwardRef, HostListener } from '@angular/core';

import { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from './control_value_accessor';

export const RANGE_VALUE_ACCESSOR: StaticProvider = {
    provide: NG_BIND_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RangeBindValueAccessor),
    multi: true,
};

/**
 * @description
 * The `ControlBindValueAccessor` for writing a range value and listening to range input changes.
 * The value accessor is used by the `BindFormControlDirective`, `BindFormControlName`, and  `NgBindModel`
 * directives.
 *
 * @usageNotes
 *
 * ### Using a range input with a reactive form
 *
 * The following example shows how to use a range input with a reactive form.
 *
 * ```ts
 * const ageControl = new BindFormControl();
 * ```
 *
 * ```
 * <input type="range" [formBindControl]="ageControl">
 * ```
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: 'input[type=range][formBindControlName],input[type=range][formBindControl],input[type=range][ngBindModel]',
    providers: [RANGE_VALUE_ACCESSOR],
})
export class RangeBindValueAccessor implements ControlBindValueAccessor {
    /**
     * @description
     * The registered callback function called when a change or input event occurs on the input
     * element.
     */
    @HostListener('change', ['$event.target.value'])
    @HostListener('input', ['$event.target.value'])
    onChange = (_: any) => {};

    /**
     * @description
     * The registered callback function called when a blur event occurs on the input element.
     */
    @HostListener('blur')
    onTouched = () => {};

    constructor(private _renderer: Renderer2, private _elementRef: ElementRef) {}

    /**
     * Sets the "value" property on the input element.
     *
     * @param value The checked value
     */
    writeValue(value: any): void {
        this._renderer.setProperty(this._elementRef.nativeElement, 'value', parseFloat(value));
    }

    /**
     * @description
     * Registers a function called when the control value changes.
     *
     * @param fn The callback function
     */
    registerOnChange(fn: (_: number | null) => void): void {
        this.onChange = (value) => {
            fn(value === '' ? null : parseFloat(value));
        };
    }

    /**
     * @description
     * Registers a function called when the control is touched.
     *
     * @param fn The callback function
     */
    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    /**
     * Sets the "disabled" property on the range input element.
     *
     * @param isDisabled The disabled value
     */
    setDisabledState(isDisabled: boolean): void {
        this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
    }
}
