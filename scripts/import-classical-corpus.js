/*
 * 从 CC0 结构化古籍底座生成「十三经与诸子」待审核候选。
 * 不会将整库文本或候选直接写入正式推荐库。
 * 用法：node scripts/import-classical-corpus.js <corpus.jsonl>
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [sourcePath] = process.argv.slice(2);
if (!sourcePath || !fs.existsSync(sourcePath)) throw new Error('请提供已下载的 corpus.jsonl 路径。');

// 只保留有明确人名感、可由完整原文回溯的词；是否进入正式库仍需人工审核。
const rules = {
  '大学': ['明德', '至善', '知止', '致知', '格物', '诚意', '正心', '修身'],
  '中庸': ['中和', '诚明', '至诚', '博学', '审问', '慎思', '明辨', '笃行'],
  '论语': ['温良', '忠信', '和贵', '安仁', '敏行', '德邻', '志道', '弘毅', '笃信', '近思'],
  '孟子': ['浩然', '知言', '居仁', '由义', '大勇', '仁政'],
  '尚书': ['允恭', '克让', '敬德', '协和'],
  '礼记': ['嘉会', '玉振', '令德'],
  '周易': ['含章', '厚德', '自强'],
  '孝经': ['立身', '扬名', '爱敬']
};
const blocked = new Set(['和贵', '仁政', '立身', '扬名', '大勇', '克让']);
const negative = /哀|悲|忧|怨|病|死|孤|伤|恨|惧|罪|祸|乱|兵|战|杀|丧|泣|泪|寡|劳|苦|贫|饥|仇|辱|恶|暴|愁|恼|离|别|残|凄|冢|寂寥/;
const themeMap = { 明:['明朗','智慧'], 德:['品性'], 善:['品性'], 知:['智慧'], 止:['平安'], 致:['智慧'], 格:['智慧'], 诚:['品性'], 意:['品性'], 正:['品性'], 心:['品性'], 修:['品性'], 中:['平安'], 和:['平安','品性'], 至:['志向'], 博:['智慧'], 学:['智慧'], 审:['智慧'], 问:['智慧'], 慎:['品性'], 思:['智慧'], 辨:['智慧'], 笃:['坚定'], 行:['坚定'], 温:['温柔'], 良:['品性'], 忠:['品性'], 信:['品性'], 安:['平安'], 仁:['品性'], 敏:['智慧'], 邻:['平安'], 志:['志向'], 道:['品性'], 弘:['志向'], 毅:['坚定'], 浩:['志向'], 然:['自在'], 言:['智慧'], 居:['平安'], 义:['品性'], 允:['品性'], 恭:['品性'], 敬:['品性'], 协:['平安'], 嘉:['喜乐'], 会:['喜乐'], 玉:['品性'], 振:['志向'], 令:['品性'], 含:['温柔'], 章:['明朗'], 厚:['品性'], 自:['自在'], 强:['坚定'], 爱:['温柔'] };
function themesFor(name) { return [...new Set(Array.from(name).flatMap(char => themeMap[char] || []))]; }
function displayWork(record) { return `${record.author || '佚名'}《${record.source}·${record.chapter || '佚篇'}》`; }

const hash = crypto.createHash('sha256');
const candidates = [];
const seen = new Set();
let scanned = 0;
for (const line of fs.readFileSync(sourcePath, 'utf8').split(/\r?\n/)) {
  if (!line.trim()) continue;
  const record = JSON.parse(line);
  if (!rules[record.source] || !record.content) continue;
  scanned += 1;
  for (const name of rules[record.source]) {
    if (blocked.has(name) || !record.content.includes(name)) continue;
    const key = `${record.source}|${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const index = record.content.indexOf(name);
    const quote = record.content.slice(Math.max(0, index - 24), Math.min(record.content.length, index + name.length + 34)).replace(/\s+/g, ' ').trim();
    if (negative.test(quote)) continue;
    const themes = themesFor(name);
    if (!themes.length) continue;
    candidates.push({
      id: crypto.createHash('sha256').update(`classics|${record.id}|${name}`).digest('hex').slice(0, 20),
      collection: 'classics', name, gender: /温|玉|嘉/.test(name) ? '中性' : '中性', work: displayWork(record), quote, extracted: name, themes,
      meaning: `取自${record.source}原文，意象初标为${themes.join('、')}；尚未通过人工语境与人名感审核。`, reviewStatus: 'auto_screened',
      provenance: { sourceName: 'gujilab/chinese-classical-corpus', sourceUrl: 'https://github.com/gujilab/chinese-classical-corpus', license: 'CC0-1.0', sourceRecordId: record.id, importedAt: new Date().toISOString() }
    });
  }
}
hash.update(fs.readFileSync(sourcePath));
const sourceSha256 = hash.digest('hex');
const output = candidates.map(record => ({ ...record, provenance: { ...record.provenance, sourceSha256 } }));
const outputPath = path.join(__dirname, '..', 'data', 'review-queue-classics.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log(`十三经与诸子：扫描 ${scanned} 个相关章节，生成 ${output.length} 条待审核候选。`);
