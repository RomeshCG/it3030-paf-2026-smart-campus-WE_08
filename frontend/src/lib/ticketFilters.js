export function filterTicketsLocal(tickets, { search, status, priority, category }) {
  const q = (search || '').trim().toLowerCase();
  return (tickets || []).filter((t) => {
    if (category && category !== 'ALL' && t.category !== category) return false;
    if (status && status !== 'ALL' && t.status !== status) return false;
    if (priority && priority !== 'ALL' && t.priority !== priority) return false;
    if (q) {
      const title = (t.title || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      if (!title.includes(q) && !cat.includes(q)) return false;
    }
    return true;
  });
}
