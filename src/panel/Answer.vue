<template>
    <div class="answer">
        <div class="title">
            <div class="title-logo">
                <img class="logo" src="/logo.jpg" />
                <span>查看答案</span>
            </div>
            <Button class="button" type="primary" @click="returnToList"
                >返回题库</Button
            >
        </div>
        <Divider class="divider" dashed></Divider>
        <div class="answer-list" id="answer-list">
            <div class="answer-one" v-for="(v, i) of list">
                <div class="question">
                    <span>第{{ i + 1 }}题</span>
                    <br />
                    <span>答案：{{ v.ans }}</span>
                    <span>拼音：{{ v.pinyin }}</span>
                    <span>解释：{{ v.desc }}</span>
                </div>
                <div class="player-answer">
                    <canvas
                        :id="`answer-canvas-${i}-${ii}`"
                        v-for="ii of 4"
                    ></canvas>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Divider, Button } from 'ant-design-vue';
import { shared } from '../common/shared';
import { onMounted, onUnmounted } from 'vue';

const nowSet = shared.gameWords;
const list = [...nowSet.value!.words.values()];

interface IAnswerCanvas {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
}

let listDiv: HTMLDivElement;
const canvases: IAnswerCanvas[][] = [];

const observer = new ResizeObserver(() => {
    resize();
});

function resize() {
    const width = listDiv.clientWidth;
    const canvasWidth = width * 0.6;
    const size = canvasWidth / 4;
    canvases.flat().forEach(v => {
        v.canvas.width = size * devicePixelRatio;
        v.canvas.height = size * devicePixelRatio;
        v.canvas.style.width = `${size}px`;
        v.canvas.style.height = `${size}px`;
    });
    drawPlayerAnswer();
}

function drawPlayerAnswer() {
    const saves = nowSet.value?.saves;
    if (!saves) return;
    canvases.forEach((v, i) => {
        const paths = saves.get(i);
        if (!paths) return;
        v.forEach((vv, ii) => {
            const path = paths.path[ii];
            const ctx = vv.ctx;
            const scale = vv.canvas.width / paths.canvasSize;

            ctx.save();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.scale(devicePixelRatio, devicePixelRatio);
            path.forEach(node => {
                ctx.beginPath();
                ctx.moveTo(node[0][0] * scale, node[0][1] * scale);
                for (const [x, y] of node.slice(1)) {
                    ctx.lineTo(x * scale, y * scale);
                }
                ctx.stroke();
            });
            ctx.restore();
        });
    });
}

function returnToList() {
    shared.mode.value = 'info';
}

onMounted(() => {
    listDiv = document.getElementById('answer-list') as HTMLDivElement;
    const size = list.length;
    for (let i = 0; i < size; i++) {
        const arr: IAnswerCanvas[] = [];
        canvases.push(arr);
        for (let ii = 0; ii < 4; ii++) {
            const id = `answer-canvas-${i}-${ii + 1}`;
            const canvas = document.getElementById(id) as HTMLCanvasElement;
            const ctx = canvas.getContext('2d')!;
            arr.push({ canvas, ctx });
        }
    }
    resize();
    observer.observe(listDiv);
});

onUnmounted(() => {
    observer.disconnect();
});
</script>

<style lang="less" scoped>
.answer {
    width: 1000px;
    display: flex;
    flex-direction: column;
    user-select: none;
}

.title {
    display: flex;
    align-items: center;
    margin-top: 30px;
    font-size: 28px;
    width: 100%;
    justify-content: space-between;
}

.title-logo {
    display: flex;
    align-items: center;
    font-size: 28px;
}

.button {
    font-size: 18px;
    height: 100%;
    align-self: flex-end;
}

.logo {
    width: 60px;
    height: 60px;
    margin-right: 20px;
}

.divider {
    border-color: #000;
}

.divider-minor {
    margin: 20px 0;
    border-color: #0004;
}

.answer-list {
    height: 100%;
    overflow: auto;
}

.answer-one {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
}

.question {
    display: flex;
    flex-direction: column;
}

.player-answer {
    display: flex;
    align-items: center;
    width: 60%;
    border: 1px solid #0004;
    padding: 10px;
}

@media screen and (max-width: 1000px) {
    .answer {
        width: 100%;
    }

    .answer-one {
        padding: 0 20px;
    }

    .button {
        margin-right: 20px;
    }
}

@media screen and (max-width: 600px) {
}
</style>
