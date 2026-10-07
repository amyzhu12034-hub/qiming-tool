const form = document.getElementById('namingForm');
const formSection = document.getElementById('formSection');
const resultsSection = document.getElementById('resultsSection');
const cards = document.querySelectorAll('.preference-card');
const sourceInput = document.getElementById('source');
const wishInput = document.getElementById('wish');
const resultGrid = document.getElementById('resultGrid');
let round = 0;
let generatedNames = null;
let backendConditions = null;
// 既支持通过 http://localhost:3000 打开，也支持直接双击 index.html 打开。
// 后一种场景下，接口仍由本机 Node 服务提供。
const backendBase = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
const backendUrl = path => `${backendBase}${path}`;

const nameSets = [
  [
    { name: '清扬', pinyin: 'qīng yáng', meaning: '眉目清秀，神采飞扬，温柔而明朗。', work: '《诗经·郑风·野有蔓草》', quote: '有美一人，清扬婉兮。', extract: '取名自「清扬」二字', strokes: '11 / 6 画', same: '约 1,246 人', figure: '未发现高置信度公众人物' },
    { name: '维桢', pinyin: 'wéi zhēn', meaning: '如栋梁般坚实可靠，也有守护与担当。', work: '《诗经·大雅·文王》', quote: '王国克生，维周之桢。', extract: '取名自「维」「桢」二字', strokes: '11 / 10 画', same: '约 368 人', figure: '维桢｜公开资料中的同名人物' },
    { name: '攸宁', pinyin: 'yōu níng', meaning: '心有所安，安稳自在地长大。', work: '《诗经·小雅·斯干》', quote: '君子攸宁。', extract: '取名自「攸宁」二字', strokes: '7 / 5 画', same: '约 821 人', figure: '未发现高置信度公众人物' },
    { name: '嘉树', pinyin: 'jiā shù', meaning: '嘉美如树，根深叶茂，生机盎然。', work: '《楚辞·九章·橘颂》', quote: '后皇嘉树，橘徕服兮。', extract: '取名自「嘉树」二字', strokes: '14 / 9 画', same: '约 95 人', figure: '嘉树｜作家笔名（同名）' },
    { name: '既明', pinyin: 'jì míng', meaning: '通达明辨，也拥有清醒温和的内心。', work: '《诗经·大雅·烝民》', quote: '既明且哲，以保其身。', extract: '取名自「既明」二字', strokes: '9 / 8 画', same: '约 537 人', figure: '未发现高置信度公众人物' }
  ],
  [
    { name: '静姝', pinyin: 'jìng shū', meaning: '娴静美好，温柔而自有光彩。', work: '《诗经·邶风·静女》', quote: '静女其姝，俟我于城隅。', extract: '取名自「静」「姝」二字', strokes: '14 / 9 画', same: '约 1,025 人', figure: '未发现高置信度公众人物' },
    { name: '其琛', pinyin: 'qí chēn', meaning: '珍贵如宝，也保有谦和的分寸感。', work: '《诗经·鲁颂·泮水》', quote: '憬彼淮夷，来献其琛。', extract: '取名自「其琛」二字', strokes: '8 / 12 画', same: '约 64 人', figure: '其琛｜公开资料中的同名人物' },
    { name: '燕绥', pinyin: 'yàn suí', meaning: '宴乐安舒，愿人生从容顺遂。', work: '《诗经·小雅·南有嘉鱼》', quote: '君子有酒，嘉宾式燕绥之。', extract: '取名自「燕绥」二字', strokes: '16 / 13 画', same: '约 406 人', figure: '未发现高置信度公众人物' },
    { name: '柔嘉', pinyin: 'róu jiā', meaning: '温润善良，同时具备美好的品性。', work: '《诗经·大雅·抑》', quote: '敬尔威仪，无不柔嘉。', extract: '取名自「柔嘉」二字', strokes: '9 / 14 画', same: '约 728 人', figure: '柔嘉｜古籍人物名（同名）' },
    { name: '怀瑾', pinyin: 'huái jǐn', meaning: '怀抱美玉，比喻拥有高洁美好的品德。', work: '《楚辞·九章·怀沙》', quote: '怀瑾握瑜兮，穷不知所示。', extract: '取名自「怀瑾」二字', strokes: '7 / 15 画', same: '约 682 人', figure: '怀瑾｜公开资料中的同名人物' }
  ]
];

