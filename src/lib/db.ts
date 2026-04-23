
import { initializeApp, type FirebaseApp } from "firebase/app";
import { collection, doc, Firestore, getDoc, getDocs, getFirestore, query, setDoc, type FirestoreDataConverter } from "firebase/firestore";
import type { Run, Stats } from "./data";
import type { FullStats } from "./aggregate";

function from(data: any) : Run {
    return data;
}

export class Database {
    app: FirebaseApp
    db: Firestore

    constructor() {
        this.app = initializeApp({
            apiKey: "AIzaSyCN8lHWF9P2Ts1DL7QSfrE1OTnFwDJEGA8",
            authDomain: "sts2stats.firebaseapp.com",
            projectId: "sts2stats",
            storageBucket: "sts2stats.firebasestorage.app",
            messagingSenderId: "1052092688559",
            appId: "1:1052092688559:web:5de3d73d44cda809d08c5a"
        });
        this.db = getFirestore(this.app);
    }

    async add(run: Run) {
        let players = run.players.map(p => p.id).sort().join("-");
        let ref = doc(collection(this.db, players), run.start.toString());
        await setDoc(ref, run);
    }

    async getAll(players: string) : Promise<Run[]> {
        let docs = await getDocs(query(collection(this.db, players)));
        let runs: Run[] = [];
        docs.forEach(doc => {
            const run = from(doc.data());
            runs.push(run);
        })
        return runs;
    }

    async addStats(players: string, stats: FullStats) {
        console.log("adding stats", players, stats);
        await setDoc(doc(collection(this.db, "playerstats"), players), stats);
    }

    async getAllStats() : Promise<Record<string, FullStats>> {
        let docs = await getDocs(query(collection(this.db, "playerstats")));
        let stats: Record<string, FullStats> = {};
        docs.forEach(doc => {
            stats[doc.ref.id] = doc.data() as any;
        })
        return stats;
    }

    async setGlobalStats(label: string, stats: FullStats) {
        await setDoc(doc(this.db, "globalstats/" + label), stats);
    }

    async getGlobalStats(label: string) : Promise<FullStats> {
        return (await getDoc(doc(this.db, "globalstats/" + label))).data() as any;
    }
}