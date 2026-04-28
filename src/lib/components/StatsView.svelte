
<script lang="ts">
    import { ANCIENTS, CARDS, RELICS, type Card, type Relic } from "../data/defs";
    import type { ResourceID } from "../stats/run";
    import { Standard, Stat } from "../stats/stats";
    import { displayStats } from "../utils";
    import Plot from "./Plot.svelte";
    import Table from "./Table.svelte";
    import Tabs from "./Tabs.svelte";

    let { stats, players } : {
        stats: Standard.Stats,
        players: number
    } = $props();


    const THRESHOLD = 7;
    function sort(stats: Standard.Stats, res: ResourceID[]) : ResourceID[] {
        return res.filter(a => {
            const stat = stats[a][Standard.ResStats.ANY];
            return Stat.runs(stat) >= THRESHOLD;
        }).sort((a, b) => {
            const statB = stats[b][Standard.ResStats.ANY],
                  statA = stats[a][Standard.ResStats.ANY];
            let diff = Stat.ratio(statB) - Stat.ratio(statA);
            if (diff != 0)
                return diff;
            return Stat.runs(statB) - Stat.runs(statA);
        })
    }

    const cards    = $derived(sort(stats, Object.keys(stats).filter(id => id.startsWith("CARD." )) as any));
    const relics   = $derived(sort(stats, Object.keys(stats).filter(id => id.startsWith("RELIC.")).filter(id => RELICS[id.slice(6)].rarity_key != "Ancient") as any));
    const ancients = $derived(sort(stats, Object.keys(stats).filter(id => id.startsWith("RELIC.")).filter(id => RELICS[id.slice(6)].rarity_key == "Ancient") as any));

    let activeAncient: string = $state("any");
    const filteredAncients = $derived(ancients.filter(res => activeAncient == "any" ||
        ANCIENTS[activeAncient].pools.find(pool => 
            pool.relics.find(relic => "RELIC." + relic.id == res) != null
        ) != null
    ));

    let activeChar: string = $state("any");
    const filteredCards = $derived(cards
        .filter(res => (CARDS[res.slice(5)] && CARDS[res.slice(5)].color == activeChar) || activeChar == "any")
        .filter(res => disp == "scatter" ? Stat.runs(stats[res][Standard.ResStats.PICK]) > 1 : true)
    );

    let disp: "table" | "scatter" = $state("scatter");
</script>


<Tabs tabs={[overview, cardSnippet, relicSnippet, ancientSnippet]} names={["Overview", "Cards", "Relics", "Ancients"]} />

