export interface Run {
    start: number,
    version: string,
    asc: number,
    players: Player[],
    acts: ActID[],

    win: boolean,
    [key: `resources-${number}`]: Resource[],
    [key: `rewards-${number}`] : Reward[]
    floors: Floor[],
}

export namespace Run {
    export function resources(run: Run) : Resource[][] {
        return run.players.map((_, i) => run[`resources-${i}`] || []);
    }

    export function rewards(run: Run) : Reward[][] {
        return run.players.map((_, i) => run[`rewards-${i}`] || []);
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

export interface Reward {
    resource: ResourceID,
    picked: boolean,
    floor: number
}

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
                    if (!run.version.startsWith(args[0])) {
                        return false;
                    }
                    break;
            }
        }

        return true;
    }

    export function filter(filter: Filter, runs: Run[]) : Run[] {
        return runs.filter(run => Filter.test(filter, run));
    }
}
