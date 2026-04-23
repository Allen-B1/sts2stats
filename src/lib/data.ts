export interface Run {
    start: number,
    version: string,
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

export type Filter = string;

export namespace Filter {
    function isChar(run: Run, char: string) : boolean {
        return run.players.filter(p => p.character == "CHARACTER." + char).length != 0;
    }

    export function normalize(filter: Filter) : Filter {
        return filter.split("_").sort().join("_");
    }

    export function test(filter: Filter, run: Run) : boolean {
        let queries = filter.split("_");
        for (let query of queries) {
            const parts = query.split("-");
            const args = parts.slice(1);
            switch (parts[0]) {
                case "c":
                    if (run.players.length == 1) {
                        if (!args.map(c => "CHARACTER." + c).includes(run.players[0].character)) {
                            return false;
                        }
                    } else {
                        for (let char of args) {
                            if (!isChar(run, char)) {
                                return false;
                            }
                        }

                    }

                    break;
                case "p":
                    if (!(run.players.length == +args[0] || args[0] == "m" && run.players.length != 1)) {
                        return false;
                    }
                    break;
                case "asc":
                    if (!args.map(Number).includes(run.asc)) {
                        return false;
                    }
                    break;
                case "act":
                    for (let act in args) {
                        if (!run.acts.map(s => s.split(".")[1]).includes(act)) {
                            return false;
                        }
                    }
                    break;
                case "v":
                    if (run.version != args[0]) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }
}


export type Multiplier = (run: Run, comp: RunComp) => number;

export namespace Multiplier {
    export function res(id: string) : Multiplier {
        return (run, comp) => Run.resources(run).flat().filter(res => res.id == id).length;
    }
    export function resAct(id: string, act: number) : Multiplier {
        return (run, comp) => Run.resources(run).flat().filter(res => res.id == id &&
            res.added < (comp.acts[act] || Infinity)
        ).length;
    }
    export function resEasy(id: string) : Multiplier {
        return (run, comp) => Run.resources(run).flat().filter(res => res.id == id && res.added < comp.adv).length;
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
    export function filter(runs: Run[], filter: Filter) : Run[] {
        return runs.filter(run => Filter.test(filter, run));
    }

    export function stats(runs: Run[], comps: Record<string, RunComp>, m: Multiplier) : Stats {
        const stats: Stats = Stats.empty();
        for (let run of runs) {
            const weight = m(run, comps[run.start]);
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