{#snippet overview()}
<div class="data-container">
<main>
    <div class="panel stat" id="panel-runs">
        <h4>Runs</h4>
        <p>{Stat.runs(stats.gen[Standard.GenStats.ALL])}</p>
    </div>
    <div class="panel stat" id="panel-players">
        <h4>Players</h4>
        <p>{players}</p>
    </div>

    <div class="panel stat" id="panel-winrate">
        <h4>Win Rate</h4>
        <p>{@html displayStats(stats.gen[Standard.GenStats.ALL])}</p>
    </div>

    <div class="panel" id="panel-dr-act">
        <h3>Death Rate by Act</h3>
        <div class="wins-flex">
            <div><strong title="Overall">Act 1</strong>                  <span>{@html displayStats(stats.gen[Standard.GenStats.ACT1])} </span></div>
            <div><strong title="Survived Act 1">Act 2</strong>           <span>{@html displayStats(stats.gen[Standard.GenStats.ACT2])} </span></div>
            <div><strong title="Survived Act 2">Act 3</strong>           <span>{@html displayStats(stats.gen[Standard.GenStats.ACT3])} </span></div>
        </div>
    </div>

    <div class="panel" id="panel-wr-char">
        <h3>Win Rate by Character</h3>
        <div class="wins-flex chars">
            {#each [Standard.GenStats.IRONCLAD, Standard.GenStats.SILENT, Standard.GenStats.REGENT, Standard.GenStats.NECROBINDER, Standard.GenStats.DEFECT] as charIdx}
            {@const name = Standard.GenStats[charIdx]}
            <div>
                <strong>{name[0] + name.slice(1).toLowerCase()}</strong>
                <span>{@html displayStats(stats.gen[charIdx])}</span>
            </div>
            {/each}
        </div>
    </div>

    <div class="panel" id="panel-wr-act">
        <h3>Win Rate by Alternate Act</h3>
        <div class="wins-flex">
            <div><strong>Overgrowth</strong> <span>{@html displayStats(stats.gen[Standard.GenStats.OVERGROWTH])}</span></div>
            <div><strong>Underdocks</strong> <span>{@html displayStats(stats.gen[Standard.GenStats.UNDERDOCKS])}</span></div>
        </div>
    </div>
</main>
</div>
{/snippet}

{#snippet ancientSnippet()}
<div class="background">
<div class="small-row">
<div class="radiobutton">
    <input type="radio" value={"scatter"} id="ancientdisp-radio-scatter" name="ancientdisp" bind:group={disp}>
    <label for="ancientdisp-radio-scatter">Plot</label>

    <input type="radio" value={"table"} id="ancientdisp-radio-table" name="ancientdisp" bind:group={disp}>
    <label for="ancientdisp-radio-table">Table</label>
</div>
<div class="sep"></div>
<select bind:value={activeAncient}>
    <option value="any">Any</option>
    {#each Object.values(ANCIENTS) as ancient}
    <option value={ancient.id}>{ancient.name}</option>
    {/each}
</select>
</div>

<div class="data-container">
{#if disp == "scatter"}
<Plot points={filteredAncients.map(card => [
    Stat.ratio(stats[card][Standard.ResStats.PICK]), 
    Stat.ratio(stats[card][Standard.ResStats.ANY])
])} resources={filteredAncients} />
{:else}
<Table title="Ancient Relic" resources={filteredAncients} stats={stats} display={[
    [Standard.ResStats.ANY, "Win%"],
    [Standard.ResStats.ACT1, "Win% Act 1"],
    [Standard.ResStats.ACT2, "Win% Act 2"],
    [Standard.ResStats.ACT3, "Win% Act 3"],
    [Standard.ResStats.PICK, "Pick%"],
    [Standard.ResStats.PICK_ACT1, "Pick% Act 1"],
    [Standard.ResStats.PICK_ACT2, "Pick% Act 2"],
    [Standard.ResStats.PICK_ACT3, "Pick% Act 3"],
]} />
{/if}
</div>

</div>    
{/snippet}

{#snippet relicSnippet()}
<div class="data-container">
<Table title="Relic" resources={relics} stats={stats} display={[
    [Standard.ResStats.ANY, "Win%"],
    [Standard.ResStats.EASY, "Win% Easy"],
    [Standard.ResStats.ACT1, "Win% Act 1"],
    [Standard.ResStats.ACT2, "Win% Act 2"],
    [Standard.ResStats.ACT3, "Win% Act 3"],
]} />
</div>

{/snippet}

{#snippet cardSnippet()}
<div class="background">

<div class="small-row">
<div class="radiobutton">
    <input type="radio" value={"scatter"} id="carddisp-radio-scatter" name="carddisp" bind:group={disp}>
    <label for="carddisp-radio-scatter">Plot</label>

    <input type="radio" value={"table"} id="carddisp-radio-table" name="carddisp" bind:group={disp}>
    <label for="carddisp-radio-table">Table</label>
</div>
<div class="sep"></div>
<select bind:value={activeChar}>
    <option value="any">Any</option>
    <option value="ironclad">Ironclad</option>
    <option value="silent">Silent</option>
    <option value="regent">Regent</option>
    <option value="necrobinder">Necrobinder</option>
    <option value="defect">Defect</option>
    <option value="colorless">Colorless</option>
    <option value="event">Event</option>
    <option value="curse">Curse</option>
</select>
</div>

<div class="data-container">
{#if disp == "scatter"}
<Plot points={filteredCards.map(card => [
    Stat.ratio(stats[card][Standard.ResStats.PICK]), 
    Stat.ratio(stats[card][Standard.ResStats.ANY])
])} resources={filteredCards} />
{:else}
<Table title="Card" resources={filteredCards} stats={stats} display={[
    [Standard.ResStats.ANY, "Win%"],
    [Standard.ResStats.EASY, "Win% Easy"],
    [Standard.ResStats.ACT1, "Win% Act 1"],
    [Standard.ResStats.ACT2, "Win% Act 2"],
    [Standard.ResStats.ACT3, "Win% Act 3"],
    [Standard.ResStats.PICK, "Pick%"],
    [Standard.ResStats.PICK_ACT1, "Pick% Act 1"],
    [Standard.ResStats.PICK_ACT2, "Pick% Act 2"],
    [Standard.ResStats.PICK_ACT3, "Pick% Act 3"],
]} />
{/if}
</div>

</div>
{/snippet}


<style>
    main { 
        display: grid;
        grid-template-rows: auto auto auto;
        grid-template-columns: repeat(6, 1fr);

        gap: 16px;
        flex-grow: 0;

        box-sizing: border-box;
    }

    .small-row {
        display: flex;
        flex-direction: row;
        gap: 8px;
        width: 100%;
        padding: 0 32px;
        box-sizing: border-box;
    }

    .wins {
        display: grid;
        grid-template-rows: auto auto;
        grid-auto-flow: column;
        gap: 12px;

        strong { 
            align-self: end;
        }
    }

    .wins-flex {
        display: flex;
        flex-direction: row;

        justify-content: center;
        align-items: center;

        column-gap: 32px;
        row-gap: 32px;
        flex-wrap: wrap;

        & > div {
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex-grow: 1;
        }
        &.chars > div {
            min-width: 27%;
            flex-grow: 0;
        }
    }

    h4, strong {
        font-size: 24px;
        margin: 0;
    }
    h3 {
        font-size: 18px;
        color: hsl(25, 50%, 75%);
        line-height: 1;
    }

    .panel {
        display: flex;
        flex-direction: column;
        padding: 32px;
        font-size: 18px;
        line-height: 1;
        span {
            font-size: 48px;
        }
        & > :not(h3) {
            flex-grow: 1;
        }
    }
    .panel:not(.stat) {
        gap: 8px;
        h3 {
            margin-bottom: 24px;
            text-align: start;
        }
    } 
    .panel.stat {
        display: flex; flex-direction: column;
        justify-content: center;
        align-items: stretch;
        gap: 12px;

        p {
            flex-grow: 1;
            font-size: 48px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }


    #panel-runs { grid-row: 1; grid-column: 1 / span 2; }
    #panel-players { grid-row: 1; grid-column: 3 / span 2; }
    #panel-winrate { grid-row: 1; grid-column: 5 / span 2; }
    #panel-dr-act { grid-row: 2; grid-column: 1 / span 3; }
    #panel-wr-act { grid-row: 3; grid-column: 1 / span 3; }
    #panel-wr-char { grid-row: 2 / span 2; grid-column: 4 / span 3; }

    @media (width <= 1200px) {
        #panel-dr-act { grid-row: 2; grid-column: 1 / span 6; }
        #panel-wr-act { grid-row: 3; grid-column: 1 / span 6; }
        #panel-wr-char { grid-row: 4; grid-column: 1 / span 6; }
    }

    @media (width <= 512px) {
        #panel-runs    { grid-row: 1; grid-column: 1 / span 3; }
        #panel-players { grid-row: 1; grid-column: 4 / span 3; }
        #panel-winrate { grid-row: 2; grid-column: 1 / span 6; }
        #panel-dr-act  { grid-row: 3; grid-column: 1 / span 6; }
        #panel-wr-act  { grid-row: 4; grid-column: 1 / span 6; }
        #panel-wr-char { grid-row: 5; grid-column: 1 / span 6; }

        .wins-flex {
            flex-direction: column;
            gap: 32px;
        }
    }

    .background {
        padding: 16px 0;
        padding-bottom: 0;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        flex-grow: 1;

        justify-content: start;

        max-width: 100vw;
        overflow: visible;
    }

    .data-container {
        box-sizing: border-box;
        max-width: 100dvw;
        max-height: calc(100dvh - 45px);
        overflow: auto;
        padding: 32px;
        flex-grow: 1;

        display: flex;
        justify-content: center;
        align-items: start;
    }
    .background .data-container {
        padding-top: 0;
        max-height: calc(100dvh - 45px - 28px - 32px);
    }
</style>