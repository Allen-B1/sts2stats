<script lang="ts">
    import { onMount } from "svelte";
    import { CARDS, RELICS, type Card, type Relic } from "../data/defs";
    import type { ResourceID } from "../stats/run";
    import { displayText } from "../utils";
    import type { Standard } from "../stats/stats";

    let { updater, points, resources, scalex = false } : {
        updater: Standard.Stats,
        points: [number, number][],
        resources: ResourceID[],
        scalex?: boolean
    } = $props();

    const minY = 0, maxY = 1;
    const minX = $derived(!scalex ? 0 : Math.min(...points.map(p => p[0]))); 
    const maxX = $derived(!scalex ? 1 : Math.max(...points.map(p => p[0])));

    const SIZE = 768;
    const POINT_SIZE = 16, PADDING = 32;
    const INNER_SIZE = (SIZE - POINT_SIZE - PADDING * 2);
    function transform(point: [number, number], ...args: any[]) : [number, number] {
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
            {@const side =  transformed[0] + POINT_SIZE/2 >= SIZE - 256 ? "left" : 
                            transformed[0] + POINT_SIZE/2 <= 256        ? "right" : 
                            transformed[1] + POINT_SIZE/2 >= SIZE - 128 ? "top" :
                            transformed[1] + POINT_SIZE/2 <= 128        ? "bottom" :"right"}
            {@const item = getItem(resources[i])}
            {@const icon = resources[i].startsWith("RELIC.") ? "https://spire-codex.com/static/images/relics/" + resources[i].slice("RELIC.".length).toLowerCase() + ".webp" : null}
            <div class="point {icon ? "image" : `bg-${item && item.rarity_key}`}" style="top:{transformed[1]}px;left:{transformed[0]}px;">
                {#if icon}
                    <img src={icon} alt={item && item.name || resources[i]} />
                {/if}
                    <div class="popup {side}">
                        <h6>{item && item.name || resources[i]}</h6>
                        <p>Win: {(100*point[1]).toFixed(1)}% | {!scalex ? "Pick" : "Seen"}: {(100*point[0]).toFixed(1)}%</p>
                        {#if item}<p>{@html displayText(item.description || "")}</p>{/if}
                    </div>
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

        &.image {
            background: none;
        }
        img {
            position: absolute;
            top: -16px; /* (img size - point size) / 2 */
            left: -16px;
            width: 48px;
            height: 48px;
        }

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