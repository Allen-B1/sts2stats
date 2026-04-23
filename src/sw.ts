import { Compute, Filter, RunComp, type ResourceID, type Run, type Stats } from "./lib/data";
import { FullStats } from "./lib/aggregate";
import type { SWReq } from "./lib/swdefs";

self.onmessage = (msg) => {
    const data = msg.data as SWReq;
    const reqid = msg.data.reqid as string;
    switch (data.kind) {
    case "get":
        const filtered = Compute.filter(data.runs, data.filter);
        self.postMessage({ reqid, result: FullStats.get(filtered) });
        break;
    case "aggregate":
        self.postMessage({ reqid, result: FullStats.aggregate(data.stats) })
        break;
    }

}

