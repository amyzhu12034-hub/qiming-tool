/*
 * 将 MIT 许可的 chinese-poetry《诗经》JSON 转成“待核验候选池”。
 * 用法：node scripts/import-shijing.js <shijing.json 路径>
 *
 * 这个脚本不会把自动抽取结果直接当作“已核验推荐名”。每条记录都带有
 * 原文、篇章、来源、语义标签和 reviewStatus，供后续人工核验后发布。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const inputPath = process.argv[2];
if (!inputPath || !fs.existsSync(inputPath)) {
  throw new Error('请提供已下载的 shijing.json 路径。');
}

const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const sourceUrl = 'https://github.com/chinese-poetry/chinese-poetry/tree/master/诗经';
const sourceSha256 = crypto.createHash('sha256').update(fs.readFileSync(inputPath)).digest('hex');

// 仅抽取常见、适合起名语境的字；这不是“生僻字判断”的最终依据。
const allowed = new Set(Array.from('安白采朝辰成初春从德方飞芬芳风高歌光华嘉简静景居兰乐良林灵明木宁佩清秋容柔如若山绍诗舒思松素天庭文温维婉望微薇希新馨星修玄雅言阳瑶叶宜怡音映悠游玉昭知芷子梓紫')); 
const blocked = new Set([
  '君子','淑女','好逑','寤寐','辗转','反侧','夭夭','其叶','左右','钟鼓','维叶','黄鸟','灌木','无斁','服之','归宁','父母','兄弟','中心','不见','忧心','不乐','我心','之子','有女','美人','硕人','大夫','公侯','天子','万年','胡为','何以','彼此','于彼','于斯','有客','维何','其然','维其','其谁','不我','无衣','无罪','无言','无将','无已','曰归','未见','在水','一方'
]);
const positiveThemes = {
  安: ['平安'], 宁: ['平安'], 乐: ['喜乐'], 嘉: ['喜乐','品性'], 清: ['清澈'], 明: ['明朗','智慧'], 昭: ['明朗'], 华: ['明朗'], 光: ['明朗'], 芳: ['自然','温柔'], 兰: ['自然','温柔'], 芷: ['自然','温柔'], 玉: ['品性'], 德: ['品性'], 雅: ['品性'], 静: ['温柔'], 柔: ['温柔'], 婉: ['温柔'], 思: ['智慧'], 知: ['智慧'], 文: ['智慧'], 修: ['品性'], 成: ['坚定'], 高: ['志向'], 远: ['志向'], 飞: ['自在','志向'], 游: ['自在'], 云: ['自在','自然'], 风: ['自在','自然'], 山: ['自然'], 林: ['自然'], 松: ['自然'], 星: ['自然'], 春: ['喜乐','自然'], 秋: ['自然'], 瑶: ['品性'], 琼: ['品性'], 音: ['喜乐'], 歌: ['喜乐']
};
const clearlyNegative = /哀|悲|忧|怨|病|死|孤|伤|恨|惧|惮|罪|祸|乱|兵|战|杀|丧|泣|泪|寡|劳|苦|贫|饥|饥|饥|仇|辱|恶|暴/;

function themesFor(name) {
  return [...new Set(Array.from(name).flatMap(char => positiveThemes[char] || []))];
}

function genderFor(name) {
  return /婉|柔|静|兰|芷|芳|瑶|薇/.test(name) ? '女孩' : '中性';
}

function sourceLabel(item) {
  return `《诗经·${item.chapter}·${item.section}·${item.title}》`;
}

const candidates = [];
const seen = new Set();
for (const item of source) {
  for (const sentence of item.content || []) {
    const plain = sentence.replace(/[^\u4e00-\u9fff]/g, '');
    for (let i = 0; i < plain.length - 1; i += 1) {
      const name = plain.slice(i, i + 2);
      if (seen.has(name) || blocked.has(name) || clearlyNegative.test(sentence)) continue;
      if (![...name].every(char => allowed.has(char))) continue;
      const themes = themesFor(name);
      if (!themes.length) continue;
      seen.add(name);
      candidates.push({
        id: crypto.createHash('sha256').update(`shijing|${sourceLabel(item)}|${name}|${sentence}`).digest('hex').slice(0, 20),
        collection: 'shijing',
        name,
        gender: genderFor(name),
        work: sourceLabel(item),
        quote: sentence,
        extracted: name,
        themes,
        meaning: `取自《诗经》原句，意象偏向${themes.join('、')}；该释义由规则初标，需人工复核后方可作为正式推荐。`,
        reviewStatus: 'auto_screened',
        provenance: { sourceName: 'chinese-poetry/chinese-poetry', sourceUrl, license: 'MIT', sourceSha256, importedAt: new Date().toISOString() }
      });
    }
  }
}

const output = path.join(__dirname, '..', 'data', 'review-queue-shijing.json');
fs.writeFileSync(output, JSON.stringify(candidates, null, 2) + '\n', 'utf8');
console.log(`已生成 ${candidates.length} 条《诗经》待核验候选：${output}`);
