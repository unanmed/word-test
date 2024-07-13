<template>
    <div class="game">
        <div class="title">
            <img class="logo" src="/logo.jpg" />
            <span>答题界面</span>
        </div>
        <Divider class="divider" dashed></Divider>
        <div v-if="!nowSet">
            <div class="non-select">请先在菜单中选择题库</div>
        </div>
        <div class="game-main" v-else>
            <div class="base-info">
                <span>
                    第 {{ shared.gameIndex.value + 1 }} /
                    {{ shared.gameWords.value?.words.size ?? 0 }} 题
                </span>
                <span> 出题人：{{ nowWord.author }} </span>
                <span> 难度：{{ nowWord.hard }} </span>
            </div>
            <Divider class="divider-minor"></Divider>
            <div class="desc">
                词汇描述：{{ nowWord.desc }}
                <div v-if="nowWord.addition">
                    <br />
                    <span>额外注释：{{ nowWord.addition }}</span>
                </div>
            </div>
            <!-- <div class="recg-status">
                <span>识别情况：{{ statusText }}</span>
                <span>识别结果：{{ resultText }}</span>
            </div> -->
            <div class="tools">
                <Button
                    class="tool-button"
                    type="primary"
                    @click="lastQuestion"
                >
                    {{ nowIndex === 0 ? '返回题库' : '上一题' }}
                </Button>
                <Button
                    class="tool-button"
                    type="primary"
                    @click="nextQuestion"
                >
                    {{ nowIndex === wordCount - 1 ? '查看答案' : '下一题' }}
                </Button>
            </div>
            <Divider class="divider-minor"></Divider>
            <div class="answer-sheet" id="answer-sheet">
                <div
                    class="sheet-one"
                    :id="`sheet-one-${i}`"
                    :show="!shared.isMobile.value || nowChar === i - 1"
                    v-for="i of 4"
                >
                    <span>{{ pinyin[i - 1] ?? 'X' }}</span>
                    <canvas
                        class="sheet-canvas-back sheet-canvas"
                        :id="`sheet-canvas-${i}-back`"
                    ></canvas>
                    <canvas
                        class="sheet-canvas-main sheet-canvas"
                        :id="`sheet-canvas-${i}`"
                    ></canvas>
                    <canvas
                        class="sheet-canvas-temp sheet-canvas"
                        :id="`sheet-canvas-temp-${i}`"
                    ></canvas>
                    <span class="clear-sheet" @click="clearCanvas(i)"
                        ><DeleteOutlined
                    /></span>
                </div>
            </div>
            <div
                v-if="shared.isMobile.value"
                class="mobile-char-button"
                id="mobile-char-button"
            >
                <Button class="canvas-button" type="primary" @click="lastChar"
                    >上一个字</Button
                >
                <span>{{ nowChar + 1 }} / {{ 4 }}</span>
                <Button class="canvas-button" type="primary" @click="nextChar"
                    >下一个字</Button
                >
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Divider, Modal } from 'ant-design-vue';
import { shared } from '../common/shared';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { DeleteOutlined } from '@ant-design/icons-vue';
import { CanvasDrawer } from '../common/canvasDrawer';
import { Button } from 'ant-design-vue';

const nowSet = shared.gameWords;
const nowWord = computed(() => {
    return nowSet.value?.words.get(shared.gameIndex.value)!;
});
const pinyin = computed(() => {
    return nowWord.value.pinyin.split(' ');
});
const wordCount = computed(() => {
    return nowSet.value?.words.size ?? 0;
});
const nowIndex = shared.gameIndex;
const nowChar = ref(0);

interface IAnswerSheet {
    back: HTMLCanvasElement;
    backCtx: CanvasRenderingContext2D;
    main: HTMLCanvasElement;
    mainCtx: CanvasRenderingContext2D;
    div: HTMLDivElement;
    tempCanvas: HTMLCanvasElement;
    tempCtx: CanvasRenderingContext2D;
    drawer: CanvasDrawer;
}

let answerSheetList: IAnswerSheet[] = [];
let answerSheet: HTMLDivElement;
let charButton: HTMLDivElement | null;

// const statusText = ref('');
// const resultText = ref('');

const observer = new ResizeObserver(() => {
    resize();
});

