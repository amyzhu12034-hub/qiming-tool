/* 从已审核姓名语料生成精简的用字笔画五行表。
 * 已有康熙笔画优先；缺失字采用 Make Me a Hanzi 的现行笔画数补齐。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const sourceFiles = ['client-corpus.json'].map(file => path.join(root, 'data', file));
const existing = JSON.parse(fs.readFileSync(path.join(root, 'data', 'character-dictionary.json'), 'utf8')).characters;
const characters = new Set();

sourceFiles.forEach(file => {
  JSON.parse(fs.readFileSync(file, 'utf8')).forEach(record => {
    Array.from(record.name || '').forEach(char => characters.add(char));
  });
});

const items = {};
const missing = [];
for (const char of [...characters].sort()) {
  if (existing[char]) {
    items[char] = { strokes: existing[char].strokes, source: 'kangxi' };
    continue;
  }
  try {
    const data = require(`hanzi-writer-data/${char}`);
    items[char] = { strokes: data.strokes.length, source: 'modern' };
  } catch {
    missing.push(char);
  }
}

if (missing.length) throw new Error(`以下候选字缺少笔画数据：${missing.join('、')}`);
const output = {
  method: '笔画五行基础匹配：优先康熙笔画，缺失字以开源现行笔画补全；仅作传统文化参考。',
  generatedAt: new Date().toISOString(),
  surnames: JSON.parse(fs.readFileSync(path.join(root, 'data', 'character-dictionary.json'), 'utf8')).surnames,
  characters: items
};
fs.writeFileSync(path.join(root, 'data', 'character-elements.json'), JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`已生成 ${Object.keys(items).length} 个候选用字的笔画五行表，其中康熙笔画 ${Object.values(items).filter(item => item.source === 'kangxi').length} 个。`);
