
/* =========================================================
   UNICOMPANION — VALIDATION ENGINE
   Flags incomplete, suspicious and conflicting results.
========================================================= */

(() => {
    "use strict";

    function validateProgramme(programme) {
        const issues = [];
        const warnings = [];

        if (!programme.name) {
            issues.push("Programme name is missing.");
        }

        if (!programme.sourcePages || !programme.sourcePages.length) {
            issues.push("No source pages recorded.");
        }

        if (!programme.aps || programme.aps.length === 0) {
            warnings.push("No APS score was detected.");
        }

        if (programme.aps && programme.aps.length > 1) {
            const scores = [...new Set(
                programme.aps.map(item => item.score)
            )];

            if (scores.length > 1) {
                warnings.push(
                    `Multiple APS scores found: ${scores.join(", ")}. Check the source pages.`
                );
            }
        }

        for (const item of programme.aps || []) {
            if (
                !Number.isInteger(item.score) ||
                item.score < 1 ||
                item.score > 60
            ) {
                issues.push(
                    `Suspicious APS score: ${item.score}.`
                );
            }
        }

        for (const subject of programme.subjects || []) {
            if (
                !Number.isInteger(subject.minimumLevel) ||
                subject.minimumLevel < 1 ||
                subject.minimumLevel > 7
            ) {
                issues.push(
                    `Invalid level for ${subject.subject}.`
                );
            }
        }

        if (!programme.subjects || programme.subjects.length === 0) {
            warnings.push("No subject requirements were detected.");
        }

        return {
            programmeId: programme.id,
            programmeName: programme.name,
            valid: issues.length === 0,
            issues,
            warnings,
            reviewStatus:
                issues.length > 0 ? "invalid" :
                warnings.length > 0 ? "needs-review" :
                "review-required"
        };
    }

    function validate(data) {
        if (!data || !Array.isArray(data.programmes)) {
            throw new Error("No normalised programme data to validate.");
        }

        const results = data.programmes.map(validateProgramme);

        const validatedData = {
            ...data,
            programmes: data.programmes.map((programme, index) => ({
                ...programme,
                reviewStatus: results[index].reviewStatus
            })),
            validation: {
                total: results.length,
                valid: results.filter(item => item.valid).length,
                invalid: results.filter(item => !item.valid).length,
                requiringReview: results.filter(
                    item => item.reviewStatus !== "review-required"
                ).length,
                results,
                validatedAt: new Date().toISOString()
            }
        };

        return validatedData;
    }

    window.UniCompanionValidationEngine = {
        validate,
        validateProgramme
    };
})();
