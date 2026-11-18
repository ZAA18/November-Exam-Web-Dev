
/* =========================================================
   UNICOMPANION — PROSPECTUS MANAGER
   Controls the complete prospectus extraction pipeline.
========================================================= */

(() => {
    "use strict";

    let running = false;
    let lastResult = null;

    function setStatus(message, type = "info") {
        const element = document.getElementById("prospectus-status");

        if (element) {
            element.textContent = message;
            element.dataset.status = type;
        }

        console.log(`[Prospectus Manager] ${message}`);
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

        const missing = required.filter(name => {
            switch (name) {
                case "UniCompanionPDF":
                    return !window.UniCompanionPDF;

                case "UniCompanionDocumentAnalyser":
                    return !window.UniCompanionDocumentAnalyser;

                case "UniCompanionProgrammeDetector":
                    return !window.UniCompanionProgrammeDetector;

                case "UniCompanionRequirementsExtractor":
                    return !window.UniCompanionRequirementsExtractor;

                case "UniCompanionDataNormaliser":
                    return !window.UniCompanionDataNormaliser;

                case "UniCompanionValidationEngine":
                    return !window.UniCompanionValidationEngine;

                default:
                    return true;
            }
        });

        if (missing.length) {
            throw new Error(
                `Missing scripts or dependencies: ${missing.join(", ")}`
            );
        }
    }

    async function run() {
        if (running) {
            console.warn("Prospectus extraction is already running.");
            return lastResult;
        }

        running = true;

        try {
            checkDependencies();

            setStatus("Step 1/6: Loading prospectus...");
            const prospectus = await window.UniCompanionPDF.read();

            setStatus("Step 2/6: Analysing document...");
            const documentAnalysis =
                window.UniCompanionDocumentAnalyser.analyse(prospectus);

            window.UniCompanionDocumentAnalysis = documentAnalysis;

            setStatus("Step 3/6: Detecting programmes...");
            const detection =
                window.UniCompanionProgrammeDetector.detect(
                    prospectus,
                    documentAnalysis
                );

            window.UniCompanionProgrammeDetection = detection;

            setStatus("Step 4/6: Extracting requirements...");
            const requirements =
                window.UniCompanionRequirementsExtractor.extract(
                    prospectus,
                    detection
                );

            window.UniCompanionRequirements = requirements;

            setStatus("Step 5/6: Normalising data...");
            const normalised =
                window.UniCompanionDataNormaliser.normalise(
                    requirements
                );

            setStatus("Step 6/6: Validating extracted data...");
            const validated =
                window.UniCompanionValidationEngine.validate(
                    normalised
                );

            lastResult = validated;

            window.UniCompanionExtractedData = validated;

            setStatus(
                `Extraction complete. ${validated.programmes.length} programme candidates processed.`,
                "success"
            );

            console.log(
                "[UniCompanion] Final extraction result:",
                validated
            );

            console.table(
                validated.programmes.map(programme => ({
                    programme: programme.name,
                    APS: programme.aps.map(item => item.score).join(", ") || "Not found",
                    subjects: programme.subjects.length,
                    status: programme.reviewStatus,
                    pages: programme.sourcePages.join(", ")
                }))
            );

            return validated;

        } catch (error) {
            console.error("[UniCompanion] Extraction failed:", error);

            setStatus(
                `Extraction failed: ${error.message}`,
                "error"
            );

            throw error;

        } finally {
            running = false;
        }
    }

    function getResults() {
        return lastResult;
    }

    function downloadJSON() {
        if (!lastResult) {
            throw new Error("Run extraction before downloading results.");
        }

        const json = JSON.stringify(lastResult, null, 2);
        const blob = new Blob([json], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download =
            `${lastResult.university}-${lastResult.admissionYear}-extracted.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }

   window.UniCompanionProspectusManager = {
    run,
    getResults,
    downloadJSON
};

/* =====================================================
   AUTOMATIC EXTRACTION
===================================================== */

async function startAutomatically() {
    try {
        setStatus("Preparing automatic prospectus extraction...");

        const result = await run();

        window.dispatchEvent(
            new CustomEvent("unicomp:prospectus-ready", {
                detail: result
            })
        );

    } catch (error) {
        console.error(
            "[UniCompanion] Automatic extraction failed:",
            error
        );

        window.dispatchEvent(
            new CustomEvent("unicomp:prospectus-error", {
                detail: { message: error.message }
            })
        );
    }
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        startAutomatically,
        { once: true }
    );
} else {
    startAutomatically();
}

})();


