// שרת Anthropic מדומה – לבדיקות הקצה-לקצה בלבד (לא חלק מהמוצר). מדמה את ה-Messages API.
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT || 4010);

function lastUserText(body) {
  const m = body.messages[body.messages.length - 1];
  if (typeof m.content === "string") return m.content;
  return m.content.filter((p) => p.type === "text").map((p) => p.text).join("\n");
}
function imageWidth(body) {
  const m = body.messages[body.messages.length - 1];
  if (typeof m.content === "string") return null;
  const img = m.content.find((p) => p.type === "image");
  if (!img) return null;
  const buf = Buffer.from(img.source.data, "base64");
  // PNG: IHDR width at bytes 16..19 ; JPEG: לא נתמך כאן, נחשב "קריא"
  return buf.slice(1, 4).toString() === "PNG" ? buf.readUInt32BE(16) : 64;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const requests = [];

const server = http.createServer(async (req, res) => {
  if (req.url === "/__requests") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(requests));
  }
  if (req.url === "/__reset") {
    requests.length = 0;
    res.writeHead(200);
    return res.end("ok");
  }
  if (req.method !== "POST" || !req.url.endsWith("/v1/messages")) {
    res.writeHead(404);
    return res.end();
  }
  let raw = "";
  for await (const c of req) raw += c;
  const body = JSON.parse(raw);
  requests.push({ system: body.system, messages: body.messages, stream: body.stream, key: req.headers["x-api-key"] });
  const text = lastUserText(body);
  const system = body.system || "";

  if (text.includes("MOCK_429")) { res.writeHead(429); return res.end("{}"); }
  if (text.includes("MOCK_500")) { res.writeHead(500); return res.end("{}"); }

  let output;
  if (system.includes("קרוא תרגיל מתוך תמונה") || system.includes("תיקן את נוסח השאלה")) {
    const w = imageWidth(body);
    if (w !== null && w >= 60) {
      output = JSON.stringify({ readable: false, detected: "", questionText: "", topic: "", hint: "ניחוש", steps: ["ניחוש"], finalAnswer: "42", confidence: "low", note: "התמונה מטושטשת מדי לקריאה" });
    } else if (text.includes("3x = 12")) {
      output = JSON.stringify({ readable: true, detected: "משוואה ממעלה ראשונה", questionText: "$3x = 12$", topic: "משוואות", hint: "חלק את שני האגפים ב-3", steps: ["$3x = 12$", "$x = 4$"], finalAnswer: "$x = 4$", confidence: "high", note: "" });
    } else {
      output = JSON.stringify({ readable: true, detected: "משוואה ממעלה ראשונה", questionText: "$2x + 3 = 11$", topic: "משוואות", hint: "חסר 3 משני האגפים", steps: ["$2x = 8$", "$x = 4$"], finalAnswer: "$x = 4$", confidence: "medium", note: "הספרה האחרונה נראתה חלקית" });
    }
  } else if (system.includes("מחולל סיכומי לימוד")) {
    output = JSON.stringify({ title: "סיכום מדומה: משפט פיתגורס", content: "## משפט פיתגורס\n\nבמשולש ישר-זווית: $a^2+b^2=c^2$\n\n- היתר הוא הצלע הארוכה ביותר" });
  } else if (system.includes("מחולל כרטיסיות")) {
    output = JSON.stringify({ cards: [
      { front: "מהו משפט פיתגורס?", back: "$a^2+b^2=c^2$", topic: "פיתגורס" },
      { front: "מהו היתר?", back: "הצלע מול הזווית הישרה", topic: "פיתגורס" },
    ] });
  } else if (system.includes("מחולל שאלות מבחן")) {
    output = JSON.stringify({ questions: [
      { type: "mcq", topic: "פיתגורס", prompt: "כמה הוא $3^2+4^2$?", options: ["7", "25", "12", "49"], answerKey: "1", explanation: "9+16=25", difficulty: 2 },
      { type: "tf", topic: "פיתגורס", prompt: "היתר הוא הצלע הקצרה ביותר", options: [], answerKey: "false", explanation: "היתר הוא הארוך ביותר", difficulty: 1 },
      { type: "mcq", topic: "שבור", prompt: "שאלה שבורה", options: ["א", "ב"], answerKey: "9", explanation: "", difficulty: 1 },
    ] });
  } else if (system.includes("בודק תשובה פתוחה")) {
    output = JSON.stringify({ score: 80, feedback: "תשובה טובה, חסר רק ציון היחידות." });
  } else {
    output = "בוא נפתור יחד. נתחיל בלבודד את $x$:\n\n$$2x+3=7 \\Rightarrow 2x=4$$\n\nמה אפשר לעשות עכשיו? [[M1:p2]] [[M1:p99]] [[M5]]";
  }

  if (body.stream) {
    res.writeHead(200, { "content-type": "text/event-stream" });
    const parts = output.match(/[\s\S]{1,12}/g);
    for (const p of parts) {
      res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: p } })}\n\n`);
      if (text.includes("MOCK_SLOW")) await sleep(400);
    }
    res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
    return res.end();
  }
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ content: [{ type: "text", text: output }], usage: { input_tokens: 10, output_tokens: 20 } }));
});

server.listen(PORT, () => console.log(`mock anthropic on ${PORT}`));
