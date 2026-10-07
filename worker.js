import nameDictionary from './data/character-dictionary.json';
import characterElements from './data/character-elements.json';
import phoneticRisks from './data/phonetic-risks.json';
import expandedCorpus from './data/expanded-corpus.json';
import approvedCorpus from './data/approved-corpus.json';
import modernInspirationCorpus from './data/modern-inspiration-corpus.json';
import lunar from 'lunar-javascript';
import { getJyutpingText } from 'to-jyutping';

const { Solar } = lunar;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const compoundSurnameStrokes = { 欧阳: [15, 17], 司马: [5, 10], 上官: [3, 8], 诸葛: [16, 15], 夏侯: [10, 9], 东方: [8, 4], 皇甫: [9, 14] };

// 与本地版一致的已核验语料。每个候选均返回可见的原文出处和取字说明。
const corpus = [
  ['清扬','女孩','《诗经·郑风·野有蔓草》','有美一人，清扬婉兮。','清扬','清秀明朗，神采飞扬，温柔而有朝气。',['温柔','明朗','喜乐'],'qīng yáng'],
  ['维桢','中性','《诗经·大雅·文王》','王国克生，维周之桢。','维桢','桢为栋梁，寓意坚实、可靠与担当。',['志向','坚定','品性'],'wéi zhēn'],
  ['攸宁','中性','《诗经·小雅·斯干》','君子攸宁。','攸宁','心有所安，愿一生安稳自在。',['平安','喜乐'],'yōu níng'],
  ['嘉树','男孩','《楚辞·九章·橘颂》','后皇嘉树，橘徕服兮。','嘉树','嘉美如树，根深叶茂，生机盎然。',['自然','志向','品性'],'jiā shù'],
  ['既明','男孩','《诗经·大雅·烝民》','既明且哲，以保其身。','既明','明辨通达，也有清醒温和的内心。',['智慧','品性'],'jì míng'],
  ['静姝','女孩','《诗经·邶风·静女》','静女其姝，俟我于城隅。','静姝','娴静美好，温柔而自有光彩。',['温柔','品性'],'jìng shū'],
  ['其琛','中性','《诗经·鲁颂·泮水》','憬彼淮夷，来献其琛。','其琛','琛为珍宝，寓意珍贵、端正。',['品性','喜乐'],'qí chēn'],
  ['燕绥','女孩','《诗经·小雅·南有嘉鱼》','君子有酒，嘉宾式燕绥之。','燕绥','宴乐安舒，愿人生从容顺遂。',['平安','喜乐'],'yàn suí'],
  ['柔嘉','女孩','《诗经·大雅·抑》','敬尔威仪，无不柔嘉。','柔嘉','温润善良，同时具备美好的品性。',['温柔','品性'],'róu jiā'],
  ['怀瑾','男孩','《楚辞·九章·怀沙》','怀瑾握瑜兮，穷不知所示。','怀瑾','怀抱美玉，比喻高洁美好的品德。',['品性','智慧'],'huái jǐn'],
  ['乐只','中性','《诗经·周南·樛木》','乐只君子，福履绥之。','乐只','心存喜乐，也拥有安稳福气。',['平安','喜乐'],'lè zhǐ'],
  ['令仪','女孩','《诗经·小雅·湛露》','岂弟君子，莫不令仪。','令仪','仪态端正，温和而有分寸。',['温柔','品性'],'lìng yí'],
  ['蓁','女孩','《诗经·周南·桃夭》','桃之夭夭，其叶蓁蓁。','蓁','草木茂盛，寓意蓬勃成长。',['自然','喜乐'],'zhēn'],
  ['乔','中性','《诗经·周南·汉广》','南有乔木，不可休思。','乔','高大挺拔的树木，寓意从容向上。',['自然','志向'],'qiáo'],
  ['宁','中性','《诗经·小雅·斯干》','君子攸宁。','宁','安宁平和，愿一生自在。',['平安','喜乐'],'níng'],
  ['昭','中性','《诗经·大雅·文王》','文王在上，于昭于天。','昭','光明昭著，寓意清朗通达。',['明朗','智慧'],'zhāo'],
  ['乐','中性','《诗经·周南·樛木》','乐只君子，福履绥之。','乐','心存喜乐，福气安稳。',['平安','喜乐'],'lè'],
  ['嘉','中性','《诗经·小雅·鹿鸣》','我有嘉宾，鼓瑟吹笙。','嘉','嘉美、善美，寓意品性可贵。',['品性','喜乐'],'jiā'],
  ['云起','中性','王维《终南别业》','行到水穷处，坐看云起时。','云起','从容自在，于平静处自有新境。',['自然','自在'],'yún qǐ'],
  ['清泉','中性','王维《山居秋暝》','明月松间照，清泉石上流。','清泉','澄澈纯净，心境明朗。',['自然','清澈'],'qīng quán'],
  ['春晖','中性','孟郊《游子吟》','谁言寸草心，报得三春晖。','春晖','春日阳光，寓意温暖、感恩与希望。',['温暖','喜乐'],'chūn huī'],
  ['星垂','男孩','杜甫《旅夜书怀》','星垂平野阔，月涌大江流。','星垂','星光低垂于阔野，心怀辽阔。',['自然','志向'],'xīng chuí'],
  ['长风','男孩','李白《行路难·其一》','长风破浪会有时，直挂云帆济沧海。','长风','长风破浪，寓意勇气与进取。',['勇敢','志向'],'cháng fēng'],
  ['清欢','中性','苏轼《浣溪沙·细雨斜风作晓寒》','人间有味是清欢。','清欢','清淡而有滋味的欢喜，平和自在。',['平安','喜乐','自在'],'qīng huān'],
  ['兰舟','女孩','李清照《一剪梅·红藕香残玉簟秋》','轻解罗裳，独上兰舟。','兰舟','兰舟轻行，雅致而从容。',['温柔','自然'],'lán zhōu'],
  ['云中','中性','李清照《一剪梅·红藕香残玉簟秋》','云中谁寄锦书来，雁字回时，月满西楼。','云中','云中寄书，寓意心怀远方与美好相念。',['自然','自在'],'yún zhōng'],
  ['青山','中性','辛弃疾《菩萨蛮·书江西造口壁》','青山遮不住，毕竟东流去。','青山','青山长在，寓意坚韧沉静。',['自然','坚定'],'qīng shān']
].map(([name, gender, work, quote, extracted, meaning, themes, pinyin]) => ({ name, gender, work, quote, extracted, meaning, themes, pinyin }));

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

