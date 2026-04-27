
<script lang="ts">
    import { CARDS, RELICS, type Card, type Relic } from "../data/defs";
    import type { ResourceID } from "../stats/run";
    import { Standard, Stat } from "../stats/stats";

    let { stats, players } : {
        stats: Standard.Stats,
        players: number
    } = $props();

    const THRESHOLD = 8;

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

    function displayStats(stats: Stat) : string {
        if (Stat.runs(stats) < THRESHOLD) {
            return `<span class="stats" title="${Stat.runs(stats)} runs">-</span>`;
        }
        return `<span class="stats" title="${Stat.runs(stats)} runs">` + (100*Stat.ratio(stats)).toFixed(1) + "%</span>";
    }

    function displayItem(id: ResourceID) {
        const item = id.startsWith("CARD.") ? CARDS[id.slice("CARD.".length)] : RELICS[id.slice("RELIC.".length)];

        const desc = (item.description || "")
                .replace(/\n/g, "<br />")
                .replace(/\[energy\:([0-9]+)\]/g, `$1 <span class="fg-text-gold">Energy</span>`)
                .replace(/\[star\:([0-9]+)\]/g, `$1 <span class="fg-text-gold">Stars</span>`)
                .replace(/\[\/([^\[\]]*)\]/g, `</span>`)
                .replace(/\[([^\[\]]*)]/g, `<span class="fg-text-$1">`);
        return `<span class="res">
            <span class="fg-${item.rarity_key}">${item.name || id}</span>
            <span class="popup">${desc}</span>
        </span>`;
    }
</script>

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
        <th>Pick %</th>
    </tr>
</thead>
<tbody>
{#each ancients as id}
    {@const rstats = stats[id]}
    <tr>
        <td>{@html displayItem(id)}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT1])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT2])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT3])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ANY])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.PICK])}</td>
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
{#each relics as id}
    {@const rstats = stats[id]}
    <tr>
        <td>{@html displayItem(id)}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.EASY])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT1])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT2])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT3])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ANY])}</td>
    </tr>    
{/each}
</tbody>
</table>
</div>


<div class="panel overflow big">
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
        <th>Pick %</th>
    </tr>
</thead>
<tbody>
{#each cards as id}
    {@const rstats = stats[id]}
    <tr>
        <td>{@html displayItem(id)}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.EASY])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT1])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT2])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ACT3])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.ANY])}</td>
        <td>{@html displayStats(rstats[Standard.ResStats.PICK])}</td>
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