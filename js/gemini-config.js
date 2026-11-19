/* Public settings only. Gemini credentials stay in the Worker environment. */
(() => {
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    window.UNICOMPANION_GEMINI_CONFIG = {
        apiBase: isLocal
            ? "http://127.0.0.1:8787"
            : "https://YOUR-WORKER-SUBDOMAIN.workers.dev",
        models: {
            assistant: "gemini-3.5-flash-lite",
            prospectus: "gemini-3.8-flash"
        }
    };
})();
