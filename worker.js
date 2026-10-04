import nameDictionary from './data/character-dictionary.json';
import phoneticRisks from './data/phonetic-risks.json';
import expandedCorpus from './data/expanded-corpus.json';
import approvedCorpus from './data/approved-corpus.json';
import lunar from 'lunar-javascript';

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

corpus.push(...expandedCorpus.map(record => ({ ...record, extracted: record.extracted || record.name, pinyin: record.pinyin || '待读音校验' })));
corpus.push(...approvedCorpus.map(record => ({ ...record, extracted: record.extracted || record.name, pinyin: record.pinyin || '待读音校验' })));
// 同名候选只保留最早进入正式库的一条，避免不同批次导入造成重复推荐。
const seenCorpusNames = new Set();
const uniqueCorpus = corpus.filter(record => {
  if (seenCorpusNames.has(record.name)) return false;
  seenCorpusNames.add(record.name);
  return true;
});
corpus.splice(0, corpus.length, ...uniqueCorpus);

const category = input => { const item = typeof input === 'string' ? { work: input } : input; const work = item.work || ''; return item.collection === 'shijing' || work.includes('诗经') ? '诗经' : item.collection === 'chuci' || work.includes('楚辞') ? '楚辞' : item.collection === 'tang' || /王维|孟郊|杜甫|李白|李商隐|刘禹锡|白居易|杜牧|孟浩然|王勃|崔颢|张若虚/.test(work) ? '唐诗' : item.collection === 'song' || /苏轼|李清照|辛弃疾|陆游|晏殊|秦观|杨万里|范仲淹|欧阳修|王安石|林逋/.test(work) ? '宋词' : item.collection === 'wikisource' || work.includes('论语') ? '论语' : '其他'; };
const element = number => ({ 1: '木', 2: '木', 3: '火', 4: '火', 5: '土', 6: '土', 7: '金', 8: '金', 9: '水', 0: '水' })[number % 10];
const charElements = name => Array.from(name).map(char => nameDictionary.characters[char] ? element(nameDictionary.characters[char].strokes) : null).filter(Boolean);

function conditions(input) {
  const chosen = input.conditions || []; const tags = [];
  if (chosen.includes('八字')) tags.push('出生信息 / 八字参考');
  if (chosen.includes('胎次')) tags.push(`${input.birthOrder || '一胎'}${input.siblingName ? ' · 呼应一胎思路' : ''}`);
  if (chosen.includes('出处')) tags.push(input.source ? `偏爱：${input.source}` : '古典出处');
  if (chosen.includes('期望')) tags.push(input.wish ? `期望：${input.wish}` : '美好品性');
  if (chosen.includes('辈分') && input.generationChar) tags.push(`辈分字「${input.generationChar}」`);
  if (input.strokes) tags.push(input.strokes); if (input.avoid) tags.push(`避开：${input.avoid}`);
  return tags.length ? tags : ['有明确出处', '简洁好读'];
}

function bazi(input) {
  if (!input.conditions?.includes('八字')) return { status: 'not_requested' };
  if (!input.birthDate || !input.birthTime || !input.birthLocation) return { status: 'needs_input', note: '需补全出生日期、时间与地点。' };
  const [year, month, day] = input.birthDate.split('-').map(Number); const [hour, minute] = input.birthTime.split(':').map(Number);
  try {
    const ec = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
    const pillars = { 年柱: ec.getYear(), 月柱: ec.getMonth(), 日柱: ec.getDay(), 时柱: ec.getTime() };
    const map = { 甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水',子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水' };
    const counts = { 木:0,火:0,土:0,金:0,水:0 }; Object.values(pillars).join('').split('').forEach(char => { if (map[char]) counts[map[char]] += 1; });
    return { status: 'calculated_reference', pillars, visibleElementCounts: counts, location: input.birthLocation, note: '按用户输入的当地标准时间排盘，未作真太阳时修正；五行统计仅统计四柱天干地支的显性元素，供传统文化参考。' };
  } catch { return { status: 'calculation_failed', note: '该日期无法完成排盘，请检查输入。' }; }
}

