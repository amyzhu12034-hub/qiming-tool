/*
 * 导入维基文库《论语》原文中的人工精选候选。
 * 用法：node scripts/import-wikisource-lunyu.js <wikisource-lunyu.json 路径>
 * 原文来自中文维基文库，记录 CC BY-SA / GFDL 来源信息；仅导入固定短语，不做随机切词。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const inputPath = process.argv[2];
if (!inputPath || !fs.existsSync(inputPath)) throw new Error('请提供 wikisource-lunyu.json 路径。');
const raw = fs.readFileSync(inputPath);
const pages = JSON.parse(raw.toString('utf8'));
const sourceSha256 = crypto.createHash('sha256').update(raw).digest('hex');
const selections = [
  ['志学','志于學','立志向学，重视终身成长。',['志向','智慧']],
  ['知新','溫故而知新','温习旧知而获得新理解，寓意求知与通达。',['智慧','志向']],
  ['安仁','仁者安仁','安于仁德，寓意内心笃定、待人仁厚。',['平安','品性']],
  ['忠恕','忠恕而已矣','尽己之心并体察他人，寓意真诚宽厚。',['品性','智慧']],
  ['敏行','敏於行','言语审慎、行动敏捷，寓意务实有执行力。',['品性','坚定']],
  ['德邻','德不孤，必有鄰','品德不孤，自会有志同道合者相伴。',['品性','喜乐']],
  ['志道','志於道','心存正道、志向明确。',['志向','品性']],
  ['弘毅','士不可以不弘','胸怀宽广、意志坚毅。',['志向','坚定']],
  ['笃信','篤信好學','笃实守信、勤于学习。',['品性','智慧']],
  ['博学','博學於文','广泛学习而有根基。',['智慧','志向']],
  ['近思','切問而近思','勤于发问，善于思考眼前可实践之事。',['智慧','品性']]
];
const findContext = traditional => {
  const page = pages.find(item => item.content.includes(traditional));
  if (!page) return null;
  const plain = page.content.replace(/<ref[^>]*>[\s\S]*?<\/ref>|\{\{[^{}]*\}\}|<[^>]+>|'''|\[\[|\]\]/g, '').replace(/\n+/g, '');
  const quote = [...plain.matchAll(/「([^「」]+)」/g)].find(match => match[1].includes(traditional))?.[1];
  if (!quote) throw new Error(`未找到「${traditional}」所在的完整引文。`);
  return { work: `《论语·${page.title.split('/')[1]}》`, quote };
};
const candidates = selections.map(([name, traditional, meaning, themes]) => {
  const context = findContext(traditional);
  if (!context) throw new Error(`未在《论语》原文中找到「${traditional}」。`);
  return { id: crypto.createHash('sha256').update(`wikisource|${name}|${context.work}|${context.quote}`).digest('hex').slice(0, 20), collection:'wikisource', name, gender:'中性', ...context, extracted:name, meaning, themes, reviewStatus:'editorial_selected', provenance:{ sourceName:'中文维基文库《论语》', sourceUrl:'https://zh.wikisource.org/wiki/論語', license:'CC BY-SA 4.0 / GFDL（以页面标注为准）', sourceSha256, importedAt:new Date().toISOString() } };
});
const output = path.join(__dirname, '..', 'data', 'review-queue-wikisource.json');
fs.writeFileSync(output, JSON.stringify(candidates, null, 2) + '\n', 'utf8');
console.log(`已生成 ${candidates.length} 条《论语》待核验候选：${output}`);
