import { read, write } from './storage';

interface IWordSetListSerializable {
    id: number;
    name: string;
    list: WordAnswer[];
}

export class WordSetList {
    static main: WordSetList;
    list: Set<WordSet> = new Set();

    constructor() {
        WordSetList.main = this;
    }

    async save() {
        const data = this.toJSON();
        await write('wordSetList', data);
    }

    toSerializable(): IWordSetListSerializable[] {
        return [...this.list.values()].map(v => {
            return { id: v.id, name: v.name, list: v.toSerializable() };
        });
    }

    toJSON() {
        return JSON.stringify(this.toSerializable());
    }

    fromJSON(str: string) {
        this.fromSerializable(JSON.parse(str));
    }

    fromSerializable(obj: IWordSetListSerializable[]) {
        obj.forEach(v => {
            this.list.add(WordSet.fromSerializable(v.id, v.name, v.list));
        });
    }

    static fromJSON(str: string) {
        return this.fromSerializable(JSON.parse(str));
    }

    static fromSerializable(obj: IWordSetListSerializable[]) {
        const list = new WordSetList();
        list.fromSerializable(obj);
        return list;
    }
}

export interface WordAnswer {
    id: number;
    ans: string;
    hard: string;
    type?: string;
    author: string;
    // 拼音的英文真的是这个（（
    pinyin: string;
    desc: string;
    addition?: string;
}

export const enum WordCheckStatus {
    Success = 0,
    Failure,
    ErrorNoWord,
    ErrorRepeatCharInOneRect,
    ErrorExceedCharCount,
    ErrorLessCharCount,
    Idle
}

interface IPathSave {
    canvasSize: number;
    path: [number, number][][][];
}

type PathSaves = Record<number, IPathSave>;

export class WordSet {
    id: number;
    name: string;

    words: Map<number, WordAnswer> = new Map();

    /** 第一维：坐标，第二维：单个路径，第三维：所有路径，第四维：四个格子 */
    saves: Map<number, IPathSave> = new Map();

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
    }

    clearPath(id: number, index: number, size: number) {
        let arr = this.saves.get(id);
        if (!arr) {
            arr = { canvasSize: size, path: [[], [], [], []] };
            this.saves.set(id, arr);
        }
        arr.canvasSize = size;
        arr.path[index] = [];
    }

    pushPath(
        id: number,
        index: number,
        size: number,
        path: [number, number][]
    ) {
        let arr = this.saves.get(id);
        if (!arr) {
            arr = { canvasSize: size, path: [[], [], [], []] };
            this.saves.set(id, arr);
        }
        arr.canvasSize = size;
        arr.path[index].push(path);
    }

    savePath() {
        const obj: PathSaves = {};
        this.saves.forEach((v, k) => {
            obj[k] = v;
        });
        const str = JSON.stringify(obj);
        return write(`answer-${this.id}`, str);
    }

    async loadPath() {
        const content = await read(`answer-${this.id}`);
        const data: PathSaves = JSON.parse(content);
        for (const [key, value] of Object.entries(data)) {
            this.saves.set(parseInt(key), value);
        }
    }

    toSerializable() {
        return [...this.words.values()];
    }

    check(id: number, ans: string): WordCheckStatus {
        const one = this.words.get(id);
        if (!one) return WordCheckStatus.ErrorNoWord;
        if (ans.length > one.ans.length) {
            return WordCheckStatus.ErrorExceedCharCount;
        }
        if (ans.length < one.ans.length) {
            return WordCheckStatus.ErrorLessCharCount;
        }
        if (one.ans !== ans) return WordCheckStatus.Failure;
        return WordCheckStatus.Success;
    }

    static fromSerializable(id: number, name: string, obj: WordAnswer[]) {
        const words = new WordSet(id, name);
        obj.forEach(v => {
            words.words.set(v.id, v);
        });
        return words;
    }
}

window.addEventListener('beforeunload', () => {
    WordSetList.main.list.forEach(v => {
        v.savePath();
    });
});
