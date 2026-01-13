async function testChatApi() {
    console.log("📡 TESTING CHAT API ENDPOINT...");

    const payload = {
        messages: [
            { role: "user", content: "Receive PO-TEST-101 into Texas" }
        ],
        context: { activeSite: "Texas" }
    };

    try {
        const res = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.error(`HTTP Check Failed: ${res.status} ${res.statusText}`);
            const txt = await res.text();
            console.error(txt);
            return;
        }

        const data = await res.json();
        console.log("✅ API RESPONSE RECEIVED:");
        console.log("------------------------------------------------");
        console.log(data.content);
        console.log("------------------------------------------------");

    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

testChatApi();
