const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const nameDictionary = require('./data/character-dictionary.json');
const phoneticRisks = require('./data/phonetic-risks.json');
const { Solar } = require('lunar-javascript');

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

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...corsHeaders }); res.end(JSON.stringify(data)); }
function redirect(res, target) { res.writeHead(302, { Location: target, 'Cache-Control': 'no-store' }); res.end(); }
function readBody(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', chunk => { raw += chunk; if (raw.length > 100000) reject(new Error('请求过大')); }); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('请求格式不是 JSON')); } }); }); }
function pinyin(name) { return ({ 清扬: 'qīng yáng', 维桢: 'wéi zhēn', 攸宁: 'yōu níng', 嘉树: 'jiā shù', 既明: 'jì míng', 静姝: 'jìng shū', 其琛: 'qí chēn', 燕绥: 'yàn suí', 柔嘉: 'róu jiā', 怀瑾: 'huái jǐn', 乐只: 'lè zhǐ', 令仪: 'lìng yí', 蓁: 'zhēn', 乔: 'qiáo', 宁: 'níng', 昭: 'zhāo', 乐: 'lè', 嘉: 'jiā', 云起: 'yún qǐ', 清泉: 'qīng quán', 春晖: 'chūn huī', 星垂: 'xīng chuí', 长风: 'cháng fēng', 清欢: 'qīng huān', 兰舟: 'lán zhōu', 云中: 'yún zhōng', 青山: 'qīng shān' })[name] || ''; }
function sourceCategory(work) { if (work.includes('诗经')) return '诗经'; if (work.includes('楚辞')) return '楚辞'; if (/王维|孟郊|杜甫|李白/.test(work)) return '唐诗'; if (/苏轼|李清照|辛弃疾/.test(work)) return '宋词'; return '其他'; }
function numerologyElement(number) { return ({ 1: '木', 2: '木', 3: '火', 4: '火', 5: '土', 6: '土', 7: '金', 8: '金', 9: '水', 0: '水' })[number % 10]; }
function nameStrokeElements(name) { return Array.from(name).map(char => nameDictionary.characters[char] ? numerologyElement(nameDictionary.characters[char].strokes) : null).filter(Boolean); }
function analyzeName(surname, givenName, requested) {
  const surnameChars = Array.from(surname);
  const givenChars = Array.from(givenName);
  const surnameStrokes = nameDictionary.surnames[surname];
  const missing = givenChars.filter(char => !nameDictionary.characters[char]);
  if (surnameStrokes === undefined || missing.length) return { status: 'dictionary_incomplete', missing: [...(surnameStrokes === undefined ? [surname] : []), ...missing], note: '该姓名的康熙笔画尚未收录，暂不计算传统数理。' };
  const givenStrokes = givenChars.map(char => nameDictionary.characters[char].strokes);
  const uncommonCharacters = givenChars.filter(char => nameDictionary.characters[char].level === 'uncommon');
  const strokes = { method: nameDictionary.method, surname: surnameStrokes, given: givenStrokes, total: surnameStrokes + givenStrokes.reduce((sum, value) => sum + value, 0), uncommonCharacters };
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
  if (!input.birthDate || !input.birthTime || !input.birthLocation) return { status: 'needs_input', note: '需补全出生日期、时间与地点。' };
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
    return { status: 'calculated_reference', pillars, visibleElementCounts: elements, location: input.birthLocation, note: '按用户输入的当地标准时间排盘，未作真太阳时修正；五行统计仅统计四柱天干地支的显性元素，供传统文化参考。' };
  } catch {
    return { status: 'calculation_failed', note: '该日期无法完成排盘，请检查输入。' };
  }
}
function checkDialect(fullName, input) {
  if (!input.conditions?.includes('方言')) return { status: 'not_requested' };
  const region = input.dialect || '普通话';
  const profile = phoneticRisks[region];
  if (!profile || !profile.rules.length) return { status: 'dictionary_not_configured', region, note: profile?.coverage || '该方言词库尚未配置。' };
  const matches = profile.rules.filter(rule => fullName.includes(rule.match));
  return { status: 'partial_lexicon_check', region, coverage: profile.coverage, matches, note: matches.length ? '发现需复核的连读风险。' : '未匹配当前内置风险词条；这不是完整方言安全保证。' };
}
function conditions(input) { const tags = []; if (input.conditions?.includes('八字')) tags.push('出生信息 / 八字参考'); if (input.conditions?.includes('胎次')) tags.push(`${input.birthOrder || '一胎'}${input.siblingName ? ' · 呼应一胎思路' : ''}`); if (input.conditions?.includes('出处')) tags.push(input.source ? `偏爱：${input.source}` : '古典出处'); if (input.conditions?.includes('期望')) tags.push(input.wish ? `期望：${input.wish}` : '美好品性'); if (input.conditions?.includes('辈分') && input.generationChar) tags.push(`辈分字「${input.generationChar}」`); if (input.strokes) tags.push(input.strokes); if (input.avoid) tags.push(`避开：${input.avoid}`); return tags.length ? tags : ['有明确出处', '简洁好读']; }
function traditionalChecks(input) {
  const requested = input.conditions || [];
  return {
    bazi: calculateBazi(input),
    wuxingAndWuge: requested.includes('五格') ? { status: 'dictionary_required', note: '需接入康熙笔画与五行映射字库后计算；当前不输出结论' } : { status: 'not_requested' },
    dialect: requested.includes('方言') ? { status: 'phonetic_dictionary_required', region: input.dialect || '普通话', note: '需接入对应方言读音词库后提示谐音风险' } : { status: 'not_requested' }
  };
}
function buildNames(input) {
  const wishes = `${input.wish || ''} ${input.revision || ''}`;
  const excluded = (input.avoid || '').split(/[，,、\s]+/).filter(Boolean);
  const generationChar = input.conditions?.includes('辈分') ? Array.from(input.generationChar || '')[0] : '';
  const targetLength = input.givenNameLength || 'two';
  const bazi = calculateBazi(input);
  const baziTargets = bazi.status === 'calculated_reference' ? Object.entries(bazi.visibleElementCounts).filter(([, count]) => count === 0).map(([element]) => element) : [];
  const requestedSources = ['诗经', '楚辞', '唐诗', '宋词'].filter(category => (input.source || '').includes(category));
  const chosen = corpus.map((record, index) => {
    let score = -index / 10000;
    if (input.gender === '中性' || record.gender === '中性' || record.gender === input.gender) score += 2;
    if (record.themes.some(theme => wishes.includes(theme))) score += 2;
    if (requestedSources.includes(sourceCategory(record.work))) score += 2;
    if ((input.source || '').includes('古典') && sourceCategory(record.work) !== '其他') score += 1;
    if (baziTargets.some(element => nameStrokeElements(record.name).includes(element))) score += 0.8;
    if (excluded.some(word => record.name.includes(word))) score -= 20;
    return { ...record, score };
  }).sort((a, b) => b.score - a.score);
  const expectedLength = targetLength === 'one' ? 1 : targetLength === 'two' ? 2 : 0;
  const lengthMatched = expectedLength ? chosen.filter(record => (generationChar ? 2 : Array.from(record.name).length) === expectedLength) : chosen;
  const candidatePool = lengthMatched.length >= 5 ? lengthMatched : chosen;
  // 每次“再生成”轮换候选池，避免同一筛选条件反复返回相同的五个名字。
  const round = Math.max(0, Math.floor(Number(input.generationRound) || 0));
  const offset = (round * 5) % candidatePool.length;
  const selected = [...candidatePool.slice(offset), ...candidatePool.slice(0, offset)].slice(0, 5);
  const tags = conditions(input);
  const position = input.generationPosition || 'either';
  return selected.map(record => {
    const sourceChar = position === 'first' ? record.name[1] : record.name[0];
    const givenName = generationChar ? (position === 'second' ? `${sourceChar}${generationChar}` : `${generationChar}${sourceChar}`) : record.name;
    const sourceNote = generationChar ? `家族辈分字「${generationChar}」；典籍取字「${sourceChar}」` : `取名自「${record.extracted}」`;
    const matchedElements = nameStrokeElements(givenName).filter(element => baziTargets.includes(element));
    const baziNaming = bazi.status === 'calculated_reference' ? { status: 'partial_element_matching', targetElements: baziTargets, matchedNameElements: matchedElements, note: '按康熙笔画尾数五行进行基础匹配；不同传统流派的用字五行规则并不完全一致，仅供参考。' } : { status: 'not_requested' };
    const fullName = `${input.surname}${givenName}`;
    return { fullName, givenName, pinyin: generationChar ? '组合名，待读音校验' : pinyin(record.name), meaning: record.meaning, source: { work: record.work, original: record.quote, extractedCharacters: generationChar ? sourceChar : record.extracted, note: sourceNote, verified: true }, nameAnalysis: analyzeName(input.surname, givenName, input.conditions || []), baziNaming, dialectCheck: checkDialect(fullName, input), rulesMatched: tags, duplicateName: { status: 'source_not_connected', count: null, source: '需接入经授权的全国同名数据源' }, publicFigures: { status: 'source_not_connected', entries: [], source: '历史人物可接 CBDB；当代人物数据源待接入' } };
  });
}
function serveStatic(req, res, pathname) { const requested = pathname === '/' ? '/index.html' : pathname; const file = path.normalize(path.join(ROOT, requested)); if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return false; const type = requested.endsWith('.html') ? 'text/html; charset=utf-8' : requested.endsWith('.css') ? 'text/css; charset=utf-8' : requested.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'application/octet-stream'; res.writeHead(200, { 'Content-Type': type }); fs.createReadStream(file).pipe(res); return true; }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204, corsHeaders); return res.end(); }
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, corpusRecords: corpus.length });
    if (req.method === 'GET' && url.pathname === '/api/catalog') {
      const categories = ['诗经', '楚辞', '唐诗', '宋词'].map(category => ({ category, records: corpus.filter(record => sourceCategory(record.work) === category).length }));
      return json(res, 200, { categories, policies: { uncommonCharacters: '默认不推荐生僻字；最终以字库分级校验为准', traditionalNaming: '五行、三才五格、八字均为用户主动选择的传统文化参考' } });
    }
    if (req.method === 'GET' && url.pathname === '/api/lookups/same-name') { const target = 'https://ywtb.mps.gov.cn/?device=mobile'; return url.searchParams.get('redirect') === '1' ? redirect(res, target) : json(res, 200, { status: 'official_redirect', label: '前往公安政务服务平台查询同名人数', url: target }); }
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
