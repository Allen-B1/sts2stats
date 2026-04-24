
<script lang="ts">
    import { FullStats, GenStats } from "../aggregate";
    import { Stats, type ResourceID } from "../data";
    import { titlecase } from "../utils";

    let { stats } : {
        stats: FullStats
    } = $props();

    
    function displayResource(res : ResourceID) : string {
        return titlecase(res.split(".")[1].replaceAll("_", " "));
    }

    function displayStats(stats: Stats) : string {
        if (stats.count < 5) {
            return `<span class="stats" title="${stats.count} runs">-</span>`;
        }
        return `<span class="stats" title="${stats.count} runs">` + (100*Stats.winrate(stats)).toFixed(1) + "%</span>";
    }
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

<div class="layout-row" style="flex-grow:1">

<div class="panel">
<h3>Relics</h3>
<table>
<thead>
    <tr>
        <th>Relic</th>
        <th title="Acquired before 1st hard combat">1HC</th>
        <th title="Acquired before end of Act 1">EoA1</th>
        <th title="Acquired before end of Act 2">EoA2</th>
        <th>All</th>
    </tr>
</thead>
<tbody>
{#each stats.relics as res}
    {@const stat = stats.resStats[res]}
    <tr>
        <td>{displayResource(res)}</td>
        <td>{@html displayStats(stat.easy)}</td>
        <td>{@html displayStats(stat.act1)}</td>
        <td>{@html displayStats(stat.act2)}</td>
        <td>{@html displayStats(stat.all)}</td>
    </tr>    
{/each}
</tbody>
</table>
</div>

<div class="panel">
<h3>Cards</h3>
<table>
<thead>
    <tr>
        <th>Card</th>
        <th title="Acquired before 1st hard combat">1HC</th>
        <th title="Acquired before end of Act 1">EoA1</th>
        <th title="Acquired before end of Act 2">EoA2</th>
        <th>All</th>
    </tr>
</thead>
<tbody>
{#each stats.cards as res}
    {@const stat = stats.resStats[res]}
    <tr>
        <td>{displayResource(res)}</td>
        <td>{@html displayStats(stat.easy)}</td>
        <td>{@html displayStats(stat.act1)}</td>
        <td>{@html displayStats(stat.act2)}</td>
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