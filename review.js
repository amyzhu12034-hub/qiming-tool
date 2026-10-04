const $ = selector => document.querySelector(selector);
const list = $('#list');
const notice = $('#notice');
const template = $('#card-template');

function setNotice(message, error = false) { notice.textContent = message; notice.style.color = error ? '#a54d4d' : ''; }
function renderSummary(summary) { $('#summary').replaceChildren(...Object.entries(summary).map(([label, count]) => { const el = document.createElement('span'); el.textContent = `${label} ${count}`; return el; })); }
async function api(url, options) { const response = await fetch(url, options); const data = await response.json(); if (!response.ok) throw new Error(data.error || '操作失败'); return data; }
function card(item) {
  const node = template.content.firstElementChild.cloneNode(true);
  $('.name', node).textContent = item.name;
  $('.state', node).textContent = item.decision?.status === 'approved' ? '已通过' : item.decision?.status === 'hold' ? '暂缓' : item.decision?.status === 'rejected' ? '已拒绝' : '待审核';
  $('.source', node).textContent = item.work;
  $('.quote', node).textContent = item.quote;
  $('.meaning', node).value = item.decision?.meaning || item.meaning;
  $('.note', node).value = item.decision?.note || '';
  $('.meta', node).replaceChildren(...item.themes.map(theme => { const tag = document.createElement('span'); tag.textContent = theme; return tag; }));
  $('.checklist', node).replaceChildren(...item.checklist.map(check => { const tag = document.createElement('span'); tag.textContent = `${check.ok ? '✓' : '!' } ${check.label}`; return tag; }));
  const search = $('.search', node); search.href = `https://www.baidu.com/s?wd=${encodeURIComponent(`${item.name} 姓名`)}`;
  $('.duplicate', node).href = 'https://ywtb.mps.gov.cn/?device=mobile';
  $('.decision', node).addEventListener('click', async event => {
    const status = event.target.dataset.status; if (!status) return;
    try {
      await api('/api/review/decision', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ id:item.id, status, meaning:$('.meaning', node).value, note:$('.note', node).value }) });
      setNotice(`「${item.name}」已标记为${status === 'approved' ? '通过' : status === 'hold' ? '暂缓' : '拒绝'}。`); load();
    } catch (error) { setNotice(error.message, true); }
  });
  return node;
}
async function load() {
  setNotice('正在读取本地审核队列…');
  try { const data = await api(`/api/review/queue?source=${$('#source').value}&status=${$('#status').value}`); renderSummary(data.summary); list.replaceChildren(...data.items.map(card)); setNotice(data.items.length ? `显示 ${data.items.length} 条记录。` : '没有符合条件的记录。'); } catch (error) { setNotice(error.message, true); }
}
$('#reload').addEventListener('click', load); $('#source').addEventListener('change', load); $('#status').addEventListener('change', load);
$('#publish').addEventListener('click', async () => { try { const result = await api('/api/review/publish', { method:'POST' }); setNotice(`已生成 ${result.count} 条正式语料。部署前请检查 Git 变更。`); load(); } catch (error) { setNotice(error.message, true); } });
load();
