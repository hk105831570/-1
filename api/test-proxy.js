module.exports = async (req, res) => {
  try {
    // Test if we can reach the backend from Vercel's network
    const resp = await fetch('http://47.102.101.20/training/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const text = await resp.text();
    res.status(200).json({
      backendStatus: resp.status,
      backendOk: resp.ok,
      body: text,
      headers: Object.fromEntries(resp.headers.entries()),
    });
  } catch (e) {
    res.status(200).json({ error: e.message, stack: e.stack });
  }
};
