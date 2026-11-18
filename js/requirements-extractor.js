
/* =========================================================
   UNICOMPANION — REQUIREMENTS EXTRACTOR
   Extracts requirements from each programme's own section.
========================================================= */

(() => {
    "use strict";

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
            .filter(Boolean);
    }

    function getPage(prospectus, pageNumber) {
        return prospectus.pages.find(
            page => page.pageNumber === pageNumber
        );
    }

    function getProgrammeSections(programme, detection, prospectus) {
        const allLocations = [];

        for (const item of detection.programmes || []) {
            for (const location of item.sourceLocations || []) {
                allLocations.push({
                    programmeId: item.id,
                    pageNumber: location.pageNumber,
                    lineIndex: location.lineIndex
                });
            }
        }

        allLocations.sort((a, b) =>
            a.pageNumber - b.pageNumber ||
            a.lineIndex - b.lineIndex
        );

        const ownLocations = (programme.sourceLocations || [])
            .slice()
            .sort((a, b) =>
                a.pageNumber - b.pageNumber ||
                a.lineIndex - b.lineIndex
            );

        const sections = [];

        for (const location of ownLocations) {
            const currentIndex = allLocations.findIndex(item =>
                item.programmeId === programme.id &&
                item.pageNumber === location.pageNumber &&
                item.lineIndex === location.lineIndex
            );

            const nextLocation = currentIndex >= 0
                ? allLocations[currentIndex + 1]
                : null;

            const startPage = location.pageNumber;
            const endPage = nextLocation
                ? nextLocation.pageNumber
                : prospectus.pageCount;

            for (
                let pageNumber = startPage;
                pageNumber <= endPage;
                pageNumber++
            ) {
                const page = getPage(prospectus, pageNumber);

                if (!page) continue;

                const lines = getPageLines(page);

                let startLine = 0;
                let endLine = lines.length;

                if (pageNumber === startPage) {
                    startLine = location.lineIndex;
                }

                if (
                    nextLocation &&
                    pageNumber === nextLocation.pageNumber
                ) {
                    endLine = nextLocation.lineIndex;
                }

                if (endLine > startLine) {
                    sections.push({
                        pageNumber,
                        lines: lines.slice(startLine, endLine)
                    });
                }
            }
        }

        return sections;
    }

    function extractAPS(text, pageNumber) {
        const results = [];

        const patterns = [
            /\bAPS\b\s*(?:score|of|:|=)?\s*(?:is|of|:|=)?\s*(\d{1,2})\b/gi,
            /\bAdmission\s+Points?\s+Score\b\s*(?:of|:|=)?\s*(\d{1,2})\b/gi,
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

        const levelPatterns = [
            /\b(?:level|achievement level)\s*(\d)\b/i,
            /\b(?:at least|minimum of)\s*(\d)\s*(?:on the NSC scale)?/i,
            /\bNSC\s*(?:level)?\s*(\d)\b/i,
            /\b(\d)\s*(?:or higher|minimum)\b/i
        ];

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
                        sourceText: clean(context),
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
            /\bportfolio\b/i,
            /\baudition\b/i,
            /\binterview\b/i,
            /\bselection test\b/i,
            /\bselection criteria\b/i,
            /\badditional selection requirements\b/i,
            /\bmedical examination\b/i,
            /\bpractical assessment\b/i
        ];

        for (const line of text.split(/\n/)) {
            const cleaned = clean(line);

            if (!cleaned) continue;

            if (patterns.some(pattern => pattern.test(cleaned))) {
                results.push({
                    description: cleaned,
                    sourcePage: pageNumber,
                    type: "selection"
                });
            }
        }

        return results;
    }

    function uniqueBy(items, keyFunction) {
        const map = new Map();

        for (const item of items) {
            const key = keyFunction(item);

            if (!map.has(key)) {
                map.set(key, item);
            }
        }

        return Array.from(map.values());
    }

    function extractProgrammeRequirements(programme, detection, prospectus) {
        const sections = getProgrammeSections(
            programme,
            detection,
            prospectus
        );

        const aps = [];
        const subjects = [];
        const selection = [];
        const sourcePages = [];

        for (const section of sections) {
            const text = section.lines.join("\n");

            aps.push(...extractAPS(text, section.pageNumber));
            subjects.push(
                ...extractSubjectRequirements(text, section.pageNumber)
            );
            selection.push(
                ...extractSelectionRequirements(text, section.pageNumber)
            );

            sourcePages.push(section.pageNumber);
        }

        return {
            programmeId: programme.id,
            programmeName: programme.programmeName,
            qualificationType: programme.qualificationType,

            apsResults: uniqueBy(
                aps,
                item => `${item.value}-${item.sourcePage}`
            ),

            subjectRequirements: uniqueBy(
                subjects,
                item =>
                    `${item.subject}-${item.minimumLevel}-${item.sourcePage}`
            ),

            selectionRequirements: uniqueBy(
                selection,
                item => `${item.description}-${item.sourcePage}`
            ),

            sourcePages: [...new Set(sourcePages)],
            sourceLocations: programme.sourceLocations || [],
            extractionStatus: "ready"
        };
    }

    function extractAll(prospectus, detection) {
        if (!prospectus || !detection) {
            throw new Error(
                "Prospectus or programme detection data is missing."
            );
        }

        return {
            university: prospectus.university,
            admissionYear: prospectus.admissionYear,

            programmes: (detection.programmes || []).map(programme =>
                extractProgrammeRequirements(
                    programme,
                    detection,
                    prospectus
                )
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
            APS: programme.apsResults
                .map(item => item.value)
                .join(", ") || "Not found",
            subjects: programme.subjectRequirements.length,
            selection: programme.selectionRequirements.length,
            pages: programme.sourcePages.join(", ")
        })));

        return result;
    }

    window.UniCompanionRequirementsExtractor = {
        analyse,
        extract: extractAll
    };
})();
