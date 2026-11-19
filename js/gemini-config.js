/* Public configuration. Never commit an API key in browser JavaScript. */
(() => {
    window.UNICOMPANION_GEMINI_CONFIG = {
        apiKey: "",
        models: {
            assistant: "gemini-3.5-flash-lite",
            prospectus: "gemini-3.8-flash"
        }
    };
})();
