
/* =====================================================
   UNICOMPANION — PROSPECTUS READER
   Front-end PDF extraction using PDF.js
===================================================== */

(() => {
    "use strict";

    const DEFAULT_ID = "wits";
    const CONFIGS = window.UniCompanionUniversities || {};
    const loadedProspectuses = new Map();
    const loadingPromises = new Map();
    const CONFIG = {
        pdfJsWorker: new URL(
            "../assets/vendor/pdfjs/pdf.worker.min.js",
            document.baseURI
        ).href
    };
    let activeProspectus = null;

    function setStatus(message, type = "info") {
        console.log(`[Prospectus] ${message}`);
    }

    async function ensurePDFLibrary() {
        if (!window.pdfjsLib && window.UniCompanionPDFJSReady) {
            await window.UniCompanionPDFJSReady;
        }
        if (!window.pdfjsLib) {
            throw new Error(
                "PDF.js was not loaded. Check your internet connection and HTML script imports."
            );
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            CONFIG.pdfJsWorker;
    }

   function extractPageContent(textContent) {
    const items = (textContent.items || [])
        .filter(item =>
            typeof item.str === "string" &&
            item.str.trim()
        );

    // Preserve the position of every text item.
    const positionedItems = items.map(item => ({
        text: item.str.trim(),
        x: item.transform?.[4] ?? 0,
        y: item.transform?.[5] ?? 0,
        width: item.width || 0,
        height: item.height || 0
    }));

    // Sort from top to bottom, then left to right.
    positionedItems.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 3) {
            return b.y - a.y;
        }

        return a.x - b.x;
    });

    // Group text items that appear on approximately the same line.
    const lines = [];

    positionedItems.forEach(item => {
        let existingLine = lines.find(line =>
            Math.abs(line.y - item.y) <= 3
        );

        if (!existingLine) {
            existingLine = {
                y: item.y,
                items: []
            };

            lines.push(existingLine);
        }

        existingLine.items.push(item);
    });

    // Reconstruct each line from its left-to-right text items.
    const structuredLines = lines
        .sort((a, b) => b.y - a.y)
        .map(line => {
            line.items.sort((a, b) => a.x - b.x);

            return {
                y: line.y,
                text: line.items
                    .map(item => item.text)
                    .join(" "),
                items: line.items
            };
        });

    const text = structuredLines
        .map(line => line.text)
        .join("\n");

    return {
        text,
        lines: structuredLines,
        items: positionedItems
    };
}

    async function readProspectus(universityId = DEFAULT_ID) {
        const institution = CONFIGS[universityId];
        if (!institution?.prospectus) throw new Error(`No prospectus is configured for ${universityId}.`);
        if (loadedProspectuses.has(universityId)) return loadedProspectuses.get(universityId);
        if (loadingPromises.has(universityId)) return loadingPromises.get(universityId);
        const loadingPromise = (async () => {
            try {
                await ensurePDFLibrary();

                setStatus(`Loading ${institution.name} prospectus...`);

                const response = await fetch(institution.prospectus);

                if (!response.ok) {
                    throw new Error(
                        `PDF could not be found. HTTP status ${response.status}.`
                    );
                }

                const pdfBuffer = await response.arrayBuffer();

                setStatus("Opening the prospectus...");

                const pdf = await window.pdfjsLib.getDocument({
                    data: pdfBuffer
                }).promise;

                const pages = [];
                const allText = [];

                for (
                    let pageNumber = 1;
                    pageNumber <= pdf.numPages;
                    pageNumber++
                ) {
                    const page = await pdf.getPage(pageNumber);
                    const textContent = await page.getTextContent();

                  const pageContent = extractPageContent(textContent);

pages.push({
    pageNumber,
    text: pageContent.text,
    lines: pageContent.lines,
    items: pageContent.items
});

allText.push(
    `PAGE ${pageNumber}\n${pageContent.text}`
);

                    setStatus(
                        `Extracting prospectus text: ${pageNumber}/${pdf.numPages} pages`
                    );
                }

                const fullText = allText.join("\n\n");

                if (!fullText.trim()) {
                    throw new Error(
                        "The PDF contains no extractable text. It may be a scanned document requiring OCR."
                    );
                }

                const loadedProspectus = {
                    university: universityId,
                    universityName: institution.name,
                    admissionYear: institution.admissionYear,
                    filename: institution.prospectus,
                    pageCount: pdf.numPages,
                    pages,
                    fullText,
                    extractedAt: new Date().toISOString()
                };

                loadedProspectuses.set(universityId, loadedProspectus);
                activeProspectus = loadedProspectus;
                window.UniCompanionProspectus = loadedProspectus;

                setStatus(
                    `${institution.name} ${institution.admissionYear || ""} prospectus loaded. ${pdf.numPages} pages extracted.`,
                    "success"
                );

                console.log("Prospectus extraction complete:", {
                    university: loadedProspectus.university,
                    year: loadedProspectus.admissionYear,
                    pages: loadedProspectus.pageCount,
                    characters: fullText.length
                });

                return loadedProspectus;

            } catch (error) {
                console.error("Prospectus reader error:", error);

                setStatus(
                    `Prospectus loading failed: ${error.message}`,
                    "error"
                );

                throw error;

            } finally {
                loadingPromises.delete(universityId);
            }
        })();

        loadingPromises.set(universityId, loadingPromise);
        return loadingPromise;
    }

    function searchProspectus(searchTerm) {
        const loadedProspectus = activeProspectus;
        if (!loadedProspectus) {
            console.warn("Load the prospectus before searching.");
            return [];
        }

        const term = String(searchTerm || "")
            .trim()
            .toLowerCase();

        if (!term) {
            return [];
        }

        return loadedProspectus.pages
            .filter(page =>
                page.text.toLowerCase().includes(term)
            )
            .map(page => ({
                pageNumber: page.pageNumber,
                text: page.text
            }));
    }

    function getPage(pageNumber) {
        const loadedProspectus = activeProspectus;
        if (!loadedProspectus) {
            return null;
        }

        return loadedProspectus.pages.find(
            page => page.pageNumber === Number(pageNumber)
        ) || null;
    }

    function getFullText() {
        return activeProspectus
            ? activeProspectus.fullText
            : "";
    }

    // Public API used by other UniCompanion scripts.
    window.UniCompanionPDF = {
        read: readProspectus,
        get: id => loadedProspectuses.get(id) || null,
        setActive: id => { activeProspectus = loadedProspectuses.get(id) || null; },
        search: searchProspectus,
        getPage,
        getFullText
    };

})();
