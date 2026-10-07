/* 为正式语料补齐带声调拼音。
 * 词典负责常规词语读音；下列古典语境、多音字组合由编辑确认后固定，避免后续词典升级改变读音。
 */
const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');

const root = path.join(__dirname, '..');
const files = ['expanded-corpus.json', 'approved-corpus.json', 'modern-inspiration-corpus.json'].map(file => path.join(root, 'data', file));
const editorialOverrides = {
  景行: 'jǐng xíng', 缉熙: 'jī xī', 于飞: 'yú fēi', 容与: 'róng yǔ',
  孤帆: 'gū fān', 长河: 'cháng hé', 长天: 'cháng tiān', 燕归: 'yàn guī',
  思乐: 'sī lè', 令德: 'lìng dé', 葆光: 'bǎo guāng', 扶搖: 'fú yáo',
  逍遙: 'xiāo yáo', 瑶佩: 'yáo pèi', 知止: 'zhī zhǐ', 致知: 'zhì zhī'
};

const derivePinyin = name => editorialOverrides[name] || pinyin(name, { toneType: 'symbol' });
const recordsByFile = files.map(file => ({ file, records: JSON.parse(fs.readFileSync(file, 'utf8')) }));
const allRecords = recordsByFile.flatMap(entry => entry.records);
const invalid = allRecords.filter(record => !derivePinyin(record.name) || /[\u4e00-\u9fff]/.test(derivePinyin(record.name)));

if (process.argv.includes('--check')) {
  const missing = allRecords.filter(record => !record.pinyin || /待|确认/.test(record.pinyin));
  if (missing.length || invalid.length) throw new Error(`拼音语料未完成：缺失 ${missing.length} 条，无法解析 ${invalid.length} 条。`);
  console.log(`拼音核验通过：${allRecords.length} 条扩展语料均有完整带声调拼音；多音字编辑覆核 ${Object.keys(editorialOverrides).length} 条。`);
  process.exit(0);
}

let filled = 0;
for (const entry of recordsByFile) {
  const enriched = entry.records.map(record => {
    if (!record.pinyin) filled += 1;
    return { ...record, pinyin: derivePinyin(record.name) };
  });
  fs.writeFileSync(entry.file, JSON.stringify(enriched, null, 2) + '\n', 'utf8');
}
console.log(`已补齐 ${filled} 条拼音；多音字编辑覆核 ${Object.keys(editorialOverrides).length} 条。`);
