export interface Ancient {
    id: string,
    name: string,
    pools: AncientPool[]
}

export interface AncientPool {
    name: string,
    relics:  { id : string }[]
}

export interface Card {
    id: string,
    name: string,
    cost: number,
    color: string,
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
import ancients from './ancients.json';

export const RELICS: Record<string, Relic> = Object.fromEntries(relics.map(relic => [relic.id, relic])) as any;
export const CARDS: Record<string, Card>   = Object.fromEntries(cards.map(item => [item.id, item])) as any;
export const ANCIENTS: Record<string, Ancient> = Object.fromEntries(ancients.map(anc => [anc.id, anc])) as any;
