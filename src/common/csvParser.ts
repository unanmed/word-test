import { shared } from './shared';
import { WordAnswer, WordSet } from './wordSet';

export function parseWordSetCSV(content: string) {
    // 判断换行符
    const index = content.indexOf('\n');
    if (index === -1) throw new Error(`Invalid csv input.`);
    const crlf = content[index - 1] === '\r';
    const newLine = crlf ? '\r\n' : '\n';

    const lines = content
        .split(newLine)
        .slice(1)
        .filter(v => v.length !== 0);
    const res: WordAnswer[] = lines.map((v, i) => {
        const [_id, ans, hard, author, pinyin, desc, addition] = v
            .split(',')
            .map(v => v.trim());
        return { id: i, ans, hard, author, pinyin, desc, addition };
    });

    return res;
}

export function parseFiles(files: FileList) {
    return Promise.all(
        Array.from(files).map(async v => {
            const content = await v.text();
            const words = parseWordSetCSV(content);
            const wordSet = new WordSet(shared.idNum++, v.name.slice(0, -4));
            words.forEach(v => {
                wordSet.words.set(v.id, v);
            });
            return wordSet;
        })
    );
}
