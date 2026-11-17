
/* ==========================================
   UNICOMPANION - AI PROSPECTUS EXTRACTOR
   University: Wits
   Admission year: 2027
========================================== */

(() => {
    "use strict";

    const CONFIG = {
        university: "wits",
        universityName: "University of the Witwatersrand",
        admissionYear: 2027,

        // Number of PDF pages sent in each Gemini request.
        pagesPerBatch: 4,

        // The model configured for prospectus extraction.
        model: "gemini-3.8-flash",

        // Local cache allows extraction to resume.
        cachePrefix: "unicomp_wits_2027_batch_"
    };

    const button = document.getElementById("extract-wits-button");
    const status = document.getElementById("prospectus-ai-status");

    if (!button) {
        console.warn("Prospectus extraction button was not found.");
        return;
    }

    function updateStatus(message) {
        if (status) {
            status.textContent = message;
        }

        console.log("[Prospectus AI]", message);
    }

    function getPageNumber(page, index) {
        return page.pageNumber || page.page || index + 1;
    }

    function getPageText(page) {
        if (typeof page === "string") {
            return page;
        }

        return page.text || page.content || "";
    }

    function getPages() {
        const prospectus = window.UniCompanionProspectus;

        if (!prospectus || !Array.isArray(prospectus.pages)) {
            throw new Error(
                "The prospectus has not been extracted. Check prospectus-reader.js."
            );
        }

        return prospectus.pages
            .map((page, index) => ({
                pageNumber: getPageNumber(page, index),
                text: getPageText(page).trim()
            }))
            .filter(page => page.text.length > 0);
    }

    function getCacheKey(batchIndex) {
        return CONFIG.cachePrefix + batchIndex;
    }

    function loadCachedBatch(batchIndex) {
        const cached = localStorage.getItem(getCacheKey(batchIndex));

        if (!cached) {
            return null;
        }

        try {
            return JSON.parse(cached);
        } catch {
            return null;
        }
    }

    function saveCachedBatch(batchIndex, result) {
        try {
            localStorage.setItem(
                getCacheKey(batchIndex),
                JSON.stringify(result)
            );
        } catch (error) {
            console.warn("Could not save extraction progress:", error);
        }
    }

    function createPrompt(batch, batchIndex, totalBatches) {
        const pageContent = batch.map(page => `
==============================
SOURCE PDF PAGE: ${page.pageNumber}
==============================

${page.text}
`).join("\n");

        return `
You are an academic admissions information extraction assistant.

Your task is to extract undergraduate programme admission requirements
from an official University of the Witwatersrand prospectus.

UNIVERSITY: ${CONFIG.universityName}
ADMISSION YEAR: ${CONFIG.admissionYear}

This is extraction batch ${batchIndex + 1} of ${totalBatches}.

IMPORTANT INSTRUCTIONS:

1. Only extract information explicitly supported by the supplied text.
2. Do not invent programme names, APS scores, subjects or admission levels.
3. If a value is missing, return null.
4. Preserve the meaning of subject requirements.
5. Distinguish between compulsory subjects and alternative subjects.
6. Record the original PDF page number for every programme.
7. Do not assume that every programme uses the same APS calculation.
8. Include additional selection requirements where provided.
9. If a table is incomplete or unclear, flag it for review.
10. Do not treat general faculty information as a programme requirement.
11. If this batch contains no programme requirements, return an empty programmes array.
12. Return valid JSON only. Do not use Markdown code fences.

Use this JSON structure:

{
  "university": "${CONFIG.university}",
  "admissionYear": ${CONFIG.admissionYear},
  "batch": ${batchIndex + 1},
  "programmes": [
    {
      "name": "Programme name",
      "faculty": "Faculty name or null",
      "aps": null,
      "requirements": [
        {
          "subjects": ["Mathematics"],
          "level": 5,
          "mode": "all",
          "description": "The original requirement in plain language"
        }
      ],
      "selectionRequirements": [],
      "sourcePages": [10],
      "reviewStatus": "REQUIRES_REVIEW",
      "reviewNotes": []
    }
  ]
}

REQUIREMENT FORMAT:

- "subjects" contains the relevant subject names.
- "level" is the required NSC achievement level when explicitly stated.
- "mode" must be "all" when every listed subject is required.
- "mode" must be "any" when any one of the listed subjects is accepted.
- If the prospectus describes a requirement that cannot safely be represented
  in this structure, preserve it in "description" and flag it for review.
- Do not convert percentages into NSC levels unless the prospectus explicitly
  provides the conversion.

PROSPECTUS TEXT:

${pageContent}
`;
    }

    function extractResponseText(response) {
        if (typeof response === "string") {
            return response;
        }

        if (response && typeof response.text === "string") {
            return response.text;
        }

        if (response && typeof response.response === "string") {
            return response.response;
        }

        if (response?.candidates?.[0]?.content?.parts) {
            return response.candidates[0].content.parts
                .map(part => part.text || "")
                .join("\n");
        }

        throw new Error(
            "Gemini returned an unexpected response format."
        );
    }

    function parseGeminiJSON(rawText) {
        let cleaned = rawText.trim();

        cleaned = cleaned
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/, "");

        const result = JSON.parse(cleaned);

        if (!Array.isArray(result.programmes)) {
            throw new Error(
                "Gemini returned JSON without a programmes array."
            );
        }

        return result;
    }

    async function analyseBatch(batch, batchIndex, totalBatches) {
        const cached = loadCachedBatch(batchIndex);

        if (cached) {
            updateStatus(
                `Using saved extraction for batch ${batchIndex + 1}/${totalBatches}...`
            );

            return cached;
        }

        updateStatus(
            `Sending pages ${batch[0].pageNumber}–${batch[batch.length - 1].pageNumber} to Gemini...`
        );

        if (!window.UniCompanionGemini?.generate) {
            throw new Error(
                "Gemini generate() was not found. Check gemini-service.js."
            );
        }

        const prompt = createPrompt(
            batch,
            batchIndex,
            totalBatches
        );

        const response = await window.UniCompanionGemini.generate(
            prompt,
            { model: CONFIG.model }
        );

        const responseText = extractResponseText(response);
        const result = parseGeminiJSON(responseText);

        saveCachedBatch(batchIndex, result);

        return result;
    }

    function mergeResults(batchResults) {
        const programmes = [];

        for (const result of batchResults) {
            if (Array.isArray(result.programmes)) {
                programmes.push(...result.programmes);
            }
        }

        // Merge duplicate programme entries that may occur
        // when a programme continues across PDF pages.
        const merged = new Map();

        for (const programme of programmes) {
            const key = String(programme.name || "")
                .trim()
                .toLowerCase();

            if (!key) {
                continue;
            }

            if (!merged.has(key)) {
                merged.set(key, programme);
                continue;
            }

            const existing = merged.get(key);

            existing.sourcePages = [
                ...new Set([
                    ...(existing.sourcePages || []),
                    ...(programme.sourcePages || [])
                ])
            ];

            existing.reviewNotes = [
                ...new Set([
                    ...(existing.reviewNotes || []),
                    ...(programme.reviewNotes || [])
                ])
            ];

            existing.requirements = [
                ...(existing.requirements || []),
                ...(programme.requirements || [])
            ];

            existing.selectionRequirements = [
                ...(existing.selectionRequirements || []),
                ...(programme.selectionRequirements || [])
            ];

            existing.reviewStatus = "REQUIRES_REVIEW";
        }

        return Array.from(merged.values());
    }

    function downloadJSON(data) {
        const json = JSON.stringify(data, null, 4);

        const blob = new Blob(
            [json],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "wits-programmes.json";

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    async function extractProspectus() {
        button.disabled = true;

        try {
            updateStatus("Waiting for the PDF reader...");

            if (window.UniCompanionProspectusReady) {
                await window.UniCompanionProspectusReady;
            }

            const pages = getPages();

            if (pages.length === 0) {
                throw new Error("No PDF text was found.");
            }

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
                `Found ${pages.length} pages. Preparing ${batches.length} extraction batches...`
            );

            const results = [];

            // Process sequentially to avoid sending many requests at once.
            for (let i = 0; i < batches.length; i++) {
                const result = await analyseBatch(
                    batches[i],
                    i,
                    batches.length
                );

                results.push(result);

                updateStatus(
                    `Processed ${i + 1} of ${batches.length} batches.`
                );
            }

            const programmes = mergeResults(results);

            const finalData = {
                university: CONFIG.university,
                universityName: CONFIG.universityName,
                admissionYear: CONFIG.admissionYear,
                extractedAt: new Date().toISOString(),
                pageCount: pages.length,
                programmeCount: programmes.length,
                status: "REQUIRES_REVIEW",
                programmes
            };

            downloadJSON(finalData);

            updateStatus(
                `Finished! Found ${programmes.length} programme records. Review the downloaded JSON before using it.`
            );

        } catch (error) {
            console.error(error);

            updateStatus(
                `Extraction failed: ${error.message}. Your completed batches have been saved where possible.`
            );

        } finally {
            button.disabled = false;
        }
    }

    button.addEventListener("click", extractProspectus);

    console.log("UniCompanion prospectus AI extractor loaded.");

})();