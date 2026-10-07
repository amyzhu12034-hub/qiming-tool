const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const nameDictionary = require('./data/character-dictionary.json');
const characterElements = require('./data/character-elements.json');
const phoneticRisks = require('./data/phonetic-risks.json');
const expandedCorpus = require('./data/expanded-corpus.json');
const approvedCorpus = require('./data/approved-corpus.json');
const modernInspirationCorpus = require('./data/modern-inspiration-corpus.json');
const { Solar } = require('lunar-javascript');
const { getJyutpingText } = require('to-jyutping');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const compoundSurnameStrokes = { 欧阳: [15, 17], 司马: [5, 10], 上官: [3, 8], 诸葛: [16, 15], 夏侯: [10, 9], 东方: [8, 4], 皇甫: [9, 14] };

// First-party curated corpus. Every returned name is linked to this verified source data.
const corpus = [
  { name: '清扬', gender: '女孩', work: '《诗经·郑风·野有蔓草》', quote: '有美一人，清扬婉兮。', extracted: '清扬', meaning: '清秀明朗，神采飞扬，温柔而有朝气。', themes: ['温柔', '明朗', '喜乐'] },
  { name: '维桢', gender: '中性', work: '《诗经·大雅·文王》', quote: '王国克生，维周之桢。', extracted: '维桢', meaning: '桢为栋梁，寓意坚实、可靠与担当。', themes: ['志向', '坚定', '品性'] },
  { name: '攸宁', gender: '中性', work: '《诗经·小雅·斯干》', quote: '君子攸宁。', extracted: '攸宁', meaning: '心有所安，愿一生安稳自在。', themes: ['平安', '喜乐'] },
  { name: '嘉树', gender: '男孩', work: '《楚辞·九章·橘颂》', quote: '后皇嘉树，橘徕服兮。', extracted: '嘉树', meaning: '嘉美如树，根深叶茂，生机盎然。', themes: ['自然', '志向', '品性'] },
  { name: '既明', gender: '男孩', work: '《诗经·大雅·烝民》', quote: '既明且哲，以保其身。', extracted: '既明', meaning: '明辨通达，也有清醒温和的内心。', themes: ['智慧', '品性'] },
  { name: '静姝', gender: '女孩', work: '《诗经·邶风·静女》', quote: '静女其姝，俟我于城隅。', extracted: '静姝', meaning: '娴静美好，温柔而自有光彩。', themes: ['温柔', '品性'] },
  { name: '其琛', gender: '中性', work: '《诗经·鲁颂·泮水》', quote: '憬彼淮夷，来献其琛。', extracted: '其琛', meaning: '琛为珍宝，寓意珍贵、端正。', themes: ['品性', '喜乐'] },
  { name: '燕绥', gender: '女孩', work: '《诗经·小雅·南有嘉鱼》', quote: '君子有酒，嘉宾式燕绥之。', extracted: '燕绥', meaning: '宴乐安舒，愿人生从容顺遂。', themes: ['平安', '喜乐'] },
  { name: '柔嘉', gender: '女孩', work: '《诗经·大雅·抑》', quote: '敬尔威仪，无不柔嘉。', extracted: '柔嘉', meaning: '温润善良，同时具备美好的品性。', themes: ['温柔', '品性'] },
  { name: '怀瑾', gender: '男孩', work: '《楚辞·九章·怀沙》', quote: '怀瑾握瑜兮，穷不知所示。', extracted: '怀瑾', meaning: '怀抱美玉，比喻高洁美好的品德。', themes: ['品性', '智慧'] },
  { name: '乐只', gender: '中性', work: '《诗经·周南·樛木》', quote: '乐只君子，福履绥之。', extracted: '乐只', meaning: '心存喜乐，也拥有安稳福气。', themes: ['平安', '喜乐'] },
  { name: '令仪', gender: '女孩', work: '《诗经·小雅·湛露》', quote: '岂弟君子，莫不令仪。', extracted: '令仪', meaning: '仪态端正，温和而有分寸。', themes: ['温柔', '品性'] },
  { name: '蓁', gender: '女孩', work: '《诗经·周南·桃夭》', quote: '桃之夭夭，其叶蓁蓁。', extracted: '蓁', meaning: '草木茂盛，寓意蓬勃成长。', themes: ['自然', '喜乐'] },
  { name: '乔', gender: '中性', work: '《诗经·周南·汉广》', quote: '南有乔木，不可休思。', extracted: '乔', meaning: '高大挺拔的树木，寓意从容向上。', themes: ['自然', '志向'] },
  { name: '宁', gender: '中性', work: '《诗经·小雅·斯干》', quote: '君子攸宁。', extracted: '宁', meaning: '安宁平和，愿一生自在。', themes: ['平安', '喜乐'] },
  { name: '昭', gender: '中性', work: '《诗经·大雅·文王》', quote: '文王在上，于昭于天。', extracted: '昭', meaning: '光明昭著，寓意清朗通达。', themes: ['明朗', '智慧'] },
  { name: '乐', gender: '中性', work: '《诗经·周南·樛木》', quote: '乐只君子，福履绥之。', extracted: '乐', meaning: '心存喜乐，福气安稳。', themes: ['平安', '喜乐'] },
  { name: '嘉', gender: '中性', work: '《诗经·小雅·鹿鸣》', quote: '我有嘉宾，鼓瑟吹笙。', extracted: '嘉', meaning: '嘉美、善美，寓意品性可贵。', themes: ['品性', '喜乐'] },
  { name: '云起', gender: '中性', work: '王维《终南别业》', quote: '行到水穷处，坐看云起时。', extracted: '云起', meaning: '从容自在，于平静处自有新境。', themes: ['自然', '自在'] },
  { name: '清泉', gender: '中性', work: '王维《山居秋暝》', quote: '明月松间照，清泉石上流。', extracted: '清泉', meaning: '澄澈纯净，心境明朗。', themes: ['自然', '清澈'] },
  { name: '春晖', gender: '中性', work: '孟郊《游子吟》', quote: '谁言寸草心，报得三春晖。', extracted: '春晖', meaning: '春日阳光，寓意温暖、感恩与希望。', themes: ['温暖', '喜乐'] },
  { name: '星垂', gender: '男孩', work: '杜甫《旅夜书怀》', quote: '星垂平野阔，月涌大江流。', extracted: '星垂', meaning: '星光低垂于阔野，心怀辽阔。', themes: ['自然', '志向'] },
  { name: '长风', gender: '男孩', work: '李白《行路难·其一》', quote: '长风破浪会有时，直挂云帆济沧海。', extracted: '长风', meaning: '长风破浪，寓意勇气与进取。', themes: ['勇敢', '志向'] },
  { name: '清欢', gender: '中性', work: '苏轼《浣溪沙·细雨斜风作晓寒》', quote: '人间有味是清欢。', extracted: '清欢', meaning: '清淡而有滋味的欢喜，平和自在。', themes: ['平安', '喜乐', '自在'] },
  { name: '兰舟', gender: '女孩', work: '李清照《一剪梅·红藕香残玉簟秋》', quote: '轻解罗裳，独上兰舟。', extracted: '兰舟', meaning: '兰舟轻行，雅致而从容。', themes: ['温柔', '自然'] },
  { name: '云中', gender: '中性', work: '李清照《一剪梅·红藕香残玉簟秋》', quote: '云中谁寄锦书来，雁字回时，月满西楼。', extracted: '云中', meaning: '云中寄书，寓意心怀远方与美好相念。', themes: ['自然', '自在'] },
  { name: '青山', gender: '中性', work: '辛弃疾《菩萨蛮·书江西造口壁》', quote: '青山遮不住，毕竟东流去。', extracted: '青山', meaning: '青山长在，寓意坚韧沉静。', themes: ['自然', '坚定'] }
];

