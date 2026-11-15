(() => {
  'use strict';
  // Kept in sync by the release builder from deployment.json. Never put an inbox here.
  const endpoint = "https://script.google.com/macros/s/AKfycbw3BBoM39pujwyMHbwvvKuT5XRgDsv0Esb4KQEkam5ksfpIApYNtQlR5DI-YF5JF9hF/exec";
  const configured = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);

  function parseReply(text, requestId) {
    let reply;
    try { reply = JSON.parse(text); } catch { throw new Error('Invalid contact acknowledgment'); }
    if (reply?.success !== true || reply.type !== 'contact' || reply.delivery !== 'queued' || reply.request_id !== requestId || reply.error) {
      throw new Error('Contact send could not be confirmed');
    }
    return reply;
  }

  async function send(fields, {fetchImpl = (...args) => fetch(...args), timeoutMs = 20000} = {}) {
    if (!configured) throw new Error('Contact service is not configured');
    const requestId = crypto.randomUUID();
    const data = new FormData();
    for (const field of ['name', 'email', 'subject', 'message']) data.append(field, String(fields[field] || ''));
    data.append('request_id', requestId);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {method: 'POST', body: data, signal: controller.signal});
      if (!response.ok) throw new Error('Contact service unavailable');
      return parseReply(await response.text(), requestId);
    } finally { clearTimeout(timer); }
  }

  window.MindverseContactService = Object.freeze({send, parseReply, configured});
})();
