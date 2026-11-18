
/* =========================================================
   UNICOMPANION — PROGRAMME DETECTOR
   Automatically identifies qualification and programme
   names from extracted prospectus pages.

   Depends on:
   - prospectus-reader.js
   - document-analyser.js

   Output:
   window.UniCompanionProgrammeDetection
========================================================= */

(() => {
    "use strict";

    const CONFIG = {
        minimumConfidence: 0.45,
        contextPages: 1,
        maximumTitleLength: 180,
        minimumTitleLength: 8
    };

    /*
       These patterns identify qualification TYPES,
       not specific university programme names.

       This allows the detector to work across universities
       without manually entering their programme lists.
    */

    const QUALIFICATION_PATTERNS = [
        {
            type: "Bachelor",
            pattern: /\bBachelor(?:'s)?\s+(?:of|in)\s+[A-Z][A-Za-z&(),/'’\-\s]{2,130}/g
        },
        {
            type: "Bachelor",
            pattern: /\bB(?:A|Sc|Com|Eng|Ed|Acc|Mus|SocSci|Admin|Dent|Pharm|Nurs|Arch|Theatre|FineArt)\b(?:\s+(?:in|of)\s+[A-Z][A-Za-z&(),/'’\-\s]{2,100})?/g
        },
        {
            type: "LLB",
            pattern: /\bLLB\b(?:\s+(?:Bachelor\s+of\s+)?Laws?)?/g
        },
        {
            type: "Diploma",
            pattern: /\b(?:National\s+)?Diploma\s+(?:in|of)\s+[A-Z][A-Za-z&(),/'’\-\s]{2,120}/g
        },
        {
            type: "Advanced Diploma",
            pattern: /\bAdvanced\s+Diploma\s+(?:in|of)\s+[A-Z][A-Za-z&(),/'’\-\s]{2,120}/g
        },
        {
            type: "Higher Certificate",
            pattern: /\bHigher\s+Certificate\s+(?:in|of)\s+[A-Z][A-Za-z&(),/'’\-\s]{2,120}/g
        },
        {
            type: "Certificate",
            pattern: /\bCertificate\s+(?:in|of)\s+[A-Z][A-Za-z&(),/'’\-\s]{2,120}/g
        }
    ];

    const EXCLUDED_TITLES = [
        "bachelor of",
        "bachelor in",
        "diploma in",
        "certificate in",
        "higher certificate in",
        "advanced diploma in",
        "bsc",
        "ba",
        "bcom",
        "beng",
        "bed"
    ];

    function cleanText(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .replace(/[|•]+/g, " ")
            .replace(/\s+([,.;:])/g, "$1")
            .trim();
    }

    function normaliseTitle(value) {
        return cleanText(value)
            .replace(/[.,;:]+$/, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function isValidTitle(title) {
        if (!title) return false;

        if (
            title.length < CONFIG.minimumTitleLength ||
            title.length > CONFIG.maximumTitleLength
        ) {
            return false;
        }

        const lower = title.toLowerCase();

        if (EXCLUDED_TITLES.includes(lower)) {
            return false;
        }

        if (/^(page|faculty|school|department|admission|requirements)\b/i.test(title)) {
            return false;
        }

        return true;
    }

    function getPageLines(page) {
        if (Array.isArray(page.lines) && page.lines.length) {
            return page.lines
                .map(line => typeof line === "string" ? line : line.text)
                .filter(Boolean);
        }

        return String(page.text || "")
            .split(/\n/)
            .map(line => line.trim())
            .filter(Boolean);
    }

    function getPageText(page) {
        return cleanText(
            getPageLines(page).join(" ")
        );
    }

    function detectCandidatesInText(text, pageNumber) {
        const candidates = [];

        for (const qualification of QUALIFICATION_PATTERNS) {
            const regex = new RegExp(
                qualification.pattern.source,
                qualification.pattern.flags
            );

            let match;

            while ((match = regex.exec(text)) !== null) {
                const title = normaliseTitle(match[0]);

                if (!isValidTitle(title)) continue;

                candidates.push({
                    title,
                    type: qualification.type,
                    pageNumber,
                    confidence: 0.55,
                    source: "qualification-pattern"
                });

                if (match[0].length === 0) {
                    regex.lastIndex++;
                }
            }
        }

        return candidates;
    }

    /*
       Short headings are often the actual programme names.
       This method gives additional weight to qualification
       names that appear on their own line.
    */

    function detectHeadingCandidates(page) {
        const candidates = [];
        const lines = getPageLines(page);

        for (const line of lines) {
            const cleaned = normaliseTitle(line);

            if (!isValidTitle(cleaned)) continue;

            const matchesQualification = QUALIFICATION_PATTERNS.some(
                item => {
                    const regex = new RegExp(
                        item.pattern.source,
                        item.pattern.flags
                    );

                    return regex.test(cleaned);
                }
            );

            if (matchesQualification) {
                candidates.push({
                    title: cleaned,
                    type: "Detected qualification heading",
                    pageNumber: page.pageNumber,
                    confidence: 0.8,
                    source: "heading"
                });
            }
        }

        return candidates;
    }

    function removeDuplicates(candidates) {
        const unique = new Map();

        for (const candidate of candidates) {
            const key = candidate.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, " ")
                .trim();

            if (!unique.has(key)) {
                unique.set(key, candidate);
                continue;
            }

            const existing = unique.get(key);

            if (candidate.confidence > existing.confidence) {
                unique.set(key, candidate);
            }
        }

        return Array.from(unique.values());
    }

    function calculateConfidence(candidate, page) {
        let score = candidate.confidence;

        const pageText = getPageText(page).toLowerCase();
        const title = candidate.title.toLowerCase();

        if (pageText.includes(title)) {
            score += 0.05;
        }

        if (candidate.source === "heading") {
            score += 0.05;
        }

        if (
            /\b(aps|admission requirements|entry requirements|minimum requirements)\b/i
                .test(pageText)
        ) {
            score += 0.05;
        }

        return Math.min(score, 0.98);
    }

    function detectProgrammes(prospectus, documentAnalysis) {
        if (!prospectus || !Array.isArray(prospectus.pages)) {
            throw new Error(
                "Prospectus data is missing. Load the PDF first."
            );
        }

        const relevantPageNumbers = new Set();

        if (
            documentAnalysis &&
            Array.isArray(documentAnalysis.pages)
        ) {
            documentAnalysis.pages
                .filter(page => page.relevant)
                .forEach(page => {
                    relevantPageNumbers.add(page.pageNumber);
                });
        }

        const pagesToAnalyse = prospectus.pages.filter(page => {
            return relevantPageNumbers.size === 0 ||
                relevantPageNumbers.has(page.pageNumber);
        });

        let allCandidates = [];

        for (const page of pagesToAnalyse) {
            const pageText = getPageText(page);

            const textCandidates = detectCandidatesInText(
                pageText,
                page.pageNumber
            );

            const headingCandidates = detectHeadingCandidates(page);

            const candidates = [
                ...textCandidates,
                ...headingCandidates
            ].map(candidate => ({
                ...candidate,
                confidence: calculateConfidence(candidate, page)
            }));

            allCandidates.push(...candidates);
        }

        allCandidates = removeDuplicates(allCandidates);

        const programmes = allCandidates
            .filter(candidate => {
                return candidate.confidence >= CONFIG.minimumConfidence;
            })
            .sort((a, b) => {
                return a.pageNumber - b.pageNumber;
            })
            .map((candidate, index) => ({
                id: index + 1,
                programmeName: candidate.title,
                qualificationType: candidate.type,
                sourcePages: [candidate.pageNumber],
                confidence: Number(candidate.confidence.toFixed(2)),
                reviewStatus: "needs-review"
            }));

        return {
            university: prospectus.university,
            admissionYear: prospectus.admissionYear,
            totalPagesAnalysed: pagesToAnalyse.length,
            totalCandidates: allCandidates.length,
            detectedProgrammes: programmes.length,
            programmes,
            detectedAt: new Date().toISOString()
        };
    }

    function analyse() {
        const prospectus = window.UniCompanionProspectus;

        if (!prospectus) {
            throw new Error(
                "Prospectus has not been loaded yet."
            );
        }

        const documentAnalysis =
            window.UniCompanionDocumentAnalysis || null;

        const result = detectProgrammes(
            prospectus,
            documentAnalysis
        );

        window.UniCompanionProgrammeDetection = result;

        console.log(
            "[Programme Detector] Detection complete."
        );

        console.log({
            pagesAnalysed: result.totalPagesAnalysed,
            candidatesFound: result.totalCandidates,
            programmesDetected: result.detectedProgrammes
        });

        console.table(
            result.programmes.map(programme => ({
                programme: programme.programmeName,
                type: programme.qualificationType,
                pages: programme.sourcePages.join(", "),
                confidence: programme.confidence
            }))
        );

        return result;
    }

    window.UniCompanionProgrammeDetector = {
        analyse,
        detect: detectProgrammes
    };

    /*
       Automatically run after the prospectus and document
       analysis have finished loading.
    */

    if (window.UniCompanionProspectusReady) {
        window.UniCompanionProspectusReady
            .then(() => {
                analyse();
            })
            .catch(error => {
                console.error(
                    "[Programme Detector] Could not start:",
                    error
                );
            });
    }

})();
