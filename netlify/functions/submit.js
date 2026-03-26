const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items, customerDetails } = JSON.parse(event.body || "{}");

    if (!Array.isArray(items) || items.length === 0) {
      return { statusCode: 400, body: "Invalid items" };
    }

    if (
      !customerDetails ||
      typeof customerDetails.name !== 'string' ||
      typeof customerDetails.phone !== 'string' ||
      typeof customerDetails.addr !== 'string'
    ) {
      return { statusCode: 400, body: "Invalid customer details" };
    }

    const repoRes = await axios.get(
      'https://raw.githubusercontent.com/amirkara17/baiti-shop/main/products.js',
      { timeout: 10000 }
    );

    const content = repoRes.data;
    const productsMatch = content.match(/\[[\s\S]*\]/);

    if (!productsMatch) {
      return { statusCode: 500, body: "Could not parse products.js" };
    }

    const officialProducts = eval(productsMatch[0]);

    let totalPrice = 0;
    let orderSummary = "";

    for (const item of items) {
      if (!item || typeof item.name !== 'string') {
        return { statusCode: 400, body: "Invalid item name" };
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        return { statusCode: 400, body: "Invalid quantity" };
      }

      const official = officialProducts.find(p => p.name === item.name);
      if (!official) {
        return { statusCode: 400, body: `Unknown product name: ${item.name}` };
      }

      totalPrice += official.price * item.quantity;
      orderSummary += `- ${official.name} (כמות: ${item.quantity}, מחיר ליחידה: ${official.price} ₪)\n`;
    }

    console.log("הזמנה חדשה התקבלה:", {
      customerDetails,
      orderSummary,
      totalPrice
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Order calculated successfully",
        totalPrice,
        summary: orderSummary
      })
    };
  } catch (error) {
    console.error("submit.js error:", error);
    return {
      statusCode: 500,
      body: error.message || "Server error"
    };
  }
};
