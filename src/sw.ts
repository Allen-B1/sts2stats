import { Compute, Filter, RunComp, type ResourceID, type Run, type Stats } from "./lib/data";
import { FullStats } from "./lib/aggregate";

function parseFilter(s: string) : Filter[] { 
    return s.split(" ").map(part => {
        if (part == "solo") return Filter.players(1);
        const parts = part.split(":");

        switch (parts[0]) {
        case "mp":
            return Filter.players(+parts[1]);
        case "clad":
        case "ironclad":
            return Filter.character("CHARACTER.IRONCLAD");
        case "silent":
            return Filter.character("CHARACTER.SILENT");
        case "regent":
            return Filter.character("CHARACTER.REGENT");
        case "necro":
            return Filter.character("CHARACTER.NECROBINDER");
        case "defect":
            return Filter.character("CHARACTER.DEFECT");
        case "asc":
            return Filter.asc(+parts[1]);
        default:
            return null
        }
    }).filter(Boolean) as any;
}

self.onmessage = (msg) => {
    switch (msg.data.kind) {
    case "fullstats":
        const runs: Run[] = msg.data.runs;
        const baseFilter: Filter = msg.data.filter ? () => 1 : Filter.all(...parseFilter(msg.data.filter + ""));
        let comps: Record<string, RunComp> = {};
        for (let run of runs) {
            comps[run.start] = RunComp.from(run);
        }

        const filtered = Compute.filter(runs, comps, baseFilter);

        self.postMessage({ reqid: msg.data.reqid, result: FullStats.get(filtered) });
        break;
    case "aggregate":
        const stats: Record<string, FullStats> = msg.data.stats;
        self.postMessage({ reqid: msg.data.reqid, result: FullStats.aggregate(stats, msg.data.mode) })
        break;
    }

}

