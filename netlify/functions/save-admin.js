exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: 'Missing GITHUB_TOKEN' })
      };
    }

    const { products, categories, password } = JSON.parse(event.body || '{}');

    if (!adminPassword || password !== adminPassword) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: 'סיסמת ניהול שגויה' })
      };
    }

    if (!Array.isArray(products) || !Array.isArray(categories)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: 'Invalid payload' })
      };
    }

    const owner = 'amirkara17';
    const repo = 'baiti-shop';
    const branch = 'main';

    async function githubRequest(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          ...(options.headers || {})
        }
      });

      const text = await response.text();

      let data;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        throw new Error(
          (data && data.message) || text || `GitHub request failed: ${response.status}`
        );
      }

      return data;
    }

    async function getFile(path) {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      return await githubRequest(url, { method: 'GET' });
    }

    async function updateFile(path, varName, dataArray) {
      const current = await getFile(path);

      const newContent = `const ${varName} = ${JSON.stringify(dataArray, null, 4)};\n`;
      const encoded = Buffer.from(newContent, 'utf8').toString('base64');

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      await githubRequest(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Update ${path}`,
          content: encoded,
          sha: current.sha,
          branch
        })
      });
    }

    await updateFile('products.js', 'myProducts', products);
    await updateFile('categories.js', 'myCategories', categories);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Saved successfully' })
    };
  } catch (error) {
    console.error('save-admin error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Server error'
      })
    };
  }
};
