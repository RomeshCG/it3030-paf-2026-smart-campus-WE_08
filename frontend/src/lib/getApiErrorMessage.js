/**
 * Normalize axios / Spring error payloads for UI messages.
 */
export function getApiErrorMessage(err, fallback = 'Request failed') {
  if (!err?.response && typeof err?.message === 'string' && err.message) {
    if (err.message === 'Network Error') {
      return 'Cannot reach the server. Check that the backend is running and CORS allows this origin (localhost vs 127.0.0.1).';
    }
  }
  const d = err?.response?.data;
  if (d == null) {
    return typeof err?.message === 'string' && err.message ? err.message : fallback;
  }
  if (typeof d === 'string') {
    return d || fallback;
  }
  if (typeof d.message === 'string' && d.message.trim()) {
    return d.message;
  }
  if (typeof d.error === 'string' && d.error.trim()) {
    return d.error;
  }
  if (typeof d.detail === 'string' && d.detail.trim()) {
    return d.detail;
  }
  if (Array.isArray(d.errors)) {
    const msgs = d.errors
      .map((e) => (e && (e.defaultMessage || e.message)) || '')
      .filter(Boolean);
    if (msgs.length) return msgs.join(' ');
  }
  if (d.errors && typeof d.errors === 'object') {
    const parts = Object.entries(d.errors).flatMap(([, v]) => {
      if (Array.isArray(v)) return v;
      return v != null ? [v] : [];
    });
    const joined = parts.map(String).filter(Boolean).join(' ');
    if (joined) return joined;
  }
  return fallback;
}
