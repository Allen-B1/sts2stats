import type { FullStats } from "./aggregate"
import type { Filter, Run } from "./data"


export type SWReq = {
    kind: "get",
    runs: Run[],
    filter: Filter
} | {
    kind: "aggregate",
    stats: FullStats[]
};

export type SWResp = FullStats;