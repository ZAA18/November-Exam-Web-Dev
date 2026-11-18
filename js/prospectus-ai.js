
/* ==========================================
   UNICOMPANION - AUTOMATIC AI EXTRACTION
   University: Wits
   Admission year: 2027
========================================== */

(() => {
    "use strict";

    const CONFIG = {
        university: "wits",
        universityName: "University of the Witwatersrand",
        admissionYear: 2027,
        pagesPerBatch: 4,
        model: "gemini-3.5-flash",

        // Versioned keys prevent reuse of older extraction batches.
        cachePrefix: "unicomp_wits_2027_v2_batch_",
        finalDataKey: "unicomp_wits_2027_programmes"
    };

    let extractionPromise = null;

    function updateStatus(message, type = "info") {
        const elements = [
            document.getElementById("prospectus-status"),
            document.getElementById("extraction-status")
        ];

        elements.forEach(element => {
            if (element) {
                element.textContent = message;
                element.dataset.status = type;
            }
        });

        console.log(`[Prospectus AI] ${message}`);
    }

    function getPageText(page) {
        return typeof page === "string"
            ? page
            : page.text || page.content || "";
    }

    function getPages() {
        const prospectus = window.UniCompanionProspectus;

        if (!prospectus || !Array.isArray(prospectus.pages)) {
            throw new Error("PDF prospectus data is unavailable.");
        }

        return prospectus.pages
            .map((page, index) => ({
                pageNumber: page.pageNumber || index + 1,
                text: getPageText(page).trim()
            }))
            .filter(page => page.text.length > 0);
    }

    // Create a fingerprint so cached batches belong to this PDF text.
    function createFingerprint(text) {
        let hash = 2166136261;

        for (let i = 0; i < text.length; i++) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        return (hash >>> 0).toString(16);
    }

    function getCacheKey(fingerprint, batchIndex) {
        return `${CONFIG.cachePrefix}${fingerprint}_${batchIndex}`;
    }

    function loadCachedBatch(fingerprint, batchIndex) {
        try {
            const saved = localStorage.getItem(
                getCacheKey(fingerprint, batchIndex)
            );

            if (!saved) return null;

            const result = JSON.parse(saved);

            return Array.isArray(result.programmes)
                ? result
                : null;

        } catch (error) {
            console.warn("Could not read cached batch:", error);
            return null;
        }
    }

    function saveCachedBatch(fingerprint, batchIndex, result) {
        try {
            localStorage.setItem(
                getCacheKey(fingerprint, batchIndex),
                JSON.stringify(result)
            );
        } catch (error) {
            console.warn("Could not cache this batch:", error);
        }
    }

    ///////////////////////////////
    // Retry temporary Gemini server and capacity errors.
function isTemporaryGeminiError(error) {
    const message = String(error?.message || "").toLowerCase();

    const temporaryErrors = [
        "high demand",
        "try again later",
        "503",
        "502",
        "504",
        "500",
        "unavailable",
        "overloaded",
        "resource_exhausted",
        "rate limit",
        "too many requests",
        "internal error"
    ];

    return temporaryErrors.some(term => message.includes(term));
}

function wait(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function generateWithRetry(prompt, batchNumber, totalBatches) {
    const maxAttempts = 4;
    const retryDelays = [5000, 10000, 20000];

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            updateStatus(
                `Sending batch ${batchNumber}/${totalBatches} to Gemini. Attempt ${attempt}/${maxAttempts}...`
            );

            return await window.UniCompanionGemini.generate(
                prompt,
                {
                    model: CONFIG.model,
                    json: true
                }
            );

        } catch (error) {
            const temporary = isTemporaryGeminiError(error);

            if (!temporary || attempt === maxAttempts) {
                if (temporary) {
                    throw new Error(
                        `Gemini remained unavailable after ${maxAttempts} attempts. ` +
                        `Your completed batches have been saved. Please try again later.`
                    );
                }

                throw error;
            }

            const delay = retryDelays[attempt - 1];
            const jitter = Math.floor(Math.random() * 1500);
            const totalDelay = delay + jitter;

            updateStatus(
                `Gemini is temporarily busy. Retrying batch ${batchNumber}/${totalBatches} in ${Math.ceil(totalDelay / 1000)} seconds. Attempt ${attempt + 1}/${maxAttempts}.`,
                "warning"
            );

            await wait(totalDelay);
        }
    }
}
    ///////////////////////////

    function createPrompt(batch, batchIndex, totalBatches) {
        const pageContent = batch.map(page => `
==============================
SOURCE PDF PAGE: ${page.pageNumber}
==============================

${page.text}
`).join("\n");

        return `
You are an academic admissions information extraction assistant.

Extract undergraduate programme admission requirements from the
official University of the Witwatersrand prospectus.

UNIVERSITY: ${CONFIG.universityName}
ADMISSION YEAR: ${CONFIG.admissionYear}
BATCH: ${batchIndex + 1} OF ${totalBatches}

RULES:

1. Only extract information supported by the supplied PDF text.
2. Never invent programme names, APS scores, subjects or levels.
3. Use null when a value is not explicitly available.
4. Preserve compulsory and alternative subject requirements accurately.
5. Include additional selection requirements where stated.
6. Record the original PDF page number.
7. Do not assume all programmes use the same APS calculation.
8. Flag unclear, incomplete or ambiguous information for review.
9. Ignore general faculty information unless it identifies a programme.
10. If there are no programme requirements in these pages, return an
    empty programmes array.
11. Return valid JSON only, without Markdown fences.

Return this structure:

{
  "university": "wits",
  "admissionYear": 2027,
  "batch": ${batchIndex + 1},
  "programmes": [
    {
      "name": "Programme name",
      "faculty": null,
      "aps": null,
      "requirements": [
        {
          "subjects": ["Mathematics"],
          "level": 5,
          "mode": "all",
          "description": "Original requirement in plain language"
        }
      ],
      "selectionRequirements": [],
      "sourcePages": [10],
      "reviewStatus": "REQUIRES_REVIEW",
      "reviewNotes": []
    }
  ]
}

REQUIREMENT RULES:

- "subjects" contains the relevant subject names.
- "level" is the NSC level only when explicitly stated.
- "mode" is "all" if every listed subject is compulsory.
- "mode" is "any" if any one of the listed subjects is accepted.
- Do not convert percentages to NSC levels yourself.
- Preserve requirements that cannot be represented safely in the
  description and flag them for review.
- Use an empty array when no requirements are stated.

PDF TEXT:

${pageContent}
`;
    }

    function parseGeminiJSON(rawText) {
        let cleaned = String(rawText || "").trim();

        cleaned = cleaned
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/, "");

        const result = JSON.parse(cleaned);

        if (!Array.isArray(result.programmes)) {
            throw new Error("Gemini did not return a programmes array.");
        }

        return result;
    }

  
