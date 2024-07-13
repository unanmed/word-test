<template>
    <div class="info">
        <div class="title">
            <img class="logo" src="/logo.jpg" />
            <span>汉字脑洞大会</span>
        </div>
        <Divider class="divider" dashed></Divider>
        <div class="list">
            <div class="list-tools">
                <span>题库列表</span>
                <Button class="button" type="default" @click="importWords"
                    >导入新题库</Button
                >
            </div>
            <Divider class="divider-minor"></Divider>
            <div class="list-content">
                <div class="list-title">
                    <span class="item-column item-one">序号</span>
                    <span class="item-column item-two">名称</span>
                    <span class="item-column item-three">开始答题</span>
                    <span class="item-column item-four">删除题库</span>
                </div>
                <div class="list-item" v-for="(one, i) of wordSets">
                    <Divider class="divider-minor"></Divider>
                    <div class="item-content">
                        <span class="item-column item-one">{{ i }}</span>
                        <span class="item-column item-two">{{ one.name }}</span>
                        <span class="item-column item-three">
                            <Button
                                class="item-button"
                                type="primary"
                                @click="startGame(one)"
                                >开始答题</Button
                            >
                        </span>
                        <span class="item-column item-four">
                            <Button
                                class="item-button"
                                type="primary"
                                danger
                                @click="deleteWords(one)"
                                >删除题库</Button
                            >
                        </span>
                    </div>
                </div>
            </div>
            <Divider class="divider" dashed></Divider>
            <div>题库格式要求：</div>
            <div>
                csv格式表格，表格第一行不计入题库，共分为七列，每一列分别是：序号，词汇，难度，出题人，拼音，解释，额外注释。
                其中额外注释列选填，可以没有
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { Button, Divider, message, Modal } from 'ant-design-vue';
import { WordSet, WordSetList } from '../common/wordSet';
import { deleteForage, read } from '../common/storage';
import { shallowReactive } from 'vue';
import { parseFiles } from '../common/csvParser';
import { shared } from '../common/shared';

const list = WordSetList.main ?? new WordSetList();
const wordSets = shallowReactive<WordSet[]>([]);

const selectFile = document.createElement('input');
selectFile.type = 'file';
selectFile.multiple = true;
selectFile.accept = '.csv';

let inited = false;

let lastPromise: Promise<void> | undefined;
async function importWords() {
    if (!inited) {
        message.warn('请题库列表等待加载完毕');
        return;
    }
    selectFile.click();
    if (lastPromise) return;
    lastPromise = new Promise<void>(res => {
        selectFile.addEventListener(
            'change',
            () => {
                res();
            },
            { once: true }
        );
    });
    await lastPromise;
    const files = selectFile.files;
    if (!files) return;
    const sets = await parseFiles(files);
    sets.forEach(v => {
        list.list.add(v);
        wordSets.push(v);
    });
    await list.save();
    lastPromise = void 0;
}

function deleteWords(word: WordSet) {
    Modal.confirm({
        title: '删除',
        content: '你确定要删除这个题库吗？你的答案也会一并删除！',
        okText: '确定',
        cancelText: '取消',
        okType: 'danger',
        onOk() {
            deleteForage(`answer-${word.id}`);
            list.list.delete(word);
            const index = wordSets.indexOf(word);
            if (index === -1) return;
            wordSets.splice(index, 1);
            list.save();
        }
    });
}

function startGame(words: WordSet) {
    if (shared.gameWords?.value !== words && shared.gameIndex.value !== 0) {
        Modal.confirm({
            title: '开始答题',
            content:
                '当前有未完成的答题，确定要切换题库吗？切换后原来的进度会自动保存！',
            okText: '确定',
            cancelText: '取消',
            okType: 'danger',
            onOk() {
                shared.gameWords.value = words;
                shared.gameIndex.value = 0;
            }
        });
    } else {
        shared.gameWords.value = words;
        shared.gameIndex.value = 0;
    }
    shared.mode.value = 'game';
}

(async () => {
    if (!shared.loaded) {
        const content = await read('wordSetList');
        list.fromJSON(content);
        await Promise.all([...list.list.values()].map(v => v.loadPath()));
    }
    wordSets.push(...list.list.values());
    wordSets.sort((a, b) => a.id - b.id);
    shared.idNum = Math.max(...wordSets.map(v => v.id));
    inited = true;
    shared.loaded = true;
})();
</script>

<style lang="less" scoped>
.info {
    margin-top: 30px;
    width: 1000px;
}

.logo {
    width: 60px;
    height: 60px;
    margin-right: 18px;
}

.title {
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 28px;
}

.divider {
    border-color: #000;
}

.divider-minor {
    margin: 10px 0;
    border-color: #0004;
}

.list-tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 20px;
}

.button {
    font-size: 18px;
    height: 100%;
}

.list-content {
    border: 1px solid #0004;
    display: flex;
    flex-direction: column;
    padding: 10px;
}

.list-title {
    display: flex;
    flex-direction: row;
}

.list-item {
    display: flex;
    flex-direction: column;
}

.item-content {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.item-one {
    width: 10%;
    border-right: 1px solid #0004;
}

.item-two {
    width: 60%;
    border-right: 1px solid #0004;
}

.item-three {
    width: 15%;
    border-right: 1px solid #0004;
}

.item-four {
    width: 15%;
}

.item-column {
    display: flex;
    justify-content: center;
}

.item-button {
    font-size: 16px;
    height: 100%;
}

@media screen and (max-width: 1000px) {
    .info {
        width: 100%;
    }

    .item-two {
        width: 40%;
    }

    .item-three {
        width: 25%;
    }

    .item-four {
        width: 25%;
    }

    .list {
        padding: 0 20px;
        font-size: 16px;
    }

    .button {
        font-size: 16px;
    }

    .item-button {
        font-size: 14px;
    }
}
</style>
