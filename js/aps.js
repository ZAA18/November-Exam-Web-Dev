/* =========================================
   UNICOMPANION — APS CALCULATOR
========================================= */


document.addEventListener("DOMContentLoaded", () => {


    /* =====================================
       1. ELEMENTS
    ===================================== */

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

    const witsResultsSection =
        document.getElementById("wits-programme-results");

    const witsResultsSummary =
        document.getElementById("wits-results-summary");

    const witsEligibleProgrammes =
        document.getElementById("wits-eligible-programmes");

    const witsRequirementsYear =
        document.getElementById("wits-requirements-year");

    const witsRequirements = window.WITS_REQUIREMENTS;

    if (
        !calculateAPSButton ||
        !calculateAverageButton ||
        !apsMessage ||
        !marksList ||
        !subjectSelect ||
        !addSubjectButton ||
        !subjectTemplate ||
        !witsCard ||
        !witsResultsSection ||
        !witsResultsSummary ||
        !witsEligibleProgrammes ||
        !witsRequirementsYear
    ) {
        console.error("APS calculator elements could not be found.");
        return;
    }

    if (
        !witsRequirements ||
        !Number.isInteger(witsRequirements.year) ||
        !Array.isArray(witsRequirements.programmes) ||
        witsRequirements.programmes.some(programme =>
            !programme.name ||
            !programme.faculty ||
            (programme.aps !== null && !Number.isFinite(programme.aps)) ||
            !Array.isArray(programme.requirements) ||
            !programme.url ||
            programme.requirements.some(requirement =>
                !Array.isArray(requirement.subjects) ||
                !requirement.subjects.length ||
                !Number.isInteger(requirement.level) ||
                requirement.level < 1 ||
                requirement.level > 7 ||
                !["all", "any"].includes(requirement.mode)
            )
        )
    ) {
        console.error("Wits programme requirements data is missing or invalid.");
        return;
    }

    const witsCoursesButton =
        witsCard.querySelector(".view-university-courses");

    const witsEligibleCount =
        witsCard.querySelector(".eligible-count");

    if (!witsCoursesButton || !witsEligibleCount) {
        console.error("Wits result card elements could not be found.");
        return;
    }

    const subjectRows = Array.from(
        subjectTemplate.content.querySelectorAll(".mark-row")
    );

    subjectRows.forEach(row => {
        const input = row.querySelector("input[data-subject]");
        const label = row.querySelector("label");

        if (input && label) {
            const option = document.createElement("option");
            option.value = input.dataset.subject;
            option.textContent = label.textContent.trim();
            subjectSelect.append(option);
        }
    });

    addSubjectButton.addEventListener("click", () => {
        const subject = subjectSelect.value;
        const subjectRow = subjectRows.find(row =>
            row.querySelector("input[data-subject]")?.dataset.subject === subject
        );

        if (!subjectRow) {
            apsMessage.textContent = "Please choose a subject to add.";
            return;
        }

        const row = subjectRow.cloneNode(true);
        const input = row.querySelector("input[data-subject]");
        const label = row.querySelector("label");
        const removeButton = document.createElement("button");

        removeButton.type = "button";
        removeButton.className = "remove-subject";
        removeButton.textContent = "Remove";
        removeButton.setAttribute(
            "aria-label",
            `Remove ${label.textContent.trim()}`
        );

        removeButton.addEventListener("click", () => {
            row.remove();
            subjectSelect.querySelector(`option[value="${subject}"]`).disabled = false;
            apsMessage.textContent = "";
        });

        row.append(removeButton);
        marksList.append(row);
        subjectSelect.querySelector(`option[value="${subject}"]`).disabled = true;
        subjectSelect.value = "";
        apsMessage.textContent = "";

        input.addEventListener("input", () => {
            apsMessage.textContent = "";
        });
    });


    /* =====================================
       2. COLLECT STUDENT RESULTS
    ===================================== */

    function getStudentResults() {

        const results = {};

        let invalidMark = false;

        marksList.querySelectorAll("input[data-subject]").forEach(input => {

            const value = input.value.trim();

            const subject = input.dataset.subject;

            if (value === "") {
                return;
            }

            const mark = Number(value);

            if (
                !Number.isFinite(mark) ||
                mark < 0 ||
                mark > 100 ||
                !Number.isInteger(mark)
            ) {

                invalidMark = true;

                input.setCustomValidity(
                    "Enter a whole number between 0 and 100."
                );

                return;

            }

            input.setCustomValidity("");

            results[subject] = mark;

        });


        if (invalidMark) {
            return null;
        }


        return results;

    }


    /* =====================================
       3. VALIDATE STUDENT RESULTS
    ===================================== */

    function validateResults(results) {

        if (!results) {

            return "Please enter valid marks between 0 and 100.";

        }


        const hasEnglish =
            results.englishHome !== undefined ||
            results.englishFAL !== undefined;


        if (!hasEnglish) {

            return "Please enter your English Home Language or English First Additional Language mark.";

        }


        if (results.englishHome !== undefined &&
            results.englishFAL !== undefined) {

            return "Please enter only the English qualification you take.";

        }


        if (
            results.mathematics !== undefined &&
            results.mathLiteracy !== undefined
        ) {

            return "Please enter either Mathematics or Mathematical Literacy, not both.";

        }


        if (results.lifeOrientation === undefined) {

            return "Please enter your Life Orientation mark.";

        }


        const totalSubjects = Object.keys(results).length;

        if (totalSubjects < 7) {

            return "Wits requires seven subjects for this calculation. Please enter at least seven subject marks, including English and Life Orientation.";

        }


        return null;

    }


    /* =====================================
       4. WITS APS SCORING TABLE
    ===================================== */

    function getWitsPoints(subject, mark) {


        // LIFE ORIENTATION

        if (subject === "lifeOrientation") {

            if (mark >= 90) return 4;

            if (mark >= 80) return 3;

            if (mark >= 70) return 2;

            if (mark >= 60) return 1;

            return 0;

        }


        // ENGLISH AND MATHEMATICS
        // Wits gives these subjects
        // an additional two points
        // in the applicable bands.

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


        // ALL OTHER SUBJECTS
        // Including Mathematical Literacy

        if (mark >= 90) return 8;

        if (mark >= 80) return 7;

        if (mark >= 70) return 6;

        if (mark >= 60) return 5;

        if (mark >= 50) return 4;

        if (mark >= 40) return 3;

        return 0;

    }


    /* =====================================
       5. CALCULATE WITS APS
    ===================================== */

    function calculateWitsAPS(results) {

        const subjectScores = [];


        Object.entries(results).forEach(
            ([subject, mark]) => {

                subjectScores.push({

                    subject: subject,

                    mark: mark,

                    points: getWitsPoints(
                        subject,
                        mark
                    )

                });

            }
        );


        // Life Orientation must be included.

        const lifeOrientation = subjectScores.find(
            item => item.subject === "lifeOrientation"
        );


        // Remove Life Orientation from
        // the remaining subject selection.

        const otherSubjects = subjectScores.filter(
            item => item.subject !== "lifeOrientation"
        );


        // Sort the other subjects from
        // highest APS points to lowest.

        otherSubjects.sort(
            (a, b) => b.points - a.points
        );


        // Select the best six other subjects.

        const bestSix = otherSubjects.slice(0, 6);


        // Include Life Orientation.

        const selectedSubjects = [
            ...bestSix,
            lifeOrientation
        ];


        // Calculate total Wits APS.

        const totalAPS = selectedSubjects.reduce(
            (total, subject) => {

                return total + subject.points;

            },
            0
        );


        return {

            aps: totalAPS,

            subjectsUsed: selectedSubjects

        };

    }


    /* =====================================
       6. CALCULATE AVERAGE
    ===================================== */

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

    function getNSCLevel(mark) {
        if (mark >= 80) return 7;
        if (mark >= 70) return 6;
        if (mark >= 60) return 5;
        if (mark >= 50) return 4;
        if (mark >= 40) return 3;
        if (mark >= 30) return 2;
        return 1;
    }

    function meetsSubjectRequirements(programme, results) {
        return programme.requirements.every(requirement => {
            const subjects = requirement.subjects.map(subject => ({
                subject,
                mark: results[subject]
            }));

            if (requirement.mode === "all") {
                return subjects.every(
                    item => item.mark !== undefined &&
                        getNSCLevel(item.mark) >= requirement.level
                );
            }

            return subjects.some(
                item => item.mark !== undefined &&
                    getNSCLevel(item.mark) >= requirement.level
            );
        });
    }

    function renderWitsProgrammeMatches(results, aps) {
        const matches = witsRequirements.programmes.filter(programme =>
            (programme.aps === null || aps >= programme.aps) &&
            meetsSubjectRequirements(programme, results)
        );

        witsEligibleProgrammes.replaceChildren();

        matches.forEach(programme => {
            const item = document.createElement("li");
            const link = document.createElement("a");
            const details = document.createElement("p");

            link.href = programme.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = programme.name;
            details.textContent = `${programme.faculty} · ` +
                (programme.aps === null
                    ? "No minimum APS stated; Composite Index selection applies"
                    : `Minimum APS ${programme.aps}`) +
                (programme.selectionRequirements
                    ? ` · Additional selection: ${programme.selectionRequirements}`
                    : "");

            item.append(link, details);
            witsEligibleProgrammes.append(item);
        });

        witsEligibleCount.textContent = String(matches.length);
        witsRequirementsYear.textContent = String(witsRequirements.year);
        witsResultsSummary.textContent = matches.length
            ? `${matches.length} listed programme${matches.length === 1 ? "" : "s"} match your APS (where stated) and the subject minimums entered.`
            : "No listed programmes match your APS and entered subject minimums.";
        witsResultsSection.hidden = false;
        witsCoursesButton.disabled = false;

        return matches;
    }


    /* =====================================
       7. FLIP UNIVERSITY CARDS
    ===================================== */

    function flipUniversityCards() {

        universityCards.forEach(card => {

            card.classList.add("is-flipped");

        });

    }


    /* =====================================
       8. DISPLAY WITS APS
    ===================================== */

    function displayWitsResult(aps) {
        const apsDisplay = witsCard.querySelector(
            ".university-aps"
        );


        if (apsDisplay) {

            apsDisplay.textContent = aps;

        }

    }

    witsCoursesButton.addEventListener("click", () => {
        witsResultsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });


    /* =====================================
       9. CALCULATE APS BUTTON
    ===================================== */

    calculateAPSButton.addEventListener("click", () => {


        const results = getStudentResults();


        const error = validateResults(results);


        if (error) {

            apsMessage.textContent = error;

            return;

        }


        // Calculate Wits APS.

        const witsResult = calculateWitsAPS(results);


        // Flip all nine cards.

        flipUniversityCards();


        // Display Wits APS.

        displayWitsResult(witsResult.aps);

        const matchingProgrammes = renderWitsProgrammeMatches(
            results,
            witsResult.aps
        );


        // Store results for the future
        // eligibility engine.

        window.UniCompanionStudentResults = {

            subjects: results,

            witsAPS: witsResult.aps,

            witsSubjectsUsed: witsResult.subjectsUsed,

            witsMatchingProgrammes: matchingProgrammes.map(
                programme => programme.name
            ),

            calculatedAt: new Date().toISOString()

        };


        apsMessage.textContent =
            `Your Wits APS is ${witsResult.aps}. Results below compare your marks with Wits' published minimum requirements.`;

        console.log(
            "Student results:",
            window.UniCompanionStudentResults
        );


    });


    /* =====================================
       10. CALCULATE AVERAGE BUTTON
    ===================================== */

    calculateAverageButton.addEventListener(
        "click",
        () => {


            const results = getStudentResults();


            if (!results) {

                apsMessage.textContent =
                    "Please correct your marks before calculating your average.";

                return;

            }


            const average = calculateAverage(results);


            if (average === null) {

                apsMessage.textContent =
                    "Please enter at least one subject mark.";

                return;

            }


            apsMessage.textContent =
                `Your average is ${average}%. This includes all the subjects you entered, including Life Orientation.`;


        }
    );


    /* =====================================
       11. RESET OLD RESULTS WHEN EDITING
    ===================================== */

    console.log(
        "UniCompanion APS calculator initialized."
    );

});