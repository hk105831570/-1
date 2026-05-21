module.exports = async (req, res) => {
  try {
    // Step 1: Login
    const loginResp = await fetch('http://47.102.101.20/training/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const loginData = await loginResp.json();

    if (loginData.code !== 200 || !loginData.data?.token) {
      return res.status(200).json({ error: 'login failed', loginData });
    }

    const token = loginData.data.token;

    // Step 2: Call employee/courses with the JWT token from admin login
    // (This will likely fail since admin doesn't have employee courses,
    //  but the key is whether the JWT is accepted)
    const coursesResp = await fetch('http://47.102.101.20/training/api/employee/courses', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const coursesText = await coursesResp.text();

    res.status(200).json({
      loginOk: true,
      coursesStatus: coursesResp.status,
      coursesBody: coursesText,
    });
  } catch (e) {
    res.status(200).json({ error: e.message, stack: e.stack });
  }
};
