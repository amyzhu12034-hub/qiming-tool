/*
 * 语料审计：验证正式库的最小证据链，并在本地存在审核队列时验证每条候选都有最终决定。
 * 不判断姓名审美；审美分歧必须由审核决定和 styleNotice 显式记录。
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const approved = readJson('data/approved-corpus.json');
const ctext = readJson('data/ctext-cross-verification.json');
const errors = [];

const names = new Set();
approved.forEach(record => {
  const label = `${record.collection || 'unknown'}:${record.name || '未命名'}`;
  if (!record.name || !record.work || !record.quote || !record.extracted || !record.meaning) errors.push(`${label} 缺少名称、出处、原文、取字或内涵。`);
  if (names.has(record.name)) errors.push(`${label} 与正式库已有同名记录重复。`);
  names.add(record.name);
  if (record.styleNotice && record.styleNotice !== '风格较特别') errors.push(`${label} 的风格提示不在受控词表中。`);
});

const ctextNames = new Set(ctext.records.map(record => record.name));
ctext.records.forEach(record => {
  if (!names.has(record.name)) errors.push(`CTP 台账「${record.name}」未进入正式库。`);
  if (!record.urn || !record.chapterUrl || !['source_excerpt_confirmed', 'chapter_located'].includes(record.status)) errors.push(`CTP 台账「${record.name}」缺少可用定位信息。`);
});

const queueFiles = ['shijing', 'tang', 'song', 'wikisource']
  .map(source => path.join(root, 'data', `review-queue-${source}.json`))
  .filter(fs.existsSync);
const decisionsPath = path.join(root, 'data', 'review-decisions.json');
let localReview = null;
if (queueFiles.length && fs.existsSync(decisionsPath)) {
  const queues = queueFiles.flatMap(file => JSON.parse(fs.readFileSync(file, 'utf8')));
  const decisions = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
  const decisionById = new Map(decisions.map(item => [item.id, item]));
  const allowed = new Set(['approved', 'rejected']);
  queues.forEach(record => {
    const decision = decisionById.get(record.id);
    if (!decision || !allowed.has(decision.status)) errors.push(`${record.collection}:${record.name} 未取得最终审核决定。`);
  });
  localReview = {
    candidates: queues.length,
    approved: queues.filter(record => decisionById.get(record.id)?.status === 'approved').length,
    rejected: queues.filter(record => decisionById.get(record.id)?.status === 'rejected').length,
    ctextMapped: ctextNames.size
  };
}

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok: true,
  formalRecords: approved.length,
  distinctiveRecords: approved.filter(record => record.styleNotice === '风格较特别').length,
  ctextRecords: ctext.records.length,
  localReview
}, null, 2));
