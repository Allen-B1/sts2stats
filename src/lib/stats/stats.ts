import { FloorType, Run, type Floor, type ResourceID } from "./run";

export type Stat = `${number}-${number}-${number}`;

export namespace Stat {
    export function create(target: number, total: number, runs: number) : Stat {
        return `${target}-${total}-${runs}`
    }
    export function zero() : Stat {
        return `0-0-0`;
    }
    export function target(stats: Stat) : number {
        return +(stats.split("-")[0]);
    }
    export function total(stats: Stat) : number {
        return +(stats.split("-")[1]);
    }
    export function runs(stats: Stat) : number {
        return +(stats.split("-")[2]);
    }
    export function ratio(stats: Stat) : number {
        const parts = stats.split("-");
        return parts[1] == "0" ? 1 : +parts[0]/+parts[1];
    }

    export function add(self: Stat, other: Stat) : Stat {
        return `${target(self)+target(other)}-${total(self)+total(other)}-${runs(self)+runs(other)}`
    }
}

export interface RunCache {
    acts: number[],
    adv: number
}

export namespace RunCache {
    export function from(run: Run) : RunCache {
        const floorsWithNum = run.floors.map((floor, i) => [floor, i] as [Floor, number]);

        const hallways = floorsWithNum.filter(floor => floor[0].type == FloorType.HALLWAY).map(a => a[1]),
            elites = floorsWithNum.filter(floor => floor[0].type == FloorType.ELITE).map(a => a[1]);
        return {
            acts: floorsWithNum.filter(floor => floor[0].type == FloorType.ANCIENT).map(floor => floor[1]),
            adv: Math.min(hallways[4] || Infinity, elites[0] || Infinity)
        }
    }

    export function fromAll(runs: Run[]) : RunCache[] {
        return runs.map(RunCache.from);
    }
}

export type Weight = (run: Run, cache: RunCache) => number;

export namespace Weight {
    export function resource(id: string) : Weight {
        return (run, _) => Run.resources(run).flat().filter(res => res.id == id).length;
    }
    export function resourceAct(id: string, act: number) : Weight {
        return (run, cache) => Run.resources(run).flat().filter(res => res.id == id &&
            res.added >= cache.acts[act] &&
            res.added < (cache.acts[act+1] || Infinity)
        ).length;
    }
    export function resourceEasy(id: string) : Weight {
        return (run, cache) => Run.resources(run).flat().filter(res => res.id == id && 
            res.added < cache.adv
        ).length;
    }

    export const one: Weight = (run: Run, _) => 1;
    
    export function act(act: number) : Weight {
        return (run, comp) => Number(comp.acts.length > act);
    }
}

export type Target = (run: Run, cache: RunCache) => boolean;

export namespace Target {
    export const win: Target = (run: Run, cache: RunCache) => run.win;
    export const loss: Target = (run: Run, cache: RunCache) => !run.win;
}

export function computeStatOne(run: Run, cache: RunCache, weight: Weight, target: Target) : Stat {
    const w = weight(run, cache);
    if (w == 0) {
        return Stat.zero();
    }
    if (target(run, cache)) {
        return Stat.create(w,w,1);
    } else {
        return Stat.create(0,w,1);
    }
}

export function computeStat(runs: Run[], caches: RunCache[], weight: Weight, target: Target) : Stat {
    return runs.reduce((acc, run, i) => Stat.add(acc, computeStatOne(run, caches[i], weight, target)), Stat.zero())
}

export type Schema = [Weight, Target];
export function computeStats(runs: Run[], caches: RunCache[], schemas: [Weight, Target][]) : Stat[] {
    return schemas.map(schema => computeStat(runs, caches, schema[0], schema[1]));
}

export namespace Standard {
    export const RES_STATS = (res: ResourceID) : Schema[] => [
        [Weight.resource(res), Target.win],
        [Weight.resourceAct(res, 0), Target.win],
        [Weight.resourceAct(res, 1), Target.win],
        [Weight.resourceAct(res, 2), Target.win],
        [Weight.resourceEasy(res), Target.win],
    ];

    export const GEN_STATS: Schema[] = [
        [Weight.one, Target.win],
        [Weight.act(0), Target.loss],
        [Weight.act(1), Target.loss],
        [Weight.act(2), Target.loss]
    ];

    export enum ResStats {
        ANY, ACT1, ACT2, ACT3, EASY
    }

    export enum GenStats {
        ALL, ACT1, ACT2, ACT3
    }

    export type Stats = Record<ResourceID | "gen", Stat[]>;

    export function compute(runs: Run[]) : Stats {
        const resources = Array.from(new Set(
            runs.map(run => Run.resources(run).flat().map(res => res.id)).flat()
        ));
        const caches = RunCache.fromAll(runs);

        const data: Record<ResourceID | "gen", Stat[]> = {} as any;
        for (let resource of resources) {
            data[resource] = computeStats(runs, caches, RES_STATS(resource));
        }
        data.gen = computeStats(runs, caches, GEN_STATS);

        return data;
    }

    export function combine(statss: Standard.Stats[]) {
        let combined: Standard.Stats = {} as any;
        for (let stats of statss) {
            for (let key_ in stats) {
                const key = key_ as ResourceID | "gen";
                if (!(key in combined)) {
                    combined[key] = Array(key == "gen" ? GEN_STATS.length : RES_STATS("RELIC.ANCHOR").length).fill(Stat.zero());
                }
                combined[key] = combined[key].map((stat, i) => Stat.add(stat, stats[key][i]));
            }
        }
        return combined;
    }
}