/* =========================================================
   UNICOMPANION - MULTI-PROSPECTUS EXTRACTION MANAGER
========================================================= */

(() => {
    "use strict";

    let running = false;
    let lastResults = [];

    function setStatus(message, type = "info") {
        const element = document.getElementById("prospectus-status");
        if (element) {
            element.textContent = message;
            element.dataset.status = type;
        }
    }

    function checkDependencies() {
        const required = [
            "UniCompanionPDF",
            "UniCompanionDocumentAnalyser",
            "UniCompanionProgrammeDetector",
            "UniCompanionRequirementsExtractor",
            "UniCompanionDataNormaliser",
            "UniCompanionValidationEngine"
        ];
        const missing = required.filter(name => !window[name]);
        if (missing.length) throw new Error(`Missing scripts: ${missing.join(", ")}`);
    }

    function processProspectus(prospectus) {
        if (!prospectus.pages || !prospectus.pages.length) {
            throw new Error(prospectus.error || "The prospectus could not be loaded.");
        }

        const analysis = window.UniCompanionDocumentAnalyser.analyse(prospectus);
        const detection = window.UniCompanionProgrammeDetector.detect(prospectus, analysis);
        const requirements = window.UniCompanionRequirementsExtractor.extract(prospectus, detection);
        const normalised = window.UniCompanionDataNormaliser.normalise(requirements);
        return window.UniCompanionValidationEngine.validate(normalised);
    }

    async function run() {
        if (running) return lastResults;
        running = true;

        try {
            checkDependencies();
            setStatus("Loading university prospectuses...");
            const prospectuses = await window.UniCompanionPDF.readAll();
            lastResults = [];

            for (let index = 0; index < prospectuses.length; index++) {
                const prospectus = prospectuses[index];
                setStatus(`Processing ${prospectus.universityName || prospectus.university} (${index + 1}/${prospectuses.length})...`);

                try {
                    const validated = processProspectus(prospectus);
                    lastResults.push(validated);
                } catch (error) {
                    console.error(`[Prospectus Manager] ${prospectus.university}:`, error);
                    lastResults.push({
                        university: prospectus.university,
                        universityName: prospectus.universityName,
                        admissionYear: prospectus.admissionYear,
                        programmes: [],
                        extractionError: error.message
                    });
                }
            }

            window.UniCompanionExtractedUniversities = lastResults;
            window.UniCompanionExtractedData = lastResults.find(item => item.university === "wits") || null;
            setStatus(`Extraction complete. ${lastResults.length} university prospectuses processed.`, "success");
            window.dispatchEvent(new CustomEvent("unicomp:prospectus-ready", {
                detail: window.UniCompanionExtractedData
            }));
            window.dispatchEvent(new CustomEvent("unicomp:all-prospectuses-ready", {
                detail: lastResults
            }));
            return lastResults;
        } finally {
            running = false;
        }
    }

    window.UniCompanionProspectusManager = {
        run,
        getResults: () => lastResults
    };

    async function startAutomatically() {
        try {
            await run();
        } catch (error) {
            setStatus(`Extraction failed: ${error.message}`, "error");
            window.dispatchEvent(new CustomEvent("unicomp:prospectuses-error", {
                detail: { message: error.message }
            }));
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startAutomatically, { once: true });
    } else {
        startAutomatically();
    }
})();