const category = input => { const item = typeof input === 'string' ? { work: input } : input; const work = item.work || ''; return item.collection === 'modern' ? '现代常用好字' : item.collection === 'nature' ? '自然意象' : item.collection === 'family' ? '家庭故事' : item.collection === 'contemporary' ? '当代文化灵感' : item.collection === 'shijing' || work.includes('诗经') ? '诗经' : item.collection === 'chuci' || work.includes('楚辞') ? '楚辞' : item.collection === 'tang' || /王维|孟郊|杜甫|李白|李商隐|刘禹锡|白居易|杜牧|孟浩然|王勃|崔颢|张若虚/.test(work) ? '唐诗' : item.collection === 'song' || /苏轼|李清照|辛弃疾|陆游|晏殊|秦观|杨万里|范仲淹|欧阳修|王安石|林逋/.test(work) ? '宋词' : item.collection === 'yuanqu' ? '元曲' : item.collection === 'wudai' ? '五代词' : item.collection === 'nalan' ? '纳兰词' : item.collection === 'prose' ? '古文' : item.collection === 'philosophy' ? '哲学与先秦古籍' : item.collection === 'wikisource' || work.includes('论语') ? '论语' : item.collection === 'confucian' || /大学|中庸|孟子/.test(work) ? '儒家经典' : item.collection === 'classics' || /尚书|礼记|周易|孝经|尔雅|春秋/.test(work) ? '十三经与诸子' : '其他'; };
const element = number => ({ 1: '木', 2: '木', 3: '火', 4: '火', 5: '土', 6: '土', 7: '金', 8: '金', 9: '水', 0: '水' })[number % 10];
const charElements = name => Array.from(name).map(char => characterElements.characters[char] ? element(characterElements.characters[char].strokes) : null).filter(Boolean);
const strokeRange = value => { const list = String(value || '').match(/\d+/g)?.map(Number) || []; return list.length > 1 ? { min:Math.min(...list), max:Math.max(...list) } : list.length ? { min:list[0], max:list[0] } : null; };
const avoidedCharacters = value => Array.from(String(value || '').replace(/不要|避开|避免|不喜欢|读音|谐音|字/g, '')).filter(char => /[\u3400-\u9fff]/.test(char));
const parsedConstraints = input => { const strictAvoid = []; const collect = value => { for (const match of String(value || '').matchAll(/(?:不要|避开|避免|不喜欢)\s*[“”"'「]?([\u3400-\u9fff]{1,2})/g)) { const word = match[1]; if (!/太古|古风|现代|温柔|大气|网红|生僻|谐音|读音/.test(word)) strictAvoid.push(...Array.from(word)); } }; collect(input.avoid); collect(input.revision); if (input.avoid && !/(不要|避开|避免|不喜欢)/.test(input.avoid)) strictAvoid.push(...avoidedCharacters(input.avoid)); const text = `${input.avoid || ''} ${input.revision || ''}`; const ranking = []; if (/现代|简洁|清爽/.test(text)) ranking.push('更现代'); if (/温柔|柔和/.test(text)) ranking.push('更温柔'); if (/大气|开阔/.test(text)) ranking.push('更大气'); if (/古风/.test(text)) ranking.push('减少古典感'); const pending = /谐音|读音/.test(text) ? ['谐音 / 读音需结合所选方言复核'] : []; return { strictAvoid:[...new Set(strictAvoid)], ranking, pending }; };
const inferSiblingStyle = value => { const text = String(value || ''); const categories = [], themes = []; if (/诗经|楚辞|唐诗|宋词|论语|古文|典/.test(text)) categories.push('诗经','楚辞','唐诗','宋词','论语','古文'); if (/春|夏|秋|冬|山|海|江|河|云|星|月|风|花|林|川|雨|阳/.test(text)) categories.push('自然意象'); if (/安|宁|泰|佑|祺/.test(text)) themes.push('平安'); if (/乐|欢|怡|欣/.test(text)) themes.push('喜乐'); if (/知|思|书|明|慧/.test(text)) themes.push('智慧'); if (/勇|毅|恒|行/.test(text)) themes.push('勇敢','坚定'); if (/柔|婉|清|雅/.test(text)) themes.push('温柔'); return { categories:[...new Set(categories)], themes:[...new Set(themes)] }; };

function conditions(input, understood = parsedConstraints(input)) {
  const chosen = input.conditions || []; const tags = [];
  if (chosen.includes('八字')) tags.push('出生信息 / 八字参考');
  if (chosen.includes('胎次')) { const style = inferSiblingStyle(input.siblingName); tags.push(input.siblingName ? `${input.birthOrder || '二胎'} · 自动延续一胎：${[...style.categories, ...style.themes].join('、') || '未识别到明确风格'}` : `${input.birthOrder || '二胎'} · 可填写一胎名字以自动延续风格`); }
  if (chosen.includes('出处')) tags.push(input.source ? `偏爱：${input.source}` : '古典出处');
  if (chosen.includes('期望')) tags.push(input.wish ? `期望：${input.wish}` : '美好品性');
  if (chosen.includes('辈分') && input.generationChar) tags.push(`辈分字「${input.generationChar}」`);
  if (chosen.includes('笔画') && input.strokes) tags.push(`全名笔画：${input.strokes}`); if (understood.strictAvoid.length) tags.push(`严格避用：${understood.strictAvoid.join('、')}`); if (understood.ranking.length) tags.push(`偏好排序：${understood.ranking.join('、')}`); if (understood.pending.length) tags.push(`待复核：${understood.pending.join('；')}`);
  return tags.length ? tags : ['有明确出处', '简洁好读'];
}

function bazi(input) {
  if (!input.conditions?.includes('八字')) return { status: 'not_requested' };
  if (!input.birthDate || !input.birthTime) return { status: 'needs_input', note: '需补全出生日期和时间。' };
  const [year, month, day] = input.birthDate.split('-').map(Number); const [hour, minute] = input.birthTime.split(':').map(Number);
  try {
    const ec = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
    const pillars = { 年柱: ec.getYear(), 月柱: ec.getMonth(), 日柱: ec.getDay(), 时柱: ec.getTime() };
    const map = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水' };
    const counts = { 木:0,火:0,土:0,金:0,水:0 }; Object.values(pillars).join('').split('').forEach(char => { if (map[char]) counts[map[char]] += 1; });
    return { status: 'calculated_reference', pillars, visibleElementCounts: counts, location: input.birthLocation || '未填写（按当地标准时间）', note: '按填写的标准时间排盘，未作真太阳时修正；五行仅统计四柱天干地支的显性元素，供传统文化参考。' };
  } catch { return { status: 'calculation_failed', note: '该日期无法完成排盘，请检查输入。' }; }
}
const weakerBaziElements = counts => { const values = Object.values(counts); const minimum = Math.min(...values); const maximum = Math.max(...values); return minimum === maximum ? [] : Object.entries(counts).filter(([, count]) => count === minimum).map(([element]) => element); };

function analysis(surname, givenName, requested) {
  const family = characterElements.surnames?.[surname]; const missing = Array.from(givenName).filter(char => !characterElements.characters[char]);
  if (family === undefined || missing.length) return { status:'dictionary_incomplete', missing:[...(family === undefined ? [surname] : []), ...missing], note:'该姓名的笔画数据尚未收录，暂不计算传统数理。' };
  const given = Array.from(givenName).map(char => characterElements.characters[char].strokes);
  const strokes = { method:characterElements.method, surname:family, given, total:family + given.reduce((sum, value) => sum + value, 0), uncommonCharacters:Array.from(givenName).filter(char => nameDictionary.characters[char]?.level === 'uncommon') };
  if (!requested.includes('五格')) return { status:'not_requested', strokes };
  const parts = Array.from(surname).length === 1 ? [family] : compoundSurnameStrokes[surname];
  if (!parts) return { status:'compound_surname_dictionary_required', strokes, note:'该复姓的拆字笔画尚未收录，当前不返回三才结论。' };
  const tian = Array.from(surname).length === 1 ? family + 1 : family; const ren = parts.at(-1) + given[0]; const di = given.length === 1 ? given[0] + 1 : given.reduce((sum, value) => sum + value, 0); const wai = Array.from(surname).length === 1 ? given.at(-1) + 1 : (given.length === 1 ? parts[0] + 1 : parts[0] + given.at(-1));
  return { status:'calculated_reference', strokes, grids:Object.fromEntries(Object.entries({ 天格:tian, 人格:ren, 地格:di, 外格:wai, 总格:strokes.total }).map(([label, value]) => [label, { value, element:element(value) }])), note:'按康熙笔画与常见五格公式计算，仅供传统命名参考，不作吉凶断言。' };
}

function dialect(fullName, input) {
  if (!input.conditions?.includes('方言')) return { status:'not_requested' }; const region = input.dialect || '普通话'; const profile = phoneticRisks[region];
  if (region === '粤语') { const reading = getJyutpingText(fullName).replace(/\s+/g, ' ').trim(); const matches = (profile?.rules || []).filter(rule => rule.jyutping && reading.includes(rule.jyutping)); return { status:'partial_lexicon_check', region, reading, coverage:profile?.coverage, matches, note:matches.length ? '发现需复核的粤语读音风险。' : '已完成粤语拼音与首批风险词条初筛；未命中不等于没有谐音风险。' }; }
  if (!profile?.rules?.length) return { status:'dictionary_not_configured', region, note:profile?.coverage || '该方言词库尚未配置。' };
  const matches = profile.rules.filter(rule => fullName.includes(rule.match)); return { status:'partial_lexicon_check', region, coverage:profile.coverage, matches, note:matches.length ? '发现需复核的连读风险。' : '未匹配当前内置风险词条；这不是完整方言安全保证。' };
}

function buildNames(input) {
  const checks = input.conditions || []; const wishes = `${input.wish || ''} ${input.revision || ''}`; const understood = parsedConstraints(input); const excluded = understood.strictAvoid; const gen = checks.includes('辈分') ? Array.from(input.generationChar || '')[0] : ''; const targetLength = input.givenNameLength || 'two'; if (gen && targetLength === 'one') throw new Error('已指定辈分字时，本版仅支持双字名或不限字数。'); const birth = bazi(input); const targets = birth.status === 'calculated_reference' ? weakerBaziElements(birth.visibleElementCounts) : []; const sourceText = input.source || ''; const sources = [['诗经','诗经'],['楚辞','楚辞'],['唐诗','唐诗'],['宋词','宋词'],['论语','论语'],['儒家经典','儒家'],['十三经与诸子','周易'],['哲学与先秦古籍','哲学'],['元曲','元曲'],['五代词','五代'],['纳兰词','纳兰'],['古文','古文'],['现代常用好字','现代|简洁|清爽'],['自然意象','自然|山|海|星空|森林'],['家庭故事','家庭|相识|初见|纪念|家乡|陪伴'],['当代文化灵感','电影|游戏|音乐|动漫|科幻|哈利|艺术']].filter(([, cues]) => new RegExp(cues).test(sourceText)).map(([value]) => value); const range = checks.includes('笔画') ? strokeRange(input.strokes) : null; if (range && characterElements.surnames?.[input.surname] === undefined) throw new Error(`“${input.surname}”尚未收录笔画，无法按全名笔画范围筛选。`); const sibling = checks.includes('胎次') && input.siblingName ? inferSiblingStyle(input.siblingName) : { categories:[], themes:[] }; const position = input.generationPosition || 'either';
  const ranked = corpus.map((record, index) => { const characters = Array.from(record.name); const sourceChar = position === 'first' ? (characters[1] || characters[0]) : characters[0]; const givenName = gen ? (position === 'second' ? `${sourceChar}${gen}` : `${gen}${sourceChar}`) : record.name; const strokes = analysis(input.surname, givenName, []).strokes; if (range && (!strokes || strokes.total < range.min || strokes.total > range.max)) return null; if (excluded.some(char => givenName.includes(char))) return null; const matchedElements = charElements(givenName).filter(value => targets.includes(value)); const score = (input.gender === '中性' || record.gender === '中性' || record.gender === input.gender ? 2 : 0) + (record.themes.some(theme => wishes.includes(theme)) ? 2 : 0) + (sources.includes(category(record)) ? 2 : 0) + (sibling.categories.includes(category(record)) ? 3 : 0) + (record.themes.some(theme => sibling.themes.includes(theme)) ? 2 : 0) + (understood.ranking.includes('更现代') && category(record) === '现代常用好字' ? 3 : 0) + (understood.ranking.includes('更温柔') && record.themes.includes('温柔') ? 2 : 0) + (understood.ranking.includes('更大气') && record.themes.includes('志向') ? 2 : 0) - (understood.ranking.includes('减少古典感') && ['诗经','楚辞','唐诗','宋词','论语','古文'].includes(category(record)) ? 2 : 0) + ((input.source || '').includes('古典') ? 1 : 0) + (matchedElements.length * 4) - index / 10000; return { ...record, sourceChar, givenName, score }; }).filter(Boolean).sort((a,b) => b.score - a.score);
  const expected = targetLength === 'one' ? 1 : targetLength === 'two' ? 2 : 0; const pool = (expected ? ranked.filter(record => Array.from(record.givenName).length === expected) : ranked).filter((record, index, list) => list.findIndex(other => other.givenName === record.givenName) === index); if (pool.length < 5) throw new Error('条件组合后不足 5 个候选，请放宽笔画范围、避用字或字数要求。'); const offset = (Math.max(0, Math.floor(Number(input.generationRound) || 0)) * 5) % pool.length; const selected = [...pool.slice(offset), ...pool.slice(0, offset)].slice(0,5);
  return selected.map(record => { const fullName = `${input.surname}${record.givenName}`; const matchedElements = charElements(record.givenName).filter(value => targets.includes(value)); return { fullName, givenName:record.givenName, pinyin:gen ? '' : record.pinyin, meaning:record.meaning, styleNotice:record.styleNotice || '', source:{ label:record.sourceLabel || '原文出处', work:record.work, original:record.quote, extractedCharacters:gen ? record.sourceChar : record.extracted, note:gen ? `家族辈分字「${gen}」；典籍取字「${record.sourceChar}」` : `取名自「${record.extracted}」`, verified:true }, nameAnalysis:analysis(input.surname, record.givenName, checks), baziNaming:birth.status === 'calculated_reference' ? { status:'partial_element_matching', pillars:birth.pillars, targetElements:targets, matchedNameElements, note:characterElements.method } : { status:'not_requested' }, dialectCheck:dialect(fullName,input), rulesMatched:conditions(input, understood), duplicateName:{ status:'source_not_connected', count:null, source:'需接入经授权的全国同名数据源' }, publicFigures:{ status:'source_not_connected', entries:[], source:'当代人物数据源待接入' } }; });
}

const reply = (data, status = 200) => Response.json(data, { status, headers:{ 'Cache-Control':'no-store', ...cors } });

export default { async fetch(request, env) {
  const url = new URL(request.url); if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });
  if (url.pathname === '/api/health') return reply({ ok:true, corpusRecords:corpus.length, runtime:'cloudflare-worker' });
  if (url.pathname === '/api/catalog') return reply({ categories:['诗经','楚辞','唐诗','宋词','论语','儒家经典','十三经与诸子','哲学与先秦古籍','元曲','五代词','纳兰词','古文','现代常用好字','自然意象','家庭故事','当代文化灵感'].map(value => ({ category:value, records:corpus.filter(item => category(item) === value).length })), policies:{ uncommonCharacters:'默认不推荐生僻字；最终以字库分级校验为准', traditionalNaming:'五行、三才五格、八字均为用户主动选择的传统文化参考' } });
  if (url.pathname === '/api/lookups/same-name') { const target = 'https://ywtb.mps.gov.cn/'; return url.searchParams.get('redirect') === '1' ? Response.redirect(target,302) : reply({ status:'official_redirect', label:'打开公安部首页后，点“便民应用 → 查询同名人数”', url:target }); }
  if (url.pathname === '/api/lookups/public-figures') { const name = url.searchParams.get('name') || ''; const target = `https://www.baidu.com/s?wd=${encodeURIComponent(`${name} 公众人物`)}`; return url.searchParams.get('redirect') === '1' ? Response.redirect(target,302) : reply({ status:'search_redirect', label:'百度搜索同名公众人物', url:target }); }
  if (request.method === 'POST' && ['/api/names/generate','/api/names/refine'].includes(url.pathname)) { try { const input = await request.json(); if (!input.surname || typeof input.surname !== 'string') return reply({ error:'请填写姓氏' },400); const birth = bazi(input); return reply({ generatedAt:new Date().toISOString(), conditions:conditions(input), traditionalChecks:{ bazi:birth, wuxingAndWuge:input.conditions?.includes('五格') ? { status:'calculated_reference', note:'计算结果见每个候选名字。' } : { status:'not_requested' }, dialect:input.conditions?.includes('方言') ? { status:input.dialect === '粤语' ? 'partial_lexicon_check' : 'dictionary_not_configured', region:input.dialect || '普通话', note:input.dialect === '粤语' ? '已接入粤语读音及首批风险词条。' : '该方言待接入读音转换与风险词库。' } : { status:'not_requested' } }, names:buildNames(input) }); } catch (error) { return reply({ error:error.message || '请求处理失败' },400); } }
  return env.ASSETS.fetch(request);
} };
