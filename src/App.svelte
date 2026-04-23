<script lang="ts">
    import { onMount } from "svelte";
    import { Filter, RunComp, Stats, type Resource, type ResourceID, type Run } from "./lib/data";
    import { importRun } from "./lib/import";
    import { Errors, titlecase } from "./lib/utils";
    import { derived } from "svelte/store";
    import Worker from './sw?worker';
    import { FullStats } from "./lib/aggregate";
    import { Database } from "./lib/db";
    import StatsC from "./lib/components/StatsC.svelte";

    const errors = Errors.create();
    const db = new Database();
    const worker = new Worker();

    function request(data: object) : Promise<any> {
        return new Promise((res) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            worker.postMessage({ reqid: id, ...data });
            worker.addEventListener("message", (e) => {
                console.log(e.data.reqid);
                if (e.data.reqid == id) {
                    res(e.data.result);
                }
            });
        })
    }

    let globalStats: Record<1 | "any" | "multi", FullStats> = {
        [1]: FullStats.empty(),
        "any": FullStats.empty(),
        "multi": FullStats.empty()
    };
    let playerStats: Record<string, FullStats> = {};
    onMount(async () => {
        for (let mode of [1, "any", "multi"]) {
            globalStats[mode as 1 | "any" | "multi"] = await db.getGlobalStats(mode+"");
        }

        playerStats = await db.getAllStats();

        updateActiveStats();
    })

    let files: FileList | null = $state(null);
    $effect(() => {
        console.log("uploading...");
        (async () => {
            if (!files || !files.length) {
                return;
            }

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
                        await db.add(run);
                        playerss.add(run.players.map(p => p.id).sort().join("-"));
                    } catch(err) {
                        console.error(err);
                        Errors.show(errors, "Invalid run: " + file.webkitRelativePath);
                    }                  
                }));
            

            console.log("uploaded runs");

            const playersList = [...playerss];
            const playersRuns = await Promise.all(playersList.map(p => db.getAll(p)));
            await Promise.all([playersList.map(async (players, i) => {
                const runs = playersRuns[i].filter(run => run.asc == 10);
                let stats: FullStats = await request({ kind: "fullstats", runs: runs });
                await db.addStats(players, stats);
            })]);

            playerStats = await db.getAllStats();

            await Promise.all(([1, "multi", "any"] as (1 | "multi" | "any")[]).map(async (mode) => {
                globalStats[mode] = await request({ kind: "aggregate", stats: playerStats, mode });
                await db.setGlobalStats(mode.toString(), globalStats[mode]);
            }));

            console.log("computed stats");

            updateActiveStats();
        })();
    })

    let id: number = $state(0);
    $effect(() => {
        if (globalThis.localStorage && id != 0) {
            localStorage.setItem("id", id.toString());
        }
    });
    onMount(() => {
        id = +Number(localStorage.getItem("id"));
    });

    let activeMode: 1 | "multi" | "any" | string = $state("any");
    let activeFilter: string = $state("");
    let activeStats: FullStats = $state(FullStats.empty());
    function updateActiveStats() {
        if (location.hash.slice(1).length) {
            activeMode = location.hash.slice(1);
        }

        activeStats = Number(activeMode) < 10 || activeMode == "multi" || activeMode == "any" ? globalStats[activeMode as 1 | "multi" | "any"] : playerStats[activeMode];
    }

    window.addEventListener("hashchange", updateActiveStats);
</script>


<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
    <link href="https://fonts.googleapis.com/css2?family=Kreon:wght@300..700&family=Saira:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
</svelte:head>

<div class="top">
Community<span style="width:8px;display:inline-block"></span>
{#if activeMode == "multi" || activeMode == "any" || Number(activeMode) < 10}
<select bind:value={activeMode}>
    <option value={1}>Solo</option>
    <option value={"multi"}>Multi</option>
    <option value={"any"} selected>Any</option>
</select>
{:else}
{@const parts = activeMode.toString().split("-")}
Player{parts.length>1?"s":""} {parts.join(" & ")}
{/if}
<div style="flex-grow:1"></div>
<input type="file" bind:files={files} webkitdirectory accept=".run">
</div>

<main>
<StatsC stats={activeStats} />

</main>

{#if $errors.msg != ""}
    <div class="error">{$errors.msg} <span class="time">{Errors.countdown($errors)}</span></div>
{/if}