function analysis(surname, givenName, requested) {
  const family = nameDictionary.surnames[surname]; const missing = Array.from(givenName).filter(char => !nameDictionary.characters[char]);
  if (family === undefined || missing.length) return { status:'dictionary_incomplete', missing:[...(family === undefined ? [surname] : []), ...missing], note:'该姓名的康熙笔画尚未收录，暂不计算传统数理。' };
  const given = Array.from(givenName).map(char => nameDictionary.characters[char].strokes);
  const strokes = { method:nameDictionary.method, surname:family, given, total:family + given.reduce((sum, value) => sum + value, 0), uncommonCharacters:Array.from(givenName).filter(char => nameDictionary.characters[char].level === 'uncommon') };
  if (!requested.includes('五格')) return { status:'not_requested', strokes };
  const parts = Array.from(surname).length === 1 ? [family] : compoundSurnameStrokes[surname];
  if (!parts) return { status:'compound_surname_dictionary_required', strokes, note:'该复姓的拆字笔画尚未收录，当前不返回三才结论。' };
  const tian = Array.from(surname).length === 1 ? family + 1 : family; const ren = parts.at(-1) + given[0]; const di = given.length === 1 ? given[0] + 1 : given.reduce((sum, value) => sum + value, 0); const wai = Array.from(surname).length === 1 ? given.at(-1) + 1 : (given.length === 1 ? parts[0] + 1 : parts[0] + given.at(-1));
  return { status:'calculated_reference', strokes, grids:Object.fromEntries(Object.entries({ 天格:tian, 人格:ren, 地格:di, 外格:wai, 总格:strokes.total }).map(([label, value]) => [label, { value, element:element(value) }])), note:'按康熙笔画与常见五格公式计算，仅供传统命名参考，不作吉凶断言。' };
}

function dialect(fullName, input) {
  if (!input.conditions?.includes('方言')) return { status:'not_requested' }; const region = input.dialect || '普通话'; const profile = phoneticRisks[region];
  if (!profile?.rules?.length) return { status:'dictionary_not_configured', region, note:profile?.coverage || '该方言词库尚未配置。' };
  const matches = profile.rules.filter(rule => fullName.includes(rule.match)); return { status:'partial_lexicon_check', region, coverage:profile.coverage, matches, note:matches.length ? '发现需复核的连读风险。' : '未匹配当前内置风险词条；这不是完整方言安全保证。' };
}

