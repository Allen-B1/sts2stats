<script lang="ts">
    import { CARDS, RELICS, type Card, type Relic } from "../data/defs";
    import type { ResourceID } from "../stats/run";
    import { displayText } from "../utils";

    let { points, resources } : {
        points: [number, number][],
        resources: ResourceID[]
    } = $props();

    let maxX = 1, maxY = 1, minX = 0, minY = 0;

    const SIZE = 768;
    const POINT_SIZE = 16, PADDING = 16;
    const INNER_SIZE = (SIZE - POINT_SIZE - PADDING * 2);
    function transform(point: [number, number]) : [number, number] {
        let x = point[0], y = point[1];

        return [(x - minX) / (maxX - minX) * INNER_SIZE + PADDING, INNER_SIZE-(y - minY) / (maxY - minY) * INNER_SIZE + PADDING];
    }

    function getItem(id: ResourceID) : Card | Relic | null {
        const item = id.startsWith("CARD.") ? CARDS[id.slice("CARD.".length)] : RELICS[id.slice("RELIC.".length)];
        return item || null;
    }
</script>

    <div class="plot">
        {#each points as point, i}
            {@const transformed = transform(point)}
            {@const side =  transformed[0] + POINT_SIZE/2 >= SIZE - 128 ? "left" : 
                            transformed[0] + POINT_SIZE/2 <= 128        ? "right" : 
                            transformed[1] + POINT_SIZE/2 >= SIZE - 128 ? "top" :
                            transformed[1] + POINT_SIZE/2 <= 128        ? "bottom" :"right"}
            {@const item = getItem(resources[i])}
            <div class="point bg-{item && item.rarity_key}" style="top:{transformed[1]}px;left:{transformed[0]}px;">
                {#if item}
                    <div class="popup {side}">
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

        background: var(--panel-bg);
        border-radius: 16px;
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

            width: 256px;
            text-wrap: wrap;

            border-radius: 8px;

            text-align: center;
        }

        .bottom {
            top: 32px;
            left: calc(-128px - 8px);
        }
        .left {
            right: 32px;
        }
        .right {
            left: 32px;
        }
        .top {
            bottom: 32px;
            left: calc(-128px - 8px);
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