function toggleFields() {
  document.querySelectorAll('.data-field').forEach(field => {
    const isSelected = [...document.querySelectorAll('input[name="condition"]:checked')].some(input => input.value === field.dataset.requires);
    field.classList.toggle('disabled', !isSelected);
    field.querySelectorAll('input, select').forEach(input => { input.disabled = !isSelected; });
  });
}

cards.forEach(card => {
  const checkbox = card.querySelector('input');
  checkbox.addEventListener('change', () => {
    card.classList.toggle('checked', checkbox.checked);
    toggleFields();
  });
});
toggleFields();

function selectedConditions() {
  const values = [...document.querySelectorAll('input[name="condition"]:checked')].map(el => el.value);
  const labels = [];
  if (values.includes('八字')) labels.push('出生信息 / 八字参考');
  if (values.includes('胎次')) labels.push(`${document.getElementById('birthOrder').value}${document.getElementById('siblingName').value ? ' · 呼应一胎思路' : ''}`);
  if (values.includes('出处')) labels.push(sourceInput.value ? `偏爱：${sourceInput.value}` : '文化出处');
  if (values.includes('期望')) labels.push(wishInput.value ? `期望：${wishInput.value}` : '平安喜乐与品性');
  if (values.includes('笔画') && document.getElementById('strokes').value) labels.push(document.getElementById('strokes').value);
  if (values.includes('避讳') && document.getElementById('avoid').value) labels.push(`避开：${document.getElementById('avoid').value}`);
  return labels.length ? labels : ['简洁、好读、有美好寓意'];
}

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function renderResults(isRevision = false) {
  const surname = document.getElementById('surname').value.trim() || '林';
  const selected = backendConditions || selectedConditions();
  const names = generatedNames || nameSets[round % nameSets.length];
  document.getElementById('resultSurname').textContent = surname;
  document.getElementById('conditionStrip').innerHTML = selected.map(item => `<span class="condition-tag">${escapeHtml(item)}</span>`).join('');
  resultGrid.innerHTML = names.map((item, index) => {
    const basis = selected.slice(0, 3).join('、');
    return `<article class="name-card">
      <div class="card-top"><span class="number">0${index + 1}</span><button class="save-btn" type="button" aria-pressed="false">♡ 收藏</button></div>
      <h3 class="full-name">${escapeHtml(surname)}${item.name}</h3>${item.pinyin ? `<p class="pinyin">${escapeHtml(item.pinyin)}</p>` : ''}
      <p class="meaning">${item.meaning}</p>${item.styleNotice ? `<p class="style-notice">${escapeHtml(item.styleNotice)}</p>` : ''}
      <div class="source-block"><span class="source-label">原文出处 · ${item.work}</span><q>${item.quote}</q><span class="source-extract">${item.extract}</span></div>
      <div class="facts"><div><span class="fact-label">笔画</span><span class="fact-value">${item.strokes}</span></div><div><span class="fact-label">全国同名</span><a class="lookup-link" href="${item.sameLink}" target="_blank" rel="noopener">${item.same} ↗</a></div></div>
      <p class="basis">依据：结合${escapeHtml(basis)}推荐。<br>${escapeHtml(item.traditional)}<br>公开同名人物：<a class="lookup-link" href="${item.figureLink}" target="_blank" rel="noopener">${item.figure} ↗</a></p>
    </article>`;
  }).join('');
  resultGrid.querySelectorAll('.save-btn').forEach(button => button.addEventListener('click', () => {
    const saved = button.classList.toggle('saved');
    button.setAttribute('aria-pressed', saved);
    button.textContent = saved ? '♥ 已收藏' : '♡ 收藏';
  }));
  formSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  if (!isRevision) resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function buildPayload(revision = '', generationRound = 0) {
  return {
    surname: document.getElementById('surname').value.trim(),
    gender: document.querySelector('input[name="gender"]:checked')?.value || '中性',
    givenNameLength: document.getElementById('givenNameLength').value,
    conditions: [...document.querySelectorAll('input[name="condition"]:checked')].map(input => input.value),
    birthDate: document.getElementById('birthDate').value,
    birthTime: document.getElementById('birthTime').value,
    birthLocation: document.getElementById('birthLocation').value.trim(),
    birthOrder: document.getElementById('birthOrder').value,
    siblingName: document.getElementById('siblingName').value.trim(),
    source: sourceInput.value.trim(), wish: wishInput.value.trim(),
    generationChar: document.getElementById('generationChar').value.trim(),
    generationPosition: document.getElementById('generationPosition').value,
    dialect: document.getElementById('dialect').value,
    strokes: document.getElementById('strokes').value.trim(),
    avoid: document.getElementById('avoid').value.trim(), revision, generationRound
  };
}

async function loadFromBackend(endpoint, payload) {
  if (window.StaticNaming?.isStaticSite) {
    const data = await window.StaticNaming.generate(payload);
    backendConditions = data.conditions;
    generatedNames = data.names;
    return;
  }
  const response = await fetch(backendUrl(endpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '生成失败');
  backendConditions = data.conditions;
  generatedNames = data.names.map(item => {
    const analysis = item.nameAnalysis;
    const strokeText = analysis.strokes ? `姓 ${analysis.strokes.surname}｜名 ${analysis.strokes.given.join(' / ')} 画` : '笔画字库待补充';
    const gridText = analysis.status === 'calculated_reference' ? `五格参考：${Object.entries(analysis.grids).map(([label, value]) => `${label}${value.value}（${value.element}）`).join('、')}` : analysis.note || '五格未选择';
    const baziText = item.baziNaming.status === 'partial_element_matching' ? `八字基础匹配：显性偏少 ${item.baziNaming.targetElements.join('、') || '无'}；名字匹配 ${item.baziNaming.matchedNameElements.join('、') || '无'}` : '';
    const dialectText = item.dialectCheck.status === 'partial_lexicon_check' ? `方言初筛：${item.dialectCheck.matches.length ? item.dialectCheck.matches.map(match => match.reason).join('；') : item.dialectCheck.note}` : item.dialectCheck.status === 'dictionary_not_configured' ? `方言提示：${item.dialectCheck.note}` : '';
    return { name: item.givenName, pinyin: item.pinyin, meaning: item.meaning, styleNotice: item.styleNotice,
      work: item.source.work, quote: item.source.original,
      extract: `${item.source.note || `取名自「${item.source.extractedCharacters}」`} · 已校验`,
      strokes: strokeText, same: '查询同名人数（公安部）', figure: '百度搜索', sameLink: backendUrl('/api/lookups/same-name?redirect=1'), figureLink: backendUrl(`/api/lookups/public-figures?redirect=1&name=${encodeURIComponent(item.fullName)}`), traditional: `${gridText}${baziText ? `；${baziText}` : ''}${dialectText ? `；${dialectText}` : ''}` };
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  const label = button.textContent;
  button.disabled = true; button.textContent = '正在从语料库检索…';
  try { round = 0; await loadFromBackend('/api/names/generate', buildPayload('', round)); renderResults(); }
  catch (error) { window.alert(window.StaticNaming?.isStaticSite ? `${error.message}。请刷新页面后重试。` : `${error.message}。请运行 node server.js，并通过 http://localhost:3000 打开页面。`); }
  finally { button.disabled = false; button.textContent = label; }
});

document.getElementById('backToForm').addEventListener('click', () => {
  resultsSection.classList.add('hidden');
  formSection.classList.remove('hidden');
  formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('regenerateButton').addEventListener('click', async event => {
  const revision = document.getElementById('revision').value.trim();
  const button = event.currentTarget;
  const label = button.textContent;
  button.disabled = true; button.textContent = '正在重新检索…';
  try {
    const nextRound = round + 1;
    await loadFromBackend('/api/names/refine', buildPayload(revision, nextRound));
    round = nextRound;
    renderResults(true);
    document.getElementById('revision').value = '';
  }
  catch (error) { window.alert(error.message); }
  finally { button.disabled = false; button.textContent = label; }
});
