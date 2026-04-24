<script lang="ts">
    import { onMount } from "svelte";
    import { Compute, Filter, RunComp, Stats, type Resource, type ResourceID, type Run } from "./lib/data";
    import { importRun } from "./lib/import";
    import { Errors, titlecase } from "./lib/utils";
    import { derived } from "svelte/store";
    import Worker from './sw?worker';
    import { FullStats } from "./lib/aggregate";
    import { Database } from "./lib/db";
    import StatsC from "./lib/components/StatsC.svelte";
    import type { SWReq, SWResp } from "./lib/swdefs";
    import { runTransaction } from "firebase/firestore";

    const errors = Errors.create();
    const db = new Database();
    const worker = new Worker();

    function request(data: SWReq) : Promise<SWResp> {
        return new Promise((res) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            worker.postMessage({ reqid: id, ...data });
            worker.addEventListener("message", (e) => {
                if (e.data.reqid == id) {
                    res(e.data.result);
                }
            });
        })
    }

    let files: FileList | null = $state(null);
    $effect(() => {
        (async () => {
            if (!files || files.length == 0) {
                return;
            }
    
            console.log("uploading...");

            loading = true;
            id = Number(files[0].webkitRelativePath.split("/")[0]);
            if (!Number.isInteger(id) || id < 10) {
                Errors.show(errors, "Invalid folder. Select the folder whose name is a large integer.");
                return;
            }

            let playerss: Set<string> = new Set();
            
            await Promise.all([...files]
                .filter(file => file.webkitRelativePath.endsWith(".run"))
                .map(file => [file, file.text()] as [File, Promise<string>])
                .map(async ([file, fileText]) => {
                    try {
                        const run = importRun(JSON.parse(await fileText), id);
                        await db.addRun(run);
                        playerss.add(run.players.map(p => p.id).sort().join("-"));
                    } catch(err) {
                        console.error(err);
                        Errors.show(errors, "Invalid run: " + file.webkitRelativePath);
                    }                  
                }));
        
            console.log("uploaded runs");

            await updateActiveStats();
            loading = false;

            files = null;
        })();
    })

    let id: number = $state(0);
    $effect(() => {
        if (globalThis.localStorage && id != 0) {
            localStorage.setItem("id", id.toString());
        }
    });
    onMount(async () => {
        id = +Number(localStorage.getItem("id"));

        loading = true;
        await updateActiveStats();
        loading = false;
    });


    let activeDataset: "global" | "me" | "player" = "global";
    let selectedPlayer: string | null = null;
    window.addEventListener("hashchange", function() {
        if (location.hash.slice(1).length) {
            selectedPlayer = location.hash.slice(1);
        } else {
            selectedPlayer = String(id);
        }
    });

    let loading = $state(false);
    let activeChar = $state({
        "DEFECT": true,
        "SILENT": true,
        "IRONCLAD": true,
        "REGENT": true,
        "NECROBINDER": true
    });
    let activeAsc = $state(10);
    let activeVersion: string = $state("any");
    const VERSIONS = ["v0.104", "v0.103", "v0.102", "v0.101", "v0.100"];

    let activeMode: "1" | "2" | "3" | "4" | "m" | "any" = $state("1");
    let activeStats: FullStats = $state(FullStats.empty());
    async function updateActiveStats() {
        let filters = [];
        let chars = [];
        for (let char in activeChar) {
            if (activeChar[char as "REGENT"]) {
                chars.push(char);
            }
        }
        if (chars.length != 5) {
            filters.push("c-" + chars.join("-"));
        }

        if (activeAsc >= 0)
            filters.push("asc-" + activeAsc);
        if (activeMode != "any")
            filters.push("p-" + activeMode);
        if (activeVersion != "any")
            filters.push("v-" + activeVersion);

        const filter: Filter = filters.sort().join("_");
        loading = true;
        if (activeDataset == "me" || activeDataset == "player") {
            activeStats = await computeLocal(filter, activeDataset == "me" ? String(id) : (selectedPlayer || String(id)));
        } else {
            activeStats = await computeGlobal(filter);
        }
        loading = false;
    }

    async function computeLocal(filter: Filter, players: string) : Promise<FullStats> {
        let stats = await db.getStatsLocal(filter, players);
        if (stats == null) {
            const runs = await db.getRuns(players);
            stats = await request({ kind: "get", runs: runs, filter: filter });
            await db.addStats(players, filter, stats);
        }
        return stats;
    }

    async function computeGlobal(filter: Filter) : Promise<FullStats> {
        let globalStats = await db.getGlobalStats(filter);
        if (globalStats != null) {
            return globalStats;
        }

        const [playerss, stats] = await Promise.all([
            db.getPlayers(), db.getStats(filter)
        ]);

        await Promise.all(playerss.map(async players => {
            if (!(players in stats)) {
                console.log("fetching player", players);
                const runs = await db.getRuns(players);
                const playerStats = await request({ kind: "get", runs: runs, filter: filter });
                await db.addStats(players, filter, playerStats);
                stats[players] = playerStats;
            }
        }));

        console.log("global stats not saved", stats);

        globalStats = await request({ kind: "aggregate", stats: Object.values(stats) });
        await db.setGlobalStats(filter, globalStats);
        return globalStats;
    }
</script>


<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Kreon:wght@300..700&family=Saira:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</svelte:head>

<div class="sidebar">
<h3>Filters</h3>
<div class="field">
    <label style="flex-grow:1">Dataset</label>
    <select bind:value={activeDataset}>
        <option value="global">Global</option>
        <option value="me">My Runs</option>
        {#if selectedPlayer}
        <option value="player">Other</option>
        {/if}
    </select>
</div>
<div class="field">
    <label for="asc">Ascension</label>
    <input id="asc" bind:value={activeAsc} type="number" min="-1" max="10">
</div>
<div class="field">
    <label for="asc">Players</label>
    <select bind:value={activeMode}>
        <option value="any">Any</option>
        <option value="1">Singleplayer</option>
        <option value="m">Multiplayer</option>
        <option value="2">2p</option>
        <option value="3">3p</option>
        <option value="4">4p</option>
    </select>
</div>
<div class="field">
    <label for="asc">Version</label>
    <select bind:value={activeVersion}>
        <option value="any">Any</option>
        {#each VERSIONS as version}
            <option value={version}>{version}</option>
        {/each}
    </select>
</div>
<div class="field large">
    <label>Characters</label>
    <div class="field-row"><span>Ironclad</span>    <input type="checkbox" bind:checked={activeChar.IRONCLAD} />    </div>
    <div class="field-row"><span>Silent</span>      <input type="checkbox" bind:checked={activeChar.SILENT} />      </div>
    <div class="field-row"><span>Regent</span>      <input type="checkbox" bind:checked={activeChar.REGENT} />      </div>
    <div class="field-row"><span>Necrobinder</span> <input type="checkbox" bind:checked={activeChar.NECROBINDER} /></div>
    <div class="field-row"><span>Defect</span>      <input type="checkbox" bind:checked={activeChar.DEFECT} />      </div>
</div>

<button on:click={updateActiveStats} disabled={loading}>{loading ? "Loading..." : "Update"}</button>


<div style="flex-grow:1"></div>
<h3>Upload Runs</h3>
<p>Select the folder inside of 'SlayTheSpire2/steam'</p>
<input style="margin-top:8px" type="file" bind:files={files} webkitdirectory accept=".run">
</div>


<main>
<StatsC stats={activeStats} />

</main>

{#if $errors.msg != ""}
    <div class="error">{$errors.msg} <span class="time">{Errors.countdown($errors)}</span></div>
{/if}