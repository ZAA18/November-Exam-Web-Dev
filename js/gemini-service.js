/* Shared browser-side Gemini client for this static HTML/CSS/JavaScript site. */
(() => {
    const config = window.UNICOMPANION_GEMINI_CONFIG;
    if (!config?.apiKey || !config?.models) {
        console.error("Gemini configuration is missing.");
        return;
    }

    async function generate(prompt, options = {}) {
        const model = options.model || config.models.assistant;
        if (!model) throw new Error("No Gemini model has been configured.");

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": config.apiKey
                    },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: String(prompt || "") }] }],
                        generationConfig: {
                            temperature: options.temperature ?? 0.3,
                            ...(options.json === true ? { responseMimeType: "application/json" } : {})
                        }
                    }),
                    signal: controller.signal
                }
            );
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.error?.message || `Gemini request failed (${response.status}).`);
            }
            const text = result.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();
            if (!text) throw new Error("Gemini returned an empty response.");
            return text;
        } catch (error) {
            if (error.name === "AbortError") throw new Error("Gemini request timed out.");
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    async function chat(message, history = [], context = "") {
        const conversation = history.slice(-8)
            .map(item => `${item.role}: ${item.text}`)
            .join("\n");
        const prompt = `
You are UniCompanion AI, a helpful South African university and study guidance assistant.

Your responsibilities:
- Explain university applications and APS calculations.
- Help students understand admission requirements.
- Explain information available on the UniCompanion website.

Rules:
- Never invent university admission requirements or guarantee admission.
- Distinguish minimum requirements from actual admission.
- If verified information is unavailable, say so and direct the student to the official university source.
- Do not pretend to have checked information you were not given.

AVAILABLE UNIVERSITY INFORMATION:
${context || "No extracted university programme information is currently available."}

PREVIOUS CONVERSATION:
${conversation || "No previous messages."}

STUDENT'S NEW QUESTION:
${message}

Give a helpful, clear answer in plain English.
`;
        return generate(prompt, { model: config.models.assistant, temperature: 0.5 });
    }

    window.UniCompanionGemini = { generate, chat };
    console.log("UniCompanion Gemini client loaded.");
})();
