export interface Run {
    start: number,
    asc: number,
    players: Player[],
    acts: ActID[],

    win: boolean,
    [key: `resources-${number}`]: Resource[],
    floors: Floor[],
}

export namespace Run {
    export function resources(run: Run) : Resource[][] {
        return run.players.map((_, i) => run[`resources-${i}`]);
    }
}

export type ActID = `ACT.${string}`;

export interface Player {
    character: string,
    id: number,
}

export interface Resource {
    id: ResourceID,
    added: number,
    upgraded?: number,
    removed?: number,
}
export type ResourceID = `CARD.${string}` | `RELIC.${string}` | `POTION.${string}`;

export interface Floor {
    type: FloorType,
    id: FloorID,
}

export type FloorID = string;

export enum FloorType {
    ANCIENT,

    HALLWAY,
    ELITE,
    BOSS,

    REST,
    CHEST,
    SHOP,
    EVENT
}


export interface RunComp {
    acts: number[],
    adv: number
}

export namespace RunComp {
    export function from(run: Run) : RunComp {
        const floorsWithNum = run.floors.map((floor, i) => [floor, i] as [Floor, number]);

        const hallways = floorsWithNum.filter(floor => floor[0].type == FloorType.HALLWAY).map(a => a[1]),
            elites = floorsWithNum.filter(floor => floor[0].type == FloorType.ELITE).map(a => a[1]);
        return {
            acts: floorsWithNum.filter(floor => floor[0].type == FloorType.ANCIENT).map(floor => floor[1]),
            adv: Math.min(hallways[4] || Infinity, elites[0] || Infinity)
        }
    }
}

export type Filter = (run: Run, comp: RunComp) => number;

export namespace Filter {
    export function res(id: string) : Filter {
        return (run, comp) => Run.resources(run).flat().filter(res => res.id == id).length;
    }
    export function resAct(id: string, act: number) : Filter {
        return (run, comp) => Run.resources(run).flat().filter(res => res.id == id &&
            res.added < (comp.acts[act] || Infinity)
        ).length;
    }

    export function resEasy(id: string) : Filter {
        return (run, comp) => Run.resources(run).flat().filter(res => res.id == id && res.added < comp.adv).length;
    }

    export function asc(asc: number) : Filter {
        return (run) => run.asc == asc ? 1 : 0;
    }

    export function players(n: number) : Filter {
        return (run) => run.players.length == n ? 1 : 0;
    }

    export function character(char: string) : Filter {
        return (run) => run.players.filter(p => p.character == char).length != 0 ? 1 : 0;
    }

    export function all(...filters: Filter[]) : Filter {
        return (run, comp) => filters.find(f => !f(run, comp)) == null ? 1 : 0;
    }
}

export interface Stats {
    wins: number,
    total: number,
    count: number
}

export namespace Stats {
    export function empty() : Stats {
        return {
            wins: 0, total: 0,
            count: 0
        };
    }


    export function winrate(self: Stats) {
        if (self.total == 0) {
            return 1;
        }

        return self.wins / self.total;
    }
}

export namespace Compute {
    export function filter(runs: Run[], comps: Record<string, RunComp>, filter: Filter) : Run[] {
        return runs.filter(run => filter(run, comps[run.start]));
    }

    export function stats(runs: Run[], comps: Record<string, RunComp>, filter: Filter) : Stats {
        const stats: Stats = Stats.empty();
        for (let run of runs) {
            const weight = filter(run, comps[run.start]);
            if (run.win) {
                stats.wins += weight;
            }
            stats.total += weight;

            if (weight != 0)
                stats.count += 1;
        }

        return stats;
    }
}