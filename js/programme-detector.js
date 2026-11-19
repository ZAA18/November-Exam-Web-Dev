
/* =========================================================
   UNICOMPANION — PROGRAMME DETECTOR
   Detects programme headings and preserves their locations.
========================================================= */

(() => {
    "use strict";

    const CONFIG = {
        minimumConfidence: 0.45,
        minimumTitleLength: 8,
        maximumTitleLength: 150
    };

    const HEADING_PATTERN =
        /^(Bachelor(?:'s)?\s+(?:of|in)\s+.+|B(?:A|Sc|Com|Eng|Ed|Acc|Mus|SocSci|Admin|Dent|Pharm|Nurs|Arch|Theatre|FineArt)\b.*|LLB\b.*|(?:National\s+)?Diploma\s+(?:in|of)\s+.+|Advanced\s+Diploma\s+(?:in|of)\s+.+|Higher\s+Certificate\s+(?:in|of)\s+.+|Certificate\s+(?:in|of)\s+.+)$/i;

    const STOP_PHRASES = [
        /\b\d{1,3}\s*[-–]\s*\d{1,3}\b/i,
        /\(\s*\d+\s+years?\s*\)/i,
        /\b\d{2}\s*\+\s*\d(?:\s*\+\s*\d)?\b/i,
        /\b(?:as well as|minimum APS|minimum admission points?)\b/i,
        /\bminimum\s+APS\b/i,
        /\bAPS\s+(?:of|score|minimum)\b/i,
        /\bapplicants?\s+(?:with|must|should|who)\b/i,
        /\bEnglish\s+(?:Home|First|Language|and)\b/i,
        /\bEnglish\s+Level\b/i,
        /\bMathematics\s+(?:and|or|with)\b/i,
        /\bPhysical\s+Sciences?\b/i,
        /\bLife\s+Sciences?\b/i,
        /\bCAREERS\b/i,
        /\bcareer\s+opportunities\b/i,
        /\bentry\s+requirements\b/i,
        /\badmission\s+requirements\b/i,
        /\bselection\s+criteria\b/i,
        /\bthe\s+following\b/i,
        /\bmust\s+have\b/i,
        /\bmust\s+obtain\b/i,
        /\bstand\s+at\b/i,
        /\bregister\s+for\b/i,
        /\bformally\s+apply\b/i,
        /\bor\s*\([ivx]+\)/i
    ];

    function cleanText(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .replace(/[|•]+/g, " ")
            .replace(/\s+([,.;:])/g, "$1")
            .trim();
    }

    function getPageRows(page) {
        if (Array.isArray(page.lines) && page.lines.length) {
            return page.lines
                .map(line => typeof line === "string" ? { text: line, items: [] } : line)
                .filter(line => line.text);
        }

        return String(page.text || "")
            .split(/\n/)
            .map(line => line.trim())
            .filter(Boolean)
            .map(text => ({ text, items: [] }));
    }

    function splitRowIntoCells(row) {
        const items = Array.isArray(row.items) ? row.items
            .filter(item => item.text && Number.isFinite(Number(item.x)))
            .slice()
            .sort((a, b) => a.x - b.x) : [];
        if (!items.length) return [{ text: row.text, x: null }];

        const cells = [];
        let current = [];
        let rightEdge = null;
        for (const item of items) {
            const x = Number(item.x);
            const width = Number(item.width) || 0;
            // A wide horizontal jump is a table column boundary. Keeping
            // these cells separate prevents "English" and APS columns from
            // becoming part of the qualification name.
            if (current.length && x - rightEdge >= 26) {
                cells.push({ text: current.map(part => part.text).join(" ").trim(), x: current[0].x });
                current = [];
            }
            current.push({ text: item.text, x });
            rightEdge = Math.max(rightEdge === null ? x + width : rightEdge, x + width);
        }
        if (current.length) cells.push({ text: current.map(part => part.text).join(" ").trim(), x: current[0].x });
        return cells.filter(cell => cell.text);
    }

    function trimHeading(text) {
        let title = cleanText(text);

        let earliestPosition = title.length;

        for (const pattern of STOP_PHRASES) {
            const match = pattern.exec(title);

            if (match && match.index < earliestPosition) {
                earliestPosition = match.index;
            }
        }

        title = title.slice(0, earliestPosition);

        return title
            .replace(/[\s,;:.-]+$/, "")
            .trim();
    }

    function isContinuationLine(value) {
        const text = cleanText(value);
        return text.length > 1 && text.length <= 36 &&
            !/\d|\b(?:faculty|department|school|APS|FPS|WPS|English|Mathematics|Maths|Physical Sciences|Life Sciences|requirements?|minimum|level|points?)\b/i.test(text) &&
            /^(?:in|of|and|for|the)\s+[A-Z][A-Za-z&'’-]*(?:\s+(?:[A-Z][A-Za-z&'’-]*|\(Extended\))){0,3}$|^[A-Z][A-Za-z&'’-]*(?:\s+(?:[A-Z][A-Za-z&'’-]*|\(Extended\))){0,3}$/.test(text);
    }

    function cleanFacultyHeading(value) {
        let text = cleanText(value);
        const match = text.match(/^Faculty\s+of\s+(.+)$/i);
        if (!match) return null;

        let name = match[1]
            .replace(/\b(?:Bachelor|BSc|BCom|BA|BEng|BEd|Diploma|Higher Certificate|Advanced Diploma)\b.*$/i, "")
            .replace(/\b(?:minimum|entry|admission)\s+requirements?\b.*$/i, "")
            .replace(/[|,;:.-]+$/, "")
            .trim();

        if (name.length < 3 || name.length > 75 || /\d|\b(?:level|APS|FPS|WPS|English|Mathematics)\b/i.test(name)) return null;
        return `Faculty of ${name}`;
    }

    function normaliseKey(value) {
        return cleanText(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function canonicalEntry(value, entries) {
        const key = normaliseKey(value);
        for (const entry of entries || []) {
            if ([entry.canonical, ...(entry.aliases || [])].some(alias => normaliseKey(alias) === key)) {
                return entry.canonical;
            }
        }
        return value;
    }

    function getQualificationType(title) {
        const lower = title.toLowerCase();

        if (lower.startsWith("llb")) return "LLB";
        if (lower.startsWith("advanced diploma")) return "Advanced Diploma";
        if (lower.startsWith("higher certificate")) return "Higher Certificate";
        if (lower.startsWith("certificate")) return "Certificate";
        if (lower.includes("diploma")) return "Diploma";
        if (lower.startsWith("bachelor")) return "Bachelor";

        return "Bachelor";
    }

    function isValidTitle(title) {
        if (!title) return false;

        if (
            title.length < CONFIG.minimumTitleLength ||
            title.length > CONFIG.maximumTitleLength
        ) {
            return false;
        }

        if (
            /^(page|faculty|school|department|admission|requirements)\b/i
                .test(title)
        ) {
            return false;
        }

        // A table's score and subject columns can be read as part of its
        // qualification heading. Do not present those fragments as degrees.
        if (/\b(?:as well as|English\s+Level|APS|FPS|WPS|minimum|requires?)\b/i.test(title)) return false;
        if (/^Bachelor\s+of\s+\d/i.test(title) || /\b\d{1,3}\s*[-–]\s*\d{1,3}\b/.test(title)) return false;
        if (/\b(?:of|in|and|with|for|the|to)$/i.test(title)) return false;
        return true;
    }

    function detectProgrammes(prospectus, documentAnalysis) {
        if (!prospectus || !Array.isArray(prospectus.pages)) {
            throw new Error("Prospectus data is missing.");
        }

        const relevantPages = new Set();

        if (documentAnalysis && Array.isArray(documentAnalysis.pages)) {
            documentAnalysis.pages
                .filter(page => page.relevant)
                .forEach(page => relevantPages.add(page.pageNumber));
        }

        const pagesToAnalyse = prospectus.pages.filter(page =>
            relevantPages.size === 0 ||
            relevantPages.has(page.pageNumber)
        );

        const detected = [];
        let currentFaculty = null;
        let currentDepartment = null;
        const catalogue = window.UniCompanionProgrammeCatalogue?.[prospectus.university] || {};

        for (const page of pagesToAnalyse) {
            const lines = getPageRows(page);

            lines.forEach((line, lineIndex) => {
                const cells = splitRowIntoCells(line);
                const cleaned = cleanText(line.text);
                const facultyCell = cells.map(cell => cleanText(cell.text)).find(text => cleanFacultyHeading(text));
                let faculty = cleanFacultyHeading(facultyCell);
                if (faculty && lines[lineIndex + 1]) {
                    const nextCell = splitRowIntoCells(lines[lineIndex + 1]).find(cell =>
                        cell.x !== null && cells.find(item => cleanFacultyHeading(item.text))?.x !== null &&
                        Math.abs(cell.x - cells.find(item => cleanFacultyHeading(item.text)).x) < 18 &&
                        isContinuationLine(cell.text)
                    );
                    if (nextCell) faculty = cleanFacultyHeading(`${facultyCell} ${nextCell.text}`) || faculty;
                }
                if (faculty) {
                    currentFaculty = canonicalEntry(faculty, catalogue.faculties);
                    currentDepartment = null;
                }
                const departmentCell = cells.map(cell => cleanText(cell.text)).find(text => /^Department\s+of\s+[^|;]{2,75}$/i.test(text));
                const departmentMatch = (departmentCell || cleaned).match(/^Department\s+of\s+([^|;]{2,75})$/i);
                if (departmentMatch) currentDepartment = `Department of ${departmentMatch[1].trim()}`;

                const titleCells = cells.filter(cell => HEADING_PATTERN.test(cleanText(cell.text)));
                const titleCell = titleCells.find(cell => isValidTitle(trimHeading(cell.text))) || titleCells[0];
                const sourceTitle = titleCell ? cleanText(titleCell.text) : cleaned;
                if (!HEADING_PATTERN.test(sourceTitle)) return;

                let title = trimHeading(sourceTitle);

                // PDF text often wraps a degree title onto a short second
                // line (for example, "Bachelor of Economic" / "Sciences").
                // Join only a clean, short continuation; never absorb a row
                // containing scores, requirements, or subject names.
                const nextLine = lines[lineIndex + 1];
                const continuation = nextLine && splitRowIntoCells(nextLine).find(cell =>
                    (titleCell?.x === undefined || cell.x === null || Math.abs(cell.x - titleCell.x) < 18) &&
                    isContinuationLine(cell.text)
                );
                if (continuation) {
                    const extendedTitle = trimHeading(`${title} ${continuation.text}`);
                    if (extendedTitle.length <= CONFIG.maximumTitleLength && !/\b(?:as well as|English\s+Level|APS|FPS|WPS)\b/i.test(extendedTitle)) {
                        title = extendedTitle;
                    }
                }

                if (!isValidTitle(title)) return;
                title = canonicalEntry(title, catalogue.programmes);

                detected.push({
                    title,
                    type: getQualificationType(title),
                    faculty: currentFaculty,
                    department: currentDepartment,
                    pageNumber: page.pageNumber,
                    lineIndex,
                    confidence: 0.85
                });
            });
        }

        // Combine repeated occurrences but preserve every location.
        const grouped = new Map();

        for (const candidate of detected) {
            const key = normaliseKey(candidate.title);

            if (!grouped.has(key)) {
                grouped.set(key, {
                    title: candidate.title,
                    type: candidate.type,
                    faculty: candidate.faculty,
                    department: candidate.department,
                    confidence: candidate.confidence,
                    sourceLocations: []
                });
            }

            const programme = grouped.get(key);

            programme.sourceLocations.push({
                pageNumber: candidate.pageNumber,
                lineIndex: candidate.lineIndex
            });
        }

        const programmes = Array.from(grouped.values())
            .map((programme, index) => {
                const locations = programme.sourceLocations
                    .sort((a, b) =>
                        a.pageNumber - b.pageNumber ||
                        a.lineIndex - b.lineIndex
                    );

                return {
                    id: index + 1,
                    programmeName: programme.title,
                    qualificationType: programme.type,
                    faculty: programme.faculty || null,
                    department: programme.department || null,
                    sourceLocations: locations,
                    sourcePages: [
                        ...new Set(locations.map(item => item.pageNumber))
                    ],
                    confidence: programme.confidence,
                    reviewStatus: "ready"
                };
            });

        return {
            university: prospectus.university,
            admissionYear: prospectus.admissionYear,
            totalPagesAnalysed: pagesToAnalyse.length,
            totalCandidates: detected.length,
            detectedProgrammes: programmes.length,
            programmes,
            detectedAt: new Date().toISOString()
        };
    }

    function analyse() {
        const prospectus = window.UniCompanionProspectus;

        if (!prospectus) {
            throw new Error("Prospectus has not loaded.");
        }

        const result = detectProgrammes(
            prospectus,
            window.UniCompanionDocumentAnalysis || null
        );

        window.UniCompanionProgrammeDetection = result;

        console.log("[Programme Detector] Detection complete.");
        console.log({
            pagesAnalysed: result.totalPagesAnalysed,
            candidatesFound: result.totalCandidates,
            programmesDetected: result.detectedProgrammes
        });

        console.table(result.programmes.map(programme => ({
            programme: programme.programmeName,
            pages: programme.sourcePages.join(", "),
            confidence: programme.confidence
        })));

        return result;
    }

    window.UniCompanionProgrammeDetector = {
        analyse,
        detect: detectProgrammes
    };

    if (window.UniCompanionProspectusReady) {
        window.UniCompanionProspectusReady
            .then(analyse)
            .catch(error =>
                console.error("[Programme Detector]", error)
            );
    }
})();
