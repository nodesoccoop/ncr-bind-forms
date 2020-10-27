import { AbstractBindControl } from './model';

/**
 * @description
 * A function that receives a control and synchronously returns a map function to
 * transform the value of the control if present, otherwise null.
 *
 * @publicApi
 */
export type BindTransformerFn = (control: AbstractBindControl) => any;

/**
 * @description
 * Provides a set of built-in validators that can be used by form controls.
 *
 * A validator is a function that processes a `BindFormControl` or collection of
 * controls and returns an error map or null. A null map means that validation has passed.
 *
 * @see [BindForm Validation](/guide/form-validation)
 *
 * @publicApi
 */
export class BindTransformers {
    /**
     * @description
     * BindTransformer that performs no operation.
     *
     */
    static nullTransformer(control: AbstractBindControl): any {
        return control.value;
    }

    /**
     * @description
     * Compose multiple validators into a single function that returns the union
     * of the individual error maps for the provided control.
     *
     * @returns A validator function that returns an error map with the
     * merged error maps of the validators if the validation check fails, otherwise `null`.
     *
     * @see `updateValueAndValidity()`
     *
     */
    static compose(transformers: null): null;
    static compose(transformers: (BindTransformerFn | null | undefined)[]): BindTransformerFn | null;
    static compose(transformers: (BindTransformerFn | null | undefined)[] | null): BindTransformerFn | null {
        if (!transformers) {
            return null;
        }
        const presentTransformers: BindTransformerFn[] = transformers.filter(isPresent) as any;
        if (presentTransformers.length === 0) {
            return null;
        }

        return (value: any) => {
            return _executeTransformers(value, presentTransformers);
        };
    }
}

function isPresent(o: any): boolean {
    return o != null;
}

function _executeTransformers(value: any, transformers: BindTransformerFn[]): any {
    transformers.forEach((fn) => (value = fn(value)));
    return value;
}
