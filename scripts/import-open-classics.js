/*
 * 将本地缓存的 MIT 许可 chinese-poetry JSON 统一转换为待审核队列。
 * 用法：node scripts/import-open-classics.js <all|confucian|chuci|yuanqu|wudai|nalan|prose> <数据目录>
 * 只生成 review-queue-*.json，绝不直接写入正式推荐库。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [requested = 'all', sourceDir] = process.argv.slice(2);
if (!sourceDir || !fs.existsSync(sourceDir)) throw new Error('请提供本地数据目录。');

const sets = {
  confucian: { label: '儒家经典', files: ['daxue.json', 'mengzi.json', 'zhongyong.json'] },
  chuci: { label: '楚辞', files: ['chuci.json'] },
  yuanqu: { label: '元曲', files: ['yuanqu.json'] },
  wudai: { label: '五代词', files: ['nantang.json', ...Array.from({ length: 9 }, (_, index) => `huajianji-${index + 1}-juan.json`), 'huajianji-x-juan.json'] },
  nalan: { label: '纳兰词', files: ['nalan.json'] },
  prose: { label: '古文与小品', files: ['guwenguanzhi.json', 'qianjiashi.json', 'youmengying.json'] }
};
const selected = requested === 'all' ? Object.keys(sets) : [requested];
if (selected.some(key => !sets[key])) throw new Error('未知来源类别。');

const allowed = new Set(Array.from('安白采朝辰成初春从德方飞芬芳风高歌光华嘉简静景居兰乐良林灵明木宁佩清秋容柔如若山绍诗舒思松素天庭文温维婉望微薇希新馨星修玄雅言阳瑶叶宜怡音映悠游玉昭知芷子梓紫远云川海天月霁晴澄涵和怀锦景朗凌露南平千青然荣瑞书曦心昕雪寻彦予仪清嘉若致中庸善义仁礼信弘毅志学敏行笃近远怀君宝灵均正则修能木兰蕙芷琼佩')); 
const functionChars = new Set(Array.from('之其于以而乃兮曰矣乎者也焉与为所自我你他她彼此何若且但又或乃则而非无未不')); 
const blocked = new Set(['君子','小人','天子','大夫','美人','万年','何以','不见','我心','之子','有女','有客','彼此','于彼','于斯','人间','一方','清明','青春','温柔','风景','歌风','然心','秋雪','华新']);
const negative = /哀|悲|忧|怨|病|死|孤|伤|恨|惧|罪|祸|乱|兵|战|杀|丧|泣|泪|寡|劳|苦|贫|饥|仇|辱|恶|暴|愁|恼|离|别|残|凄|冢|寂寥/;
const themeMap = { 安:['平安'],宁:['平安'],乐:['喜乐'],嘉:['喜乐','品性'],清:['清澈'],明:['明朗','智慧'],昭:['明朗'],华:['明朗'],光:['明朗'],芳:['自然','温柔'],兰:['自然','温柔'],芷:['自然','温柔'],玉:['品性'],德:['品性'],雅:['品性'],静:['温柔'],柔:['温柔'],婉:['温柔'],思:['智慧'],知:['智慧'],文:['智慧'],修:['品性'],成:['坚定'],高:['志向'],远:['志向'],飞:['自在','志向'],游:['自在'],云:['自在','自然'],风:['自在','自然'],山:['自然'],林:['自然'],松:['自然'],星:['自然'],春:['喜乐','自然'],秋:['自然'],瑶:['品性'],琼:['品性'],音:['喜乐'],月:['明朗','自然'],海:['自在','自然'],涵:['温柔'],和:['平安','品性'],锦:['明朗'],书:['智慧'],晴:['明朗'],雪:['清澈'],心:['品性'],仁:['品性'],义:['品性'],礼:['品性'],信:['品性'],志:['志向'],弘:['志向'],毅:['坚定'],灵:['明朗'],均:['平安'],致:['智慧'],中:['平安'],善:['品性'] };
// 只有在原文中作为完整、可解释的命名短语出现时才进入审核台；绝不再用滑动截字。
const curatedPhrases = {
  confucian: ['明德','至善','知止','修身','正心','诚意','致知','格物','仁义','中和','时中','弘毅','笃志','博学','近思','好问','诚明','大知','嘉善'],
  chuci: ['正则','灵均','修能','江离','秋兰','木兰','蕙茝','蕙兰','琼芳','芳华','嘉月','嘉志','飞龙','云旗','玉英','芳洲','信芳','昭质','桂华','兰佩','怀瑾'],
  yuanqu: ['飞琼','玉兰','春和','景明','清风','明月','芳草','兰心','云锦','玉树','嘉庆','清秋'],
  wudai: ['飞琼','玉兰','兰心','和风','明月','清风','芳草','灵和','云锦','玉树','春华','清秋','兰舟'],
  nalan: ['飞琼','玉兰','明月','清风','兰舟','云水','清秋','春华','芳草','玉树'],
  prose: ['春和','景明','风雅','玉兰','高明','明德','至善','修身','正心','致知','清嘉','兰心','清风','明月','嘉树']
};

function toSentences(value) { return String(value || '').split(/[。！？；]/).map(text => text.trim()).filter(text => text.length >= 4); }
function textEntries(value, inherited = {}) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(item => textEntries(item, inherited));
  if (typeof value === 'string') return toSentences(value).map(text => ({ ...inherited, text }));
  if (typeof value !== 'object') return [];
  const context = { title: value.chapter || value.title || value.rhythmic || inherited.title || '佚题', author: value.author || inherited.author || '佚名', source: value.source || inherited.source || '' };
  const direct = ['paragraphs', 'para', 'content'].flatMap(key => Array.isArray(value[key]) ? value[key].flatMap(item => typeof item === 'string' ? toSentences(item).map(text => ({ ...context, text })) : textEntries(item, context)) : typeof value[key] === 'string' ? toSentences(value[key]).map(text => ({ ...context, text })) : []);
  const nested = Object.entries(value).flatMap(([key, item]) => ['paragraphs', 'para', 'content', 'comment', 'notes', 'abstract'].includes(key) ? [] : (Array.isArray(item) || (item && typeof item === 'object')) ? textEntries(item, context) : []);
  return [...direct, ...nested];
}
function themesFor(name) { return [...new Set(Array.from(name).flatMap(char => themeMap[char] || []))]; }
function displayWork(entry) { const source = entry.source ? `·${entry.source}` : ''; return `${entry.author || '佚名'}《${entry.title || '佚题'}》${source}`; }
function candidateScore(name, themes) { return themes.length * 5 + (/[瑶琼兰芷嘉宁安昭雅修弘毅志灵均]/.test(name) ? 4 : 0) - (/[春秋风云月雪]/.test(name) ? 1 : 0); }

for (const key of selected) {
  const settings = sets[key];
  const sourcePaths = settings.files.map(file => path.join(sourceDir, file)).filter(fs.existsSync);
  if (!sourcePaths.length) { console.warn(`${settings.label}：未找到本地文件，跳过。`); continue; }
  const records = sourcePaths.flatMap(file => textEntries(JSON.parse(fs.readFileSync(file, 'utf8'))));
  const digest = crypto.createHash('sha256');
  sourcePaths.forEach(file => digest.update(fs.readFileSync(file)));
  const sourceSha256 = digest.digest('hex');
  const candidates = []; const seen = new Set();
  for (const entry of records) {
    if (negative.test(entry.text)) continue;
    for (const name of curatedPhrases[key]) {
      const themes = themesFor(name);
      if (!entry.text.includes(name) || seen.has(name) || blocked.has(name) || functionChars.has(name[0]) || functionChars.has(name[1]) || !Array.from(name).every(char => allowed.has(char)) || !themes.length) continue;
      seen.add(name);
      candidates.push({
        id: crypto.createHash('sha256').update(`${key}|${displayWork(entry)}|${name}|${entry.text}`).digest('hex').slice(0, 20),
        collection: key, name, gender: /婉|柔|静|兰|芷|芳|瑶|薇/.test(name) ? '女孩' : '中性', work: displayWork(entry), quote: entry.text, extracted: name, themes,
        meaning: `取自${settings.label}原句，意象初标为${themes.join('、')}；尚未通过人工语境与人名感审核。`, reviewStatus: 'auto_screened', score: candidateScore(name, themes),
        provenance: { sourceName: 'chinese-poetry/chinese-poetry', sourceUrl: 'https://github.com/chinese-poetry/chinese-poetry', license: 'MIT', sourceSha256, importedAt: new Date().toISOString() }
      });
    }
  }
  const output = candidates.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh')).slice(0, 300).map(({ score, ...record }) => record);
  fs.writeFileSync(path.join(__dirname, '..', 'data', `review-queue-${key}.json`), JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`${settings.label}：扫描 ${records.length} 个原文片段，生成 ${output.length} 条待审核候选。`);
}
