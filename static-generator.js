/* GitHub Pages 静态试用版：推荐逻辑与已审核语料均在浏览器本地运行。 */
(() => {
  // 公安部“查询同名人数”官方直达入口。需由用户在官方页面自行填写姓名。
  const officialSameName = 'https://ywtb.mps.gov.cn/newhome/portal/cmcx';
  let corpusPromise;
  const loadCorpus = () => corpusPromise ||= fetch('./data/client-corpus.json').then(response => {
    if (!response.ok) throw new Error('本地语料加载失败');
    return response.json();
  });
  const chars = value => Array.from(value || '');
  const category = record => {
    const work = record.work || '';
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
  const conditions = input => {
    const selected = input.conditions || [];
    const tags = ['静态试用版 · 221 条已审核语料'];
    if (selected.includes('出生信息 / 八字') || selected.includes('八字')) tags.push('八字：静态版暂不计算');
    if (selected.includes('胎次')) tags.push(`${input.birthOrder || '一胎'}${input.siblingName ? ' · 呼应一胎思路' : ''}`);
    if (selected.includes('出处')) tags.push(input.source ? `偏爱：${input.source}` : '文化出处');
    if (selected.includes('期望')) tags.push(input.wish ? `期望：${input.wish}` : '美好品性');
    if (selected.includes('辈分') && input.generationChar) tags.push(`辈分字「${input.generationChar}」`);
    if (input.strokes) tags.push(input.strokes);
    if (input.avoid) tags.push(`避开：${input.avoid}`);
    return tags;
  };
  const generate = async input => {
    const corpus = await loadCorpus();
    const sourceTags = wants(input.source || '', {
      '诗经':['诗经'], '楚辞':['楚辞'], '唐诗':['唐诗'], '宋词':['宋词'], '论语':['论语'],
      '儒家':['儒家经典'], '周易':['十三经与诸子'], '古文':['古文'], '元曲':['元曲'],
      '纳兰':['纳兰词'], '哲学':['哲学与先秦古籍']
    });
    const wishTags = wants(input.wish || '', {
      '平安':['平安'], '喜乐':['喜乐'], '温柔':['温柔'], '智慧':['智慧'], '品性':['品性'],
      '志向':['志向'], '自在':['自在'], '自然':['自然'], '坚定':['坚定'], '勇敢':['勇敢'], '明朗':['明朗']
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
      score += (hash(`${record.name}:${input.generationRound || 0}`) % 1000) / 10000;
      return { record, score };
    }).sort((a, b) => b.score - a.score).slice(0, 5);
    if (ranked.length < 5) throw new Error('条件过于严格，建议放宽避用字或辈分字位置');
    return {
      conditions: conditions(input),
      names: ranked.map(({ record }) => ({
        name: record.name,
        pinyin: record.pinyin || '读音待人工确认',
        meaning: record.meaning || '取自可定位的古典原文。',
        styleNotice: record.styleNotice || '',
        work: record.work || '已审核古典语料',
        quote: record.quote || '',
        extract: `取名自「${record.extracted || record.name}」· 已审核`,
        strokes: '静态版未接入笔画字典',
        same: '查询同名人数（公安部）',
        sameLink: officialSameName,
        figure: '百度搜索',
        figureLink: `https://www.baidu.com/s?wd=${encodeURIComponent(`${input.surname}${record.name} 公众人物`)}`,
        traditional: '静态试用版：八字、五格与方言提示暂不计算，供偏好筛选与出处阅读使用。'
      }))
    };
  };
  window.StaticNaming = { isStaticSite: location.hostname.endsWith('github.io'), generate };
})();
