/*
 * 从 Early Chinese Text Corpus（CC BY-SA 4.0）生成哲学与先秦古籍待审核候选。
 * 原文去除了标点，故每一条保留稳定 sourceRecordId；未审核前绝不进入正式库。
 * 用法：node scripts/import-early-chinese-texts.js <ect-krp 目录>
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [root] = process.argv.slice(2);
if (!root || !fs.existsSync(root)) throw new Error('请提供 ect-krp 本地目录。');
const metadata = JSON.parse(fs.readFileSync(path.join(root, 'metadata.json'), 'utf8'));
const rules = {
  '老子道德經': ['若水', '知足', '知止', '玄同', '抱朴', '大成', '大方', '大音', '大象'],
  '莊子': ['逍遙', '扶搖', '天籟', '葆光', '至人', '神人', '真人'],
  '荀子': ['積善', '致知', '修身', '清明'],
  '山海經': ['青丘', '白澤', '扶桑', '若木', '建木', '玉山', '瑤水', '赤水', '丹木', '青鳥'],
  '列子': ['御風', '虛靜'],
  '淮南子': ['清靜', '玄同']
};
const unusual = new Set(['扶搖', '天籟', '葆光', '至人', '神人', '真人', '青丘', '白澤', '扶桑', '若木', '建木', '玉山', '瑤水', '赤水', '丹木', '青鳥', '御風']);
const negative = /哀|悲|憂|怨|病|死|孤|傷|恨|懼|罪|禍|亂|兵|戰|殺|喪|泣|淚|寡|勞|苦|貧|飢|仇|辱|惡|暴|愁|惱|離|別|殘|凄|冢|寂寥/;
const themeMap = { 若:['自在'], 水:['清澈','自在'], 知:['智慧'], 足:['平安'], 止:['平安'], 玄:['智慧'], 同:['平安'], 抱:['温柔'], 朴:['品性'], 大:['志向'], 成:['坚定'], 方:['品性'], 音:['喜乐'], 象:['智慧'], 逍:['自在'], 遙:['自在'], 扶:['志向'], 搖:['自在'], 天:['自然'], 籟:['自然'], 葆:['品性'], 光:['明朗'], 至:['志向'], 人:['品性'], 神:['明朗'], 真:['品性'], 積:['坚定'], 善:['品性'], 致:['智慧'], 修:['品性'], 身:['品性'], 清:['清澈'], 明:['明朗','智慧'], 青:['自然'], 丘:['自然'], 白:['清澈'], 澤:['温柔'], 桑:['自然'], 木:['自然'], 建:['志向'], 玉:['品性'], 山:['自然'], 瑤:['品性'], 赤:['明朗'], 丹:['明朗'], 鳥:['自在'], 御:['自在'], 風:['自在'], 虛:['自在'], 靜:['温柔'] };
function themesFor(name) { return [...new Set(Array.from(name).flatMap(char => themeMap[char] || []))]; }
function quoteFor(text, name) { const index = text.indexOf(name); return text.slice(Math.max(0, index - 22), Math.min(text.length, index + name.length + 36)); }

const records = [];
for (const [series, title] of Object.entries(metadata)) {
  if (!rules[title]) continue;
  const file = path.join(root, 'jsonl', `${series}.jsonl`);
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) if (line.trim()) records.push({ ...JSON.parse(line), title, file });
}
const digest = crypto.createHash('sha256');
for (const record of records) digest.update(record.text);
const sourceSha256 = digest.digest('hex');
const seen = new Set();
const candidates = [];
for (const record of records) {
  for (const name of rules[record.title]) {
    if (!record.text.includes(name) || seen.has(`${record.title}|${name}`)) continue;
    const quote = quoteFor(record.text, name);
    if (negative.test(quote)) continue;
    seen.add(`${record.title}|${name}`);
    const themes = themesFor(name);
    candidates.push({
      id: crypto.createHash('sha256').update(`early|${record.id}|${name}`).digest('hex').slice(0, 20),
      collection: 'philosophy', name, gender: '中性', work: `《${record.title}》`, quote, extracted: name, themes,
      meaning: `取自《${record.title}》原文，意象初标为${themes.join('、')}；尚未通过人工语境与人名感审核。`,
      styleNotice: unusual.has(name) ? '风格较特别' : '', reviewStatus: 'auto_screened',
      provenance: { sourceName: 'Early Chinese Text Corpus / Kanseki Repository', sourceUrl: 'https://github.com/direct-phonology/ect-krp', license: 'CC BY-SA 4.0', sourceRecordId: record.id, sourceSha256, importedAt: new Date().toISOString() }
    });
  }
}
const output = candidates.sort((a, b) => a.name.localeCompare(b.name, 'zh'));
const outputPath = path.join(__dirname, '..', 'data', 'review-queue-philosophy.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`哲学与先秦古籍：扫描 ${records.length} 条原文，生成 ${output.length} 条待审核候选。`);
