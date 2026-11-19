/* Browser client for the private UniCompanion Gemini proxy. */
(() => {
    const config = window.UNICOMPANION_GEMINI_CONFIG;
    if (!config?.models) {
        console.error("Gemini proxy configuration is missing.");
        return;
    }

    async function generate(prompt, options = {}) {
        const model = options.model || config.models.assistant;
        if (!model) throw new Error("No Gemini model has been configured.");
        if (!config.apiBase || config.apiBase.includes("YOUR-WORKER-SUBDOMAIN")) {
            throw new Error("The Gemini proxy URL has not been configured yet.");
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000);
        try {
            const response = await fetch(`${config.apiBase.replace(/\/$/, "")}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: String(prompt || ""),
                    model,
                    temperature: options.temperature ?? 0.3,
                    json: options.json === true
                }),
                signal: controller.signal
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.error || `Gemini request failed (${response.status}).`);
            }
            if (typeof result.text !== "string" || !result.text.trim()) {
                throw new Error("Gemini returned an empty response.");
            }
            return result.text.trim();
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
    console.log("UniCompanion Gemini proxy client loaded.");
})();
