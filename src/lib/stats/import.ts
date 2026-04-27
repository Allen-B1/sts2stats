import { FloorType, type Resource, type Reward, type Run } from "./run";


export function importRun(data: any, id: number) : Run  {
    let resources: Record<string, Resource[]>[] = data.players.map((_: any) => ({}));
    let floorNum = 0;
    for (let floor of data.map_point_history.flat()) {
        if (!floor.player_stats) {
            console.debug("no player stats", floor);
            continue;
        }

        for (let i = 0; i < floor.player_stats.length; i++) {
            const stats = floor.player_stats[i];
            const res = resources[i];   

            if (stats.relic_choices) for (let relic of stats.relic_choices) {
                if (relic.was_picked) {
                    res[relic.choice] = [{
                        id: relic.choice,
                        added: floorNum
                    }];
                }
            }

            if (stats.cards_gained) for (let card of stats.cards_gained) {
                res[card.id] = res[card.id] || [];
                const upgraded = !!card.current_upgrade_level && card.current_upgrade_level >= 0;
                res[card.id].push(!upgraded ? { id: card.id, added: floorNum } : { id: card.id, added: floorNum, upgraded: floorNum });
            }

            if (stats.upgraded_cards) for (let card of stats.upgraded_cards as string[]) {
                res[card] = res[card] || [];
                let filtered = res[card].filter(entry => entry.added <= floorNum && !("upgraded" in entry) && !("removed" in entry)) as Resource[];
                if (filtered.length != 0) {
                    filtered[0].upgraded = floorNum;
                }
            }

            if (stats.cards_removed) for (let card of stats.cards_removed) {
                res[card.id] = res[card.id] || [];
                const filtered = res[card.id].filter(entry => entry.added == card.floor_added_to_deck - 1);
                if (filtered.length != 0) {
                    filtered[0].removed = floorNum;
                }                
            }

            if (stats.cards_transformed) for (let card of stats.cards_transformed) {
                const from = card.original_card,
                    to = card.final_card;
                res[from.id] = res[from.id] || [];

                const filtered = res[from.id].filter(entry => entry.added == from.floor_added_to_deck - 1);
                if (filtered.length != 0) {
                    filtered[0].removed = floorNum;
                }

                res[to.id] = res[to.id] || [];
                const upgraded = !!to.current_upgrade_level && to.current_upgrade_level >= 0;
                res[to.id].push(!upgraded ? { id: to.id, added: floorNum } : { id: to.id, added: floorNum, upgraded: floorNum });
            }

            if (stats.potions_choices) for (let potion of stats.potion_choices) {
                if (potion.was_picked) {
                    res[potion.choice] = res[potion.choice] || [];
                    res[potion.choice].push({ id: potion.choice, added: floorNum });
                }
            }

            for (let potion of (stats.potion_used || []).concat(stats.potion_discarded || [])) {
                res[potion.choice] = res[potion.choice] || [];
                let filtered = res[potion.choice].filter(entry => entry.added <= floorNum && !("removed" in entry)) as Resource[];
                if (filtered.length != 0) {
                    filtered[0].removed = floorNum;
                }
            }
        }

        floorNum++;
    }

    if (data.players.length == 1 && data.players[0].id < 10) {
        data.players[0].id = id;
    }

    const floors: any[] = data.map_point_history.flat();
    let rewards: Record<`rewards-${number}`, Reward[]> = {};
    for (let floorNum = 0; floorNum < floors.length; floorNum++) {
        const floor = floors[floorNum];

        if (floor.map_point_type == "shop") {
            continue;
        }

        if (floor.player_stats) for (let i = 0; i < floor.player_stats.length; i++) {
            rewards[`rewards-${i}`] = rewards[`rewards-${i}`] || [];
            const playerStats = floor.player_stats[i];
            const playerRewards = rewards[`rewards-${i}`];

            if (playerStats.card_choices) {
                playerRewards.push(...playerStats.card_choices.map((choice: any) => ({
                    floor: floorNum,
                    resource: choice.card.id,
                    picked: choice.was_picked
                })));
            }

            if (playerStats.ancient_choice) {
                playerRewards.push(...playerStats.ancient_choice.map((choice: any) => ({
                    resource: `RELIC.${choice.TextKey}`,
                    floor: floorNum,
                    picked: choice.was_chosen
                })));
            }

            if (floor.rooms && floor.rooms[0] && floor.rooms[0].model_id == "EVENT.WOOD_CARVINGS") {
                playerRewards.push({
                    resource: "CARD.TORIC_TOUGHNESS",
                    picked: Boolean(playerStats.cards_transformed && playerStats.cards_transformed[0].final_card.id == "CARD.TORIC_TOUGHNESS"),
                    floor: floorNum
                });

                playerRewards.push({
                    resource: "CARD.PECK",
                    picked: Boolean(playerStats.cards_transformed && playerStats.cards_transformed[0].final_card.id == "CARD.PECK"),
                    floor: floorNum
                });
            }
        }
    }

    return {
        version: data.build_id as string,
        start: data.start_time as number,
        asc: data.ascension as number,
        players: data.players.map((player: any) => ({
            character: player.character as string,
            id: player.id as number
        })),
        acts: data.acts,

        win: data.win as boolean, 
        floors: data.map_point_history.flat().map((point: any) => {
            if (!point.rooms || !point.rooms[0]) {
                console.debug(point);
                return { type: FloorType.EVENT, id: "" };
            }

            if (point.map_point_type == "ancient") {
                return { type: FloorType.ANCIENT, id: point.rooms[0].model_id };
            }

            const room = point.rooms[0];
            switch (room.room_type) {
                case "rest_site":
                    return { type: FloorType.REST, id: "" };
                case "treasure":
                    return { type: FloorType.CHEST, id: "" };
                case "shop":
                    return { type: FloorType.SHOP, id: "" };
                case "event":
                    return { type: FloorType.EVENT, id: room.model_id };
                
                case "elite":
                    return { type: FloorType.ELITE, id: room.model_id };
                case "monster":
                    return { type: FloorType.HALLWAY, id: room.model_id };
                case "boss":
                    return { type: FloorType.BOSS, id: room.model_id }; 
            }
        }),

        ...(() => {
            let out: Record<`resources-${number}`, Resource[]> = {};
            for (let i = 0; i < data.players.length; i++) {
                out[`resources-${i}`] = Object.values(resources[i]).flat();
            }
            return out;
        })(),

        ...rewards
    }
}