function buildNames(input) {
  const checks = input.conditions || []; const wishes = `${input.wish || ''} ${input.revision || ''}`; const excluded = (input.avoid || '').split(/[，,、\s]+/).filter(Boolean); const gen = checks.includes('辈分') ? Array.from(input.generationChar || '')[0] : ''; const targetLength = input.givenNameLength || 'two'; const birth = bazi(input); const targets = birth.status === 'calculated_reference' ? Object.entries(birth.visibleElementCounts).filter(([, n]) => n === 0).map(([key]) => key) : []; const sources = ['诗经','楚辞','唐诗','宋词','论语'].filter(value => (input.source || '').includes(value));
  const ranked = corpus.map((record, index) => ({ ...record, score:(input.gender === '中性' || record.gender === '中性' || record.gender === input.gender ? 2 : 0) + (record.themes.some(theme => wishes.includes(theme)) ? 2 : 0) + (sources.includes(category(record)) ? 2 : 0) + ((input.source || '').includes('古典') ? 1 : 0) + (targets.some(value => charElements(record.name).includes(value)) ? .8 : 0) - (excluded.some(word => record.name.includes(word)) ? 20 : 0) - index / 10000 })).sort((a,b) => b.score - a.score);
  const expected = targetLength === 'one' ? 1 : targetLength === 'two' ? 2 : 0; const matched = expected ? ranked.filter(record => (gen ? 2 : Array.from(record.name).length) === expected) : ranked; const pool = matched.length >= 5 ? matched : ranked; const offset = (Math.max(0, Math.floor(Number(input.generationRound) || 0)) * 5) % pool.length; const selected = [...pool.slice(offset), ...pool.slice(0, offset)].slice(0,5);
  return selected.map(record => { const sourceChar = input.generationPosition === 'first' ? record.name[1] : record.name[0]; const givenName = gen ? (input.generationPosition === 'second' ? `${sourceChar}${gen}` : `${gen}${sourceChar}`) : record.name; const fullName = `${input.surname}${givenName}`; const matchedElements = charElements(givenName).filter(value => targets.includes(value)); return { fullName, givenName, pinyin:gen ? '组合名，待读音校验' : record.pinyin, meaning:record.meaning, source:{ work:record.work, original:record.quote, extractedCharacters:gen ? sourceChar : record.extracted, note:gen ? `家族辈分字「${gen}」；典籍取字「${sourceChar}」` : `取名自「${record.extracted}」`, verified:true }, nameAnalysis:analysis(input.surname, givenName, checks), baziNaming:birth.status === 'calculated_reference' ? { status:'partial_element_matching', targetElements:targets, matchedNameElements, note:'按康熙笔画尾数五行进行基础匹配；不同传统流派的用字五行规则并不完全一致，仅供参考。' } : { status:'not_requested' }, dialectCheck:dialect(fullName,input), rulesMatched:conditions(input), duplicateName:{ status:'source_not_connected', count:null, source:'需接入经授权的全国同名数据源' }, publicFigures:{ status:'source_not_connected', entries:[], source:'当代人物数据源待接入' } }; });
}

const reply = (data, status = 200) => Response.json(data, { status, headers:{ 'Cache-Control':'no-store', ...cors } });

export default { async fetch(request, env) {
  const url = new URL(request.url); if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });
  if (url.pathname === '/api/health') return reply({ ok:true, corpusRecords:corpus.length, runtime:'cloudflare-worker' });
  if (url.pathname === '/api/catalog') return reply({ categories:['诗经','楚辞','唐诗','宋词','论语'].map(value => ({ category:value, records:corpus.filter(item => category(item) === value).length })), policies:{ uncommonCharacters:'默认不推荐生僻字；最终以字库分级校验为准', traditionalNaming:'五行、三才五格、八字均为用户主动选择的传统文化参考' } });
  if (url.pathname === '/api/lookups/same-name') { const target = 'https://ywtb.mps.gov.cn/?device=mobile'; return url.searchParams.get('redirect') === '1' ? Response.redirect(target,302) : reply({ status:'official_redirect', label:'前往公安政务服务平台查询同名人数', url:target }); }
  if (url.pathname === '/api/lookups/public-figures') { const name = url.searchParams.get('name') || ''; const target = `https://www.baidu.com/s?wd=${encodeURIComponent(`${name} 公众人物`)}`; return url.searchParams.get('redirect') === '1' ? Response.redirect(target,302) : reply({ status:'search_redirect', label:'百度搜索同名公众人物', url:target }); }
  if (request.method === 'POST' && ['/api/names/generate','/api/names/refine'].includes(url.pathname)) { try { const input = await request.json(); if (!input.surname || typeof input.surname !== 'string') return reply({ error:'请填写姓氏' },400); const birth = bazi(input); return reply({ generatedAt:new Date().toISOString(), conditions:conditions(input), traditionalChecks:{ bazi:birth, wuxingAndWuge:input.conditions?.includes('五格') ? { status:'calculated_reference', note:'计算结果见每个候选名字。' } : { status:'not_requested' }, dialect:input.conditions?.includes('方言') ? { status:'partial_lexicon_check', region:input.dialect || '普通话' } : { status:'not_requested' } }, names:buildNames(input) }); } catch (error) { return reply({ error:error.message || '请求处理失败' },400); } }
  return env.ASSETS.fetch(request);
} };
