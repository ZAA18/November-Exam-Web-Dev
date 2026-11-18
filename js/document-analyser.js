
/* =====================================================
   UNICOMPANION — DOCUMENT ANALYSER
   Analyses prospectus structure without an AI API.
===================================================== */

(() => {
    "use strict";

    const CONFIG = {
        // Minimum score for a page to be considered relevant.
        relevanceThreshold: 3,

        // Maximum gap between pages in the same section.
        sectionPageGap: 1
    };

    const PATTERNS = {
        admission: [
            /\badmission requirements?\b/i,
            /\bentry requirements?\b/i,
            /\bminimum requirements?\b/i,
            /\bentrance requirements?\b/i,
            /\bundergraduate admission\b/i
        ],

        aps: [
            /\bAPS\b/i,
            /\badmission point score\b/i,
            /\badmission points?\b/i,
            /\bpoints required\b/i
        ],

        programme: [
            /\bBachelor of\b/i,
            /\bBachelor\b/i,
            /\bBSc\b/i,
            /\bBA\b/i,
            /\bBCom\b/i,
            /\bBEng\b/i,
            /\bBEd\b/i,
            /\bDiploma\b/i,
            /\bHigher Certificate\b/i,
            /\bAdvanced Diploma\b/i
        ],

        subjects: [
            /\bMathematics\b/i,
            /\bMathematical Literacy\b/i,
            /\bEnglish\b/i,
            /\bPhysical Sciences\b/i,
            /\bLife Sciences\b/i,
            /\bAccounting\b/i,
            /\bsubject requirements?\b/i,
            /\bNSC\b/i
        ],

        selection: [
            /\bselection criteria\b/i,
            /\bselection requirements?\b/i,
            /\badditional requirements?\b/i,
            /\bportfolio\b/i,
            /\baudition\b/i,
            /\binterview\b/i
        ],

        faculty: [
            /\bfaculty of\b/i,
            /\bschool of\b/i,
            /\bdepartment of\b/i
        ],

        qualification: [
            /\bqualification\b/i,
            /\bqualifications\b/i,
            /\bdegree programmes?\b/i,
            /\bundergraduate programmes?\b/i
        ]
    };

    function countMatches(text, patterns) {
        return patterns.reduce((total, pattern) => {
            return total + (pattern.test(text) ? 1 : 0);
        }, 0);
    }

    function getMatchedCategories(text) {
        const categories = [];

        for (const [category, patterns] of Object.entries(PATTERNS)) {
            if (patterns.some(pattern => pattern.test(text))) {
                categories.push(category);
            }
        }

        return categories;
    }

    function calculatePageScore(text) {
        let score = 0;

        // Strong indicators of admission information.
        score += countMatches(text, PATTERNS.admission) * 4;
        score += countMatches(text, PATTERNS.aps) * 4;
        score += countMatches(text, PATTERNS.selection) * 3;

        // Supporting indicators.
        score += countMatches(text, PATTERNS.programme) * 2;
        score += countMatches(text, PATTERNS.subjects);
        score += countMatches(text, PATTERNS.faculty);
        score += countMatches(text, PATTERNS.qualification);

        return score;
    }

    function detectHeadings(lines) {
        const headingPatterns = [
            /admission/i,
            /entry requirements/i,
            /minimum requirements/i,
            /undergraduate programmes/i,
            /selection criteria/i,
            /faculty of/i,
            /school of/i,
            /degree programmes/i,
            /qualification/i
        ];

        return lines
            .filter(line => {
                const text = line.text.trim();

                if (!text || text.length > 110) {
                    return false;
                }

                return headingPatterns.some(pattern =>
                    pattern.test(text)
                );
            })
            .map(line => ({
                text: line.text.trim(),
                y: line.y
            }));
    }

    function classifyPage(categories, score) {
        const types = [];

        if (categories.includes("admission")) {
            types.push("admission_information");
        }

        if (categories.includes("aps")) {
            types.push("aps_information");
        }

        if (categories.includes("programme")) {
            types.push("programme_information");
        }

        if (categories.includes("subjects")) {
            types.push("subject_information");
        }

        if (categories.includes("selection")) {
            types.push("selection_information");
        }

        if (categories.includes("faculty")) {
            types.push("faculty_information");
        }

        if (types.length === 0 && score > 0) {
            types.push("supporting_information");
        }

        return types;
    }

    function analysePage(page) {
        const text = page.text || "";
        const lines = page.lines || [];

        const score = calculatePageScore(text);
        const categories = getMatchedCategories(text);

        return {
            pageNumber: page.pageNumber,
            characterCount: text.length,
            score,
            relevant: score >= CONFIG.relevanceThreshold,
            categories,
            pageTypes: classifyPage(categories, score),
            headings: detectHeadings(lines),
            text
        };
    }

    function groupPagesIntoSections(analysedPages) {
        const relevantPages = analysedPages
            .filter(page => page.relevant)
            .sort((a, b) => a.pageNumber - b.pageNumber);

        const sections = [];
        let currentSection = null;

        relevantPages.forEach(page => {
            const belongsToCurrentSection =
                currentSection &&
                page.pageNumber - currentSection.endPage <=
                    CONFIG.sectionPageGap + 1;

            if (!belongsToCurrentSection) {
                currentSection = {
                    id: sections.length + 1,
                    startPage: page.pageNumber,
                    endPage: page.pageNumber,
                    pages: [],
                    categories: new Set()
                };

                sections.push(currentSection);
            }

            currentSection.endPage = page.pageNumber;
            currentSection.pages.push(page.pageNumber);

            page.categories.forEach(category => {
                currentSection.categories.add(category);
            });
        });

        return sections.map(section => ({
            id: section.id,
            startPage: section.startPage,
            endPage: section.endPage,
            pages: section.pages,
            categories: [...section.categories]
        }));
    }

    function analyseProspectus(prospectus) {
        if (!prospectus || !Array.isArray(prospectus.pages)) {
            throw new Error(
                "A valid loaded prospectus is required."
            );
        }

        console.log("[Document Analyser] Analysing prospectus...");

        const analysedPages = prospectus.pages.map(analysePage);

        const relevantPages = analysedPages.filter(
            page => page.relevant
        );

        const sections = groupPagesIntoSections(analysedPages);

        const report = {
            university: prospectus.university,
            admissionYear: prospectus.admissionYear,
            totalPages: prospectus.pageCount,
            analysedAt: new Date().toISOString(),

            statistics: {
                totalPages: analysedPages.length,
                relevantPages: relevantPages.length,
                irrelevantPages:
                    analysedPages.length - relevantPages.length,
                detectedSections: sections.length
            },

            sections,
            pages: analysedPages
        };

        window.UniCompanionDocumentAnalysis = report;

        console.log("[Document Analyser] Analysis complete.");

        console.table(
            relevantPages.map(page => ({
                page: page.pageNumber,
                score: page.score,
                types: page.pageTypes.join(", "),
                headings: page.headings
                    .map(heading => heading.text)
                    .join(" | ")
            }))
        );

        console.log("Analysis statistics:", report.statistics);
        console.log("Detected sections:", sections);

        return report;
    }

    window.UniCompanionDocumentAnalyser = {
        analyse: analyseProspectus
    };

    // Wait until PDF.js has finished reading the prospectus.
    if (window.UniCompanionProspectusReady) {
        window.UniCompanionProspectusReady
            .then(prospectus => {
                analyseProspectus(prospectus);
            })
            .catch(error => {
                console.error(
                    "[Document Analyser] Could not analyse prospectus:",
                    error
                );
            });
    }

    console.log("[Document Analyser] Script loaded.");

})();
