<script lang="ts">
    import { onMount } from "svelte";
    import { Filter } from "./lib/stats/run";
    import { importRun } from "./lib/stats/import";
    import { Errors, titlecase } from "./lib/utils";
    import { derived } from "svelte/store";
    import Worker from './sw?worker';
    import { Database } from "./lib/db";
    import StatsC from "./lib/components/StatsView.svelte";
    import type { SWReq, SWResp } from "./lib/swdefs";
    import { runTransaction } from "firebase/firestore";
    import type { Standard } from "./lib/stats/stats";

    const errors = Errors.create();
    const db = new Database();
    const worker = new Worker();

    function work(data: SWReq) : Promise<SWResp> {
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
    // upload
    $effect(() => {
        (async () => {
            if (!files || files.length == 0) {
                return;
            }
    
            console.log("uploading...");

            loading = true;
            id = Number(files[0].webkitRelativePath.split("/")[0]);
            console.log(files[0].webkitRelativePath, "new id: " + id);
            if (!Number.isInteger(id) || id < 10) {
                Errors.show(errors, "Invalid folder. Select the folder whose name is a large integer.");
                return;
            }

            let playerss: Set<string> = new Set();
            
            await Promise.all([...files]
                .filter(file => file.webkitRelativePath.endsWith(".run"))
                .map(async file => {
                    const fileText = await file.text();

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
    // update id
    $effect(() => {
        if (globalThis.localStorage && id != 0) {
            localStorage.setItem("id", id.toString());
        }
    });
    // initialize id & initialize stats
    onMount(async () => {
        id = +Number(localStorage.getItem("id"));

        loading = true;
        updateByHash();
        await updateActiveStats();
        loading = false;
    });


    let activeDataset: "global" | "me" | "player" = $state("global");
    let selectedPlayer: string | null = null;
    window.addEventListener("hashchange", function() {
        if (updateByHash()) {
            updateActiveStats();
        }
    });
    function updateByHash() : boolean {
        if (selectedPlayer == location.hash.slice(1)) {
            return false;
        }

        if (location.hash.slice(1).length) {
            selectedPlayer = location.hash.slice(1);
        } else {
            selectedPlayer = String(id);
        }

        const nPlayers = selectedPlayer.split("-").length;
        if (nPlayers != 1 && activeMode == "1" && nPlayers <= 4) {
            activeMode = nPlayers.toString() as "2" | "3" | "4";
        } else if (nPlayers == 1 && activeMode != "1" && activeMode != "any") {
            activeMode = "1";
        }

        if (selectedPlayer != String(id)) {
            activeDataset = "player";
            return true;
        } else if (activeDataset != "me") {
            activeDataset = "me";
            return true;
        }

        return false;
    }

    let loading = $state(false);
    let activeChar = $state({
        "DEFECT": true,
        "SILENT": true,
        "IRONCLAD": true,
        "REGENT": true,
        "NECROBINDER": true
    });
    let activeAsc = $state(10);
    let activeVersion: string = $state("v0.104");
    const VERSIONS = ["v0.104", "v0.103", "v0.102", "v0.101", "v0.100"];

    let activeMode: "1" | "2" | "3" | "4" | "m" | "any" = $state("1");
    let activeStats: Standard.Stats | null = $state(null);
    let activePlayers: number = $state(0);
    async function updateActiveStats() {
        if (activeDataset == "me") {
            location.hash = "#" + id;
        }

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
        console.log(filter);
        loading = true;
        if (activeDataset == "me" || activeDataset == "player") {
            [activeStats, activePlayers] = await computeLocal(filter, activeDataset == "me" ? String(id) : (selectedPlayer || String(id)));
        } else {
            [activeStats, activePlayers] = await computeGlobal(filter);
        }
        loading = false;
    }

    async function computeLocal(filter: Filter, players: string) : Promise<[Standard.Stats, number]> {
        let stats = await db.getStatsLocal(filter, players);
        if (stats == null) {
            const runs = await db.getRuns(players);
            console.log(runs[0]);
            stats = await work({ kind: "standard-compute", runs: runs, filter: filter });
            await db.addStats(players, filter, stats);
        }
        return [stats, players.split("-").length];
    }

    async function computeGlobal(filter: Filter) : Promise<[Standard.Stats, number]> {
        let globalStats = await db.getGlobalStats(filter);
        if (globalStats != null) {
            return [globalStats, (await db.getPlayers()).filter(p => p.indexOf("-") == -1).length];
        }

        const [playerss, stats] = await Promise.all([
            db.getPlayers(), db.getStats(filter)
        ]);

        await Promise.all(playerss.map(async players => {
            if (!(players in stats)) {
                const runs = await db.getRuns(players);
                const playerStats = await work({ kind: "standard-compute", runs: runs, filter: filter });
                await db.addStats(players, filter, playerStats);

                stats[players] = playerStats;
            }
        }));

        globalStats = await work({ kind: "standard-combine", statss: Object.values(stats) });
        await db.setGlobalStats(filter, globalStats);
        return [globalStats, playerss.filter(p => p.indexOf("-") == -1).length];
    }

    let sidebarOpen = $state(false);
</script>


<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Kreon:wght@300..700&family=Saira:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <title>StS2 Stats</title>
    <meta name="viewport" content="initial-scale=1.0,maximum-scale=1.0" />
</svelte:head>

<label for="sidebar-open" id="sidebar-open-label">≡</label>
<input type="checkbox" id="sidebar-open" bind:checked={sidebarOpen}>

<div class="sidebar">
<h3>Filters</h3>
<div class="field">
    <label style="flex-grow:1">Dataset</label>
    <select bind:value={activeDataset}>
        <option value="global">Global</option>
        <option value="me">My Runs</option>
        {#if activeDataset == "player"}
        <option value="player">Player {selectedPlayer?.split("-").map(a => a.slice(-4, -1)).join(" and ")}'s Runs</option>
        {/if}
    </select>
</div>
<div class="field">
    <label for="asc">Ascension</label>
    <input class="input" id="asc" bind:value={activeAsc} type="number" min="-1" max="10">
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

<button class="button" onclick={async () => { await updateActiveStats(); sidebarOpen = false }} disabled={loading}>{loading ? "Loading..." : "Update"}</button>

<div style="flex-grow:1"></div>
<section id="upload">
<h3>Upload Runs</h3>
<p>Select the folder inside of<br />'SlayTheSpire2/steam'</p>
<input style="margin-top:8px" type="file" bind:files={files} webkitdirectory accept=".run">
</section>
</div>


{#if activeStats}
<StatsC stats={activeStats} players={activePlayers} />
{/if}

{#if $errors.msg != ""}
    <div class="error">{$errors.msg} <span class="time">{Errors.countdown($errors)}</span></div>
{/if}

<style>
    #sidebar-open, #sidebar-open-label { display: none; }
    @media (width <= 900px) {
        #upload {
            display: none;
        }
    }
    @media (width <= 900px) {
        #sidebar-open-label {
            display: block;
            position: fixed;
            top: 0;
            right: 0;
            width: 42px; height: 42px;
            text-align: center;
            line-height: 42px;
            cursor: pointer;
            font-size: 24px;
            font-family: sans-serif;
            z-index: 30;
        }
        .sidebar {
            display: none;

            position: fixed;
            z-index: 20;
            width: 100%; height: 100%;
            box-sizing: border-box;
        }
        #sidebar-open:checked + .sidebar {
            display: flex;
        }
    }
</style>