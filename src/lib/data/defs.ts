
export interface Card {
    id: string,
    name: string,
    rarity_key: "Rare" | "Uncommon" | "Common" | "Basic" | "Event" | "Curse" | "Ancient"
    description: string
}

export interface Relic {
    id: string,
    name: string,
    rarity_key: "Common" | "Uncommon" | "Ancient" | "Rare",
    description: string,
}

import relics from './relics.json';
import cards from './cards.json';

export const RELICS: Record<string, Relic> = Object.fromEntries(relics.map(relic => [relic.id, relic])) as any;
export const CARDS: Record<string, Card>   = Object.fromEntries(cards.map(item => [item.id, item])) as any;