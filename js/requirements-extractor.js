
/* =========================================================
   UNICOMPANION — REQUIREMENTS EXTRACTOR
   Extracts APS, subject levels and selection information.
========================================================= */

(() => {
    "use strict";

    const CONFIG = {
        pagesBefore: 1,
        pagesAfter: 2
    };

    const SUBJECTS = [
        { name: "Mathematics", pattern: /\bmathematics\b|\bmaths\b/i },
        { name: "Mathematical Literacy", pattern: /\bmathematical literacy\b|\bmaths literacy\b/i },
        { name: "English", pattern: /\benglish\b/i },
        { name: "Physical Sciences", pattern: /\bphysical sciences?\b/i },
        { name: "Life Sciences", pattern: /\blife sciences?\b/i },
        { name: "Accounting", pattern: /\baccounting\b/i },
        { name: "Geography", pattern: /\bgeography\b/i },
        { name: "History", pattern: /\bhistory\b/i },
        { name: "Economics", pattern: /\beconomics?\b/i },
        { name: "Business Studies", pattern: /\bbusiness studies\b/i },
        { name: "Information Technology", pattern: /\binformation technology\b|\bIT\b/i },
        { name: "Technical Mathematics", pattern: /\btechnical mathematics\b/i },
        { name: "Technical Sciences", pattern: /\btechnical sciences\b/i },
        { name: "Life Orientation", pattern: /\blife orientation\b/i }
    ];

    function clean(value) {
        return String(value || "")
            .replace(/\s+/g, " ")
            .trim();
    }

    function getPageText(page) {
        if (Array.isArray(page.lines) && page.lines.length) {
            return page.lines
                .map(line => typeof line === "string" ? line : line.text)
                .filter(Boolean)
                .join("\n");
        }

        return String(page.text || "");
    }

    function findPage(prospectus, pageNumber) {
        return prospectus.pages.find(
            page => page.pageNumber === pageNumber
        );
    }

    function getProgrammePages(programme, prospectus) {
        const pageNumbers = new Set();

        for (const sourcePage of programme.sourcePages || []) {
            for (
                let number = sourcePage - CONFIG.pagesBefore;
                number <= sourcePage + CONFIG.pagesAfter;
                number++
            ) {
                if (number >= 1 && number <= prospectus.pageCount) {
                    pageNumbers.add(number);
                }
            }
        }

        return Array.from(pageNumbers)
            .sort((a, b) => a - b)
            .map(number => findPage(prospectus, number))
            .filter(Boolean);
    }

    function extractAPS(text, pageNumber) {
        const results = [];

        const patterns = [
            /\bAPS\b\s*(?:score|of|:|=)?\s*(?:is|of|:|=)?\s*(\d{1,2})\b/gi,
            /\bAdmission\s+Point(?:s)?\s+Score\b\s*(?:of|:|=)?\s*(\d{1,2})\b/gi,
            /\bminimum\s+APS\b\s*(?:of|:|=)?\s*(\d{1,2})\b/gi,
            /\bminimum\s+admission\s+points?\b\s*(?:of|:|=)?\s*(\d{1,2})\b/gi
        ];

        for (const pattern of patterns) {
            let match;

            while ((match = pattern.exec(text)) !== null) {
                const score = Number(match[1]);

                if (score >= 1 && score <= 60) {
                    results.push({
                        value: score,
                        sourcePage: pageNumber,
                        sourceText: clean(match[0]),
                        type: "APS"
                    });
                }
            }
        }

        return results;
    }

    function extractSubjectRequirements(text, pageNumber) {
        const results = [];
        const lines = text.split(/\n/);

        for (let i = 0; i < lines.length; i++) {
            const line = clean(lines[i]);

            if (!line) continue;

            for (const subject of SUBJECTS) {
                if (!subject.pattern.test(line)) continue;

                const context = [
                    lines[i - 1] || "",
                    line,
                    lines[i + 1] || ""
                ].join(" ");

                const levelPatterns = [
                    /\b(?:level|achievement level)\s*(\d)\b/i,
                    /\b(?:at least|minimum of)\s*(\d)\s*(?:on the NSC scale)?/i,
                    /\bNSC\s*(?:level)?\s*(\d)\b/i,
                    /\b(\d)\s*(?:or higher|minimum)\b/i
                ];

                let level = null;

                for (const pattern of levelPatterns) {
                    const match = context.match(pattern);
                    if (match) {
                        const value = Number(match[1]);
                        if (value >= 1 && value <= 7) {
                            level = value;
                            break;
                        }
                    }
                }

                if (level !== null) {
                    results.push({
                        subject: subject.name,
                        minimumLevel: level,
                        sourcePage: pageNumber,
                        sourceText: context.trim(),
                        type: "subject"
                    });
                }
            }
        }

        return results;
    }

    function extractSelectionRequirements(text, pageNumber) {
        const results = [];
        const patterns = [
            /\bportfolio\b/gi,
            /\baudition\b/gi,
            /\binterview\b/gi,
            /\bselection test\b/gi,
            /\bselection criteria\b/gi,
            /\badditional selection requirements\b/gi,
            /\bmedical examination\b/gi,
            /\bpractical assessment\b/gi
        ];

        const lines = text.split(/\n/);

        for (const line of lines) {
            const cleaned = clean(line);
            if (!cleaned) continue;

            for (const pattern of patterns) {
                if (pattern.test(cleaned)) {
                    results.push({
                        description: cleaned,
                        sourcePage: pageNumber,
                        type: "selection"
                    });
                    pattern.lastIndex = 0;
                }
            }
        }

        return results;
    }

    function uniqueBy(items, keyFunction) {
        const map = new Map();

        for (const item of items) {
            const key = keyFunction(item);
            if (!map.has(key)) map.set(key, item);
        }

        return Array.from(map.values());
    }

    function extractProgrammeRequirements(programme, prospectus) {
        const pages = getProgrammePages(programme, prospectus);

        const aps = [];
        const subjects = [];
        const selection = [];
        const sourcePages = [];

        for (const page of pages) {
            const text = getPageText(page);

            aps.push(...extractAPS(text, page.pageNumber));
            subjects.push(
                ...extractSubjectRequirements(text, page.pageNumber)
            );
            selection.push(
                ...extractSelectionRequirements(text, page.pageNumber)
            );

            sourcePages.push(page.pageNumber);
        }

        const uniqueAPS = uniqueBy(
            aps,
            item => `${item.value}-${item.sourcePage}`
        );

        const uniqueSubjects = uniqueBy(
            subjects,
            item => `${item.subject}-${item.minimumLevel}-${item.sourcePage}`
        );

        const uniqueSelection = uniqueBy(
            selection,
            item => `${item.description}-${item.sourcePage}`
        );

        return {
            programmeId: programme.id,
            programmeName: programme.programmeName,
            qualificationType: programme.qualificationType,
            apsResults: uniqueAPS,
            subjectRequirements: uniqueSubjects,
            selectionRequirements: uniqueSelection,
            sourcePages,
            extractionStatus: "needs-review"
        };
    }

    function extractAll(prospectus, detection) {
        if (!prospectus || !detection) {
            throw new Error("Prospectus or programme detection data is missing.");
        }

        const programmes = detection.programmes || [];

        return {
            university: prospectus.university,
            admissionYear: prospectus.admissionYear,
            programmes: programmes.map(programme =>
                extractProgrammeRequirements(programme, prospectus)
            ),
            extractedAt: new Date().toISOString()
        };
    }

    function analyse() {
        const prospectus = window.UniCompanionProspectus;
        const detection = window.UniCompanionProgrammeDetection;

        const result = extractAll(prospectus, detection);

        window.UniCompanionRequirements = result;

        console.log("[Requirements Extractor] Complete.");
        console.table(result.programmes.map(programme => ({
            programme: programme.programmeName,
            APS: programme.apsResults.map(item => item.value).join(", ") || "Not found",
            subjects: programme.subjectRequirements.length,
            selection: programme.selectionRequirements.length
        })));

        return result;
    }

    window.UniCompanionRequirementsExtractor = {
        analyse,
        extract: extractAll
    };
})();
