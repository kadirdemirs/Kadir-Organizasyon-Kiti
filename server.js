"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const root = __dirname;
const preferredPort = Number(process.env.PORT || 4173);

// ── KONFIG / API ANAHTARLARI ──────────────────────────────────────────
// Anahtarlar kade.config.json icinde tutulur (gitignore'lu, tarayiciya sizmaz).
// Ornek icin kade.config.example.json dosyasina bak.
function loadConfig() {
  let cfg = {};
  try {
    const raw = fs.readFileSync(path.join(root, "kade.config.json"), "utf8");
    cfg = JSON.parse(raw);
  } catch { /* dosya yoksa demo modunda calisir */ }
  // Ortam degiskenleri dosyanin uzerine yazar
  cfg.provider = process.env.AI_PROVIDER || cfg.provider || "gemini";
  cfg.geminiKey = process.env.GEMINI_API_KEY || cfg.geminiKey || "";
  cfg.openaiKey = process.env.OPENAI_API_KEY || cfg.openaiKey || "";
  cfg.qwenKey = process.env.QWEN_API_KEY || process.env.OPENROUTER_API_KEY || cfg.qwenKey || "";
  cfg.youtubeKey = process.env.YOUTUBE_API_KEY || cfg.youtubeKey || "";
  cfg.assistantModel = cfg.assistantModel || "gemini-2.5-flash";
  cfg.qwenModel = cfg.qwenModel || "qwen/qwen3-next-80b-a3b-instruct:free";
  cfg.imageModel = cfg.imageModel || "gemini-2.5-flash-image";
  return cfg;
}
let config = loadConfig();

function features() {
  // assistant: secili saglayicinin anahtari var mi?
  const assistant = config.provider === "openai" ? Boolean(config.openaiKey)
    : config.provider === "qwen" ? Boolean(config.qwenKey)
    : Boolean(config.geminiKey);
  // gorsel: Qwen'in bedava gorsel ucu yok; gemini veya openai anahtari varsa acik
  const image = Boolean(config.geminiKey || config.openaiKey);
  return {
    provider: config.provider,
    assistant,
    image,
    youtube: Boolean(config.youtubeKey),
  };
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  // Gizli config dosyasi servis edilmez
  if (clean === "kade.config.json") return null;
  const target = path.resolve(root, clean || "index.html");
  const rel = path.relative(root, target);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  return target;
}

function openBrowser(url) {
  const cmd = process.platform === "win32"
    ? `start "" "${url}"`
    : process.platform === "darwin"
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

// ── Yardimcilar ───────────────────────────────────────────────────────
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { resolve({}); }
    });
  });
}

function parseVideoId(url) {
  if (!url) return null;
  const s = String(url).trim();
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) { const m = s.match(p); if (m) return m[1]; }
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  return null;
}

