import EventEmitter from 'eventemitter3';
import {
    createScheduler,
    createWorker,
    ImageLike,
    Page,
    Scheduler,
    Worker
} from 'tesseract.js';
import { CanvasDrawer } from './canvasDrawer';
import { DebouncedFunc, throttle } from 'lodash-es';
import { WordCheckStatus } from './wordSet';

interface RecognitionEvent {
    beforeTerminate: [worker: Worker];
    afterTerminate: [worker: Worker];
}

interface IntervalRecognitionEvent {
    recognizeEnd: [result: Page[]];
    beforeTerminate: [];
    afterTerminate: [];
}

export const enum RecognitionStatus {
    Success = 0,
    Failure,
    WarnNotInList,
    ErrorNoIntervalRecognition
}

export class TesseractRecognition extends EventEmitter<RecognitionEvent> {
    workerList: Set<Worker> = new Set();
    scheduler: Scheduler;

    intervals: Map<number, IntervalRecognition> = new Map();

    constructor() {
        super();
        this.scheduler = createScheduler();
    }

    async createWorker() {
        const worker = await createWorker(['chi_sim']);
        this.workerList.add(worker);
        this.scheduler.addWorker(worker);
    }

    async terminateWorker(worker: Worker): Promise<RecognitionStatus> {
        if (!this.workerList.has(worker)) {
            await worker.terminate();
            return RecognitionStatus.WarnNotInList;
        }
        this.emit('beforeTerminate', worker);
        await worker.terminate();
        this.emit('afterTerminate', worker);
        return RecognitionStatus.Success;
    }

    async recognize(image: ImageLike[]) {
        const recg = await Promise.all(
            image.map(v => {
                return this.scheduler.addJob('recognize', v, {
                    rotateAuto: false
                });
            })
        );

        return recg.map(v => v.data);
    }

    addIntervalRecognition(image: ImageLike[], interval: number) {
        if (interval < 50) interval = 50;
        const recg = new IntervalRecognition(image, interval, this);
        this.intervals.set(recg.intervalId, recg);
        return recg;
    }

    removeIntervalRecognition(id: number): RecognitionStatus {
        const recg = this.intervals.get(id);
        if (!recg) return RecognitionStatus.ErrorNoIntervalRecognition;
        this.intervals.delete(id);
        if (recg.enable) recg.terminate();
        return RecognitionStatus.Success;
    }
}

export class IntervalRecognition extends EventEmitter<IntervalRecognitionEvent> {
    images: ImageLike[];
    interval: number;
    recg: TesseractRecognition;

    id: number = IntervalRecognition.num++;
    intervalId: number = -1;
    enable: boolean = false;

    static num: number = 0;

    constructor(
        image: ImageLike[],
        interval: number,
        recg: TesseractRecognition
    ) {
        super();
        this.images = image;
        this.interval = interval;
        this.recg = recg;
        this.setInterval();
    }

    setInterval() {
        if (this.enable) return;
        this.intervalId = window.setInterval(async () => {
            const time = Date.now();
            const res = await this.recognize();
            this.emit('recognizeEnd', res);
            if (Date.now() - time > this.interval) {
                console.warn(
                    `Recognition time too long. System has automatically increases the interval time.`
                );
            }
        }, this.interval);
        this.enable = true;
    }

    recognize() {
        return this.recg.recognize(this.images);
    }

    terminate() {
        if (!this.enable) return;
        this.emit('beforeTerminate');
        window.clearInterval(this.intervalId);
        this.enable = false;
        this.emit('afterTerminate');
        this.recg.removeIntervalRecognition(this.id);
    }
}

interface ICanvasDrawerRecognitionEvent {
    result: [status: WordCheckStatus, result: string[]];
}

const mainRecognition = new TesseractRecognition();
mainRecognition.createWorker();
export class CanvasDrawerRecognition extends EventEmitter<ICanvasDrawerRecognitionEvent> {
    drawer: CanvasDrawer[];
    onMove!: DebouncedFunc<() => Promise<void>>;

    result: string[] = [];
    status: WordCheckStatus = WordCheckStatus.Idle;

    constructor(drawer: CanvasDrawer[]) {
        super();
        this.drawer = drawer;
        this.initRecognition();
        this.listen();
    }

    initRecognition() {
        this.onMove = throttle(async () => {
            this.result = [];
            const res = await mainRecognition.recognize(
                this.drawer.map(v => v.canvas)
            );
            let error = false;
            res.forEach(v => {
                const text = v.text.replace('\n', '');
                if (text.length > 1) {
                    error = true;
                    this.status = WordCheckStatus.ErrorRepeatCharInOneRect;
                }
                this.result.push(text);
            });
            if (!error) this.status = WordCheckStatus.Success;
            this.emit('result', this.status, this.result);
        }, 100);
    }

    listen() {
        this.drawer.forEach(v => {
            v.on('end', this.onMove);
        });
    }

    unlisten() {
        this.drawer.forEach(v => {
            v.off('end', this.onMove);
        });
    }
}
