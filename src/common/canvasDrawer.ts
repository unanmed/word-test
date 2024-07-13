import EventEmitter from 'eventemitter3';

interface ICanvasListener {
    type: string;
    fn: (ev: any) => void;
}

interface ICanvasDrawerEvent {
    move: [];
    end: [path: [number, number][]];
    start: [];
}

export class CanvasDrawer extends EventEmitter<ICanvasDrawerEvent> {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    tempCanvas: HTMLCanvasElement;
    tempCtx: CanvasRenderingContext2D;

    posX: number = 0;
    posY: number = 0;

    private li: ICanvasListener[] = [];

    constructor(
        canvas: HTMLCanvasElement,
        ctx: CanvasRenderingContext2D,
        tempCanvas: HTMLCanvasElement,
        tempCtx: CanvasRenderingContext2D
    ) {
        super();
        this.canvas = canvas;
        this.ctx = ctx;
        this.tempCanvas = tempCanvas;
        this.tempCtx = tempCtx;
        this.bind();
        this.calCanvasPosition();
    }

    bind() {
        let mouseDown = false;
        let touchDown = false;
        let touchId: number | undefined;
        let trace: [number, number][] = [];
        let lastNode: [number, number] | undefined;

        const end = () => {
            this.clearTemp();
            if (trace.length > 1) this.drawPath(trace);
            this.emit('end', trace);
            trace = [];
            lastNode = void 0;
            mouseDown = false;
            touchDown = false;
        };

        const onMouseDown = (ev: MouseEvent) => {
            if (mouseDown || touchDown) return;
            ev.preventDefault();
            mouseDown = true;
            touchDown = false;
            trace = [[ev.offsetX, ev.offsetY]];
            lastNode = [ev.offsetX, ev.offsetY];
            this.emit('start');
        };
        const onMouseMove = (ev: MouseEvent) => {
            if (!mouseDown || touchDown) return;
            ev.preventDefault();
            const x = ev.offsetX;
            const y = ev.offsetY;
            if (lastNode) this.linkTempPath(lastNode, [x, y]);
            trace.push([x, y]);
            lastNode = [x, y];
            this.emit('move');
        };
        const onTouchStart = (ev: TouchEvent) => {
            if (mouseDown || touchDown) return;
            touchId = ev.touches[0]?.identifier ?? void 0;
            if (touchId === void 0) return;
            ev.preventDefault();
            mouseDown = false;
            touchDown = true;
            const touch = ev.touches[0];
            const x = touch.clientX - this.posX;
            const y = touch.clientY - this.posY;
            trace = [[x, y]];
            this.emit('start');
        };
        const onTouchMove = (ev: TouchEvent) => {
            if (touchId === void 0) return;
            if (!touchDown || mouseDown) return;
            ev.preventDefault();
            const touch = Array.from(ev.touches).find(
                v => v.identifier === touchId
            );
            if (!touch) return;
            const x = touch.clientX - this.posX;
            const y = touch.clientY - this.posY;
            if (lastNode) this.linkTempPath(lastNode, [x, y]);
            trace.push([x, y]);
            lastNode = [x, y];
            this.emit('move');
        };
        const onTouchEnd = (ev: TouchEvent) => {
            if (Array.from(ev.touches).every(v => v.identifier !== touchId)) {
                end();
            }
        };
        const onMouseLeave = () => {
            if (mouseDown) end();
        };

        this.canvas.addEventListener('mousedown', onMouseDown);
        this.canvas.addEventListener('mousemove', onMouseMove);
        this.canvas.addEventListener('mouseup', onMouseLeave);
        this.canvas.addEventListener('mouseleave', onMouseLeave);
        this.canvas.addEventListener('touchstart', onTouchStart);
        this.canvas.addEventListener('touchmove', onTouchMove);
        this.canvas.addEventListener('touchend', onTouchEnd);
        this.canvas.addEventListener('touchcancel', onTouchEnd);
        this.li = [
            { type: 'mousedown', fn: onMouseDown },
            { type: 'mousemove', fn: onMouseMove },
            { type: 'mouseup', fn: end },
            { type: 'mouseleave', fn: end },
            { type: 'touchstart', fn: onTouchStart },
            { type: 'touchmove', fn: onTouchMove },
            { type: 'touchend', fn: end },
            { type: 'touchcancel', fn: end }
        ];
    }

    calCanvasPosition() {
        let current: HTMLElement | null = this.canvas;
        let nx = 0;
        let ny = 0;

        while (current) {
            nx += current.offsetLeft;
            ny += current.offsetTop;
            current = current.offsetParent as HTMLElement | null;
        }

        this.posX = nx - window.scrollX;
        this.posY = ny - window.scrollY;
    }

    unbind() {
        this.li.forEach(v => {
            this.canvas.removeEventListener(v.type, v.fn);
        });
        this.li = [];
    }

    linkTempPath(node1: [number, number], node2: [number, number]) {
        const ctx = this.tempCtx;
        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.scale(devicePixelRatio, devicePixelRatio);
        ctx.beginPath();
        ctx.moveTo(node1[0], node1[1]);
        ctx.lineTo(node2[0], node2[1]);
        ctx.stroke();
        ctx.restore();
    }

    clearTemp() {
        this.tempCtx.clearRect(
            0,
            0,
            this.tempCanvas.width,
            this.tempCanvas.height
        );
    }

    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    drawPath(path: [number, number][], originSize?: number) {
        const ctx = this.ctx;

        const scale = originSize ? this.canvas.width / originSize : 1;

        ctx.save();
        ctx.scale(devicePixelRatio, devicePixelRatio);
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(path[0][0] * scale, path[0][1] * scale);
        for (const [x, y] of path.slice(1)) {
            ctx.lineTo(x * scale, y * scale);
        }
        ctx.stroke();
        ctx.restore();
    }
}
