/* =========================================
   UNICOMPANION - SHARED GEMINI SERVICE
========================================= */

(() => {

    const config = window.UNICOMPANION_GEMINI_CONFIG;

    if (!config || !config.apiKey) {
        console.error("Gemini API key is missing.");
        return;
    }

    const API_BASE =
        "https://generativelanguage.googleapis.com/v1beta/models/";

    async function generate(prompt, options = {}) {

        const model =
            options.model || config.models.assistant;

        if (!model) {
            throw new Error("No Gemini model has been configured.");
        }

        const endpoint =
            `${API_BASE}${model}:generateContent`;

        const generationConfig = {};

        // Gemini 3.8 Flash does not use temperature.
        if (model !== "gemini-3.8-flash") {
            generationConfig.temperature =
                options.temperature ?? 0.3;
        }

        if (options.json === true) {
            generationConfig.responseMimeType =
                "application/json";
        }

        const requestBody = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt }
                    ]
                }
            ],
            generationConfig
        };

        const controller = new AbortController();

        const timeout = setTimeout(
            () => controller.abort(),
            120000
        );

        try {

            const response = await fetch(
                `${endpoint}?key=${encodeURIComponent(config.apiKey)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                }
            );

            const result = await response.json();

            if (!response.ok) {

                const message =
                    result.error?.message ||
                    `Gemini request failed: ${response.status}`;

                throw new Error(message);
            }

            const text =
                result.candidates?.[0]?.content?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .trim();

            if (!text) {
                throw new Error(
                    "Gemini returned an empty response."
                );
            }

            return text;

        } catch (error) {

            if (error.name === "AbortError") {
                throw new Error("Gemini request timed out.");
            }

            throw error;

        } finally {

            clearTimeout(timeout);

        }
    }


    /* =====================================
       CHATBOT FUNCTION
    ===================================== */

    async function chat(message, history = [], context = "") {

        const conversation = history
            .slice(-8)
            .map(item => `${item.role}: ${item.text}`)
            .join("\n");

        const prompt = `
You are UniCompanion AI, a helpful South African
university and study guidance assistant.

Your responsibilities:
- Explain university applications.
- Explain APS calculations.
- Help students understand admission requirements.
- Explain information available on the UniCompanion website.

Rules:
- Never invent university admission requirements.
- Never guarantee that someone will be accepted.
- Distinguish minimum requirements from actual admission.
- If verified information is unavailable, say so.
- Encourage students to check official university sources.
- Do not pretend to have checked information that you have not received.

AVAILABLE UNIVERSITY INFORMATION:
${context || "No extracted university programme information is currently available."}

PREVIOUS CONVERSATION:
${conversation || "No previous messages."}

STUDENT'S NEW QUESTION:
${message}

Give a helpful, clear answer in plain English.
`;

        return generate(prompt, {
            model: config.models.assistant,
            temperature: 0.5
        });
    }


    /* =====================================
       PUBLIC API
    ===================================== */

    window.UniCompanionGemini = {
        generate,
        chat
    };

    console.log("UniCompanion Gemini service loaded.");

})();   