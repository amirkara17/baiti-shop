const axios = require('axios');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items, customerDetails } = JSON.parse(event.body);

    // שואב את נתוני המוצרים האמיתיים מהגיטהאב שלך כדי לאמת מחירים
    const repoRes = await axios.get('https://raw.githubusercontent.com/amirkara17/baiti-shop/main/products.js');
    const content = repoRes.data;
    const productsMatch = content.match(/\[[\s\S]*\]/);
    const officialProducts = eval(productsMatch[0]);

    let totalPrice = 0;
    let orderSummary = "";

    // חישוב מאובטח - לוקח מחיר רק מהקובץ הרשמי
    items.forEach(item => {
      const official = officialProducts.find(p => p.name === item.name);
      if (official) {
        const price = official.price;
        totalPrice += price * item.quantity;
        orderSummary += `- ${item.name} (כמות: ${item.quantity}, מחיר ליחידה: ${price} ₪)\n`;
      }
    });

    // כאן אפשר להוסיף שליחה למייל או לוואטסאפ (כרגע מחזיר אישור)
    console.log("הזמנה חדשה התקבלה:", { customerDetails, orderSummary, totalPrice });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Order calculated successfully", 
        totalPrice: totalPrice,
        summary: orderSummary
      })
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
