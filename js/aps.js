
/* =====================================================
   UNICOMPANION — APS & ELIGIBILITY CALCULATOR
   Front-end JavaScript
   First university: Wits
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* =================================================
       1. GET HTML ELEMENTS
    ================================================= */

    const marksList = document.getElementById("marks-list");
    const subjectSelect = document.getElementById("subject-select");
    const addSubjectButton = document.getElementById("add-subject");
    const subjectTemplate = document.getElementById("subject-options");

    const calculateAPSButton =
        document.getElementById("calculate-aps");

    const calculateAverageButton =
        document.getElementById("calculate-average");

    const apsMessage =
        document.getElementById("aps-message");

    const universityCards =
        document.querySelectorAll(".aps-university-card");

    const witsCard =
        document.querySelector('[data-university="wits"]');

    const resultsSection =
        document.getElementById("wits-programme-results");

    const resultsSummary =
        document.getElementById("wits-results-summary");

    const eligibleProgrammesList =
        document.getElementById("wits-eligible-programmes");

    const requirementsYear =
        document.getElementById("wits-requirements-year");

    const prospectusStatus =
        document.getElementById("prospectus-status");

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
        console.error(
            "UniCompanion could not initialize. One or more HTML elements are missing."
        );
        return;
    }

    /* =================================================
       2. LOAD WITS REQUIREMENTS
    ================================================= */

    const witsRequirements = window.WITS_REQUIREMENTS;

    if (
        !witsRequirements ||
        !Array.isArray(witsRequirements.programmes) ||
        !Number.isInteger(witsRequirements.year)
    ) {
        console.error(
            "Wits requirements are missing. Check wits-requirements.js and its script order."
        );

        apsMessage.textContent =
            "Wits programme requirements could not be loaded.";

        return;
    }

    function validateProgrammeData(programmes) {
        return programmes.every(programme => {

            if (
                !programme.name ||
                !programme.faculty ||
                !Array.isArray(programme.requirements) ||
                !programme.url
            ) {
                return false;
            }

            if (
                programme.aps !== null &&
                !Number.isFinite(programme.aps)
            ) {
                return false;
            }

            return programme.requirements.every(requirement => {

                return (
                    Array.isArray(requirement.subjects) &&
                    requirement.subjects.length > 0 &&
                    Number.isInteger(requirement.level) &&
                    requirement.level >= 1 &&
                    requirement.level <= 7 &&
                    ["all", "any"].includes(requirement.mode)
                );

            });

        });
    }

    if (!validateProgrammeData(witsRequirements.programmes)) {
        console.error("One or more Wits programme entries are invalid.");

        apsMessage.textContent =
            "Some Wits programme requirements contain invalid data.";

        return;
    }

    /* =================================================
       3. GET WITS CARD ELEMENTS
    ================================================= */

    const witsAPSDisplay =
        witsCard.querySelector(".university-aps");

    const witsEligibleCount =
        witsCard.querySelector(".eligible-count");

    const witsCoursesButton =
        witsCard.querySelector(".view-university-courses");

    if (
        !witsAPSDisplay ||
        !witsEligibleCount ||
        !witsCoursesButton
    ) {
        console.error("Wits university card is incomplete.");
        return;
    }

    /* =================================================
       4. SUBJECT PICKER
    ================================================= */

    const subjectRows = Array.from(
        subjectTemplate.content.querySelectorAll(".mark-row")
    );

    const subjectDefinitions = new Map();

    subjectRows.forEach(row => {

        const input = row.querySelector("input[data-subject]");
        const label = row.querySelector("label");

        if (!input || !label) {
            return;
        }

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
            "No subjects were found in the subject template.";

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
            if (!option.value) {
                return;
            }

            option.disabled = addedSubjects.has(option.value);
        });
    }

    function resetResults() {
        resultsSection.hidden = true;

        witsAPSDisplay.textContent = "--";
        witsEligibleCount.textContent = "Pending";

        witsCoursesButton.disabled = true;

        apsMessage.textContent = "";

        universityCards.forEach(card => {
            card.classList.remove("is-flipped");
        });

        // Other universities are not configured yet.
        universityCards.forEach(card => {
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

    function addSubject() {
        const subjectKey = subjectSelect.value;

        if (!subjectKey) {
            apsMessage.textContent =
                "Please choose a subject first.";

            return;
        }

        const definition = subjectDefinitions.get(subjectKey);

        if (!definition) {
            return;
        }

        if (getAddedSubjects().includes(subjectKey)) {
            apsMessage.textContent =
                "You have already added that subject.";

            return;
        }

        const row = definition.row.cloneNode(true);

        const input = row.querySelector("input[data-subject]");
        const label = row.querySelector("label");

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

        if (input) {
            input.focus();
        }
    }

    addSubjectButton.addEventListener("click", addSubject);

    /* =================================================
       5. COLLECT STUDENT MARKS
    ================================================= */

    function getStudentResults() {

        const results = {};
        let invalidInput = false;

        const inputs = marksList.querySelectorAll(
            "input[data-subject]"
        );

        inputs.forEach(input => {

            const rawValue = input.value.trim();
            const subject = input.dataset.subject;

            input.setCustomValidity("");

            if (rawValue === "") {
                return;
            }

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

        if (invalidInput) {
            return null;
        }

        return results;
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
       
       This retains the scoring method in your
       existing implementation. Verify it against
       the official admission-year scoring guide.
    ================================================= */

    function getWitsPoints(subject, mark) {

        // Life Orientation.
        if (subject === "lifeOrientation") {

            if (mark >= 90) return 4;
            if (mark >= 80) return 3;
            if (mark >= 70) return 2;
            if (mark >= 60) return 1;

            return 0;
        }

        // English and Mathematics.
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

        // Other subjects, including Mathematical Literacy.
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
            points: getWitsPoints(
                "lifeOrientation",
                lifeOrientationMark
            )
        };

        const selectedSubjects = [
            ...bestSix,
            lifeOrientation
        ];

        const aps = selectedSubjects.reduce(
            (total, item) => total + item.points,
            0
        );

        return {
            aps,
            subjectsUsed: selectedSubjects,
            otherSubjectsNotUsed: otherSubjects.slice(6)
        };
    }

    /* =================================================
       10. CALCULATE GENERAL AVERAGE
    ================================================= */

    function calculateAverage(results) {

        const marks = Object.values(results);

        if (marks.length === 0) {
            return null;
        }

        const total = marks.reduce(
            (sum, mark) => sum + mark,
            0
        );

        return (total / marks.length).toFixed(2);
    }

    /* =================================================
       11. CHECK INDIVIDUAL SUBJECT REQUIREMENTS
       
       Supports your existing data structure:
       mode: "all" = every listed subject is required.
       mode: "any" = at least one listed subject is required.
    ================================================= */

    function checkSubjectRequirement(requirement, results) {

        const checks = requirement.subjects.map(subject => {

            const mark = results[subject];

            return {
                subject,
                mark,
                level: mark === undefined
                    ? null
                    : getNSCLevel(mark),
                passed: mark !== undefined &&
                    getNSCLevel(mark) >= requirement.level
            };
        });

        const passed = requirement.mode === "all"
            ? checks.every(item => item.passed)
            : checks.some(item => item.passed);

        return {
            passed,
            checks,
            mode: requirement.mode,
            requiredLevel: requirement.level
        };
    }

    /* =================================================
       12. CHECK A PROGRAMME
    ================================================= */

    function checkProgrammeEligibility(
        programme,
        results,
        studentAPS
    ) {

        const subjectChecks = programme.requirements.map(
            requirement =>
                checkSubjectRequirement(requirement, results)
        );

        const subjectRequirementsPassed =
            subjectChecks.every(check => check.passed);

        const hasAPSRequirement =
            Number.isFinite(programme.aps);

        const apsPassed = !hasAPSRequirement ||
            studentAPS >= programme.aps;

        const eligible =
            subjectRequirementsPassed && apsPassed;

        return {
            eligible,
            programme,
            subjectRequirementsPassed,
            subjectChecks,
            hasAPSRequirement,
            apsPassed,
            studentAPS
        };
    }

    /* =================================================
       13. CHECK ALL WITS PROGRAMMES
    ================================================= */

    function findEligibleWitsProgrammes(results, aps) {

        return witsRequirements.programmes
            .map(programme =>
                checkProgrammeEligibility(
                    programme,
                    results,
                    aps
                )
            );
    }

    /* =================================================
       14. DISPLAY PROGRAMME MATCHES
    ================================================= */

    function renderWitsProgrammeMatches(results, aps) {

        const assessments = findEligibleWitsProgrammes(
            results,
            aps
        );

        const matches = assessments.filter(
            assessment => assessment.eligible
        );

        eligibleProgrammesList.replaceChildren();

        matches.forEach(assessment => {

            const programme = assessment.programme;

            const item = document.createElement("li");

            const link = document.createElement("a");

            const details = document.createElement("p");

            link.href = programme.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = programme.name;

            const apsText = assessment.hasAPSRequirement
                ? `Minimum APS: ${programme.aps}`
                : "No minimum APS stated in the loaded dataset";

            const selectionText =
                programme.selectionRequirements
                    ? ` Additional selection: ${programme.selectionRequirements}`
                    : "";

            details.textContent =
                `${programme.faculty} · ${apsText}.${selectionText}`;

            item.appendChild(link);
            item.appendChild(details);

            eligibleProgrammesList.appendChild(item);
        });

        witsEligibleCount.textContent = String(matches.length);

        requirementsYear.textContent =
            String(witsRequirements.year);

        if (matches.length > 0) {

            resultsSummary.textContent =
                `${matches.length} listed programme(s) meet the APS and subject thresholds in your loaded Wits requirements dataset. Additional selection criteria may still apply.`;

        } else {

            resultsSummary.textContent =
                "No programmes in the current Wits dataset meet all the checked minimum thresholds. This does not mean every Wits programme has been assessed.";

        }

        resultsSection.hidden = false;
        witsCoursesButton.disabled = false;

        return {
            assessments,
            matches
        };
    }

    /* =================================================
       15. UNIVERSITY CARD DISPLAY
    ================================================= */

    function flipUniversityCards() {

        universityCards.forEach(card => {
            card.classList.add("is-flipped");
        });

    }

    function updateWitsAPSDisplay(aps) {
        witsAPSDisplay.textContent = String(aps);
    }

    function setOtherUniversitiesNotConfigured() {

        universityCards.forEach(card => {

            if (card.dataset.university === "wits") {
                return;
            }

            const aps = card.querySelector(".university-aps");
            const count = card.querySelector(".eligible-count");
            const button = card.querySelector(".view-university-courses");

            if (aps) {
                aps.textContent = "--";
            }

            if (count) {
                count.textContent = "Not configured";
            }

            if (button) {
                button.disabled = true;
            }

        });
    }

    /* =================================================
       16. WITS RESULTS BUTTON
    ================================================= */

    witsCoursesButton.addEventListener("click", () => {

        resultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });

    /* =================================================
       17. CALCULATE APS BUTTON
    ================================================= */

    calculateAPSButton.addEventListener("click", () => {

        const results = getStudentResults();

        const validationError =
            validateStudentResults(results);

        if (validationError) {

            apsMessage.textContent = validationError;

            return;
        }

        const witsResult = calculateWitsAPS(results);

        const programmeResults =
            renderWitsProgrammeMatches(
                results,
                witsResult.aps
            );

        flipUniversityCards();

        setOtherUniversitiesNotConfigured();

        updateWitsAPSDisplay(witsResult.aps);

        window.UniCompanionStudentResults = {

            subjects: results,

            witsAPS: witsResult.aps,

            witsSubjectsUsed: witsResult.subjectsUsed,

            witsMatchingProgrammes:
                programmeResults.matches.map(
                    assessment => assessment.programme.name
                ),

            witsAssessments:
                programmeResults.assessments,

            requirementsYear: witsRequirements.year,

            prospectusLoaded: Boolean(
                window.UniCompanionProspectus
            ),

            calculatedAt: new Date().toISOString()
        };

        apsMessage.textContent =
            `Your calculated Wits APS is ${witsResult.aps}. The programme results compare your marks with the currently loaded Wits requirements dataset.`;

        console.log(
            "UniCompanion student results:",
            window.UniCompanionStudentResults
        );

    });

    /* =================================================
       18. CALCULATE AVERAGE BUTTON
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

    marksList.addEventListener("input", () => {
        resetResults();
    });

    /* =================================================
       20. INITIALISE
    ================================================= */

    updateSubjectOptions();

    setOtherUniversitiesNotConfigured();

    requirementsYear.textContent =
        String(witsRequirements.year);

    if (prospectusStatus) {
        prospectusStatus.textContent =
            "Loading the Wits prospectus in the background...";
    }

    // The PDF loads independently of the calculator.
    // A PDF failure does not stop the calculator.
    if (window.UniCompanionProspectusReady) {

        window.UniCompanionProspectusReady
            .then(() => {
                console.log(
                    "Wits PDF is ready for searching."
                );
            })
            .catch(error => {
                console.warn(
                    "Wits PDF could not be loaded. The calculator can still use its existing requirements dataset.",
                    error
                );
            });
    }

    console.log(
        "UniCompanion APS calculator initialised successfully."
    );

});
