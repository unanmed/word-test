import fs from 'fs/promises';
import fse from 'fs-extra';

(async function () {
    // 1. 移动main.js等，生成h5魔塔的发塔形式
    await fs.mkdir('./dist/libs');
    await fs.mkdir('./dist/libs/thirdparty');
    await fs.mkdir('./dist/project');
    await fs.mkdir('./dist/project/autotiles');
    await fs.mkdir('./dist/project/images');
    await fs.mkdir('./dist/project/materials');
    await fs.mkdir('./dist/project/animates');
    await fs.mkdir('./dist/project/fonts');
    await fs.mkdir('./dist/project/floors');
    await fs.mkdir('./dist/project/tilesets');
    await fs.mkdir('./dist/project/sounds');
    await fs.mkdir('./dist/project/bgms');

    await fs.writeFile(
        './dist/project/icons.js',
        `var icons_4665ee12_3a1f_44a4_bea3_0fccba634dc1 = 
{
    "autotile": {
        
    }
}`,
        'utf-8'
    );
    await fs.writeFile('./dist/project/floors/none.js', '"none"', 'utf-8');
    await fs.writeFile('./dist/libs/none.js', '"none"', 'utf-8');

    await fse.copyFile('./template/main.js', './dist/main.js');
    await fse.copyFile('./template/data.js', './dist/project/data.js');
    await fse.copyFile(
        './template/lz-string.min.js',
        './dist/libs/thirdparty/lz-string.min.js'
    );

    await Promise.all(
        ['animates', 'images', 'materials', 'sounds', 'tilesets'].map(v => {
            fse.copyFile(
                './template/.h5data',
                `./dist/project/${v}/${v}.h5data`
            );
        })
    );
})();