function resize() {
    if (!nowSet.value) return;
    const windowHeight = window.innerHeight;
    const width = answerSheet.clientWidth;
    const top = answerSheet.offsetTop;
    const restHeight = windowHeight - top;
    const span = width / 20;
    let divWidth = width / 4;
    const avrWidth = width / 4 - span;
    const avrHeight = restHeight - span;
    let canvasSize = Math.min(avrWidth, avrHeight);
    let size = canvasSize * devicePixelRatio;

    charButton = document.getElementById(
        'mobile-char-button'
    ) as HTMLDivElement;

    if (shared.isMobile.value) {
        divWidth = document.body.clientWidth;
        canvasSize = document.body.clientWidth * 0.7;
        size = canvasSize * devicePixelRatio;
    } else {
        answerSheet.style.left = '';
    }

    answerSheetList.forEach((v, i) => {
        v.div.style.width = `${divWidth}px`;
        if (!shared.isMobile.value) v.div.style.left = `${divWidth * i}px`;
        else v.div.style.left = `0px`;
        v.back.width = size;
        v.back.height = size;
        v.main.width = size;
        v.main.height = size;
        v.tempCanvas.width = size;
        v.tempCanvas.height = size;
        v.back.style.width = `${canvasSize}px`;
        v.back.style.height = `${canvasSize}px`;
        v.main.style.width = `${canvasSize}px`;
        v.main.style.height = `${canvasSize}px`;
        v.tempCanvas.style.width = `${canvasSize}px`;
        v.tempCanvas.style.height = `${canvasSize}px`;
        v.drawer.calCanvasPosition();
    });

    if (shared.isMobile.value) {
        requestAnimationFrame(() => {
            const height = canvasSize + 70;
            if (!charButton) return;
            charButton.style.top = `${height}px`;
        });
    }

    drawSheetBackground();
    drawSavedPath();
}

function onScroll() {
    answerSheetList.forEach(v => v.drawer.calCanvasPosition());
}

function drawSavedPath() {
    if (!nowSet.value) return;
    const saves = nowSet.value!.saves;
    const id = nowWord.value.id;
    const paths = saves.get(id);
    if (!paths) return;
    answerSheetList.forEach((v, i) => {
        const path = paths.path[i];
        const drawer = v.drawer;
        drawer.clear();
        drawer.clearTemp();
        path.forEach(v => {
            drawer.drawPath(v, paths.canvasSize);
        });
    });
}

function drawSheetBackground() {
    answerSheetList.forEach(v => {
        const { backCtx: ctx, back } = v;
        ctx.clearRect(0, 0, back.width, back.height);
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'red';

        // border
        ctx.setLineDash([]);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(back.width, 0);
        ctx.lineTo(back.width, back.height);
        ctx.lineTo(0, back.height);
        ctx.closePath();
        ctx.stroke();

        // 米字格
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        [
            [0, 0],
            [back.width / 2, 0],
            [back.width, 0],
            [back.width, back.height / 2],
            [back.width, back.height],
            [back.width / 2, back.height],
            [0, back.height],
            [0, back.height / 2]
        ].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.moveTo(back.width / 2, back.height / 2);
            ctx.lineTo(x, y);
            ctx.stroke();
        });
    });
}

function clearCanvas(index: number) {
    nowSet.value?.clearPath(
        nowWord.value.id,
        index - 1,
        answerSheetList[index - 1].main.width
    );
    answerSheetList[index - 1].drawer.clear();
}

function clearAll() {
    answerSheetList.forEach(v => {
        v.drawer.clear();
        v.drawer.clearTemp();
    });
}

function lastQuestion() {
    if (nowIndex.value === 0) {
        Modal.confirm({
            title: '返回题库',
            content: '确定返回题库吗？',
            okType: 'danger',
            okText: '确定',
            cancelText: '取消',
            onOk() {
                shared.mode.value = 'info';
            }
        });
    } else {
        nowIndex.value--;
        clearAll();
        drawSavedPath();
    }
}

function nextQuestion() {
    if (nowIndex.value === wordCount.value - 1) {
        Modal.confirm({
            title: '查看答案',
            content: '确定要查看答案吗？',
            okText: '确定',
            cancelText: '取消',
            onOk() {
                shared.mode.value = 'answer';
                shared.gameIndex.value = 0;
            }
        });
    } else {
        nowIndex.value++;
        clearAll();
        drawSavedPath();
    }
}

function lastChar() {
    if (nowChar.value > 0) nowChar.value--;
}

function nextChar() {
    if (nowChar.value < 3) nowChar.value++;
}

// function onRecognition(status: WordCheckStatus, result: string[]) {
//     const ans = result.join('');
//     const s =
//         status === WordCheckStatus.Success
//             ? nowSet.value?.check(shared.gameIndex.value, ans)
//             : status;

