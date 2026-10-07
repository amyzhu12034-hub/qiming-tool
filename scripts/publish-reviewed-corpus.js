/* 将审核台中标记为 approved 的候选，生成可上线的正式语料文件。 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const decisionsPath = path.join(root, 'data', 'review-decisions.json');
const approvedPath = path.join(root, 'data', 'approved-corpus.json');
if (!fs.existsSync(decisionsPath)) throw new Error('尚未生成审核决定，不能发布。');

const decisions = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
const queues = fs.readdirSync(path.join(root, 'data'))
  .filter(file => /^review-queue-[a-z]+\.json$/.test(file))
  .flatMap(file => JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8')));
const byId = new Map(queues.map(item => [item.id, item]));
const seenNames = new Set();
const published = decisions
  .filter(item => item.status === 'approved')
  .map(decision => {
    const source = byId.get(decision.id);
    if (!source) return null;
    return {
      ...source,
      themes: decision.themes?.length ? decision.themes : source.themes,
      meaning: decision.meaning?.trim() || source.meaning,
      styleNotice: decision.styleNotice?.trim() || source.styleNotice?.trim() || '',
      reviewStatus: 'approved',
      reviewedAt: decision.updatedAt,
      reviewNote: decision.note?.trim() || ''
    };
  })
  .filter(Boolean)
  .filter(record => {
    if (seenNames.has(record.name)) return false;
    seenNames.add(record.name);
    return true;
  });

fs.writeFileSync(approvedPath, JSON.stringify(published, null, 2) + '\n', 'utf8');
console.log(`已生成 ${published.length} 条正式发布语料：${approvedPath}`);
