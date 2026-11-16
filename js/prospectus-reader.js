
/* =====================================================
   UNICOMPANION — PROSPECTUS READER
   Front-end PDF extraction using PDF.js
===================================================== */

(() => {
    "use strict";

    const CONFIG = {
        university: "wits",
        admissionYear: 2027,

        // This path is relative to aps-calculator.html.
        pdfPath: "../prospectuses/wits/wits-2027.pdf",

        pdfJsWorker:
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
    };

    let loadedProspectus = null;
    let loadingPromise = null;

    function setStatus(message, type = "info") {
        const element = document.getElementById("prospectus-status");

        if (element) {
            element.textContent = message;
            element.dataset.status = type;
        }

        console.log(`[Prospectus] ${message}`);
    }

    function ensurePDFLibrary() {
        if (!window.pdfjsLib) {
            throw new Error(
                "PDF.js was not loaded. Check your internet connection and HTML script imports."
            );
        }

        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            CONFIG.pdfJsWorker;
    }

    function extractPageText(textContent) {
        const items = textContent.items || [];

        // Keep the text in the order supplied by PDF.js.
        return items
            .filter(item => typeof item.str === "string")
            .map(item => item.str.trim())
            .filter(Boolean)
            .join(" ");
    }

    async function readProspectus() {
        if (loadedProspectus) {
            return loadedProspectus;
        }

        if (loadingPromise) {
            return loadingPromise;
        }

        loadingPromise = (async () => {
            try {
                ensurePDFLibrary();

                setStatus("Loading the Wits prospectus...");

                const response = await fetch(CONFIG.pdfPath);

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

                    const pageText = extractPageText(textContent);

                    pages.push({
                        pageNumber,
                        text: pageText
                    });

                    allText.push(
                        `PAGE ${pageNumber}\n${pageText}`
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

                loadedProspectus = {
                    university: CONFIG.university,
                    admissionYear: CONFIG.admissionYear,
                    filename: CONFIG.pdfPath,
                    pageCount: pdf.numPages,
                    pages,
                    fullText,
                    extractedAt: new Date().toISOString()
                };

                window.UniCompanionProspectus = loadedProspectus;

                setStatus(
                    `Wits ${CONFIG.admissionYear} prospectus loaded. ${pdf.numPages} pages extracted.`,
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
                loadingPromise = null;
            }
        })();

        return loadingPromise;
    }

    function searchProspectus(searchTerm) {
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
        if (!loadedProspectus) {
            return null;
        }

        return loadedProspectus.pages.find(
            page => page.pageNumber === Number(pageNumber)
        ) || null;
    }

    function getFullText() {
        return loadedProspectus
            ? loadedProspectus.fullText
            : "";
    }

    // Public API used by other UniCompanion scripts.
    window.UniCompanionPDF = {
        read: readProspectus,
        search: searchProspectus,
        getPage,
        getFullText
    };

    // Start loading the prospectus when the page opens.
    window.UniCompanionProspectusReady = readProspectus();

})();
