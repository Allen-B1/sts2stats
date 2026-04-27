<script lang="ts">
    import { CARDS, RELICS, type Card, type Relic } from "../data/defs";
    import type { ResourceID } from "../stats/run";
    import { displayText } from "../utils";

    let { points, resources } : {
        points: [number, number][],
        resources: ResourceID[]
    } = $props();

    let maxX = $derived(Math.max(...points.map(p => p[0])));
    let maxY = $derived(Math.max(...points.map(p => p[1])));
    let minX = $derived(Math.min(...points.map(p => p[0])));
    let minY = $derived(Math.min(...points.map(p => p[1])));

    const SIZE = 768;
    function transform(point: [number, number]) : [number, number] {
        let x = point[0], y = point[1];

        return [(x - minX) / (maxX - minX) * SIZE, SIZE-(y - minY) / (maxY - minY) * SIZE];
    }

    function getItem(id: ResourceID) : Card | Relic | null {
        const item = id.startsWith("CARD.") ? CARDS[id.slice("CARD.".length)] : RELICS[id.slice("RELIC.".length)];
        return item || null;
    }
</script>

<div class="plot">
    {#each points as point, i}
        {@const transformed = transform(point)}
        {@const item = getItem(resources[i])}
        <div class="point bg-{item && item.rarity_key}" style="top:{transformed[1]}px;left:{transformed[0]}px;">
            {#if item}
                <div class="popup">
                    <h6>{item.name}</h6>
                    <p>Win: {(100*point[1]).toFixed(1)}% | Pick: {(100*point[0]).toFixed(1)}%</p>
                    <p>{@html displayText(item.description || "")}</p>
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .plot {
        width: 768px;
        height: 768px;
        position: relative;
    }

    .point {
        position: absolute;
        width: 16px;
        height: 16px;
        border-radius: 16px;
        background: white;

        .popup {
            position: absolute;
            display: none;

            background: hsl(220, 35%, 15%);
            padding: 8px 16px;
            z-index: 10;
            top: 32px;
            left: calc(-128px - 8px);

            width: 256px;
            text-wrap: wrap;

            border-radius: 8px;

            text-align: center;
        }

        &:hover .popup { display: block; }
    }

    h6 {
        font-size: 16px;
        margin: 0;
    }
    p {
        margin: 0;
    }
    p:last-child {
        margin-top: 8px;
    }
</style>