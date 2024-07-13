import { ref, Ref, shallowRef } from 'vue';
import { WordSet } from './wordSet';

type MenuType = 'info' | 'game' | 'answer';

interface ISharedInfo {
    idNum: number;
    mode: Ref<MenuType>;
    gameWords: Ref<WordSet | undefined>;
    gaming: boolean;
    gameIndex: Ref<number>;
    isMobile: Ref<boolean>;
    loaded: boolean;
}

const isMobile = ref(false);
isMobile.value = checkMobile();

export const shared: ISharedInfo = {
    idNum: 0,
    mode: ref('info'),
    gaming: false,
    gameIndex: ref(0),
    gameWords: shallowRef(),
    isMobile,
    loaded: false
};

function checkMobile() {
    return matchMedia('(max-width: 600px)').matches;
}

window.addEventListener('resize', () => {
    isMobile.value = checkMobile();
});
