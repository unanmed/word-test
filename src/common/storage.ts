import localforage from 'localforage';

const PREFIX = 'word-test';

function wrapKey(key: string) {
    return PREFIX + '_' + key;
}

export async function read(key: string) {
    const res = await localforage.getItem<string>(wrapKey(key));
    return res || '[]';
}

export function write(key: string, value: string) {
    return localforage.setItem(wrapKey(key), value);
}

export function deleteForage(key: string) {
    return localforage.removeItem(wrapKey(key));
}
