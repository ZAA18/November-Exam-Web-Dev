
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
            sourceText: subject.sourceText || "",
            achievementPercent: Number.isFinite(Number(subject.achievementPercent))
                ? Number(subject.achievementPercent) : null
        };
    }

    function normaliseAPS(item) {
        return {
            score: Number(item.value),
            type: item.type || "APS",
            sourcePage: Number(item.sourcePage),
            sourceText: item.sourceText || ""
        };
    }

    function normaliseProgramme(programme) {
        return {
            id: programme.programmeId,
            name: programme.programmeName,
            qualificationType: programme.qualificationType || "Unknown",
            faculty: programme.faculty || null,
            department: programme.department || null,

            aps: (programme.apsResults || []).map(normaliseAPS),

            subjects: (programme.subjectRequirements || [])
                .map(normaliseSubject),

            selectionRequirements:
                (programme.selectionRequirements || []).map(item => ({
                    description: item.description,
                    sourcePage: Number(item.sourcePage),
                    sourceText: item.sourceText || item.description || ""
                })),

            sourcePages: [
                ...new Set((programme.sourcePages || []).map(Number))
            ],

            sourceLocations: programme.sourceLocations || [],
            extractionStatus: programme.extractionStatus || "candidate",
            confidence: Number.isFinite(Number(programme.confidence))
                ? Number(programme.confidence) : null,

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
            universityId: String(data.universityId || data.university || "unknown").toLowerCase(),
            university: data.university || "Unknown",
            prospectusSource: data.prospectusSource || null,
            admissionYear: Number(data.admissionYear) || null,
            extractedAt: data.extractedAt || new Date().toISOString(),

            programmes: data.programmes.map(normaliseProgramme)
        };
    }

    window.UniCompanionDataNormaliser = {
        normalise
    };
})();

