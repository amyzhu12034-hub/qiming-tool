/* GitHub Pages 静态试用版：推荐逻辑与已审核语料均在浏览器本地运行。 */
(() => {
  // 公安部“查询同名人数”官方直达入口。需由用户在官方页面自行填写姓名。
  const officialSameName = 'https://ywtb.mps.gov.cn/newhome/portal/cmcx';
  let corpusPromise;
  let characterElementsPromise;
  const loadCorpus = () => corpusPromise ||= fetch('./data/client-corpus.json').then(response => {
    if (!response.ok) throw new Error('本地语料加载失败');
    return response.json();
  });
  const loadCharacterElements = () => characterElementsPromise ||= fetch('./data/character-elements.json').then(response => {
    if (!response.ok) throw new Error('笔画五行数据加载失败');
    return response.json();
  });
  const chars = value => Array.from(value || '');
  const strokeElement = strokes => ({ 1: '木', 2: '木', 3: '火', 4: '火', 5: '土', 6: '土', 7: '金', 8: '金', 9: '水', 0: '水' })[strokes % 10];
  const nameElements = (name, characterElements) => chars(name).map(char => characterElements.characters[char]).filter(Boolean).map(item => strokeElement(item.strokes));
  const baziElement = char => ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水', 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' })[char];
  const baziTargets = counts => {
    const values = Object.values(counts);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    return minimum === maximum ? [] : Object.entries(counts).filter(([, count]) => count === minimum).map(([element]) => element);
  };
  const calculateBazi = input => {
    if (!(input.conditions || []).includes('八字')) return { status: 'not_requested' };
    if (!input.birthDate || !input.birthTime) return { status: 'needs_input', note: '请补全出生日期和时间。' };
    if (!window.Solar) return { status: 'calculation_failed', note: '八字计算组件加载失败，请刷新页面重试。' };
    const [year, month, day] = input.birthDate.split('-').map(Number);
    const [hour, minute] = input.birthTime.split(':').map(Number);
    if (![year, month, day, hour, minute].every(Number.isInteger)) return { status: 'invalid_input', note: '出生日期或时间格式不正确。' };
    try {
      const eightChar = window.Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar().getEightChar();
      const pillars = { 年柱: eightChar.getYear(), 月柱: eightChar.getMonth(), 日柱: eightChar.getDay(), 时柱: eightChar.getTime() };
      const visibleElementCounts = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
      Object.values(pillars).join('').split('').forEach(char => {
        const element = baziElement(char);
        if (element) visibleElementCounts[element] += 1;
      });
      return { status: 'calculated_reference', pillars, visibleElementCounts, location: input.birthLocation || '未填写（按当地标准时间）', note: '按填写的标准时间排盘，未作真太阳时修正；五行仅统计四柱天干地支显性元素，供传统文化参考。' };
    } catch {
      return { status: 'calculation_failed', note: '该日期无法完成排盘，请检查输入。' };
    }
  };
  const category = record => {
    const work = record.work || '';
    if (record.collection === 'modern') return '现代常用好字';
    if (record.collection === 'nature') return '自然意象';
    if (record.collection === 'family') return '家庭故事';
    if (record.collection === 'contemporary') return '当代文化灵感';
    if (record.collection === 'shijing' || work.includes('诗经')) return '诗经';
    if (record.collection === 'chuci' || work.includes('楚辞')) return '楚辞';
    if (record.collection === 'yuanqu') return '元曲';
    if (record.collection === 'wudai') return '五代词';
    if (record.collection === 'nalan') return '纳兰词';
    if (record.collection === 'prose') return '古文';
    if (record.collection === 'philosophy') return '哲学与先秦古籍';
    if (record.collection === 'wikisource' || work.includes('论语')) return '论语';
    if (record.collection === 'confucian' || /大学|中庸|孟子/.test(work)) return '儒家经典';
    if (record.collection === 'classics' || /尚书|礼记|周易|孝经|尔雅|春秋/.test(work)) return '十三经与诸子';
    if (/王维|孟郊|杜甫|李白|李商隐|刘禹锡|白居易|杜牧|孟浩然|王勃|崔颢|张若虚/.test(work)) return '唐诗';
    if (/苏轼|李清照|辛弃疾|陆游|晏殊|秦观|杨万里|范仲淹|欧阳修|王安石|林逋/.test(work)) return '宋词';
    return '其他';
  };
  const wants = (value, mapping) => Object.entries(mapping).filter(([word]) => value.includes(word)).flatMap(([, tags]) => tags);
  const hash = value => [...value].reduce((sum, char) => ((sum * 31) + char.codePointAt(0)) >>> 0, 7);
  const conditions = (input, bazi, targets, corpusCount) => {
    const selected = input.conditions || [];
    const tags = [`静态试用版 · ${corpusCount} 条已审核 / 编辑灵感语料`];
    if (selected.includes('出生信息 / 八字') || selected.includes('八字')) {
      if (bazi.status === 'calculated_reference') tags.push(`八字：${Object.values(bazi.pillars).join(' ') } · ${targets.length ? `显性偏少 ${targets.join('、')}` : '五行相对均衡'}`);
      else tags.push(`八字：${bazi.note || '未计算'}`);
    }
    if (selected.includes('胎次')) tags.push(`${input.birthOrder || '一胎'}${input.siblingName ? ' · 呼应一胎思路' : ''}`);
    if (selected.includes('出处')) tags.push(input.source ? `偏爱：${input.source}` : '文化出处');
    if (selected.includes('期望')) tags.push(input.wish ? `期望：${input.wish}` : '美好品性');
    if (selected.includes('辈分') && input.generationChar) tags.push(`辈分字「${input.generationChar}」`);
    if (input.strokes) tags.push(input.strokes);
    if (input.avoid) tags.push(`避开：${input.avoid}`);
    return tags;
  };
  const generate = async input => {
    const [corpus, characterElements] = await Promise.all([loadCorpus(), loadCharacterElements()]);
    const bazi = calculateBazi(input);
    const targets = bazi.status === 'calculated_reference' ? baziTargets(bazi.visibleElementCounts) : [];
    const sourceTags = wants(input.source || '', {
      '诗经':['诗经'], '楚辞':['楚辞'], '唐诗':['唐诗'], '宋词':['宋词'], '论语':['论语'],
      '儒家':['儒家经典'], '周易':['十三经与诸子'], '古文':['古文'], '元曲':['元曲'],
      '纳兰':['纳兰词'], '哲学':['哲学与先秦古籍'],
      '现代':['现代常用好字'], '简洁':['现代常用好字'], '清爽':['现代常用好字'],
      '自然':['自然意象'], '山':['自然意象'], '海':['自然意象'], '星空':['自然意象'], '森林':['自然意象'],
      '家庭':['家庭故事'], '相识':['家庭故事'], '初见':['家庭故事'], '纪念':['家庭故事'], '家乡':['家庭故事'], '陪伴':['家庭故事'],
      '电影':['当代文化灵感'], '游戏':['当代文化灵感'], '音乐':['当代文化灵感'], '动漫':['当代文化灵感'], '科幻':['当代文化灵感'], '哈利':['当代文化灵感'], '艺术':['当代文化灵感']
    });
    const wishTags = wants(input.wish || '', {
      '平安':['平安'], '喜乐':['喜乐'], '温柔':['温柔'], '智慧':['智慧'], '品性':['品性'],
      '志向':['志向'], '自在':['自在'], '自然':['自然'], '坚定':['坚定'], '勇敢':['勇敢'], '明朗':['明朗'],
      '陪伴':['陪伴'], '纪念':['纪念'], '探索':['探索'], '想象':['想象'], '成长':['成长'], '温暖':['温暖']
    });
    const avoid = input.avoid || '';
    const special = /不要.*古风|更现代/.test(input.revision || '');
    const ranked = corpus.filter(record => {
      const length = chars(record.name).length;
      if (input.givenNameLength === 'one' && length !== 1) return false;
      if (input.givenNameLength === 'two' && length !== 2) return false;
      if (avoid && chars(avoid).some(char => record.name.includes(char))) return false;
      if (input.generationChar) {
        const position = input.generationPosition || 'either';
        if (position === 'first' && record.name[0] !== input.generationChar) return false;
        if (position === 'second' && record.name[1] !== input.generationChar) return false;
        if (position === 'either' && !record.name.includes(input.generationChar)) return false;
      }
      return true;
    }).map(record => {
      let score = 0;
      if (input.gender === '中性' || record.gender === '中性' || record.gender === input.gender) score += 2;
      if (wishTags.some(tag => (record.themes || []).includes(tag))) score += 3;
      if (sourceTags.includes(category(record))) score += 3;
      if (input.source && (record.work || '').includes(input.source.trim())) score += 2;
      if ((input.revision || '').includes('温柔') && (record.themes || []).includes('温柔')) score += 2;
      if ((input.revision || '').includes('大气') && (record.themes || []).includes('志向')) score += 2;
      if (special && record.styleNotice) score -= 2;
      const matchedElements = nameElements(record.name, characterElements).filter(element => targets.includes(element));
      if (matchedElements.length) score += matchedElements.length * 4;
      score += (hash(`${record.name}:${input.generationRound || 0}`) % 1000) / 10000;
      return { record, score, matchedElements };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    if (ranked.length < 5) throw new Error('条件过于严格，建议放宽避用字或辈分字位置');
    return {
      conditions: conditions(input, bazi, targets, corpus.length),
      names: ranked.map(({ record, matchedElements }) => ({
        name: record.name,
        pinyin: record.pinyin,
        meaning: record.meaning || '取自可定位的古典原文。',
        styleNotice: record.styleNotice || '',
        sourceLabel: record.sourceLabel || '原文出处',
        work: record.work || '已审核古典语料',
        quote: record.quote || '',
        extract: `取名自「${record.extracted || record.name}」· 已审核`,
        strokes: '静态版未接入笔画字典',
        same: '查询同名人数（公安部）',
        sameLink: officialSameName,
        figure: '百度搜索',
        figureLink: `https://www.baidu.com/s?wd=${encodeURIComponent(`${input.surname}${record.name} 公众人物`)}`,
        traditional: bazi.status === 'calculated_reference'
          ? `八字基础匹配：显性偏少 ${targets.join('、') || '无'}；此名按笔画五行匹配 ${matchedElements.join('、') || '无'}。${bazi.note}`
          : `八字：${bazi.note || '未选择'}；五格与方言提示暂未计算。`
      }))
    };
  };
  window.StaticNaming = { isStaticSite: location.hostname.endsWith('github.io'), generate };
})();
