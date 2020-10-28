/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Directive, ElementRef, Injectable, Injector, Input, OnDestroy, OnInit, Renderer2, forwardRef, HostListener } from '@angular/core';

import { ControlBindValueAccessor, NG_BIND_VALUE_ACCESSOR } from './control_value_accessor';
import { NgBindControl } from './ng_control';

export const RADIO_VALUE_ACCESSOR: any = {
    provide: NG_BIND_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RadioControlBindValueAccessor),
    multi: true,
};

/**
 * @description
 * Class used by Angular to track radio buttons. For internal use only.
 */
@Injectable()
export class RadioControlRegistry {
    private _accessors: any[] = [];

    /**
     * @description
     * Adds a control to the internal registry. For internal use only.
     */
    add(control: NgBindControl, accessor: RadioControlBindValueAccessor) {
        this._accessors.push([control, accessor]);
    }

    /**
     * @description
     * Removes a control from the internal registry. For internal use only.
     */
    remove(accessor: RadioControlBindValueAccessor) {
        for (let i = this._accessors.length - 1; i >= 0; --i) {
            if (this._accessors[i][1] === accessor) {
                this._accessors.splice(i, 1);
                return;
            }
        }
    }

    /**
     * @description
     * Selects a radio button. For internal use only.
     */
    select(accessor: RadioControlBindValueAccessor) {
        this._accessors.forEach((c) => {
            if (this._isSameGroup(c, accessor) && c[1] !== accessor) {
                c[1].fireUncheck(accessor.value);
            }
        });
    }

    private _isSameGroup(controlPair: [NgBindControl, RadioControlBindValueAccessor], accessor: RadioControlBindValueAccessor): boolean {
        if (!controlPair[0].control) return false;
        return controlPair[0]._parent === accessor._control._parent && controlPair[1].name === accessor.name;
    }
}

/**
 * @description
 * The `ControlBindValueAccessor` for writing radio control values and listening to radio control
 * changes. The value accessor is used by the `BindFormControlDirective`, `BindFormControlName`, and
 * `NgBindModel` directives.
 *
 * @usageNotes
 *
 * ### Using radio buttons with reactive form directives
 *
 * The follow example shows how to use radio buttons in a reactive form. When using radio buttons in
 * a reactive form, radio buttons in the same group should have the same `formBindControlName`.
 * Providing a `name` attribute is optional.
 *
 * {@example forms/ts/reactiveRadioButtons/reactive_radio_button_example.ts region='Reactive'}
 *
 * @ngModule BindReactiveFormsModule
 * @ngModule BindFormsModule
 * @publicApi
 */
@Directive({
    // tslint:disable-next-line: directive-selector
    selector: 'input[type=radio][formBindControlName],input[type=radio][formBindControl],input[type=radio][ngBindModel]',
    providers: [RADIO_VALUE_ACCESSOR],
})
export class RadioControlBindValueAccessor implements ControlBindValueAccessor, OnDestroy, OnInit {
    /** @internal */
    // TODO(issue/24571): remove '!'.
    _state!: boolean;
    /** @internal */
    // TODO(issue/24571): remove '!'.
    _control!: NgBindControl;
    /** @internal */
    // TODO(issue/24571): remove '!'.
    _fn!: Function;

    /**
     * @description
     * The registered callback function called when a change event occurs on the input element.
     */
    @HostListener('change')
    onChange = () => {};

    /**
     * @description
     * The registered callback function called when a blur event occurs on the input element.
     */
    @HostListener('blur')
    onTouched = () => {};

    /**
     * @description
     * Tracks the name of the radio input element.
     */
    // TODO(issue/24571): remove '!'.
    @Input() name!: string;

    /**
     * @description
     * Tracks the name of the `BindFormControl` bound to the directive. The name corresponds
     * to a key in the parent `BindFormGroup` or `BindFormArray`.
     */
    // TODO(issue/24571): remove '!'.
    @Input() formBindControlName!: string;

    /**
     * @description
     * Tracks the value of the radio input element
     */
    @Input() value: any;

    constructor(private _renderer: Renderer2, private _elementRef: ElementRef, private _registry: RadioControlRegistry, private _injector: Injector) {}

    /**
     * @description
     * A lifecycle method called when the directive is initialized. For internal use only.
     */
    ngOnInit(): void {
        this._control = this._injector.get(NgBindControl);
        this._checkName();
        this._registry.add(this._control, this);
    }

    /**
     * @description
     * Lifecycle method called before the directive's instance is destroyed. For internal use only.
     */
    ngOnDestroy(): void {
        this._registry.remove(this);
    }

    /**
     * @description
     * Sets the "checked" property value on the radio input element.
     *
     * @param value The checked value
     */
    writeValue(value: any): void {
        this._state = value === this.value;
        this._renderer.setProperty(this._elementRef.nativeElement, 'checked', this._state);
    }

    /**
     * @description
     * Registers a function called when the control value changes.
     *
     * @param fn The callback function
     */
    registerOnChange(fn: (_: any) => {}): void {
        this._fn = fn;
        this.onChange = () => {
            fn(this.value);
            this._registry.select(this);
        };
    }

    /**
     * Sets the "value" on the radio input element and unchecks it.
     *
     * @param value Value of the Radio Control
     */
    fireUncheck(value: any): void {
        this.writeValue(value);
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

    private _checkName(): void {
        if (this.name && this.formBindControlName && this.name !== this.formBindControlName) {
            this._throwNameError();
        }
        if (!this.name && this.formBindControlName) this.name = this.formBindControlName;
    }

    private _throwNameError(): void {
        throw new Error(`
      If you define both a name and a formBindControlName attribute on your radio button, their values
      must match. Ex: <input type="radio" formBindControlName="food" name="food">
    `);
    }
}
