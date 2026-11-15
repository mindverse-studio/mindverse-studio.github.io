(() => {
  'use strict';
  // Existing archive email-collection service; never use it for full inquiries.
  const endpoint = "https://script.google.com/macros/s/AKfycbyMOuZ-fyRw1w7wyqUb4kydViXYUa2k1f41DxeShzBUr5xaNU4V5J8yPOgeX-8z8I9dmA/exec";
  const configured = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint);
  function parseReply(text) {
    const body = String(text || '').trim();
    let reply;
    try { reply = JSON.parse(body); } catch { /* The legacy service may return plain text. */ }
    if (reply && typeof reply === 'object') {
      const status = String(reply.status || reply.result || '').toLowerCase();
      if (reply.success === false || reply.error || ['error','failed','failure'].includes(status)) throw new Error('Subscription rejected');
      if (reply.success === true || ['success','ok','subscribed'].includes(status)) return true;
    }
    if (/^(ok|success|subscribed|subscription successful)[.!]?$/i.test(typeof reply === 'string' ? reply : body)) return true;
    throw new Error('Subscription acknowledgment not recognized');
  }
  async function send(email, {fetchImpl = (...args) => fetch(...args), timeoutMs = 20000} = {}) {
    if (!configured) throw new Error('Subscription service unavailable');
    const data = new FormData(); data.append('email', String(email).trim());
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {method:'POST',body:data,signal:controller.signal});
      if (!response.ok) throw new Error('Subscription service unavailable');
      return parseReply(await response.text());
    } finally { clearTimeout(timer); }
  }
  window.MindverseSubscriptionService = Object.freeze({send,parseReply,configured});
})();
