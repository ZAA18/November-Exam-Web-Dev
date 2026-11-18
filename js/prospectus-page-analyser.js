
(function () {
    "use strict";

    console.log("[Page Analyser] Starting...");

    async function analysePages() {
        const pages = window.UniCompanionProspectus?.pages;

        if (!pages || pages.length === 0) {
            console.error("[Page Analyser] Prospectus pages unavailable.");
            return;
        }

        const patterns = [
            /admission requirements?/i,
            /entry requirements?/i,
            /minimum requirements?/i,
            /\bAPS\b/i,
            /faculty of/i,
            /school of/i,
            /\bBachelor of\b/i,
            /\bBSc\b/i,
            /\bBA\b/i,
            /\bBCom\b/i,
            /mathematics/i,
            /mathematical literacy/i,
            /english/i,
            /selection requirements?/i,
            /undergraduate programmes?/i
        ];

        const results = pages.map(page => {
            const pageText = page.text || "";

            const matches = patterns.filter(pattern =>
                pattern.test(pageText)
            );

            return {
                page: page.pageNumber,
                characters: pageText.length,
                matchCount: matches.length,
                text: pageText
            };
        }).filter(page => page.matchCount > 0);

        window.UniCompanionPageAnalysis = results;

        console.log("[Page Analyser] Analysis complete.");
        console.log("Total PDF pages:", pages.length);
        console.log("Potentially relevant pages:", results.length);

        console.table(results.map(page => ({
            page: page.page,
            characters: page.characters,
            matches: page.matchCount
        })));

        // Create a text report containing the full extracted text.
        const report = results.map(page => {
            return `
========================================
PDF PAGE: ${page.page}
KEYWORD MATCHES: ${page.matchCount}
========================================

${page.text}
`;
        }).join("\n\n");

        const blob = new Blob([report], {
            type: "text/plain;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "wits-prospectus-page-analysis.txt";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        console.log(
            "[Page Analyser] Text report downloaded successfully."
        );
    }

    if (window.UniCompanionProspectusReady) {
        window.UniCompanionProspectusReady
            .then(analysePages)
            .catch(error => {
                console.error("[Page Analyser] Error:", error);
            });
    } else {
        console.error("[Page Analyser] Prospectus loading promise missing.");
    }

})();
