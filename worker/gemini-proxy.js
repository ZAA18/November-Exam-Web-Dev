const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models/";
const ALLOWED_MODELS = new Set([
    "gemini-3.5-flash-lite",
    "gemini-3.5-flash",
    "gemini-3.8-flash"
]);
const MAX_BODY_BYTES = 200_000;
const MAX_PROMPT_CHARS = 180_000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const rateWindows = new Map();

function allowedOrigin(origin, env) {
    return String(env.ALLOWED_ORIGINS || "")
        .split(",")
        .map(value => value.trim())
        .filter(Boolean)
        .includes(origin);
}

function corsHeaders(origin) {
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin",
        "Cache-Control": "no-store"
    };
}

function jsonResponse(data, status, origin) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders(origin),
            "Content-Type": "application/json; charset=utf-8",
            "X-Content-Type-Options": "nosniff"
        }
    });
}

function isRateLimited(ip) {
    const now = Date.now();
    if (rateWindows.size > 5000) {
        for (const [address, window] of rateWindows) {
            if (now - window.startedAt >= RATE_WINDOW_MS) rateWindows.delete(address);
        }
    }
    const current = rateWindows.get(ip);
    if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
        rateWindows.set(ip, { startedAt: now, count: 1 });
        return false;
    }
    current.count += 1;
    return current.count > RATE_LIMIT;
}

function clampTemperature(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0.3;
    return Math.max(0, Math.min(2, number));
}

export default {
    async fetch(request, env) {
        const origin = request.headers.get("Origin") || "";
        if (!allowedOrigin(origin, env)) {
            return new Response("Origin is not allowed.", {
                status: 403,
                headers: { "Cache-Control": "no-store", "Vary": "Origin" }
            });
        }
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        const url = new URL(request.url);
        if (request.method === "GET" && url.pathname === "/health") {
            return jsonResponse({ ok: true }, 200, origin);
        }
        if (request.method !== "POST" || url.pathname !== "/generate") {
            return jsonResponse({ error: "Not found." }, 404, origin);
        }
        if (!request.headers.get("Content-Type")?.includes("application/json")) {
            return jsonResponse({ error: "Send a JSON request." }, 415, origin);
        }
        if (!env.GEMINI_API_KEY) {
            return jsonResponse({ error: "The Gemini proxy secret is not configured." }, 503, origin);
        }

        const ip = request.headers.get("CF-Connecting-IP") || "local-client";
        if (isRateLimited(ip)) {
            return jsonResponse({ error: "Request limit reached. Wait a minute and try again." }, 429, origin);
        }

        const bodyText = await request.text();
        if (new TextEncoder().encode(bodyText).length > MAX_BODY_BYTES) {
            return jsonResponse({ error: "The request is too large." }, 413, origin);
        }

        let input;
        try {
            input = JSON.parse(bodyText);
        } catch {
            return jsonResponse({ error: "The request body is not valid JSON." }, 400, origin);
        }

        const model = String(input.model || "");
        const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
        if (!ALLOWED_MODELS.has(model)) {
            return jsonResponse({ error: "That Gemini model is not enabled." }, 400, origin);
        }
        if (!prompt || prompt.length > MAX_PROMPT_CHARS) {
            return jsonResponse({ error: "Enter a prompt within the supported length." }, 400, origin);
        }

        const generationConfig = {};
        if (model !== "gemini-3.8-flash") {
            generationConfig.temperature = clampTemperature(input.temperature);
        }
        if (input.json === true) generationConfig.responseMimeType = "application/json";

        let upstream;
        try {
            upstream = await fetch(`${GEMINI_API}${model}:generateContent`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": env.GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    generationConfig
                })
            });
        } catch {
            return jsonResponse({ error: "Gemini could not be reached. Try again shortly." }, 502, origin);
        }

        const result = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            return jsonResponse({
                error: result.error?.message || `Gemini request failed (${upstream.status}).`
            }, upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502, origin);
        }

        const text = result.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();
        if (!text) return jsonResponse({ error: "Gemini returned an empty response." }, 502, origin);
        return jsonResponse({ text }, 200, origin);
    }
};
