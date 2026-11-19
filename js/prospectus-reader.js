/* =========================================================
   UNICOMPANION - MULTI-UNIVERSITY PROSPECTUS READER
========================================================= */

(() => {
    "use strict";

    const PROSPECTUSES = [
        { key: "wits", name: "Wits University", shortName: "Wits", year: 2027, path: "../prospectuses/wits/wits-2027.pdf" },
        { key: "uct", name: "University of Cape Town", shortName: "UCT", year: 2027, path: "../prospectuses/UCT/2027-uct-undergraduate-prospectus-1-april-2026.pdf" },
        { key: "up", name: "University of Pretoria", shortName: "UP", year: 2027, path: "../prospectuses/UP/UP_UG Prospectus 2027_NSC-IEB_DevV5_web_0.pdf" },
        { key: "uj", name: "University of Johannesburg", shortName: "UJ", year: 2027, path: "../prospectuses/UJ/uj_undergrad_prospectus2027_online_25jun2026.pdf" },
        { key: "ufh", name: "University of Fort Hare", shortName: "UFH", year: 2027, path: "../prospectuses/UFH/Study-Guide-2027.pdf" },
        { key: "rhodes", name: "Rhodes University", shortName: "RU", year: 2026, path: "../prospectuses/Rhodes/RU_READY_Undergraduate_Prospectus_2026_DIGITAL_A5_Landscape_24pp_18Mar2026.pdf" },
        { key: "wsu", name: "Walter Sisulu University", shortName: "WSU", year: 2027, path: "../prospectuses/WSU/2027-information-brochure-admission-requirements walter sisulu.pdf" },
        { key: "stellenbosch", name: "Stellenbosch University", shortName: "SU", year: 2027, path: "../prospectuses/SU/stellenbosch university prospectus 2027.pdf" }
    ];

    const workerUrl =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const loaded = new Map();
    const promises = new Map();

    function setStatus(message, type = "info") {
        const element = document.getElementById("prospectus-status");
        if (element) {
            element.textContent = message;
            element.dataset.status = type;
        }
    }

    function ensurePDFLibrary() {
        if (!window.pdfjsLib) {
            throw new Error("PDF.js was not loaded. Check your internet connection.");
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    }

    function extractPageContent(textContent) {
        const positionedItems = (textContent.items || [])
            .filter(item => typeof item.str === "string" && item.str.trim())
            .map(item => ({
                text: item.str.trim(),
                x: item.transform?.[4] ?? 0,
                y: item.transform?.[5] ?? 0,
                width: item.width || 0,
                height: item.height || 0
            }))
            .sort((a, b) => Math.abs(a.y - b.y) > 3 ? b.y - a.y : a.x - b.x);

        const lines = [];
        positionedItems.forEach(item => {
            let line = lines.find(candidate => Math.abs(candidate.y - item.y) <= 3);
            if (!line) {
                line = { y: item.y, items: [] };
                lines.push(line);
            }
            line.items.push(item);
        });

        const structuredLines = lines
            .sort((a, b) => b.y - a.y)
            .map(line => {
                line.items.sort((a, b) => a.x - b.x);
                return {
                    y: line.y,
                    text: line.items.map(item => item.text).join(" "),
                    items: line.items
                };
            });

        return {
            text: structuredLines.map(line => line.text).join("\n"),
            lines: structuredLines,
            items: positionedItems
        };
    }

    async function readUniversity(config) {
        if (!config) throw new Error("Prospectus configuration is missing.");
        if (loaded.has(config.key)) return loaded.get(config.key);
        if (promises.has(config.key)) return promises.get(config.key);

        const promise = (async () => {
            ensurePDFLibrary();
            setStatus(`Loading ${config.name} prospectus...`);

            const response = await fetch(config.path);
            if (!response.ok) {
                throw new Error(`${config.name} PDF could not be found (HTTP ${response.status}).`);
            }

            const pdf = await window.pdfjsLib.getDocument({
                data: await response.arrayBuffer()
            }).promise;

            const pages = [];
            const allText = [];
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const content = extractPageContent(await page.getTextContent());
                pages.push({
                    pageNumber,
                    text: content.text,
                    lines: content.lines,
                    items: content.items
                });
                allText.push(`PAGE ${pageNumber}\n${content.text}`);
                setStatus(`Extracting ${config.shortName}: ${pageNumber}/${pdf.numPages} pages`);
            }

            const fullText = allText.join("\n\n");
            if (!fullText.trim()) {
                throw new Error(`${config.name} PDF contains no extractable text.`);
            }

            const prospectus = {
                university: config.key,
                universityName: config.name,
                admissionYear: config.year,
                filename: config.path,
                pageCount: pdf.numPages,
                pages,
                fullText,
                extractedAt: new Date().toISOString()
            };

            loaded.set(config.key, prospectus);
            return prospectus;
        })();

        promises.set(config.key, promise);
        try {
            return await promise;
        } finally {
            promises.delete(config.key);
        }
    }

    async function readAll() {
        const results = [];
        for (const config of PROSPECTUSES) {
            try {
                results.push(await readUniversity(config));
            } catch (error) {
                console.error(`[Prospectus Reader] ${config.name}:`, error);
                results.push({
                    university: config.key,
                    universityName: config.name,
                    admissionYear: config.year,
                    filename: config.path,
                    pageCount: 0,
                    pages: [],
                    fullText: "",
                    error: error.message
                });
            }
        }
        window.UniCompanionProspectuses = results;
        return results;
    }

    async function readProspectus(key = "wits") {
        const config = PROSPECTUSES.find(item => item.key === key);
        if (!config) throw new Error(`Unknown university prospectus: ${key}`);
        return readUniversity(config);
    }

    window.UniCompanionPDF = {
        read: readProspectus,
        readAll,
        readUniversity,
        getProspectuses: () => PROSPECTUSES.slice()
    };
})();
