/* 应用用户对“风格较特别”候选的最终决定：仅保留已明确确认的项目。 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const decisionsPath = path.join(root, 'data', 'review-decisions.json');
if (!fs.existsSync(decisionsPath)) throw new Error('未找到本地审核决定。');

const decisions = JSON.parse(fs.readFileSync(decisionsPath, 'utf8'));
const confirmedId = '39bc0609002d2be80cd6'; // 宋词「瑶佩」
let retained = 0;
let rejected = 0;
const updated = decisions.map(decision => {
  if (decision.styleNotice !== '风格较特别') return decision;
  const isConfirmed = decision.id === confirmedId;
  if (isConfirmed) retained += 1; else rejected += 1;
  return {
    ...decision,
    status: isConfirmed ? 'approved' : 'rejected',
    styleNotice: '',
    note: isConfirmed
      ? '用户逐项确认保留：瑶佩可作为正式候选。'
      : '用户逐项确认不收录：不符合当前产品的正式推荐标准。',
    updatedAt: new Date().toISOString()
  };
});
fs.writeFileSync(decisionsPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
console.log(`已应用用户决定：保留 ${retained} 条，拒绝 ${rejected} 条原“风格较特别”候选。`);
