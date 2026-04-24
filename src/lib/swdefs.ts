import type { Filter, Run } from "./stats/run"
import type { Standard } from "./stats/stats";


export type SWReq = {
    kind: "standard-compute",
    runs: Run[],
    filter: Filter
} | {
    kind: "standard-combine",
    statss: Standard.Stats[]
};

export type SWResp = Standard.Stats;