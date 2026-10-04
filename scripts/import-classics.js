/*
 * 通用古典文本初筛器。用法：
 *   node scripts/import-classics.js tang <json 路径>
 *   node scripts/import-classics.js song <json 路径>
 *
 * 输出是待核验队列，不会自动进入线上推荐库。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [collection, inputPath] = process.argv.slice(2);
const settings = {
  tang: { label: '唐诗', sourceUrl: 'https://github.com/chinese-poetry/chinese-poetry/tree/master/水墨唐诗' },
  song: { label: '宋词', sourceUrl: 'https://github.com/chinese-poetry/chinese-poetry/tree/master/宋词' }
}[collection];
if (!settings || !inputPath || !fs.existsSync(inputPath)) throw new Error('用法：node scripts/import-classics.js tang|song <json 路径>');

const sourceBytes = fs.readFileSync(inputPath);
const poems = JSON.parse(sourceBytes.toString('utf8'));
const sourceSha256 = crypto.createHash('sha256').update(sourceBytes).digest('hex');
const allowed = new Set(Array.from('安白采朝辰成初春从德方飞芬芳风高歌光华嘉简静景居兰乐良林灵明木宁佩清秋容柔如若山绍诗舒思松素天庭文温维婉望微薇希新馨星修玄雅言阳瑶叶宜怡音映悠游玉昭知芷子梓紫远云川海天月霁晴澄涵和怀锦景朗凌露南平千青然荣瑞书舒曦心昕雪寻言彦映悠予')); 
const blocked = new Set(['君子','淑女','好逑','不见','我心','之子','有女','美人','大夫','天子','万年','何以','彼此','于彼','于斯','有客','其然','其谁','不我','无衣','无罪','无言','无将','无已','曰归','未见','在水','一方','人间','一片','此次','谁与','不解','当门','重见','甚时','没个','并刀','愁痕','黄昏','清明','不语','空樽','消魂']);
const negative = /哀|悲|忧|怨|病|死|孤|伤|恨|惧|罪|祸|乱|兵|战|杀|丧|泣|泪|寡|劳|苦|贫|饥|仇|辱|恶|暴|愁|恼|恨|离|别|残|凄|泣/;
const themeMap = { 安:['平安'],宁:['平安'],乐:['喜乐'],嘉:['喜乐','品性'],清:['清澈'],明:['明朗','智慧'],昭:['明朗'],华:['明朗'],光:['明朗'],芳:['自然','温柔'],兰:['自然','温柔'],芷:['自然','温柔'],玉:['品性'],德:['品性'],雅:['品性'],静:['温柔'],柔:['温柔'],婉:['温柔'],思:['智慧'],知:['智慧'],文:['智慧'],修:['品性'],成:['坚定'],高:['志向'],远:['志向'],飞:['自在','志向'],游:['自在'],云:['自在','自然'],风:['自在','自然'],山:['自然'],林:['自然'],松:['自然'],星:['自然'],春:['喜乐','自然'],秋:['自然'],瑶:['品性'],琼:['品性'],音:['喜乐'],歌:['喜乐'],月:['明朗','自然'],海:['自在','自然'],涵:['温柔'],和:['平安','品性'],锦:['明朗'],书:['智慧'],晴:['明朗'],雪:['清澈'],心:['品性'] };
const themesFor = name => [...new Set(Array.from(name).flatMap(char => themeMap[char] || []))];
const genderFor = name => /婉|柔|静|兰|芷|芳|瑶|薇/.test(name) ? '女孩' : '中性';
const quoteOf = item => (item.paragraphs || item.content || []).join('');
const workOf = item => collection === 'tang'
  ? `${item.author || '佚名'}《${item.title || '佚题'}》`
  : `${item.author || '佚名'}《${item.rhythmic || item.title || '佚题'}》`;

const result = [];
const seen = new Set();
for (const item of poems) {
  for (const sentence of item.paragraphs || item.content || []) {
    if (negative.test(sentence)) continue;
    const plain = sentence.replace(/[^\u4e00-\u9fff]/g, '');
    for (let i = 0; i < plain.length - 1; i += 1) {
      const name = plain.slice(i, i + 2);
      if (seen.has(name) || blocked.has(name) || ![...name].every(char => allowed.has(char)) || name[0] === name[1]) continue;
      const themes = themesFor(name);
      if (!themes.length) continue;
      seen.add(name);
      const work = workOf(item);
      result.push({ id: crypto.createHash('sha256').update(`${collection}|${work}|${name}|${sentence}`).digest('hex').slice(0, 20), collection, name, gender: genderFor(name), work, quote: sentence, extracted: name, themes,
        meaning: `取自${settings.label}原句，意象偏向${themes.join('、')}；这是规则初筛结果，需人工复核语境与释义。`,
        reviewStatus: 'auto_screened',
        provenance: { sourceName: 'chinese-poetry/chinese-poetry', sourceUrl: settings.sourceUrl, license: 'MIT', sourceSha256, importedAt: new Date().toISOString() }
      });
    }
  }
}
const output = path.join(__dirname, '..', 'data', `review-queue-${collection}.json`);
fs.writeFileSync(output, JSON.stringify(result, null, 2) + '\n', 'utf8');
console.log(`已生成 ${result.length} 条${settings.label}待核验候选：${output}`);
