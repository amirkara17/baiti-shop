const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items, customerDetails } = JSON.parse(event.body);

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

    const repoRes = await axios.get('https://raw.githubusercontent.com/amirkara17/baiti-shop/main/products.json');
    const officialProducts = repoRes.data;

    let totalPrice = 0;
    let orderSummary = "";

    for (const item of items) {
      if (!item || typeof item.id !== 'string') {
        return { statusCode: 400, body: "Invalid item id" };
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        return { statusCode: 400, body: "Invalid quantity" };
      }

      const official = officialProducts.find(p => p.id === item.id);
      if (!official) {
        return { statusCode: 400, body: `Unknown product id: ${item.id}` };
      }

      totalPrice += official.price * item.quantity;
      orderSummary += `- ${official.name} (כמות: ${item.quantity}, מחיר ליחידה: ${official.price} ₪)\n`;
    }

    console.log("הזמנה חדשה התקבלה:", { customerDetails, orderSummary, totalPrice });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Order calculated successfully",
        totalPrice,
        summary: orderSummary
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: "Server error"
    };
  }
};
