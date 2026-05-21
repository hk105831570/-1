const BACKEND = 'http://47.102.101.20/training/api';

module.exports = async (req, res) => {
  // 去掉 /api/ 前缀，拼出后端完整路径
  const path = req.url.replace('/api/', '');
  const url = `${BACKEND}/${path}`;

  // 构建转发请求头（只保留关键头）
  const headers = { 'Content-Type': 'application/json' };
  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  try {
    const opt = { method: req.method, headers };
    // GET/HEAD 不带 body
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      opt.body = JSON.stringify(req.body);
    }

    const resp = await fetch(url, opt);
    const data = await resp.json();

    res.status(resp.status).json(data);
  } catch (e) {
    console.error('Proxy error:', e.message);
    res.status(502).json({ code: 502, message: '后端服务不可用', data: null });
  }
};
