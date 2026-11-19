/* University editions and their separate admission-score rules. */
(() => {
    "use strict";
    const institutions = [
        ["wits", "Wits University", 2027, "../prospectuses/wits/wits-2027.pdf"],
        ["uct", "University of Cape Town", 2027, "../prospectuses/UCT/2027-uct-undergraduate-prospectus-1-april-2026.pdf"],
        ["up", "University of Pretoria", 2027, "../prospectuses/UP/UP_UG Prospectus 2027_NSC-IEB_DevV5_web_0.pdf"],
        ["uj", "University of Johannesburg", 2027, "../prospectuses/UJ/uj_undergrad_prospectus2027_online_25jun2026.pdf"],
        ["ufh", "University of Fort Hare", 2027, "../prospectuses/UFH/Study-Guide-2027.pdf"],
        ["rhodes", "Rhodes University", 2026, "../prospectuses/Rhodes/RU_READY_Undergraduate_Prospectus_2026_DIGITAL_A5_Landscape_24pp_18Mar2026.pdf"],
        ["wsu", "Walter Sisulu University", 2027, "../prospectuses/WSU/2027-information-brochure-admission-requirements walter sisulu.pdf"],
        ["stellenbosch", "Stellenbosch University", 2027, "../prospectuses/SU/stellenbosch university prospectus 2027.pdf"],
        ["ufs", "University of the Free State", 2027, "../prospectuses/UFS/ufs---ug-prospectus-2027---jan.pdf"]
    ];
    const scoring = {
        wits: { method: "wits-2027", source: "https://www.wits.ac.za/undergraduate/entry-requirements/", sourceLabel: "Wits 2027 NSC points table", subjectCount: 7, lifeOrientation: "included-with-capped-points" },
        uct: { method: "uct-fps", source: "https://degree.uct.ac.za/sites/default/files/media/documents/2027-uct-undergraduate-prospectus-1-april-2026.pdf", sourceLabel: "UCT 2027 Undergraduate Prospectus, FPS section", subjectCount: 6, lifeOrientation: "excluded", facultySpecific: true },
        up: { method: "nsc-six-levels", source: "https://drupalwebprod-files.up.ac.za/Public/2026-01/UP_UG%20Prospectus%202027_NSC-IEB_DevV5_web_0.pdf", sourceLabel: "UP 2027 Undergraduate Prospectus", subjectCount: 6, lifeOrientation: "excluded" },
        uj: { method: "nsc-six-levels", source: "https://www.uj.ac.za/wp-content/uploads/2026/06/uj_undergrad_prospectus2027.pdf", sourceLabel: "UJ 2027 Undergraduate Prospectus", subjectCount: 6, lifeOrientation: "excluded", includeRequiredSubjects: true },
        rhodes: { method: "rhodes-six-tenths", source: "https://www.ru.ac.za/media/rhodesuniversity/content/facultyofcommerce/documents/Undergraduate_information_booklet_2026.pdf", sourceLabel: "Rhodes 2026 Undergraduate Information Booklet, p. 12", subjectCount: 6, lifeOrientation: "excluded", minimumMark: 40 },
        stellenbosch: { method: "su-nsc-average", source: "https://www.su.ac.za/en/apply/undergrad/apply-0/admission-and-selection-requirements", sourceLabel: "Stellenbosch admission and selection requirements", subjectCount: 6, lifeOrientation: "excluded", languageSubjects: ["English", "Afrikaans"] },
        wsu: { method: "wsu-six-categories", source: "https://www.wsu.ac.za/media/attachments/2026/05/27/2027-information-brochure-admission-requirements.pdf", sourceLabel: "WSU 2027 Undergraduate Information Brochure, APS conversion section", subjectCount: 6, lifeOrientation: "education-programmes-only", languageCount: 2, otherSubjectCount: 4 },
        ufh: { method: "ufh-seven-nsc", source: "https://dev.ufh.ac.za/wp-content/uploads/2025/01/2025-SA-Prospectus-Online-Version.pdf", sourceLabel: "UFH published seven-subject APS conversion", subjectCount: 7, lifeOrientation: "included-capped-at-level-4" },
        ufs: { method: "ufs-six-ap", source: "https://www.ufs.ac.za/docs/librariesprovider44/undergraduate/ufs---ug-prospectus-2027---jan.pdf", sourceLabel: "UFS 2027 Undergraduate Prospectus, p. 50", subjectCount: 6, lifeOrientation: "one-bonus-point-at-level-5" }
    };
    window.UniCompanionUniversities = Object.fromEntries(institutions.map(([id, name, year, pdfPath]) => [id, {
        id, name, admissionYear: year, prospectus: pdfPath,
        scoring: scoring[id] || null,
        scoringStatus: scoring[id] ? "configured" : "needs-configuration",
        programmes: [], extractionStatus: pdfPath ? "not-yet-extracted" : "prospectus-unavailable"
    }]));
})();
