
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
        /\bminimum\s+APS\b/i,
        /\bAPS\s+(?:of|score|minimum)\b/i,
        /\bapplicants?\s+(?:with|must|should|who)\b/i,
        /\bEnglish\s+(?:Home|First|Language|and)\b/i,
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

    function getPageLines(page) {
        if (Array.isArray(page.lines) && page.lines.length) {
            return page.lines
                .map(line =>
                    typeof line === "string" ? line : line.text
                )
                .filter(Boolean);
        }

        return String(page.text || "")
            .split(/\n/)
            .map(line => line.trim())
            .filter(Boolean);
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

    function normaliseKey(value) {
        return cleanText(value)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
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

        for (const page of pagesToAnalyse) {
            const lines = getPageLines(page);

            lines.forEach((line, lineIndex) => {
                const cleaned = cleanText(line);

                if (!HEADING_PATTERN.test(cleaned)) return;

                const title = trimHeading(cleaned);

                if (!isValidTitle(title)) return;

                detected.push({
                    title,
                    type: getQualificationType(title),
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
