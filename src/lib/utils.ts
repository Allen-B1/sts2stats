import { get, writable, type Readable, type Writable } from "svelte/store";

export function titlecase(s: string) {
    return s.split(" ")
        .map(a => !a.length ? "" : a[0].toUpperCase() + a.slice(1).toLowerCase())
        .join(" ");
}

export function curry<T, U, V>(f: (t: T, u: U) => V) : (t: T) => (u: U) => V {
    return (t) => ((u) => f(t,u));
}


export interface Errors {
    msg: string,
    time: number,
}

export namespace Errors {
    export function show(e: Writable<Errors>, msg: string) {
        const date = Date.now();

        e.update($e => {
            $e.msg = msg;
            $e.time = date;
            return $e;
        });

        let interval = setInterval(() => {
            e.update($e => {
                if (Date.now() - $e.time >= 5000) {
                    $e.msg = "";
                    $e.time = 0;
                    clearInterval(interval);
                }
                return $e;
            });
        }, 500);
    }

    export function create() : Writable<Errors> {
        const errors = writable({ msg: "", time: 0 });
        return errors;
    }

    export function countdown(e: Errors) : number {
        return Math.ceil((5000 - (Date.now() - e.time)) / 1000);
    }
}