<script lang="ts">
    import type { Snippet } from "svelte";

    let { tabs, names } : {
        tabs: Snippet[],
        names: string[]
    }= $props();

    let selected: number = $state(0);
</script>

<div class="root">
    <div style="height: 42px;flex-shrink:0">&nbsp;</div>
    <div class="tabs">
        {#each tabs as tab, i}
            <button class="tab" class:selected={selected == i} onclick={() => selected = i}>{names[i]}</button>
        {/each}
    </div>

    {@render tabs[selected]()}

</div>

<style>
    .root {
        display: flex;
        flex-direction: column;
        align-items: stretch;

        flex-grow: 1;
        height: 100dvh;

        position: relative;
        overflow: visible;
    }

    .tabs {
        display: flex;
        flex-direction: row;
        align-items: center;
        background: #111;
        justify-content: center;

        position: absolute;
        top: 0;
        width: 100%;
        box-sizing: border-box;
    }

    .tab {
        padding: 8px 16px;
        padding-top: 10px;
        font-family: 'Saira', sans-serif;
        font-size: 16px;

        background: transparent;
        color: #fff;
        border: 0;
        outline: 0;
        border-bottom: 2px solid transparent;
    }

    .tab.selected {
        border-color: #FF5722;
    }
</style>