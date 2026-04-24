import { Compute, Filter, FloorType, Multiplier, Run, RunComp, Stats, type ResourceID } from "./data";

function addStats(self: Stats, other: Stats) {
    self.count += other.count;
    
    self.total += other.total;
    self.wins += other.wins;
}

export interface GenStats {
    deathAct1: Stats,
    deathAct2: Stats,
    deathAct3: Stats,
    wins: Stats,
    players: number[],
}

export namespace GenStats {
    export function empty() : GenStats {
        return {
            deathAct1: Stats.empty(),
            deathAct2: Stats.empty(),
            deathAct3: Stats.empty(),
            wins: Stats.empty(),
            players: []
        }
    }

    export function add(self: GenStats, other: GenStats) {
        addStats(self.deathAct1, other.deathAct1);
        addStats(self.deathAct2, other.deathAct2);
        addStats(self.deathAct3, other.deathAct3);
        addStats(self.wins, other.wins);
        self.players = [...new Set(self.players.concat(other.players))].sort()
    }

    export function from(run: Run, comp: RunComp) : GenStats {
        let gs = GenStats.empty();
        for (let i = 1; i <= 3; i++) {
            const stat = gs[`deathAct${i}` as keyof GenStats] as Stats;
            if (comp.acts.length >= i) {
                stat.count += 1;
                stat.total += 1;
                if (!(comp.acts.length >= i+1 || run.win)) {
                    stat.wins += 1;
                }
            }
        }

        gs.wins.count += 1;
        gs.wins.total += 1;
        if (run.win) {
            gs.wins.wins += 1;
        }

        if (run.players.length == 1) {
            gs.players.push(run.players[0].id);
        }

        return gs;
    }
}

export interface ResStats {
    easy: Stats,
    act1: Stats,
    act2: Stats,
    all: Stats,
}

export namespace ResStats {
    export function empty() : ResStats {
        return {
            easy: Stats.empty(),
            act1: Stats.empty(),
            act2: Stats.empty(),
            all: Stats.empty()
        }
    }

    export function add(self: ResStats, other: ResStats) {
        addStats(self.easy, other.easy);
        addStats(self.act1, other.act1);
        addStats(self.act2, other.act2);
        addStats(self.all, other.all);
    }
}

export interface FullStats {
    genStats: GenStats,
    resStats: Record<ResourceID, ResStats>,

    relics: ResourceID[],
    cards: ResourceID[]
}

export namespace FullStats {
    export function empty() : FullStats {
        return {
            genStats: GenStats.empty(),
            resStats: {},
            relics: [],
            cards: []
        };
    }
}

const RES_MULT: Record<keyof ResStats, (res:ResourceID) => Multiplier> = {
    "easy": Multiplier.resEasy,
    "act1": (res: ResourceID) => Multiplier.resAct(res, 1),
    "act2": (res: ResourceID) => Multiplier.resAct(res, 2),
    "all": Multiplier.res
}

export namespace FullStats {
    export function get(runs: Run[]) : FullStats {
        const resources = [... new Set (runs.map(run => Run.resources(run)).flat().flat().map(res => res.id))];
        const comps: Record<string, RunComp> = {};
        for (let run of runs) {
            comps[run.start] = RunComp.from(run);
        }

        let resStats: Record<ResourceID, ResStats> = {};
        for (let res of resources) {
            let resStat: ResStats = {} as any;
            for (let item in RES_MULT) {
                resStat[item as keyof ResStats] = Compute.stats(runs, comps, RES_MULT[item as keyof ResStats](res));
            }
            resStats[res] = resStat;
        }

        let genStats: GenStats = GenStats.empty();
        for (let run of runs) {
            GenStats.add(genStats, GenStats.from(run, comps[run.start]));
        }

        return {
            genStats,
            resStats,

            relics: sortRes(resources.filter(id => id.startsWith("RELIC.")), resStats),
            cards:  sortRes(resources.filter(id => id.startsWith("CARD." )), resStats)
        }
    
    }

    export function aggregate(stats: FullStats[]) : FullStats {
        let full: FullStats = {
            genStats: GenStats.empty(),
            resStats: {},
            relics: [],
            cards: []
        };


        for (let stat of stats){
            GenStats.add(full.genStats, stat.genStats);

            for (let res_ in stat.resStats) {
                const res = res_ as ResourceID;
                if (!full.resStats[res]) {
                    full.resStats[res] = ResStats.empty();
                }

                ResStats.add(full.resStats[res], stat.resStats[res]);
            }

            full.cards.push(...stat.cards);
            full.relics.push(...stat.relics);
        }

        full.cards = sortRes(full.cards, full.resStats);
        full.relics = sortRes(full.relics, full.resStats);

        return full;
    }
}

function sortRes(res: ResourceID[], resStats: Record<ResourceID, ResStats>) : ResourceID[] {
    return [... new Set(res.filter(res => 
        resStats[res].all.count >= THRESHOLD
    ))].sort((a, b) => {
        const statsA = resStats[a].all;
        const statsB = resStats[b].all;

        const wrA = Stats.winrate(statsA), wrB = Stats.winrate(statsB);

        if (wrA != wrB) {
            return wrB - wrA;
        }
        return statsB.count - statsA.count;
    });
}

export const THRESHOLD = 8;