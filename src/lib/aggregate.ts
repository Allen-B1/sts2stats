import { Compute, Filter, FloorType, Multiplier, Run, RunComp, Stats, type ResourceID } from "./data";

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


    function addStats(self: Stats, other: Stats) {
        self.count += other.count;
        
        self.total += other.total;
        self.wins += other.wins;
    }
}

export interface FullStats {
    genStats: ResStats,
    resStats: Record<ResourceID, ResStats>,

    relics: ResourceID[],
    cards: ResourceID[]
}

export namespace FullStats {
    export function empty() : FullStats {
        return {
            genStats: ResStats.empty(),
            resStats: {},
            relics: [],
            cards: []
        };
    }
}

const GEN_MULT: Record<keyof ResStats, Multiplier>  = {
    "all": () => 1,
    "act1": (_, comp) => comp.acts.length >= 2 ? 1 : 0,
    "act2": (_, comp) => comp.acts.length >= 3 ? 1 : 0,
    "easy": (run) => 
        Number(run.floors.slice(0, -1).find(floor => floor.type == FloorType.ELITE) != null
        || run.floors.slice(0, -1).filter(floor => floor.type == FloorType.HALLWAY).length > 3)
};

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

        let genStats: ResStats = {} as any;
        for (let item in GEN_MULT) {
            genStats[item as keyof ResStats] = Compute.stats(runs, comps, GEN_MULT[item as keyof ResStats]);
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
            genStats: ResStats.empty(),
            resStats: {},
            relics: [],
            cards: []
        };


        for (let stat of stats){
            ResStats.add(full.genStats, stat.genStats);

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
    return res.filter(res => 
        resStats[res].all.count >= 5
    ).sort((a, b) => {
        const statsA = resStats[a].all;
        const statsB = resStats[b].all;

        const wrA = Stats.winrate(statsA), wrB = Stats.winrate(statsB);

        if (wrA != wrB) {
            return wrB - wrA;
        }
        return statsB.count - statsA.count;
    });
}