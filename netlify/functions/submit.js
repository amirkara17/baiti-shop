exports.handler = async function(event, context) {
    // חסימת כל בקשה שהיא לא שליחת נתונים
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const data = JSON.parse(event.body);
        const { cart, name, phone, address } = data;

        // 🛑 המחירון הסודי והמוגן של השרת 🛑
        // חשוב: אם בעתיד תוסיף מוצר או תשנה מחיר באתר, חובה לעדכן גם פה!
        const securePrices = {
            "طقم فاخر": 170,
            "طقم أكواب الزهور": 140,
            "طقم القلعة الكلاسيكي": 99,
            "أكواب بتصاميم مميزة": 35,
            "كوب القطة ماري - ديزني": 50,
            "كوب ستيتش - ديزني": 50,
            "كوب ميني ماوس - ديزني": 50
        };

        let realTotal = 0;
        let orderDetails = "";

        // השרת סורק את העגלה שהלקוח שלח, ומחשב את המחיר בעצמו מול המחירון הסודי
        cart.forEach(item => {
            const realPrice = securePrices[item.name];
            if (realPrice && item.quantity > 0) { 
                realTotal += (realPrice * item.quantity);
                orderDetails += `- ${item.name} (الكمية: ${item.quantity}) - ₪${realPrice * item.quantity}\n`;
            }
        });

        if (realTotal === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Cart is empty or invalid" }) };
        }

        // השרת מתקשר עם FormSubmit בעצמו, הלקוח לא יכול לראות את זה!
        const formSubmitUrl = "https://formsubmit.co/ajax/amirkara99@gmail.com";
        
        const response = await fetch(formSubmitUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                "اسم الزبون": name,
                "رقم الهاتف": phone,
                "العنوان": address,
                "تفاصيل الطلب": orderDetails,
                "المجموع الكلي": "₪" + realTotal,
                "_subject": "طلب جديد من متجر Baiti! 🏠 (מאובטח דרך השרת)"
            })
        });

        if (!response.ok) throw new Error("FormSubmit failed");

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Order processed securely" })
        };

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: "Server Error" }) };
    }
};
