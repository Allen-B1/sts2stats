<script lang="ts">
    import { CARDS, RELICS } from "../data/defs";
    import type { ResourceID } from "../stats/run";
    import { Stat, type Standard } from "../stats/stats";
    import { displayStats, displayText } from "../utils";
    const THRESHOLD = 7;

    let { resources, stats, display, title } : {
        resources: ResourceID[],
        stats: Standard.Stats,
        display: [Standard.ResStats, string][],
        title: string
    } = $props();

    function displayItem(id: ResourceID) {
        const item = id.startsWith("CARD.") ? CARDS[id.slice("CARD.".length)] : RELICS[id.slice("RELIC.".length)];
        if (!item) 
            return `<span class="res">${id}</span>`;

        const desc = displayText(item.description || "");
        return `<span class="res">
            <span class="fg-${item.rarity_key}">${item.name || id}</span>
            <span class="popup">${desc}</span>
        </span>`;
    }
</script>


<table>
<thead>
    <tr>
        <th>{title}</th>

        {#each display as [_, label]}
        <th>{label}</th>
        {/each}
    </tr>
</thead>
<tbody>
{#each resources as id}
    {@const rstats = stats[id]}
    <tr>
        <td>{@html displayItem(id)}</td>
        {#each display as [idx, _]}
        <td>{@html displayStats(rstats[idx])}</td>
        {/each}
    </tr>    
{/each}
</tbody>
</table>

<style>
table {
    background: var(--panel-bg);
    border-radius: 16px;
    padding: 16px;
}
td:first-child {
    min-width: 128px;
    text-wrap: nowrap;
    font-weight: 500;
}
td, th {
    padding: 0 16px;
    text-align: center;
}
th {
    text-wrap: nowrap;
}

</style>