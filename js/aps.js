
/* =====================================================
   UNICOMPANION — APS & ELIGIBILITY CALCULATOR
   Requirements are loaded from Gemini's JSON extraction.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    /* =================================================
       1. HTML ELEMENTS
    ================================================= */

    const marksList = document.getElementById("marks-list");
    const subjectSelect = document.getElementById("subject-select");
    const addSubjectButton = document.getElementById("add-subject");
    const subjectTemplate = document.getElementById("subject-options");

    const calculateAPSButton = document.getElementById("calculate-aps");
    const calculateAverageButton = document.getElementById("calculate-average");
    const apsMessage = document.getElementById("aps-message");
    const prospectusStatus = document.getElementById("prospectus-status");

    const universityCards = document.querySelectorAll(".aps-university-card");
    const witsCard = document.querySelector('[data-university="wits"]');

    const resultsSection = document.getElementById("wits-programme-results");
    const resultsSummary = document.getElementById("wits-results-summary");
    const eligibleProgrammesList = document.getElementById("wits-eligible-programmes");
    const requirementsYear = document.getElementById("wits-requirements-year");

    const requiredElements = [
        marksList,
        subjectSelect,
        addSubjectButton,
        subjectTemplate,
        calculateAPSButton,
        calculateAverageButton,
        apsMessage,
        witsCard,
        resultsSection,
        resultsSummary,
        eligibleProgrammesList,
        requirementsYear
    ];

    if (requiredElements.some(element => !element)) {
        console.error("APS calculator: One or more HTML elements are missing.");
        return;
    }

    const witsAPSDisplay = witsCard.querySelector(".university-aps");
    const witsEligibleCount = witsCard.querySelector(".eligible-count");
    const witsCoursesButton = witsCard.querySelector(".view-university-courses");

    if (!witsAPSDisplay || !witsEligibleCount || !witsCoursesButton) {
        console.error("APS calculator: Wits card is incomplete.");
        return;
    }

/* =================================================
   2. LOAD DATA FROM THE NEW EXTRACTION ENGINE
================================================= */

let witsRequirements = null;

function loadWitsRequirements(data) {
    if (!data || !Array.isArray(data.programmes)) {
        console.error("[APS] Invalid extracted programme data.");
        return false;
    }

    witsRequirements = data;

    if (prospectusStatus) {
        prospectusStatus.textContent =
            `${data.programmes.length} programme candidates extracted from the Wits prospectus.`;
    }

    requirementsYear.textContent =
        String(data.admissionYear || 2027);

    console.log("[APS] Programme data successfully connected.", {
        university: data.university,
        year: data.admissionYear,
        programmes: data.programmes.length
    });

    return true;
}

window.addEventListener("unicomp:prospectus-ready", event => {
    loadWitsRequirements(event.detail);
});

window.addEventListener("unicomp:prospectus-error", event => {
    if (prospectusStatus) {
        prospectusStatus.textContent =
            `Prospectus extraction failed: ${event.detail?.message || "Unknown error"}`;
    }
});

