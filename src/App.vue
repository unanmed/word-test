<template>
    <div class="main">
        <Header></Header>
        <Info v-if="shared.mode.value === 'info'"></Info>
        <Game v-else-if="shared.mode.value === 'game'"></Game>
        <Answer v-else></Answer>
    </div>
</template>

<script lang="ts" setup>
import Info from './panel/Info.vue';
import Header from './components/Header.vue';
import Game from './panel/Game.vue';
import Answer from './panel/Answer.vue';
import { shared } from './common/shared';
</script>

<style lang="less" scoped>
.main {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
}
</style>
