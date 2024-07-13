<template>
    <div class="header">
        <div class="header-left">
            <img class="logo" src="/logo.jpg" />
            <span class="title">汉字脑洞大会</span>
        </div>
        <div class="header-center">
            <Menu
                v-model:selected-keys="selectedPages"
                mode="horizontal"
                class="header-menu"
            >
                <MenuItem class="menu-item" key="info">菜单</MenuItem>
                <MenuItem class="menu-item" key="game">答题</MenuItem>
            </Menu>
        </div>
        <div class="header-right"></div>
    </div>
</template>

<script lang="ts" setup>
import { Menu, MenuItem } from 'ant-design-vue';
import { computed, ref, watch } from 'vue';
import { shared } from '../common/shared';

type MenuType = 'info' | 'game';

const emits = defineEmits<{
    (e: 'menu', data: MenuType): void;
}>();

const selectedPages = ref<MenuType[]>(['info']);
const currentPage = computed(() => selectedPages.value?.[0] ?? 'info');

watch(shared.mode, n => {
    if (n === 'game') {
        selectedPages.value = ['game'];
    }
    if (n === 'info') {
        selectedPages.value = ['info'];
    }
    if (n === 'answer') {
        selectedPages.value = ['game'];
    }
});

watch(currentPage, n => {
    if (shared.mode.value !== n) shared.mode.value = n;
    emits('menu', n);
});
</script>

<style lang="less" scoped>
.logo {
    width: 40px;
    height: 40px;
    margin-left: 6px;
}

.title {
    margin-left: 6px;
    font-size: 18px;
    width: 120px;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 52px;
    box-shadow: 0px 1px 12px rgba(0, 0, 0, 0.3);
    width: 100%;
    margin: 0;
    background-color: #fff;
}

.header-left {
    display: flex;
    align-items: center;
    width: 200px;
}

.header-right {
    width: 200px;
}

.header-center :deep(.ant-menu .ant-menu-item) {
    font-size: 18px;
    margin: 0 12px;
}

.header-center :deep(.ant-menu) {
    border-bottom: 0;
}

@media screen and (max-width: 600px) {
    .header-center :deep(.ant-menu .ant-menu-item) {
        font-size: 16px;
        margin: 0 6px;
    }

    .header-center :deep(.ant-menu) {
        background-color: transparent;
    }

    .header-right {
        display: none;
    }
}
</style>