// ── API: ASISTAN (Gemini / OpenAI) ────────────────────────────────────
async function handleAssistant(body) {
  const question = String(body.question || "").slice(0, 4000);
  const context = String(body.context || "").slice(0, 12000);
  if (!question) return { error: "Soru bos." };
  const sys = "Sen bir YouTube produksiyon ekibinin Turkce konusan yapim asistanisin. " +
    "Asagidaki ekip verisine dayanarak kisa, net ve uygulanabilir cevap ver. " +
    "Veri yoksa genel oneride bulun.\n\n--- EKIP VERISI ---\n" + context;

  if (config.provider === "qwen") {
    if (!config.qwenKey) return { error: "Qwen (OpenRouter) anahtari yok." };
    let j;
    for (let attempt = 0; attempt < 3; attempt++) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.qwenKey}`,
          "HTTP-Referer": "http://127.0.0.1",
          "X-Title": "Kade Organizasyon Kiti",
        },
        body: JSON.stringify({
          model: config.qwenModel,
          messages: [{ role: "system", content: sys }, { role: "user", content: question }],
          temperature: 0.4,
        }),
      });
      j = await r.json();
      if (r.ok && j.choices?.[0]?.message?.content) return { answer: j.choices[0].message.content.trim() };
      const msg = j.error?.message || "";
      const transient = r.status === 429 || r.status === 503 || /rate.?limit|overloaded|temporarily/i.test(msg);
      if (!transient && msg) return { error: msg };
      await new Promise((s) => setTimeout(s, 1500 * (attempt + 1)));
    }
    return { error: (j?.error?.message || "Qwen su an yogun") + " — tekrar dene veya bedava kota dolmus olabilir." };
  }

  if (config.provider === "openai") {
    if (!config.openaiKey) return { error: "OpenAI anahtari yok." };
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.openaiKey}` },
      body: JSON.stringify({
        model: config.assistantModel.startsWith("gpt") ? config.assistantModel : "gpt-4o-mini",
        messages: [{ role: "system", content: sys }, { role: "user", content: question }],
        temperature: 0.4,
      }),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.error?.message || "OpenAI hatasi" };
    return { answer: j.choices?.[0]?.message?.content?.trim() || "(bos cevap)" };
  }

  // Varsayilan: Gemini (gecici "high demand"/503 durumunda tekrar dener)
  if (!config.geminiKey) return { error: "Gemini anahtari yok." };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.assistantModel}:generateContent?key=${config.geminiKey}`;
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: sys }] },
    contents: [{ role: "user", parts: [{ text: question }] }],
    generationConfig: { temperature: 0.4 },
  });
  let j;
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    j = await r.json();
    if (r.ok) {
      const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "(bos cevap)";
      return { answer: text.trim() };
    }
    const msg = j.error?.message || "";
    const transient = r.status === 503 || /high demand|overloaded|UNAVAILABLE/i.test(msg);
    if (!transient) return { error: msg || "Gemini hatasi" };
    await new Promise((s) => setTimeout(s, 1200 * (attempt + 1)));
  }
  return { error: (j?.error?.message || "Gemini su an yogun") + " — lutfen tekrar dene." };
}

// ── API: YOUTUBE YORUMLARI ────────────────────────────────────────────
async function handleYoutubeComments(query) {
  if (!config.youtubeKey) return { error: "YouTube anahtari yok." };
  const videoId = parseVideoId(query.videoUrl || query.videoId);
  if (!videoId) return { error: "Gecerli bir YouTube linki/ID bulunamadi." };
  const max = Math.min(Number(query.max) || 100, 300);
  const out = [];
  let pageToken = "";
  try {
    while (out.length < max) {
      const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
      url.searchParams.set("part", "snippet");
      url.searchParams.set("videoId", videoId);
      url.searchParams.set("maxResults", "100");
      url.searchParams.set("order", "relevance");
      url.searchParams.set("key", config.youtubeKey);
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const r = await fetch(url);
      const j = await r.json();
      if (!r.ok) return { error: j.error?.message || "YouTube hatasi" };
      for (const it of j.items || []) {
        const sn = it.snippet?.topLevelComment?.snippet;
        if (sn) out.push({ text: sn.textOriginal || "", likes: sn.likeCount || 0, author: sn.authorDisplayName || "" });
      }
      pageToken = j.nextPageToken || "";
      if (!pageToken) break;
    }
  } catch (e) {
    return { error: "YouTube istegi basarisiz: " + e.message };
  }
  return { videoId, comments: out.slice(0, max) };
}

// ── API: GORSEL URETIMI ───────────────────────────────────────────────
async function handleImage(body) {
  const prompt = String(body.prompt || "").slice(0, 4000);
  if (!prompt) return { error: "Prompt bos." };

  if (config.provider === "openai") {
    if (!config.openaiKey) return { error: "OpenAI anahtari yok." };
    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${config.openaiKey}` },
      body: JSON.stringify({ model: "gpt-image-1", prompt, n: 1, size: "1024x1024" }),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.error?.message || "OpenAI gorsel hatasi" };
    const b64 = j.data?.[0]?.b64_json;
    if (!b64) return { error: "Gorsel donmedi." };
    return { image: `data:image/png;base64,${b64}` };
  }

  // Varsayilan: Gemini
  if (!config.geminiKey) return { error: "Gemini anahtari yok." };
  const model = config.imageModel;

  // Imagen ailesi -> :predict
  if (model.startsWith("imagen")) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${config.geminiKey}`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [{ prompt }], parameters: { sampleCount: 1 } }),
    });
    const j = await r.json();
    if (!r.ok) return { error: j.error?.message || "Imagen hatasi (faturalandirma gerekebilir)" };
    const b64 = j.predictions?.[0]?.bytesBase64Encoded;
    if (!b64) return { error: "Gorsel donmedi." };
    return { image: `data:image/png;base64,${b64}` };
  }

  // Gemini gorsel modeli (nano-banana) -> :generateContent + inlineData
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
  });
  const j = await r.json();
  if (!r.ok) return { error: j.error?.message || "Gemini gorsel hatasi (faturalandirma gerekebilir)" };
  const inline = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData;
  if (!inline) return { error: "Gorsel donmedi." };
  return { image: `data:${inline.mimeType || "image/png"};base64,${inline.data}` };
}

async function handleApi(req, res, url) {
  try {
    if (url.pathname === "/api/config" && req.method === "GET") {
      return sendJson(res, 200, features());
    }
    if (url.pathname === "/api/assistant" && req.method === "POST") {
      const body = await readBody(req);
      return sendJson(res, 200, await handleAssistant(body));
    }
    if (url.pathname === "/api/youtube/comments" && req.method === "GET") {
      return sendJson(res, 200, await handleYoutubeComments(Object.fromEntries(url.searchParams)));
    }
    if (url.pathname === "/api/image" && req.method === "POST") {
      const body = await readBody(req);
      return sendJson(res, 200, await handleImage(body));
    }
    return sendJson(res, 404, { error: "Bilinmeyen API ucu" });
  } catch (e) {
    return sendJson(res, 500, { error: "Sunucu hatasi: " + e.message });
  }
}

function start(port) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);

    if (url.pathname.startsWith("/api/")) {
      handleApi(req, res, url);
      return;
    }

    const file = resolveFile(req.url || "/");
    if (!file) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": mime[path.extname(file).toLowerCase()] || "application/octet-stream" });
      res.end(data);
    });
  });

  server.on("error", err => {
    if (err.code === "EADDRINUSE") start(port + 1);
    else throw err;
  });

  server.listen(port, "127.0.0.1", () => {
    const url = `http://127.0.0.1:${port}/`;
    const f = features();
    console.log(`Kade Organizasyon Kiti calisiyor: ${url}`);
    console.log(`API durumu -> Asistan: ${f.assistant ? "acik" : "kapali"} | YouTube: ${f.youtube ? "acik" : "kapali"} | Gorsel: ${f.image ? "acik" : "kapali"} (saglayici: ${f.provider})`);
    if (!f.assistant && !f.youtube) console.log("Not: kade.config.json bos. Demo modunda calisiyor. Anahtar eklemek icin kade.config.example.json dosyasina bak.");
    console.log("Kapatmak icin bu pencereyi kapatabilir veya Ctrl+C yapabilirsin.");
    if (!process.env.NO_OPEN) openBrowser(url);
  });
}

start(preferredPort);