async function analyseBatch(
    batch,
    batchIndex,
    totalBatches,
    fingerprint
) {
    // First check whether this batch was already extracted.
    const cached = loadCachedBatch(fingerprint, batchIndex);

    if (cached) {
        updateStatus(
            `Restoring saved batch ${batchIndex + 1} of ${totalBatches}...`
        );

        return cached;
    }

    updateStatus(
        `Preparing PDF pages ${batch[0].pageNumber}–${batch[batch.length - 1].pageNumber}. Batch ${batchIndex + 1}/${totalBatches}.`
    );

    if (!window.UniCompanionGemini?.generate) {
        throw new Error("Gemini service is not available.");
    }

    const prompt = createPrompt(
        batch,
        batchIndex,
        totalBatches
    );

    // Send the request with automatic retries.
    const response = await generateWithRetry(
        prompt,
        batchIndex + 1,
        totalBatches
    );

    const result = parseGeminiJSON(response);

    // Save this batch immediately after successful extraction.
    saveCachedBatch(fingerprint, batchIndex, result);

    return result;
}

    function mergeResults(batchResults) {
        const merged = new Map();

        for (const result of batchResults) {
            for (const programme of result.programmes || []) {
                const key = String(programme.name || "")
                    .trim()
                    .toLowerCase();

                if (!key) continue;

                if (!merged.has(key)) {
                    merged.set(key, {
                        ...programme,
                        sourcePages: [...(programme.sourcePages || [])],
                        requirements: [...(programme.requirements || [])],
                        selectionRequirements: [
                            ...(programme.selectionRequirements || [])
                        ],
                        reviewNotes: [...(programme.reviewNotes || [])]
                    });

                    continue;
                }

                const existing = merged.get(key);

                existing.sourcePages = [
                    ...new Set([
                        ...existing.sourcePages,
                        ...(programme.sourcePages || [])
                    ])
                ];

                existing.requirements.push(
                    ...(programme.requirements || [])
                );

                existing.selectionRequirements.push(
                    ...(programme.selectionRequirements || [])
                );

                existing.reviewNotes = [
                    ...new Set([
                        ...existing.reviewNotes,
                        ...(programme.reviewNotes || [])
                    ])
                ];

                existing.reviewStatus = "REQUIRES_REVIEW";
            }
        }

        return Array.from(merged.values());
    }

    function saveFinalData(data) {
        try {
            localStorage.setItem(
                CONFIG.finalDataKey,
                JSON.stringify(data)
            );

            // Make the data immediately available to other scripts.
            window.WITS_REQUIREMENTS = data;

            window.dispatchEvent(
                new CustomEvent("unicomp:wits-data-ready", {
                    detail: data
                })
            );

        } catch (error) {
            throw new Error(
                "The extracted data could not be saved in browser storage. " +
                "Try clearing old UniCompanion extraction data. " +
                error.message
            );
        }
    }

    function loadFinalData() {
        try {
            const saved = localStorage.getItem(CONFIG.finalDataKey);

            if (!saved) return null;

            const data = JSON.parse(saved);

            if (
                data.university !== CONFIG.university ||
                data.admissionYear !== CONFIG.admissionYear ||
                !Array.isArray(data.programmes)
            ) {
                return null;
            }

            return data;

        } catch (error) {
            console.warn("Saved Wits data could not be read:", error);
            return null;
        }
    }

    async function extractProspectus() {
        if (extractionPromise) {
            return extractionPromise;
        }

        extractionPromise = (async () => {
            try {
                updateStatus("Checking for saved Wits programme data...");

                const savedData = loadFinalData();

                if (savedData && savedData.programmes.length > 0) {
                    window.WITS_REQUIREMENTS = savedData;

                    window.dispatchEvent(
                        new CustomEvent("unicomp:wits-data-ready", {
                            detail: savedData
                        })
                    );

                    updateStatus(
                        `${savedData.programmes.length} Wits programmes loaded from saved data.`,
                        "success"
                    );

                    return savedData;
                }

                updateStatus("Waiting for the Wits PDF to finish loading...");

                if (!window.UniCompanionProspectusReady) {
                    throw new Error("The PDF reader has not started.");
                }

                await window.UniCompanionProspectusReady;

                const pages = getPages();

                if (pages.length === 0) {
                    throw new Error("No readable PDF text was found.");
                }

                const fingerprint = createFingerprint(
                    pages.map(page => page.text).join("\n")
                );

                const batches = [];

                for (
                    let i = 0;
                    i < pages.length;
                    i += CONFIG.pagesPerBatch
                ) {
                    batches.push(
                        pages.slice(i, i + CONFIG.pagesPerBatch)
                    );
                }

                updateStatus(
                    `Prospectus ready. ${pages.length} pages divided into ${batches.length} Gemini batches.`
                );

                const results = [];

                // Sequential processing helps avoid sending too many
                // Gemini requests at the same time.
                for (let i = 0; i < batches.length; i++) {
                    const result = await analyseBatch(
                        batches[i],
                        i,
                        batches.length,
                        fingerprint
                    );

                    results.push(result);

                    updateStatus(
                        `AI extraction progress: ${i + 1}/${batches.length} batches completed.`
                    );
                }

                const programmes = mergeResults(results);

                if (programmes.length === 0) {
                    throw new Error(
                        "Gemini did not identify any programme records. The PDF text and extraction prompts need checking."
                    );
                }

                const finalData = {
                    university: CONFIG.university,
                    universityName: CONFIG.universityName,
                    admissionYear: CONFIG.admissionYear,
                    extractedAt: new Date().toISOString(),
                    pageCount: pages.length,
                    programmeCount: programmes.length,
                    status: "REQUIRES_REVIEW",
                    fingerprint,
                    programmes
                };

                saveFinalData(finalData);

                updateStatus(
                    `Finished. ${programmes.length} Wits programmes saved and ready for the APS calculator.`,
                    "success"
                );

                return finalData;

            } catch (error) {
                console.error("Automatic extraction failed:", error);

                updateStatus(
                    `Automatic extraction failed: ${error.message}`,
                    "error"
                );

                throw error;
            }
        })();

        return extractionPromise;
    }

    // Public functions for the APS calculator and debugging.
    window.UniCompanionExtraction = {
        start: extractProspectus,
        loadSavedData: loadFinalData
    };

    // Start automatically when this script loads.
    window.UniCompanionExtractionReady = extractProspectus();

    // Handle the promise here so a PDF/API error is visible in the
    // status message rather than becoming an unhandled rejection.
    window.UniCompanionExtractionReady.catch(() => {});

    console.log("UniCompanion automatic prospectus extraction loaded.");

})();