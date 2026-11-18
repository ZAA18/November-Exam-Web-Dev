
/* =========================================================
   UNICOMPANION — DATA NORMALISER
   Converts extraction results into a consistent schema.
========================================================= */

(() => {
    "use strict";

    function normaliseSubject(subject) {
        return {
            subject: subject.subject,
            minimumLevel: Number(subject.minimumLevel),
            sourcePage: Number(subject.sourcePage),
            sourceText: subject.sourceText || ""
        };
    }

    function normaliseAPS(item) {
        return {
            score: Number(item.value),
            sourcePage: Number(item.sourcePage),
            sourceText: item.sourceText || ""
        };
    }

    function normaliseProgramme(programme) {
        return {
            id: programme.programmeId,
            name: programme.programmeName,
            qualificationType: programme.qualificationType || "Unknown",

            aps: (programme.apsResults || []).map(normaliseAPS),

            subjects: (programme.subjectRequirements || [])
                .map(normaliseSubject),

            selectionRequirements:
                (programme.selectionRequirements || []).map(item => ({
                    description: item.description,
                    sourcePage: Number(item.sourcePage)
                })),

            sourcePages: [
                ...new Set((programme.sourcePages || []).map(Number))
            ],

            sourceLocations: programme.sourceLocations || [],

            confidence: null,

            // Extraction is not automatically labelled as needing review.
            reviewStatus: "ready"
        };
    }

    function normalise(data) {
        if (!data || !Array.isArray(data.programmes)) {
            throw new Error("No programme requirements were provided.");
        }

        return {
            schemaVersion: "1.0",
            university: data.university || "Unknown",
            admissionYear: Number(data.admissionYear) || null,
            extractedAt: data.extractedAt || new Date().toISOString(),

            programmes: data.programmes.map(normaliseProgramme)
        };
    }

    window.UniCompanionDataNormaliser = {
        normalise
    };
})();

