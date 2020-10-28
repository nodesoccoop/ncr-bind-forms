/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, ElementRef, Renderer2, forwardRef, HostListener } from '@angular/core';

import { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from './control_value_accessor';

export const CHECKBOX_VALUE_ACCESSOR: any = {
    provide: NG_BIND_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CheckboxControlBindValueAccessor),
    multi: true,
};

/**
 * @description
 * A `ControlBindValueAccessor` for writing a value and listening to changes on a checkbox input
 * element.
 *
 * @usageNotes
 *
 * ### Using a checkbox with a reactive form.
 *
 * The following example shows how to use a checkbox with a reactive form.
 *
 * ```ts
 * const rememberLoginControl = new BindFormControl();
 * ```
 *
 * ```
 * <input type="checkbox" [formBindControl]="rememberLoginControl">
 * ```
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: 'input[type=checkbox][formBindControlName],input[type=checkbox][formBindControl],input[type=checkbox][ngBindModel]',
    providers: [CHECKBOX_VALUE_ACCESSOR],
})
export class CheckboxControlBindValueAccessor implements ControlBindValueAccessor {
    /**
     * @description
     * The registered callback function called when a change event occurs on the input element.
     */
    @HostListener('change', ['$event.target.checked'])
    onChange = (_: any) => {};

    /**
     * @description
     * The registered callback function called when a blur event occurs on the input element.
     */
    @HostListener('blur')
    onTouched = () => {};

    constructor(private _renderer: Renderer2, private _elementRef: ElementRef) {}

    /**
     * Sets the "checked" property on the input element.
     *
     * @param value The checked value
     */
    writeValue(value: any): void {
        this._renderer.setProperty(this._elementRef.nativeElement, 'checked', value);
    }

    /**
     * @description
     * Registers a function called when the control value changes.
     *
     * @param fn The callback function
     */
    registerOnChange(fn: (_: any) => {}): void {
        this.onChange = fn;
    }

    /**
     * @description
     * Registers a function called when the control is touched.
     *
     * @param fn The callback function
     */
    registerOnTouched(fn: () => {}): void {
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
