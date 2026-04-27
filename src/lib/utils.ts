import { get, writable, type Readable, type Writable } from "svelte/store";
import { Stat } from "./stats/stats";

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

export function displayStats(stats: Stat) : string {
    if (Stat.runs(stats) < 7) {
        return `<span class="stats" title="${Stat.runs(stats)} runs">-</span>`;
    }
    return `<span class="stats" title="${Stat.runs(stats)} runs">` + (100*Stat.ratio(stats)).toFixed(1) + "%</span>";
}

export function displayText(text: string) : string {
    return text
        .replace(/\n/g, "<br />")
        .replace(/\[energy\:([0-9]+)\]/g, `$1 <span class="fg-text-gold">Energy</span>`)
        .replace(/\[star\:([0-9]+)\]/g, `$1 <span class="fg-text-gold">Stars</span>`)
        .replace(/\[\/([^\[\]]*)\]/g, `</span>`)
        .replace(/\[([^\[\]]*)]/g, `<span class="fg-text-$1">`)
}