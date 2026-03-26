const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { statusCode: 500, body: 'Missing GITHUB_TOKEN in Netlify environment variables' };
    }

    const { products, categories } = JSON.parse(event.body || '{}');

    if (!Array.isArray(products) || !Array.isArray(categories)) {
      return { statusCode: 400, body: 'Invalid payload' };
    }

    const owner = 'amirkara17';
    const repo = 'baiti-shop';
    const branch = 'main';

    async function getFile(path) {
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json'
        }
      });
      return res.data;
    }

    async function updateFile(path, varName, dataArray) {
      const current = await getFile(path);

      const newContent = `const ${varName} = ${JSON.stringify(dataArray, null, 4)};\n`;
      const encoded = Buffer.from(newContent, 'utf8').toString('base64');

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      await axios.put(
        url,
        {
          message: `Update ${path}`,
          content: encoded,
          sha: current.sha,
          branch
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json'
          }
        }
      );
    }

    await updateFile('products.js', 'myProducts', products);
    await updateFile('categories.js', 'myCategories', categories);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Saved successfully' })
    };
  } catch (error) {
    console.error('save-admin error:', error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: error.response?.data?.message || error.message || 'Server error'
      })
    };
  }
};
