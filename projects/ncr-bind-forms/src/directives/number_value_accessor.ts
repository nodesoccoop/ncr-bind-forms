/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, ElementRef, Renderer2, forwardRef, HostListener } from '@angular/core';

import { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from './control_value_accessor';

export const NUMBER_VALUE_ACCESSOR: any = {
    provide: NG_BIND_VALUE_ACCESSOR,
    useExisting: forwardRef(() => NumberBindValueAccessor),
    multi: true,
};

/**
 * @description
 * The `ControlBindValueAccessor` for writing a number value and listening to number input changes.
 * The value accessor is used by the `BindFormControlDirective`, `BindFormControlName`, and  `NgBindModel`
 * directives.
 *
 * @usageNotes
 *
 * ### Using a number input with a reactive form.
 *
 * The following example shows how to use a number input with a reactive form.
 *
 * ```ts
 * const totalCountControl = new BindFormControl();
 * ```
 *
 * ```
 * <input type="number" [formBindControl]="totalCountControl">
 * ```
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: 'input[type=number][formBindControlName],input[type=number][formBindControl],input[type=number][ngBindModel]',
    providers: [NUMBER_VALUE_ACCESSOR],
})
export class NumberBindValueAccessor implements ControlBindValueAccessor {
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
    writeValue(value: number): void {
        // The value needs to be normalized for IE9, otherwise it is set to 'null' when null
        const normalizedValue = value == null ? '' : value;
        this._renderer.setProperty(this._elementRef.nativeElement, 'value', normalizedValue);
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
     * Sets the "disabled" property on the input element.
     *
     * @param isDisabled The disabled value
     */
    setDisabledState(isDisabled: boolean): void {
        this._renderer.setProperty(this._elementRef.nativeElement, 'disabled', isDisabled);
    }
}
