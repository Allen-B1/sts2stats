
<script lang="ts">
    import { FullStats, GenStats, THRESHOLD } from "../aggregate";
    import { Stats, type ResourceID } from "../data";
    import { CARDS, RELICS, type Card, type Relic } from "../data/defs";

    let { stats } : {
        stats: FullStats
    } = $props();

    function displayStats(stats: Stats) : string {
        if (stats.count < THRESHOLD) {
            return `<span class="stats" title="${stats.count} runs">-</span>`;
        }
        return `<span class="stats" title="${stats.count} runs">` + (100*Stats.winrate(stats)).toFixed(1) + "%</span>";
    }

    function displayItem(item: Card | Relic) {
        const desc = item.description
                .replace(/\n/g, "<br />")
                .replace(/\[energy\:([0-9]+)\]/g, `$1 <span class="fg-text-gold">Energy</span>`)
                .replace(/\[star\:([0-9]+)\]/g, `$1 <span class="fg-text-gold">Stars</span>`)
                .replace(/\[\/([^\[\]]*)\]/g, `</span>`)
                .replace(/\[([^\[\]]*)]/g, `<span class="fg-text-$1">`);
        if (item.id == "GORGET") console.log(desc);
        return `<span class="res">
            <span class="fg-${item.rarity_key}">${item.name}</span>
            <span class="popup">${desc}</span>
        </span>`;
    }

    const displayCard = displayItem;
    const displayRelic = displayItem;
</script>

<div class="layout-row">
<div class="panel stat" style="flex-grow:1">
    <h3>Runs</h3>
    <p>{stats.genStats.wins.count}</p>
</div>
<div class="panel stat" style="flex-grow:1">
    <h3>Players</h3>
    <p>{stats.genStats.players ? stats.genStats.players.length : 0}</p>
</div>

<div class="panel stat" style="flex-grow:2">
    <h3>Win Rate</h3>
    <p>{@html displayStats(stats.genStats.wins)}</p>
</div>

<div class="panel inline" style="align-items:flex-start;flex-grow:0">
    <h3>Death Rate</h3>
    <div class="rows wins">
        <div><strong title="Overall">Act 1</strong>                   <span>{@html displayStats(stats.genStats.deathAct1)} </span></div>
        <div><strong title="Survived Act 1">Act 2</strong>           <span>{@html displayStats(stats.genStats.deathAct2)} </span></div>
        <div><strong title="Survived Act 2">Act 3</strong>           <span>{@html displayStats(stats.genStats.deathAct3)} </span></div>
    </div>
</div>
</div>

<div class="layout-row bottom-row">

<div class="panel overflow">
<h3>Ancient Bonuses</h3>
<table>
<thead>
    <tr>
        <th>Ancient Relic</th>
        <th title="Acquired in Act 1">Act 1</th>
        <th title="Acquired in Act 2">Act 2</th>
        <th title="Acquired in Act 2">Act 3</th>
        <th>All</th>
    </tr>
</thead>
<tbody>
{#each stats.relics.filter(res => RELICS[res.slice("RELIC.".length)].rarity_key == "Ancient") as res}
    {@const stat = stats.resStats[res]}
    {@const item = RELICS[res.slice("RELIC.".length)]}
    <tr>
        <td>{@html displayRelic(item)}</td>
        <td>{@html displayStats(stat.act1)}</td>
        <td>{@html displayStats(stat.act2)}</td>
        <td>{@html displayStats(stat.act3)}</td>
        <td>{@html displayStats(stat.all)}</td>
    </tr>    
{/each}
</tbody>
</table>
</div>

<div class="panel overflow">
<h3>Relics</h3>
<table>
<thead>
    <tr>
        <th>Relic</th>
        <th title="Acquired before 1st hard combat">Early</th>
        <th title="Acquired in Act 1">Act 1</th>
        <th title="Acquired in Act 2">Act 2</th>
        <th title="Acquired in Act 2">Act 3</th>
        <th>All</th>
    </tr>
</thead>
<tbody>
{#each stats.relics.filter(res => RELICS[res.slice("RELIC.".length)].rarity_key != "Ancient") as res}
    {@const stat = stats.resStats[res]}
    {@const item = RELICS[res.slice("RELIC.".length)]}
    <tr>
        <td>{@html displayRelic(item)}</td>
        <td>{@html displayStats(stat.easy)}</td>
        <td>{@html displayStats(stat.act1)}</td>
        <td>{@html displayStats(stat.act2)}</td>
        <td>{@html displayStats(stat.act3)}</td>
        <td>{@html displayStats(stat.all)}</td>
    </tr>    
{/each}
</tbody>
</table>
</div>


<div class="panel overflow">
<h3>Cards</h3>
<table>
<thead>
    <tr>
        <th>Card</th>
        <th title="Acquired before 1st hard combat">Early</th>
        <th title="Acquired in Act 1">Act 1</th>
        <th title="Acquired in Act 2">Act 2</th>
        <th title="Acquired in Act 2">Act 3</th>
        <th>All</th>
    </tr>
</thead>
<tbody>
{#each stats.cards as res}
    {@const stat = stats.resStats[res]}
    {@const item = CARDS[res.slice("CARD.".length)]}
    <tr>
        <td>{@html displayCard(item)}</td>
        <td>{@html displayStats(stat.easy)}</td>
        <td>{@html displayStats(stat.act1)}</td>
        <td>{@html displayStats(stat.act2)}</td>
        <td>{@html displayStats(stat.act3)}</td>
        <td>{@html displayStats(stat.all)}</td>
    </tr>    
{/each}
</tbody>
</table>
</div>

</div>


<style>
    .wins strong {
        width: 48px;
    }
</style>