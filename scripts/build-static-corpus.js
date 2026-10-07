/* 将当前正式语料编译为 GitHub Pages 可离线读取的浏览器数据文件。 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const worker = fs.readFileSync(path.join(root, 'worker.js'), 'utf8');
const start = worker.indexOf('const corpus = [') + 'const corpus = '.length;
const end = worker.indexOf('].map(([name, gender', start) + 1;
if (start < 'const corpus = '.length || end < 1) throw new Error('无法读取 Worker 内置语料。');

const baseRows = vm.runInNewContext(`(${worker.slice(start, end)})`);
const base = baseRows.map(([name, gender, work, quote, extracted, meaning, themes, pinyin]) => ({ name, gender, work, quote, extracted, meaning, themes, pinyin }));
const expanded = JSON.parse(fs.readFileSync(path.join(root, 'data', 'expanded-corpus.json'), 'utf8'));
const approved = JSON.parse(fs.readFileSync(path.join(root, 'data', 'approved-corpus.json'), 'utf8'));
const modern = JSON.parse(fs.readFileSync(path.join(root, 'data', 'modern-inspiration-corpus.json'), 'utf8'));
const seen = new Set();
const corpus = [...base, ...expanded, ...approved, ...modern].filter(record => {
  if (seen.has(record.name)) return false;
  seen.add(record.name);
  return true;
});
const missingPinyin = corpus.filter(record => !record.pinyin || /待|确认/.test(record.pinyin));
if (missingPinyin.length) throw new Error(`静态语料存在 ${missingPinyin.length} 条未核验拼音，无法生成页面。`);

const output = path.join(root, 'data', 'client-corpus.json');
fs.writeFileSync(output, JSON.stringify(corpus, null, 2) + '\n', 'utf8');
console.log(`已生成 ${corpus.length} 条浏览器本地语料：${output}`);
