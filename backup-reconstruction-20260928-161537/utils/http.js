// Petite aide pour appeler des API publiques (fetch est natif dans Node 18+)
async function getJson(url, timeout = 8000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    headers: { "User-Agent": "ServerManagerBot/2.0" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

module.exports = { getJson };
