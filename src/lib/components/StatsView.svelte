
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
        .filter(res => cardDisp == "scatter" ? Stat.runs(stats[res][Standard.ResStats.PICK]) > 1 : true)
    );

    let cardDisp: "table" | "scatter" = $state("scatter");
</script>


<Tabs tabs={[overview, cardSnippet, relicSnippet, ancientSnippet]} names={["Overview", "Cards", "Relics", "Ancients"]} />

{#snippet overview()}
<main>

    <div class="layout-row">
    <div class="panel stat" style="flex-grow:1">
        <h3>Runs</h3>
        <p>{Stat.runs(stats.gen[Standard.GenStats.ALL])}</p>
    </div>
    <div class="panel stat" style="flex-grow:1">
        <h3>Players</h3>
        <p>{players}</p>
    </div>

    <div class="panel stat" style="flex-grow:2">
        <h3>Win Rate</h3>
        <p>{@html displayStats(stats.gen[Standard.GenStats.ALL])}</p>
    </div>

    <div class="panel inline" style="align-items:flex-start;flex-grow:0">
        <h3>Death Rate</h3>
        <div class="rows wins">
            <div><strong title="Overall">Act 1</strong>                  <span>{@html displayStats(stats.gen[Standard.GenStats.ACT1])} </span></div>
            <div><strong title="Survived Act 1">Act 2</strong>           <span>{@html displayStats(stats.gen[Standard.GenStats.ACT2])} </span></div>
            <div><strong title="Survived Act 2">Act 3</strong>           <span>{@html displayStats(stats.gen[Standard.GenStats.ACT3])} </span></div>
        </div>
    </div>
    </div>

    <div class="layout-row" style="flex-grow:1">
        <div class="panel">
            
        </div>
    </div>

</main>
{/snippet}

{#snippet ancientSnippet()}
<div class="background">
<select bind:value={activeAncient}>
    <option value="any">Any</option>
    {#each Object.values(ANCIENTS) as ancient}
    <option value={ancient.id}>{ancient.name}</option>
    {/each}
</select>

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
</div>    
{/snippet}

{#snippet relicSnippet()}
<div class="background">
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
    <input type="radio" value={"scatter"} id="carddisp-radio-scatter" name="carddisp" bind:group={cardDisp}>
    <label for="carddisp-radio-scatter">Plot</label>

    <input type="radio" value={"table"} id="carddisp-radio-table" name="carddisp" bind:group={cardDisp}>
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

{#if cardDisp == "scatter"}
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
{/snippet}


<style>
    main { 
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 32px;
        flex-grow: 1;

        box-sizing: border-box;
    }

    .background {
        padding: 16px 0;
        overflow: auto;
        background: hsla(0, 0%, 5%, 65%);
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: center;
        flex-grow: 1;

        justify-content: start;
    }

    .wins strong {
        width: 48px;
    }

    .small-row {
        display: flex;
        flex-direction: row;
        gap: 8px;
        width: 100%;
        padding: 0 32px;
        box-sizing: border-box;
    }
</style>