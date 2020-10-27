import { ɵisObservable as isObservable, ɵisPromise as isPromise } from '@angular/core';
import { from, Observable } from 'rxjs';

export function toObservable(r: any): Observable<any> {
    const obs = isPromise(r) ? from(r) : r;
    if (!isObservable(obs)) {
        throw new Error(`Expected validator to return Promise or Observable.`);
    }
    return obs;
}

export function removeDir<T>(list: T[], el: T): void {
    const index = list.indexOf(el);
    if (index > -1) {
        list.splice(index, 1);
    }
}
