/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { ɵgetDOM as getDOM } from '@angular/platform-browser';
import { Directive, ElementRef, Inject, InjectionToken, Optional, Renderer2, forwardRef, HostListener } from '@angular/core';
import { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from './control_value_accessor';

export const DEFAULT_VALUE_ACCESSOR: any = {
    provide: NG_BIND_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DefaultBindValueAccessor),
    multi: true,
};

/**
 * We must check whether the agent is Android because composition events
 * behave differently between iOS and Android.
 */
function _isAndroid(): boolean {
    const userAgent = getDOM() ? getDOM().getUserAgent() : '';
    return /android (\d+)/.test(userAgent.toLowerCase());
}

/**
 * @description
 * Provide this token to control if form directives buffer IME input until
 * the "compositionend" event occurs.
 * @publicApi
 */
export const COMPOSITION_BUFFER_MODE = new InjectionToken<boolean>('CompositionEventMode');

/**
 * @description
 * The default `ControlBindValueAccessor` for writing a value and listening to changes on input
 * elements. The accessor is used by the `BindFormControlDirective`, `BindFormControlName`, and
 * `NgBindModel` directives.
 *
 * @usageNotes
 *
 * ### Using the default value accessor
 *
 * The following example shows how to use an input element that activates the default value accessor
 * (in this case, a text field).
 *
 * ```ts
 * const firstNameControl = new BindFormControl();
 * ```
 *
 * ```
 * <input type="text" [formBindControl]="firstNameControl">
 * ```
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    selector:
        // tslint:disable-next-line: directive-selector
        'input:not([type=checkbox])[formBindControlName],textarea[formBindControlName],input:not([type=checkbox])[formBindControl],textarea[formBindControl],input:not([type=checkbox])[ngBindModel],textarea[ngBindModel],[ngDefaultControl]',
    // TODO: vsavkin replace the above selector with the one below it once
    // https://github.com/angular/angular/issues/3011 is implemented
    // selector: '[ngBindModel],[formBindControl],[formBindControlName]',
    host: {
        '(input)': '$any(this)._handleInput($event.target.value)',
    },
    providers: [DEFAULT_VALUE_ACCESSOR],
})
export class DefaultBindValueAccessor implements ControlBindValueAccessor {
    constructor(private _renderer: Renderer2, private _elementRef: ElementRef, @Optional() @Inject(COMPOSITION_BUFFER_MODE) private _compositionMode: boolean) {
        if (this._compositionMode == null) {
            this._compositionMode = !_isAndroid();
        }
    }

    /** Whether the user is creating a composition string (IME events). */
    private _composing = false;
    /**
     * @description
     * The registered callback function called when an input event occurs on the input element.
     */
    onChange = (_: any) => {};

    /**
     * @description
     * The registered callback function called when a blur event occurs on the input element.
     */
    @HostListener('blur')
    onTouched = () => {};

    /**
     * Sets the "value" property on the input element.
     *
     * @param value The checked value
     */
    writeValue(value: any): void {
        const normalizedValue = value == null ? '' : value;
        this._renderer.setProperty(this._elementRef.nativeElement, 'value', normalizedValue);
    }

    /**
     * @description
     * Registers a function called when the control value changes.
     *
     * @param fn The callback function
     */
    registerOnChange(fn: (_: any) => void): void {
        this.onChange = fn;
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

    /** @internal */
    @HostListener('input', ['$event.target.value'])
    _handleInput(value: any): void {
        if (!this._compositionMode || (this._compositionMode && !this._composing)) {
            this.onChange(value);
        }
    }

    /** @internal */
    @HostListener('compositionstart', [])
    _compositionStart(): void {
        this._composing = true;
    }

    /** @internal */
    @HostListener('compositionend', ['$event.target.value'])
    _compositionEnd(value: any): void {
        this._composing = false;
        this._compositionMode && this.onChange(value);
    }
}