//     switch (s) {
//         case WordCheckStatus.Success:
//             statusText.value = '回答正确！';
//             break;
//         case WordCheckStatus.Failure:
//             statusText.value = '回答错误！';
//             break;
//         case WordCheckStatus.ErrorExceedCharCount:
//             statusText.value = '文字数量过多！';
//             break;
//         case WordCheckStatus.ErrorLessCharCount:
//             statusText.value = '文字数量过少！';
//             break;
//         case WordCheckStatus.ErrorNoWord:
//             statusText.value = '不存在的文字！';
//             break;
//         case WordCheckStatus.ErrorRepeatCharInOneRect:
//             statusText.value = '一个格子内只能写一个字！';
//             break;
//     }

//     resultText.value = ans;
// }

onMounted(() => {
    if (!nowSet.value) return;
    answerSheet = document.getElementById('answer-sheet') as HTMLDivElement;
    charButton = document.getElementById(
        'mobile-char-button'
    ) as HTMLDivElement;
    for (let i = 0; i < 4; i++) {
        const back = document.getElementById(
            `sheet-canvas-${i + 1}-back`
        ) as HTMLCanvasElement;
        const main = document.getElementById(
            `sheet-canvas-${i + 1}`
        ) as HTMLCanvasElement;
        const div = document.getElementById(
            `sheet-one-${i + 1}`
        ) as HTMLDivElement;
        const temp = document.getElementById(
            `sheet-canvas-temp-${i + 1}`
        ) as HTMLCanvasElement;
        const mainCtx = main.getContext('2d')!;
        const tempCtx = temp.getContext('2d')!;
        const drawer = new CanvasDrawer(main, mainCtx, temp, tempCtx);
        const sheet: IAnswerSheet = {
            back,
            main,
            backCtx: back.getContext('2d')!,
            mainCtx,
            div,
            tempCanvas: temp,
            tempCtx,
            drawer
        };
        drawer.on('end', path => {
            nowSet.value?.pushPath(nowWord.value.id, i, main.width, path);
        });
        answerSheetList.push(sheet);
    }
    resize();
    observer.observe(answerSheet);
    window.addEventListener('scroll', onScroll);
});

onUnmounted(() => {
    observer.disconnect();
    answerSheetList.forEach(v => {
        v.drawer.unbind();
        v.drawer.removeAllListeners();
    });
    window.removeEventListener('scroll', onScroll);
});
</script>

<style lang="less" scoped>
.game {
    width: 1000px;
    display: flex;
    flex-direction: column;
    user-select: none;
    height: 100%;
    overflow-x: clip;
    overflow-y: visible;
}

.non-select {
    font-size: 32px;
    display: flex;
    justify-content: center;
}

.title {
    display: flex;
    align-items: center;
    margin-top: 30px;
    font-size: 28px;
    width: 100%;
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

.game-main {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.base-info {
    font-size: 22px;
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
}

.desc {
    font-size: 16px;
    height: 30vh;
}

.tools {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.tool-button {
    font-size: 16px;
    height: 100%;
}

.recg-status {
    display: flex;
    font-size: 18px;

    span {
        flex-basis: 50%;
    }
}

.answer-sheet {
    font-size: 20px;
    position: relative;
    width: 100%;
    height: max-content;
    // overflow-x: hidden;
}

.sheet-one[show='true'] {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    overflow: visible;
}

.sheet-one[show='false'] {
    display: none;
}

.sheet-canvas {
    position: absolute;
    top: 40px;
}

.sheet-canvas-back {
    z-index: 0;
}

.sheet-canvas-main {
    z-index: 2;
}

.sheet-canvas-temp {
    z-index: 1;
}

.clear-sheet {
    position: absolute;
    bottom: 0;
    right: 10%;
    transition: all 0.1s ease;
    color: rgb(220, 0, 158);
}

.clear-sheet:hover {
    cursor: pointer;
    color: rgb(0, 191, 255);
}

.mobile-char-button {
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    position: relative;
    padding-bottom: 20px;
    align-items: center;
}

.canvas-button {
    font-size: 16px;
    height: 100%;
}

@media screen and (max-width: 1000px) {
    .game {
        width: 100%;
    }

    .base-info {
        justify-content: space-around;
    }

    .desc {
        padding: 0 20px;
    }

    .recg-status {
        padding: 0 20px;
    }

    .tools {
        padding: 0 20px;
    }
}

@media screen and (max-width: 600px) {
    .base-info {
        font-size: 16px;
        justify-content: space-around;
    }

    .desc {
        padding: 0 20px;
    }

    .answer-sheet {
        font-size: 16px;
    }

    .tools {
        padding: 0 20px;
    }

    .sheet-one {
        width: 70vw;
    }
}
</style>