corpus.push(...expandedCorpus.map(record => ({ ...record, extracted: record.extracted || record.name })));
corpus.push(...approvedCorpus.map(record => ({ ...record, extracted: record.extracted || record.name })));
corpus.push(...modernInspirationCorpus.map(record => ({ ...record, extracted: record.extracted || record.name })));
// 同名候选只保留最早进入正式库的一条，避免不同批次导入造成重复推荐。
const seenCorpusNames = new Set();
const uniqueCorpus = corpus.filter(record => {
  if (seenCorpusNames.has(record.name)) return false;
  seenCorpusNames.add(record.name);
  return true;
});
corpus.splice(0, corpus.length, ...uniqueCorpus);

const reviewDecisionFile = path.join(ROOT, 'data', 'review-decisions.json');
function readJsonArray(file) { try { const value = JSON.parse(fs.readFileSync(file, 'utf8')); return Array.isArray(value) ? value : []; } catch { return []; } }
function reviewQueueFiles() { return fs.readdirSync(path.join(ROOT, 'data')).filter(file => /^review-queue-[a-z]+\.json$/.test(file)).map(file => path.join(ROOT, 'data', file)); }
function reviewQueues() { return reviewQueueFiles().flatMap(readJsonArray); }
function reviewDecisions() { return readJsonArray(reviewDecisionFile); }
function writeReviewDecisions(decisions) { fs.writeFileSync(reviewDecisionFile, JSON.stringify(decisions, null, 2) + '\n', 'utf8'); }
function reviewChecklist(record) {
  return [
    { label: '可定位原文出处', ok: Boolean(record.work && record.quote) },
    { label: '有初步主题标签', ok: Array.isArray(record.themes) && record.themes.length > 0 },
    { label: '语境与人名可用性需人工判断', ok: false },
    { label: '可用搜索链接核查现实使用', ok: true }
  ];
}
function reviewSummary(items, decisions) {
  const statusById = new Map(decisions.map(item => [item.id, item.status]));
  const result = { 待审核: 0, 已通过: 0, 暂缓: 0, 已拒绝: 0 };
  items.forEach(item => { const status = statusById.get(item.id) || 'pending'; result[status === 'approved' ? '已通过' : status === 'hold' ? '暂缓' : status === 'rejected' ? '已拒绝' : '待审核'] += 1; });
  return result;
}
function publishReviewedCorpus() {
  const decisions = reviewDecisions();
  const byId = new Map(reviewQueues().map(item => [item.id, item]));
  const approved = decisions.filter(item => item.status === 'approved').map(decision => {
    const record = byId.get(decision.id); if (!record) return null;
    return { ...record, themes: decision.themes?.length ? decision.themes : record.themes, meaning: decision.meaning?.trim() || record.meaning, styleNotice: decision.styleNotice?.trim() || record.styleNotice?.trim() || '', reviewStatus: 'approved', reviewedAt: decision.updatedAt, reviewNote: decision.note?.trim() || '' };
  }).filter(Boolean);
  fs.writeFileSync(path.join(ROOT, 'data', 'approved-corpus.json'), JSON.stringify(approved, null, 2) + '\n', 'utf8');
  return approved;
}
function isLocalRequest(req) { return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress); }

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders }); res.end(JSON.stringify(data)); }
function redirect(res, target) { res.writeHead(302, { Location: target, 'Cache-Control': 'no-store' }); res.end(); }
function readBody(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 100000) reject(new Error('请求过大')); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('请求格式不是 JSON')); } }); }); }
function pinyin(name) { return ({ 清扬: 'qīng yáng', 维桢: 'wéi zhēn', 攸宁: 'yōu níng', 嘉树: 'jiā shù', 既明: 'jì míng', 静姝: 'jìng shū', 其琛: 'qí chēn', 燕绥: 'yàn suí', 柔嘉: 'róu jiā', 怀瑾: 'huái jǐn', 乐只: 'lè zhǐ', 令仪: 'lìng yí', 蓁: 'zhēn', 乔: 'qiáo', 宁: 'níng', 昭: 'zhāo', 乐: 'lè', 嘉: 'jiā', 云起: 'yún qǐ', 清泉: 'qīng quán', 春晖: 'chūn huī', 星垂: 'xīng chuí', 长风: 'cháng fēng', 清欢: 'qīng huān', 兰舟: 'lán zhōu', 云中: 'yún zhōng', 青山: 'qīng shān' })[name] || ''; }
function sourceCategory(input) { const record = typeof input === 'string' ? { work: input } : input; const work = record.work || ''; if (record.collection === 'modern') return '现代常用好字'; if (record.collection === 'nature') return '自然意象'; if (record.collection === 'family') return '家庭故事'; if (record.collection === 'contemporary') return '当代文化灵感'; if (record.collection === 'shijing' || work.includes('诗经')) return '诗经'; if (record.collection === 'chuci' || work.includes('楚辞')) return '楚辞'; if (record.collection === 'tang' || /王维|孟郊|杜甫|李白|李商隐|刘禹锡|白居易|杜牧|孟浩然|王勃|崔颢|张若虚/.test(work)) return '唐诗'; if (record.collection === 'song' || /苏轼|李清照|辛弃疾|陆游|晏殊|秦观|杨万里|范仲淹|欧阳修|王安石|林逋/.test(work)) return '宋词'; if (record.collection === 'yuanqu') return '元曲'; if (record.collection === 'wudai') return '五代词'; if (record.collection === 'nalan') return '纳兰词'; if (record.collection === 'prose') return '古文'; if (record.collection === 'philosophy') return '哲学与先秦古籍'; if (record.collection === 'wikisource' || work.includes('论语')) return '论语'; if (record.collection === 'confucian' || /大学|中庸|孟子/.test(work)) return '儒家经典'; if (record.collection === 'classics' || /尚书|礼记|周易|孝经|尔雅|春秋/.test(work)) return '十三经与诸子'; return '其他'; }
function numerologyElement(number) { return ({ 1: '木', 2: '木', 3: '火', 4: '火', 5: '土', 6: '土', 7: '金', 8: '金', 9: '水', 0: '水' })[number % 10]; }
function nameStrokeElements(name) { return Array.from(name).map(char => characterElements.characters[char] ? numerologyElement(characterElements.characters[char].strokes) : null).filter(Boolean); }
function strokeRange(value) { const numbers = String(value || '').match(/\d+/g)?.map(Number) || []; return numbers.length > 1 ? { min: Math.min(...numbers), max: Math.max(...numbers) } : numbers.length ? { min: numbers[0], max: numbers[0] } : null; }
function avoidedCharacters(value) { return Array.from(String(value || '').replace(/不要|避开|避免|不喜欢|读音|谐音|字/g, '')).filter(char => /[\u3400-\u9fff]/.test(char)); }
function parsedConstraints(input) { const strictAvoid = []; const collect = value => { for (const match of String(value || '').matchAll(/(?:不要|避开|避免|不喜欢)\s*[“”"'「]?([\u3400-\u9fff]{1,2})/g)) { const word = match[1]; if (!/太古|古风|现代|温柔|大气|网红|生僻|谐音|读音/.test(word)) strictAvoid.push(...Array.from(word)); } }; collect(input.avoid); collect(input.revision); if (input.avoid && !/(不要|避开|避免|不喜欢)/.test(input.avoid)) strictAvoid.push(...avoidedCharacters(input.avoid)); const text = `${input.avoid || ''} ${input.revision || ''}`; const ranking = []; if (/现代|简洁|清爽/.test(text)) ranking.push('更现代'); if (/温柔|柔和/.test(text)) ranking.push('更温柔'); if (/大气|开阔/.test(text)) ranking.push('更大气'); if (/古风/.test(text)) ranking.push('减少古典感'); const pending = /谐音|读音/.test(text) ? ['谐音 / 读音需结合所选方言复核'] : []; return { strictAvoid:[...new Set(strictAvoid)], ranking, pending }; }
function inferSiblingStyle(value) { const text = String(value || ''); const categories = []; const themes = []; if (/诗经|楚辞|唐诗|宋词|论语|古文|典/.test(text)) categories.push('诗经', '楚辞', '唐诗', '宋词', '论语', '古文'); if (/春|夏|秋|冬|山|海|江|河|云|星|月|风|花|林|川|雨|阳/.test(text)) categories.push('自然意象'); if (/安|宁|泰|佑|祺/.test(text)) themes.push('平安'); if (/乐|欢|怡|欣/.test(text)) themes.push('喜乐'); if (/知|思|书|明|慧/.test(text)) themes.push('智慧'); if (/勇|毅|恒|行/.test(text)) themes.push('勇敢', '坚定'); if (/柔|婉|清|雅/.test(text)) themes.push('温柔'); return { categories: [...new Set(categories)], themes: [...new Set(themes)] }; }
function analyzeName(surname, givenName, requested) {
  const surnameChars = Array.from(surname);
  const givenChars = Array.from(givenName);
  const surnameStrokes = characterElements.surnames?.[surname];
  const missing = givenChars.filter(char => !characterElements.characters[char]);
  if (surnameStrokes === undefined || missing.length) return { status: 'dictionary_incomplete', missing: [...(surnameStrokes === undefined ? [surname] : []), ...missing], note: '该姓名的笔画数据尚未收录，暂不计算传统数理。' };
  const givenStrokes = givenChars.map(char => characterElements.characters[char].strokes);
  const uncommonCharacters = givenChars.filter(char => nameDictionary.characters[char]?.level === 'uncommon');
  const strokes = { method: characterElements.method, surname: surnameStrokes, given: givenStrokes, total: surnameStrokes + givenStrokes.reduce((sum, value) => sum + value, 0), uncommonCharacters };
  if (!requested.includes('五格')) return { status: 'not_requested', strokes };
  const surnameParts = surnameChars.length === 1 ? [surnameStrokes] : compoundSurnameStrokes[surname];
  if (!surnameParts) return { status: 'compound_surname_dictionary_required', strokes, note: '该复姓的拆字笔画尚未收录，当前不返回三才结论。' };
  const tian = surnameChars.length === 1 ? surnameStrokes + 1 : surnameStrokes;
  const ren = surnameParts[surnameParts.length - 1] + givenStrokes[0];
  const di = givenStrokes.length === 1 ? givenStrokes[0] + 1 : givenStrokes.reduce((sum, value) => sum + value, 0);
  const wai = surnameChars.length === 1 ? givenStrokes[givenStrokes.length - 1] + 1 : (givenStrokes.length === 1 ? surnameParts[0] + 1 : surnameParts[0] + givenStrokes[givenStrokes.length - 1]);
  const total = surnameStrokes + givenStrokes.reduce((sum, value) => sum + value, 0);
  const grids = { 天格: tian, 人格: ren, 地格: di, 外格: wai, 总格: total };
  return { status: 'calculated_reference', strokes, grids: Object.fromEntries(Object.entries(grids).map(([label, value]) => [label, { value, element: numerologyElement(value) }])), note: '按康熙笔画与常见五格公式计算，仅供传统命名参考，不作吉凶断言。' };
}
function calculateBazi(input) {
  if (!input.conditions?.includes('八字')) return { status: 'not_requested' };
  if (!input.birthDate || !input.birthTime) return { status: 'needs_input', note: '需补全出生日期和时间。' };
  const [year, month, day] = input.birthDate.split('-').map(Number);
  const [hour, minute] = input.birthTime.split(':').map(Number);
  if (![year, month, day, hour, minute].every(Number.isInteger)) return { status: 'invalid_input', note: '出生日期或时间格式不正确。' };
  try {
    const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
    const eightChar = lunar.getEightChar();
    const pillars = { 年柱: eightChar.getYear(), 月柱: eightChar.getMonth(), 日柱: eightChar.getDay(), 时柱: eightChar.getTime() };
    const stems = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
    const branches = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
    const elements = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    Object.values(pillars).join('').split('').forEach(char => { const element = stems[char] || branches[char]; if (element) elements[element] += 1; });
    return { status: 'calculated_reference', pillars, visibleElementCounts: elements, location: input.birthLocation || '未填写（按当地标准时间）', note: '按填写的标准时间排盘，未作真太阳时修正；五行仅统计四柱天干地支的显性元素，供传统文化参考。' };
  } catch {
    return { status: 'calculation_failed', note: '该日期无法完成排盘，请检查输入。' };
  }
}
function weakerBaziElements(counts) {
  const values = Object.values(counts);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return minimum === maximum ? [] : Object.entries(counts).filter(([, count]) => count === minimum).map(([element]) => element);
}
function checkDialect(fullName, input) {
  if (!input.conditions?.includes('方言')) return { status: 'not_requested' };
  const region = input.dialect || '普通话';
  const profile = phoneticRisks[region];
  if (region === '粤语') {
    const reading = getJyutpingText(fullName).replace(/\s+/g, ' ').trim();
    const matches = (profile?.rules || []).filter(rule => rule.jyutping && reading.includes(rule.jyutping));
    return { status: 'partial_lexicon_check', region, reading, coverage: profile?.coverage, matches, note: matches.length ? '发现需复核的粤语读音风险。' : '已完成粤语拼音与首批风险词条初筛；未命中不等于没有谐音风险。' };
  }
  if (!profile || !profile.rules.length) return { status: 'dictionary_not_configured', region, note: profile?.coverage || '该方言词库尚未配置。' };
  const matches = profile.rules.filter(rule => fullName.includes(rule.match)); return { status: 'partial_lexicon_check', region, coverage: profile.coverage, matches, note: matches.length ? '发现需复核的连读风险。' : '未匹配当前内置风险词条；这不是完整方言安全保证。' };
}
function conditions(input, understood = parsedConstraints(input)) { const tags = []; if (input.conditions?.includes('八字')) tags.push('出生信息 / 八字参考'); if (input.conditions?.includes('胎次')) { const style = inferSiblingStyle(input.siblingName); tags.push(input.siblingName ? `${input.birthOrder || '二胎'} · 自动延续一胎：${[...style.categories, ...style.themes].join('、') || '未识别到明确风格'}` : `${input.birthOrder || '二胎'} · 可填写一胎名字以自动延续风格`); } if (input.conditions?.includes('出处')) tags.push(input.source ? `偏爱：${input.source}` : '出处不限'); if (input.conditions?.includes('期望')) tags.push(input.wish ? `期望：${input.wish}` : '美好品性'); if (input.conditions?.includes('辈分') && input.generationChar) tags.push(`辈分字「${input.generationChar}」`); if (input.conditions?.includes('笔画') && input.strokes) tags.push(`全名笔画：${input.strokes}`); if (understood.strictAvoid.length) tags.push(`严格避用：${understood.strictAvoid.join('、')}`); if (understood.ranking.length) tags.push(`偏好排序：${understood.ranking.join('、')}`); if (understood.pending.length) tags.push(`待复核：${understood.pending.join('；')}`); return tags.length ? tags : ['有明确出处', '简洁好读']; }
function traditionalChecks(input) {
  const requested = input.conditions || [];
  return {
    bazi: calculateBazi(input),
    wuxingAndWuge: requested.includes('五格') ? { status: 'calculated_reference', note: '计算结果见每个候选名字。' } : { status: 'not_requested' },
    dialect: requested.includes('方言') ? { status: input.dialect === '粤语' ? 'partial_lexicon_check' : 'dictionary_not_configured', region: input.dialect || '普通话', note: input.dialect === '粤语' ? '已接入粤语读音及首批风险词条。' : '该方言待接入读音转换与风险词库。' } : { status: 'not_requested' }
  };
}
function buildNames(input) {
  const wishes = `${input.wish || ''} ${input.revision || ''}`;
  const understood = parsedConstraints(input);
  const excluded = understood.strictAvoid;
  const generationChar = input.conditions?.includes('辈分') ? Array.from(input.generationChar || '')[0] : '';
  const targetLength = input.givenNameLength || 'two';
  if (generationChar && targetLength === 'one') throw new Error('已指定辈分字时，本版仅支持双字名或不限字数。');
  const bazi = calculateBazi(input);
  const baziTargets = bazi.status === 'calculated_reference' ? weakerBaziElements(bazi.visibleElementCounts) : [];
  const sourceText = input.source || '';
  const requestedSources = [
    ['诗经', '诗经'], ['楚辞', '楚辞'], ['唐诗', '唐诗'], ['宋词', '宋词'], ['论语', '论语'], ['儒家经典', '儒家'], ['十三经与诸子', '周易'], ['哲学与先秦古籍', '哲学'], ['元曲', '元曲'], ['五代词', '五代'], ['纳兰词', '纳兰'], ['古文', '古文'],
    ['现代常用好字', '现代|简洁|清爽'], ['自然意象', '自然|山|海|星空|森林'], ['家庭故事', '家庭|相识|初见|纪念|家乡|陪伴'], ['当代文化灵感', '电影|游戏|音乐|动漫|科幻|哈利|艺术']
  ].filter(([, cues]) => new RegExp(cues).test(sourceText)).map(([category]) => category);
  const requestedStrokeRange = input.conditions?.includes('笔画') ? strokeRange(input.strokes) : null;
  if (requestedStrokeRange && characterElements.surnames?.[input.surname] === undefined) throw new Error(`“${input.surname}”尚未收录笔画，无法按全名笔画范围筛选。`);
  const sibling = input.conditions?.includes('胎次') && input.siblingName ? inferSiblingStyle(input.siblingName) : { categories: [], themes: [] };
  const position = input.generationPosition || 'either';
  const chosen = corpus.map((record, index) => {
    const recordChars = Array.from(record.name);
    const sourceChar = position === 'first' ? (recordChars[1] || recordChars[0]) : recordChars[0];
    const givenName = generationChar ? (position === 'second' ? `${sourceChar}${generationChar}` : `${generationChar}${sourceChar}`) : record.name;
    const strokes = analyzeName(input.surname, givenName, []).strokes;
    if (requestedStrokeRange && (!strokes || strokes.total < requestedStrokeRange.min || strokes.total > requestedStrokeRange.max)) return null;
    let score = -index / 10000;
    if (input.gender === '中性' || record.gender === '中性' || record.gender === input.gender) score += 2;
    if (record.themes.some(theme => wishes.includes(theme))) score += 2;
    if (requestedSources.includes(sourceCategory(record))) score += 2;
    if (sibling.categories.includes(sourceCategory(record))) score += 3;
    if (sibling.themes.some(theme => record.themes.includes(theme))) score += 2;
    if (understood.ranking.includes('更现代') && sourceCategory(record) === '现代常用好字') score += 3;
    if (understood.ranking.includes('更温柔') && record.themes.includes('温柔')) score += 2;
    if (understood.ranking.includes('更大气') && record.themes.includes('志向')) score += 2;
    if (understood.ranking.includes('减少古典感') && ['诗经', '楚辞', '唐诗', '宋词', '论语', '古文'].includes(sourceCategory(record))) score -= 2;
    if ((input.source || '').includes('古典') && sourceCategory(record) !== '其他') score += 1;
    const baziMatches = nameStrokeElements(givenName).filter(element => baziTargets.includes(element));
    if (baziMatches.length) score += baziMatches.length * 4;
    if (excluded.some(char => givenName.includes(char))) return null;
    return { ...record, sourceChar, givenName, score };
  }).filter(Boolean).sort((a, b) => b.score - a.score);
  const expectedLength = targetLength === 'one' ? 1 : targetLength === 'two' ? 2 : 0;
  const lengthMatched = (expectedLength ? chosen.filter(record => Array.from(record.givenName).length === expectedLength) : chosen).filter((record, index, list) => list.findIndex(other => other.givenName === record.givenName) === index);
  const candidatePool = lengthMatched;
  if (candidatePool.length < 5) throw new Error('条件组合后不足 5 个候选，请放宽笔画范围、避用字或字数要求。');
  // 每次“再生成”轮换候选池，避免同一筛选条件反复返回相同的五个名字。
  const round = Math.max(0, Math.floor(Number(input.generationRound) || 0));
  const offset = (round * 5) % candidatePool.length;
  const selected = [...candidatePool.slice(offset), ...candidatePool.slice(0, offset)].slice(0, 5);
  const tags = conditions(input, understood);
  return selected.map(record => {
    const sourceNote = generationChar ? `家族辈分字「${generationChar}」；典籍取字「${record.sourceChar}」` : `取名自「${record.extracted}」`;
    const matchedElements = nameStrokeElements(record.givenName).filter(element => baziTargets.includes(element));
    const baziNaming = bazi.status === 'calculated_reference' ? { status: 'partial_element_matching', pillars: bazi.pillars, targetElements: baziTargets, matchedNameElements: matchedElements, note: characterElements.method } : { status: 'not_requested' };
    const fullName = `${input.surname}${record.givenName}`;
    return { fullName, givenName: record.givenName, pinyin: generationChar ? '' : (record.pinyin || pinyin(record.name)), meaning: record.meaning, styleNotice: record.styleNotice || '', source: { label: record.sourceLabel || '原文出处', work: record.work, original: record.quote, extractedCharacters: generationChar ? record.sourceChar : record.extracted, note: sourceNote, verified: true }, nameAnalysis: analyzeName(input.surname, record.givenName, input.conditions || []), baziNaming, dialectCheck: checkDialect(fullName, input), rulesMatched: tags, duplicateName: { status: 'source_not_connected', count: null, source: '需接入经授权的全国同名数据源' }, publicFigures: { status: 'source_not_connected', entries: [], source: '历史人物可接 CBDB；当代人物数据源待接入' } };
  });
}
function serveStatic(req, res, pathname) { const requested = pathname === '/' ? '/index.html' : pathname; const file = path.normalize(path.join(ROOT, requested)); if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return false; const type = requested.endsWith('.html') ? 'text/html; charset=utf-8' : requested.endsWith('.css') ? 'text/css; charset=utf-8' : requested.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'application/octet-stream'; res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(file).pipe(res); return true; }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, corsHeaders); return res.end(); }
    if (url.pathname.startsWith('/review') || url.pathname.startsWith('/api/review')) {
      if (!isLocalRequest(req)) return json(res, 403, { error: '语料审核台仅允许在本机访问。' });
      if (req.method === 'GET' && url.pathname === '/api/review/queue') {
        const source = url.searchParams.get('source') || 'all';
        const status = url.searchParams.get('status') || 'pending';
        const decisions = reviewDecisions();
        const decisionById = new Map(decisions.map(item => [item.id, item]));
        const records = reviewQueues()
          .filter(item => source === 'all' || item.collection === source)
          .map(item => ({ ...item, decision: decisionById.get(item.id), checklist: reviewChecklist(item) }));
        const filtered = records.filter(item => status === 'all' || (item.decision?.status || 'pending') === status);
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 30));
        const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
        const items = filtered.slice(offset, offset + limit);
        return json(res, 200, { items, total: filtered.length, offset, limit, nextOffset: offset + items.length < filtered.length ? offset + items.length : null, summary: reviewSummary(records, decisions) });
      }
      if (req.method === 'POST' && url.pathname === '/api/review/decision') {
        const input = await readBody(req);
        if (!input.id || !['approved', 'hold', 'rejected'].includes(input.status)) return json(res, 400, { error: '审核状态不正确。' });
        if (!reviewQueues().some(item => item.id === input.id)) return json(res, 404, { error: '未找到这条候选记录，请刷新审核台。' });
        const decisions = reviewDecisions();
        const index = decisions.findIndex(item => item.id === input.id);
        const decision = { id: input.id, status: input.status, meaning: String(input.meaning || '').slice(0, 300), note: String(input.note || '').slice(0, 300), updatedAt: new Date().toISOString() };
        if (index >= 0) decisions[index] = decision; else decisions.push(decision);
        writeReviewDecisions(decisions);
        return json(res, 200, { ok: true, decision });
      }
      if (req.method === 'POST' && url.pathname === '/api/review/publish') return json(res, 200, { ok: true, count: publishReviewedCorpus().length });
      if (req.method === 'GET' && url.pathname === '/review.html') return serveStatic(req, res, '/review.html') || json(res, 404, { error: '审核台文件不存在。' });
      return json(res, 404, { error: '未找到审核资源。' });
    }
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, corpusRecords: corpus.length });
    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      const categories = ['诗经', '楚辞', '唐诗', '宋词', '论语', '儒家经典', '十三经与诸子', '哲学与先秦古籍', '元曲', '五代词', '纳兰词', '古文', '现代常用好字', '自然意象', '家庭故事', '当代文化灵感'].map(category => ({ category, records: corpus.filter(record => sourceCategory(record) === category).length }));
      return json(res, 200, { categories, policies: { uncommonCharacters: '默认不推荐生僻字；最终以字库分级校验为准', traditionalNaming: '五行、三才五格、八字均为用户主动选择的传统文化参考' } });
    }
    if (req.method === 'GET' && url.pathname === '/api/lookups/same-name') { const target = 'https://ywtb.mps.gov.cn/newhome/portal/cmcx'; return url.searchParams.get('redirect') === '1' ? redirect(res, target) : json(res, 200, { status: 'official_redirect', label: '前往公安部查询同名人数页面（需自行填写姓名）', url: target }); }
    if (req.method === 'GET' && url.pathname === '/api/lookups/public-figures') {
      const name = url.searchParams.get('name') || '';
      const target = `https://www.baidu.com/s?wd=${encodeURIComponent(`${name} 公众人物`)}`;
      return url.searchParams.get('redirect') === '1' ? redirect(res, target) : json(res, 200, { status: 'search_redirect', label: '百度搜索同名公众人物', url: target });
    }
    if (req.method === 'POST' && (url.pathname === '/api/names/generate' || url.pathname === '/api/names/refine')) { const input = await readBody(req); if (!input.surname || typeof input.surname !== 'string') return json(res, 400, { error: '请填写姓氏' }); return json(res, 200, { generatedAt: new Date().toISOString(), conditions: conditions(input), traditionalChecks: traditionalChecks(input), names: buildNames(input) }); }
    if (serveStatic(req, res, url.pathname)) return;
    json(res, 404, { error: '未找到资源' });
  } catch (error) { json(res, 400, { error: error.message || '请求处理失败' }); }
});
server.listen(PORT, () => console.log(`知名后端已启动：http://localhost:${PORT}`));
