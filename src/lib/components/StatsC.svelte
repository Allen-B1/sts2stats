
<script lang="ts">
    import { FullStats } from "../aggregate";
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

<div class="row" style="align-items: center">
<div class="panel inline">
<h3>Total Runs</h3>
<p>{stats.genStats.all.count}</p>
</div>
<div class="panel inline" style="align-items:flex-start">
    <h3>WR | Survived</h3>
    <div class="wins">
        <div><strong title="Overall">All</strong>                   <span>{@html displayStats(stats.genStats.all)} </span></div>
        <div><strong title="Survived Act 1">EoA1</strong>           <span>{@html displayStats(stats.genStats.act1)} </span></div>
        <div><strong title="Survived Act 2">EoA2</strong>           <span>{@html displayStats(stats.genStats.act2)} </span></div>
    </div>
</div>
</div>

<div class="row">

<div class="panel">
<h3>WR | Relics</h3>
<table>
<thead>
    <tr>
        <th>Acquired before...</th>
        <th title="1st Hard Combat">1HC</th>
        <th title="End of Act 1">EoA1</th>
        <th title="End of Act 2">EoA2</th>
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
<h3>WR | Cards</h3>
<table>
<thead>
    <tr>
        <th>Acquired before...</th>
        <th title="1st Hard Combat">1HC</th>
        <th title="End of Act 1">EoA1</th>
        <th title="End of Act 2">EoA2</th>
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
        display: inline-block;
        text-align: right;
        margin-right: 8px;
    }
    .wins span {
        min-width: 48px;
        display: inline-block;
    }
</style>