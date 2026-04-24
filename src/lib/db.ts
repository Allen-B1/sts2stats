
import { initializeApp, type FirebaseApp } from "firebase/app";
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, getFirestore, query, setDoc, updateDoc, type FirestoreDataConverter } from "firebase/firestore";
import type { Filter, Run, Stats } from "./data";
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

    async addRun(run: Run) {
        let players = run.players.map(p => p.id).sort().join("-");
        let ref = doc(collection(this.db, "runs-" + players), run.start.toString());
        await Promise.all([
            setDoc(ref, run),
            this.addPlayer(players),
            setDoc(doc(collection(this.db, "runs-" + players), "meta"), { "updated": Date.now() }),
            this.deleteGlobalStats()
        ]);
    }

    async addPlayer(item: string) {
        await setDoc(doc(this.db, "meta/players"), { [item]: true }, {merge : true});
    }  

    async getPlayers() : Promise<string[]> {
        const playersDoc = doc(this.db, "meta/players");
        const d = await getDoc(playersDoc);
        return d.data() ? Object.keys(d.data()!) : [];
    }

    async getRuns(players: string) : Promise<Run[]> {
        let docs = await getDocs(query(collection(this.db, "runs-" + players)));
        let runs: Run[] = [];
        docs.forEach(doc => {
            if (doc.id == "meta") {
                return;
            }
            const run = from(doc.data());
            runs.push(run);
        })
        return runs;
    }

    async getLastUpdated(players: string) : Promise<number> { 
        const data = (await getDoc(doc(this.db, `runs-${players}/meta`))).data();
        if (!data) {
            return Infinity;
        } else {
            return Number(data);
        }
    }

    async addStats(players: string, filter: Filter, stats: FullStats) {
        await setDoc(doc(collection(this.db, "stats-" + filter), players), {
            updated: Date.now(),
            ...stats
        });
    }

    async getStats(filter: Filter) : Promise<Record<string, FullStats>> {
        let docs = await getDocs(query(collection(this.db, "stats-" + filter)));
        let rec: Record<string, FullStats> = {};

        for (let d of docs.docs) {
            if (d.data().updated >= await this.getLastUpdated(d.id)) {
                rec[d.id] = d.data() as any;
            }
        }

        return rec;
    }

    async getStatsLocal(filter: Filter, players: string) : Promise<FullStats | null> {
        const d = await getDoc(doc(this.db, `stats-${filter}/${players}`));
        return (d.data() as any) || null;
    }

    async setGlobalStats(filter: Filter, stats: FullStats) {
        await setDoc(doc(this.db, "global/stats-" + filter), stats);
    }

    async getGlobalStats(filter: Filter) : Promise<FullStats | null> {
        let data = (await getDoc(doc(this.db, "global/stats-" + filter))).data() as any;
        return data ? data : null;
    }

    async deleteGlobalStats() {
        const docs = await getDocs(query(collection(this.db, "global")));
        await Promise.all(docs.docs.map(doc => {
            deleteDoc(doc.ref);
        }));
    }
}