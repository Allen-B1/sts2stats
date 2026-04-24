import { Filter } from "./lib/stats/run";
import { Standard } from "./lib/stats/stats";
import type { SWReq } from "./lib/swdefs";

self.onmessage = (msg) => {
    const data = msg.data as SWReq;
    const reqid = msg.data.reqid as string;
    switch (data.kind) {
    case "standard-compute":
        const filtered = Filter.filter(data.filter, data.runs);
        self.postMessage({ reqid, result: Standard.compute(filtered) });
        break;
    case "standard-combine":
        self.postMessage({ reqid, result: Standard.combine(data.statss) });
        break;
    }
}