// Handle the possibility that extraction finished
// before the APS calculator registered its event listener.
if (window.UniCompanionExtractedData) {
    loadWitsRequirements(window.UniCompanionExtractedData);
}

    /* =================================================
       3. SUBJECT PICKER
       This works independently of the JSON file.
    ================================================= */

    const subjectRows = Array.from(
        subjectTemplate.content.querySelectorAll(".mark-row")
    );

    const subjectDefinitions = new Map();

    subjectRows.forEach(row => {
        const input = row.querySelector("input[data-subject]");
        const label = row.querySelector("label");

        if (!input || !label) return;

        const subjectKey = input.dataset.subject;

        subjectDefinitions.set(subjectKey, {
            key: subjectKey,
            name: label.textContent.trim(),
            row
        });

        const option = document.createElement("option");
        option.value = subjectKey;
        option.textContent = label.textContent.trim();

        subjectSelect.appendChild(option);
    });

    if (subjectDefinitions.size === 0) {
        apsMessage.textContent =
            "No subjects were found. Check the subject-options template in your HTML.";
        console.error("No subject rows were found.");
        return;
    }

    function getAddedSubjects() {
        return Array.from(
            marksList.querySelectorAll("input[data-subject]")
        ).map(input => input.dataset.subject);
    }

    function updateSubjectOptions() {
        const addedSubjects = new Set(getAddedSubjects());

        Array.from(subjectSelect.options).forEach(option => {
            if (option.value) {
                option.disabled = addedSubjects.has(option.value);
            }
        });
    }

    function addSubject() {
        const subjectKey = subjectSelect.value;

        if (!subjectKey) {
            apsMessage.textContent = "Please choose a subject first.";
            return;
        }

        const definition = subjectDefinitions.get(subjectKey);

        if (!definition) return;

        if (getAddedSubjects().includes(subjectKey)) {
            apsMessage.textContent = "You have already added that subject.";
            return;
        }

        const row = definition.row.cloneNode(true);
        const input = row.querySelector("input[data-subject]");

        input.value = "";
        input.required = false;
        input.setCustomValidity("");

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-subject";
        removeButton.textContent = "Remove";
        removeButton.setAttribute(
            "aria-label",
            `Remove ${definition.name}`
        );

        removeButton.addEventListener("click", () => {
            row.remove();
            updateSubjectOptions();
            resetResults();
        });

        input.addEventListener("input", () => {
            input.setCustomValidity("");
            resetResults();
        });

        row.appendChild(removeButton);
        marksList.appendChild(row);

        subjectSelect.value = "";

        updateSubjectOptions();
        resetResults();
        input.focus();
    }

    addSubjectButton.addEventListener("click", addSubject);

    /* =================================================
       4. RESET RESULTS
    ================================================= */

    function resetResults() {
        resultsSection.hidden = true;

        witsAPSDisplay.textContent = "--";
        witsEligibleCount.textContent = "Pending";
        witsCoursesButton.disabled = true;

        apsMessage.textContent = "";

        universityCards.forEach(card => {
            card.classList.remove("is-flipped");

            if (card.dataset.university !== "wits") {
                const aps = card.querySelector(".university-aps");
                const count = card.querySelector(".eligible-count");
                const button = card.querySelector(".view-university-courses");

                if (aps) aps.textContent = "--";
                if (count) count.textContent = "Not configured";
                if (button) button.disabled = true;
            }
        });

        window.UniCompanionStudentResults = null;
    }

    /* =================================================
       5. COLLECT STUDENT MARKS
    ================================================= */

    function getStudentResults() {
        const results = {};
        let invalidInput = false;

        const inputs = marksList.querySelectorAll("input[data-subject]");

        inputs.forEach(input => {
            const rawValue = input.value.trim();
            const subject = input.dataset.subject;

            input.setCustomValidity("");

            if (rawValue === "") return;

            const mark = Number(rawValue);

            if (
                !Number.isFinite(mark) ||
                mark < 0 ||
                mark > 100 ||
                !Number.isInteger(mark)
            ) {
                input.setCustomValidity(
                    "Enter a whole-number percentage from 0 to 100."
                );

                invalidInput = true;
                return;
            }

            results[subject] = mark;
        });

        return invalidInput ? null : results;
    }

    /* =================================================
       6. VALIDATE STUDENT MARKS
    ================================================= */

    function validateStudentResults(results) {
        if (!results) {
            return "Please correct your marks. Use whole numbers between 0 and 100.";
        }

        if (Object.keys(results).length === 0) {
            return "Please add your subjects and enter your marks.";
        }

        const hasEnglish =
            results.englishHome !== undefined ||
            results.englishFAL !== undefined;

        if (!hasEnglish) {
            return "Please enter English Home Language or English First Additional Language.";
        }

        if (results.lifeOrientation === undefined) {
            return "Please enter your Life Orientation mark to calculate this Wits APS.";
        }

        const otherSubjectCount = Object.keys(results)
            .filter(subject => subject !== "lifeOrientation")
            .length;

        if (otherSubjectCount < 6) {
            return "Please enter at least six subjects in addition to Life Orientation for this Wits APS calculation.";
        }

        return null;
    }

    /* =================================================
       7. NSC LEVEL CONVERSION
    ================================================= */

    function getNSCLevel(mark) {
        if (mark >= 80) return 7;
        if (mark >= 70) return 6;
        if (mark >= 60) return 5;
        if (mark >= 50) return 4;
        if (mark >= 40) return 3;
        if (mark >= 30) return 2;
        return 1;
    }

    /* =================================================
       8. WITS APS POINTS
       Retains your existing scoring implementation.
    ================================================= */

    function getWitsPoints(subject, mark) {
        if (subject === "lifeOrientation") {
            if (mark >= 90) return 4;
            if (mark >= 80) return 3;
            if (mark >= 70) return 2;
            if (mark >= 60) return 1;
            return 0;
        }

        if (
            subject === "englishHome" ||
            subject === "englishFAL" ||
            subject === "mathematics"
        ) {
            if (mark >= 90) return 10;
            if (mark >= 80) return 9;
            if (mark >= 70) return 8;
            if (mark >= 60) return 7;
            if (mark >= 50) return 4;
            if (mark >= 40) return 3;
            return 0;
        }

        if (mark >= 90) return 8;
        if (mark >= 80) return 7;
        if (mark >= 70) return 6;
        if (mark >= 60) return 5;
        if (mark >= 50) return 4;
        if (mark >= 40) return 3;
        return 0;
    }

    /* =================================================
       9. CALCULATE WITS APS
    ================================================= */

    function calculateWitsAPS(results) {
        const lifeOrientationMark = results.lifeOrientation;

        const otherSubjects = Object.entries(results)
            .filter(([subject]) => subject !== "lifeOrientation")
            .map(([subject, mark]) => ({
                subject,
                mark,
                points: getWitsPoints(subject, mark)
            }));

        otherSubjects.sort((a, b) => {
            if (b.points !== a.points) {
                return b.points - a.points;
            }
            return b.mark - a.mark;
        });

        const bestSix = otherSubjects.slice(0, 6);

        const lifeOrientation = {
            subject: "lifeOrientation",
            mark: lifeOrientationMark,
            points: getWitsPoints("lifeOrientation", lifeOrientationMark)
        };

        const subjectsUsed = [...bestSix, lifeOrientation];

        const aps = subjectsUsed.reduce(
            (total, item) => total + item.points,
            0
        );

        return {
            aps,
            subjectsUsed,
            otherSubjectsNotUsed: otherSubjects.slice(6)
        };
    }

    /* =================================================
       10. GENERAL AVERAGE
    ================================================= */

    function calculateAverage(results) {
        const marks = Object.values(results);

        if (marks.length === 0) return null;

        const total = marks.reduce((sum, mark) => sum + mark, 0);

        return (total / marks.length).toFixed(2);
    }

    /* =================================================
       11. MATCH EXTRACTED SUBJECT NAMES
       Gemini may return names rather than our JS keys.
    ================================================= */

    function normaliseSubjectName(name) {
        return String(name || "")
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    const subjectNameToKey = new Map();

    subjectDefinitions.forEach(definition => {
        subjectNameToKey.set(
            normaliseSubjectName(definition.name),
            definition.key
        );

        subjectNameToKey.set(
            normaliseSubjectName(definition.key),
            definition.key
        );
    });

    const subjectAliases = {
        englishhl: "englishHome",
        englishhome: "englishHome",
        englishhomelanguage: "englishHome",
        englishfal: "englishFAL",
        englishfirstadditional: "englishFAL",
        englishfirstadditionallanguage: "englishFAL",
        maths: "mathematics",
        mathematics: "mathematics",
        mathsliteracy: "mathLiteracy",
        mathematicalliteracy: "mathLiteracy",
        physicalscience: "physicalSciences",
        physicalsciences: "physicalSciences",
        lifescience: "lifeSciences",
        lifesciences: "lifeSciences",
        cat: "computerApplicationsTechnology",
        computerapplicationstechnology: "computerApplicationsTechnology",
        it: "informationTechnology",
        informationtechnology: "informationTechnology",
        visualarts: "visualArts",
        lifeorientation: "lifeOrientation"
    };

    let resultsForSubjectLookup = {};

function getSubjectKey(extractedName) {
    const normalised = normaliseSubjectName(extractedName);

    // If the prospectus only says "English", use the
    // English subject the student actually entered.
    if (normalised === "english") {
        if (resultsForSubjectLookup.englishHome !== undefined) {
            return "englishHome";
        }

        if (resultsForSubjectLookup.englishFAL !== undefined) {
            return "englishFAL";
        }

        return null;
    }

    return subjectNameToKey.get(normalised) ||
        subjectAliases[normalised] ||
        null;
}


    /* =================================================
       12. CHECK SUBJECT REQUIREMENTS
    ================================================= */

    function checkSubjectRequirement(requirement, results) {
        const subjectNames = Array.isArray(requirement.subjects)
            ? requirement.subjects
            : [];

        const requiredLevel = Number(requirement.level);
        const mode = requirement.mode === "any" ? "any" : "all";

        const checks = subjectNames.map(subjectName => {
            const subjectKey = getSubjectKey(subjectName);
            const mark = subjectKey ? results[subjectKey] : undefined;

            return {
                subject: subjectName,
                subjectKey,
                mark: mark === undefined ? null : mark,
                level: mark === undefined ? null : getNSCLevel(mark),
                passed: Boolean(
                    subjectKey &&
                    mark !== undefined &&
                    getNSCLevel(mark) >= requiredLevel
                )
            };
        });

        const passed = checks.length > 0 &&
            (mode === "all"
                ? checks.every(item => item.passed)
                : checks.some(item => item.passed));

        return {
            passed,
            checks,
            mode,
            requiredLevel
        };
    }

   
/* =================================================
   13. CHECK PROGRAMME ELIGIBILITY
================================================= */

function checkProgrammeEligibility(programme, results, studentAPS) {

    resultsForSubjectLookup = results;
    // Extract unique APS scores.
    const apsValues = [
        ...new Set(
            (programme.aps || [])
                .map(item => Number(item.score))
                .filter(score =>
                    Number.isInteger(score) &&
                    score >= 1 &&
                    score <= 60
                )
        )
    ];

    const hasAPSRequirement = apsValues.length === 1;

    const apsRequirement = hasAPSRequirement
        ? apsValues[0]
        : null;

    const apsPassed =
        hasAPSRequirement &&
        studentAPS >= apsRequirement;

    // Check extracted subject requirements.
    const subjectChecks = (programme.subjects || []).map(requirement => {

        const subjectKey = getSubjectKey(requirement.subject);

        const mark = subjectKey
            ? results[subjectKey]
            : undefined;

        const requiredLevel = Number(requirement.minimumLevel);

        const validLevel =
            Number.isInteger(requiredLevel) &&
            requiredLevel >= 1 &&
            requiredLevel <= 7;

        const studentLevel = mark === undefined
            ? null
            : getNSCLevel(mark);

        return {
            subject: requirement.subject,
            subjectKey,
            requiredLevel: validLevel ? requiredLevel : null,
            studentLevel,

            // Unknown subjects and invalid requirements
            // must be reviewed rather than silently treated
            // as passed.
            passed:
                subjectKey !== null &&
                mark !== undefined &&
                validLevel &&
                studentLevel >= requiredLevel,

            needsReview:
                !subjectKey || !validLevel
        };
    });

    // Known subject requirements must pass.
    // An empty list is allowed because some programmes
    // may only have an APS requirement extracted.
    const subjectRequirementsPassed =
        subjectChecks
            .filter(item => !item.needsReview)
            .every(item => item.passed);

    const hasSubjectRequirements = subjectChecks.length > 0;

    const hasUnresolvedSubjects =
        subjectChecks.some(item => item.needsReview);

    const hasUsableCriteria = hasAPSRequirement;

    // Do not exclude every programme just because its
    // automatically extracted data still needs review.
    // Only programmes explicitly marked invalid are excluded.
    const isInvalid =
        programme.reviewStatus === "invalid";

    const eligible =
        hasUsableCriteria &&
        apsPassed &&
        subjectRequirementsPassed &&
        !isInvalid;

    return {
        eligible,
        programme,

        apsRequirement,
        hasAPSRequirement,
        apsPassed,

        subjectChecks,
        subjectRequirementsPassed,
        hasSubjectRequirements,
        hasUnresolvedSubjects,

        hasUsableCriteria,

        needsReview: false
    };
}

    /* =================================================
       14. CHECK ALL EXTRACTED PROGRAMMES
    ================================================= */

    function findWitsProgrammeMatches(results, aps) {
        if (!witsRequirements ||
            !Array.isArray(witsRequirements.programmes)) {
            return [];
        }

        return witsRequirements.programmes
            .filter(programme => programme && programme.name)
            .map(programme =>
                checkProgrammeEligibility(programme, results, aps)
            );
    }

    /* =================================================
       15. DISPLAY PROGRAMME MATCHES
    ================================================= */

   
function renderWitsProgrammeMatches(results, aps) {

    const assessments = findWitsProgrammeMatches(results, aps);

    const matches = assessments.filter(
        assessment => assessment.eligible
    );

    eligibleProgrammesList.replaceChildren();

    matches.forEach(assessment => {

        const programme = assessment.programme;
        const item = document.createElement("li");

        const name = document.createElement("strong");
        name.textContent = programme.name;
        item.appendChild(name);

        if (programme.faculty) {
            const faculty = document.createElement("p");
            faculty.textContent = programme.faculty;
            item.appendChild(faculty);
        }

        const details = document.createElement("p");

        details.textContent =
            `Minimum APS: ${assessment.apsRequirement}. ` +
            `Your APS: ${aps}.`;

        item.appendChild(details);

        if (assessment.subjectChecks.length > 0) {

            const subjectList = document.createElement("ul");

            assessment.subjectChecks.forEach(check => {

                const subjectItem = document.createElement("li");

                if (check.needsReview) {
                    subjectItem.textContent =
                        `${check.subject}: Could not be reliably checked.`;
                } else {
                    subjectItem.textContent =
                        `${check.subject}: Required level ${check.requiredLevel}, ` +
                        `your level ${check.studentLevel}. ` +
                        (check.passed ? "Passed" : "Not met");
                }

                subjectList.appendChild(subjectItem);
            });

            item.appendChild(subjectList);
        }

        // if (assessment.needsReview) {
        //     const review = document.createElement("p");
        //     review.textContent =
        //         "Some extracted requirements still need verification against the original prospectus.";
        //     item.appendChild(review);
        // }

        if (Array.isArray(programme.sourcePages) &&
            programme.sourcePages.length > 0) {

            const source = document.createElement("small");

            source.textContent =
                `Prospectus page(s): ${programme.sourcePages.join(", ")}`;

            item.appendChild(source);
        }

        eligibleProgrammesList.appendChild(item);
    });

    witsEligibleCount.textContent = String(matches.length);

    requirementsYear.textContent = String(
        witsRequirements?.admissionYear || 2027
    );

if (matches.length > 0) {

    resultsSummary.textContent =
        `${matches.length} potential programme match(es) found using the ` +
        `Wits ${witsRequirements?.admissionYear || 2027} prospectus data.`;

} else {

        resultsSummary.textContent =
            assessments.length === 0
                ? "No programme candidates were extracted from the prospectus."
                : "No extracted programmes currently meet the assessed APS and subject requirements. This does not mean that every Wits programme has been assessed.";
    }

    resultsSection.hidden = false;
    witsCoursesButton.disabled = false;

    return {
        assessments,
        matches
    };
}


    /* =================================================
       16. UNIVERSITY CARDS
    ================================================= */

    function flipUniversityCards() {
        universityCards.forEach(card => {
            card.classList.add("is-flipped");
        });
    }

    function setOtherUniversitiesNotConfigured() {
        universityCards.forEach(card => {
            if (card.dataset.university === "wits") return;

            const aps = card.querySelector(".university-aps");
            const count = card.querySelector(".eligible-count");
            const button = card.querySelector(".view-university-courses");

            if (aps) aps.textContent = "--";
            if (count) count.textContent = "Not configured";
            if (button) button.disabled = true;
        });
    }

    witsCoursesButton.addEventListener("click", () => {
        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });

    /* =================================================
       17. CALCULATE APS
    ================================================= */

    calculateAPSButton.addEventListener("click", () => {
        const results = getStudentResults();
        const validationError = validateStudentResults(results);

        if (validationError) {
            apsMessage.textContent = validationError;
            return;
        }

        const witsResult = calculateWitsAPS(results);

        witsAPSDisplay.textContent = String(witsResult.aps);

        flipUniversityCards();
        setOtherUniversitiesNotConfigured();

        let programmeResults = {
            assessments: [],
            matches: []
        };

        if (witsRequirements &&
            Array.isArray(witsRequirements.programmes) &&
            witsRequirements.programmes.length > 0) {
            programmeResults = renderWitsProgrammeMatches(
                results,
                witsResult.aps
            );
        } else {
            witsEligibleCount.textContent = "Data unavailable";
            witsCoursesButton.disabled = true;

            apsMessage.textContent =
                `Your calculated APS is ${witsResult.aps}. Programme eligibility cannot be checked yet because the Wits prospectus data has not been extracted.`;
        }

        window.UniCompanionStudentResults = {
            subjects: results,
            witsAPS: witsResult.aps,
            witsSubjectsUsed: witsResult.subjectsUsed,
            witsMatchingProgrammes: programmeResults.matches.map(
                assessment => assessment.programme.name
            ),
            witsAssessments: programmeResults.assessments,
            requirementsYear: witsRequirements?.admissionYear || null,
            prospectusLoaded: Boolean(window.UniCompanionProspectus),
            calculatedAt: new Date().toISOString()
        };

        if (programmeResults.matches.length > 0) {
            apsMessage.textContent =
                `Your calculated APS is ${witsResult.aps}. Potential programme matches are displayed. Check their source pages and selection criteria.`;
        }

        console.log(
            "UniCompanion student results:",
            window.UniCompanionStudentResults
        );
    });

    /* =================================================
       18. CALCULATE AVERAGE
    ================================================= */

    calculateAverageButton.addEventListener("click", () => {
        const results = getStudentResults();

        if (!results) {
            apsMessage.textContent =
                "Please correct your marks before calculating your average.";
            return;
        }

        const average = calculateAverage(results);

        if (average === null) {
            apsMessage.textContent =
                "Please add subjects and enter your marks first.";
            return;
        }

        apsMessage.textContent =
            `Your average is ${average}%. This average includes every subject you entered, including Life Orientation.`;
    });

    /* =================================================
       19. RESET WHEN MARKS CHANGE
    ================================================= */

    marksList.addEventListener("input", resetResults);

    /* =================================================
       20. INITIALISE
    ================================================= */

    updateSubjectOptions();
    setOtherUniversitiesNotConfigured();

    if (prospectusStatus) {
        prospectusStatus.textContent =
            "Loading extracted Wits programme data...";
    }

    // loadWitsRequirements();

    console.log("UniCompanion APS calculator initialised.");
});
