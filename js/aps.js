/* UNICOMPANION - MULTI-UNIVERSITY APS & ELIGIBILITY CALCULATOR */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const marksList = document.getElementById("marks-list");
    const subjectSelect = document.getElementById("subject-select");
    const addSubjectButton = document.getElementById("add-subject");
    const subjectTemplate = document.getElementById("subject-options");
    const calculateAPSButton = document.getElementById("calculate-aps");
    const calculateAverageButton = document.getElementById("calculate-average");
    const apsMessage = document.getElementById("aps-message");
    const prospectusStatus = document.getElementById("prospectus-status");
    const universityGrid = document.getElementById("aps-universities");
    const resultsSection = document.getElementById("university-programme-results");
    const activeUniversityName = document.getElementById("active-university-name");
    const activeUniversityYear = document.getElementById("active-university-year");
    const activeResultsSummary = document.getElementById("active-results-summary");
    const activeProgrammeList = document.getElementById("active-eligible-programmes");

    if (!marksList || !subjectSelect || !addSubjectButton || !subjectTemplate ||
        !calculateAPSButton || !calculateAverageButton || !universityGrid ||
        !resultsSection || !activeUniversityName || !activeUniversityYear ||
        !activeResultsSummary || !activeProgrammeList) {
        console.error("APS calculator: required HTML elements are missing.");
        return;
    }

    const universityConfigs = [
        { key: "wits", name: "Wits University", shortName: "W", scoreLabel: "Wits APS", year: 2027 },
        { key: "uct", name: "University of Cape Town", shortName: "UCT", scoreLabel: "UCT APS aggregate", year: 2027 },
        { key: "up", name: "University of Pretoria", shortName: "UP", scoreLabel: "UP APS", year: 2027 },
        { key: "uj", name: "University of Johannesburg", shortName: "UJ", scoreLabel: "UJ APS", year: 2027 },
        { key: "ufh", name: "University of Fort Hare", shortName: "UFH", scoreLabel: "UFH APS", year: 2027 },
        { key: "rhodes", name: "Rhodes University", shortName: "RU", scoreLabel: "Rhodes APS", year: 2026 },
        { key: "wsu", name: "Walter Sisulu University", shortName: "WSU", scoreLabel: "WSU APS", year: 2027 },
        { key: "stellenbosch", name: "Stellenbosch University", shortName: "SU", scoreLabel: "SU six-subject aggregate", year: 2027 }
    ];

    let extractedUniversities = [];
    const universityResults = new Map();
    let activeUniversityKey = null;

    const subjectRows = Array.from(subjectTemplate.content.querySelectorAll(".mark-row"));
    const subjectDefinitions = new Map();

    subjectRows.forEach(row => {
        const input = row.querySelector("input[data-subject]");
        const label = row.querySelector("label");
        if (!input || !label) return;
        const key = input.dataset.subject;
        subjectDefinitions.set(key, { key, name: label.textContent.trim(), row });

        const option = document.createElement("option");
        option.value = key;
        option.textContent = label.textContent.trim();
        subjectSelect.appendChild(option);
    });

    function getAddedSubjects() {
        return Array.from(marksList.querySelectorAll("input[data-subject]"))
            .map(input => input.dataset.subject);
    }

    function updateSubjectOptions() {
        const added = new Set(getAddedSubjects());
        Array.from(subjectSelect.options).forEach(option => {
            if (option.value) option.disabled = added.has(option.value);
        });
    }

    addSubjectButton.addEventListener("click", () => {
        const key = subjectSelect.value;
        if (!key) {
            apsMessage.textContent = "Please choose a subject first.";
            return;
        }
        if (getAddedSubjects().includes(key)) {
            apsMessage.textContent = "You have already added that subject.";
            return;
        }

        const definition = subjectDefinitions.get(key);
        const row = definition.row.cloneNode(true);
        const input = row.querySelector("input[data-subject]");
        input.value = "";
        input.required = false;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-subject";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${definition.name}`);
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
    });

    function getStudentResults() {
        const results = {};
        let invalid = false;
        marksList.querySelectorAll("input[data-subject]").forEach(input => {
            if (input.value.trim() === "") return;
            const mark = Number(input.value);
            input.setCustomValidity("");
            if (!Number.isFinite(mark) || mark < 0 || mark > 100 || !Number.isInteger(mark)) {
                input.setCustomValidity("Enter a whole-number percentage from 0 to 100.");
                invalid = true;
            } else {
                results[input.dataset.subject] = mark;
            }
        });
        return invalid ? null : results;
    }

    function validateStudentResults(results) {
        if (!results) return "Please correct your marks. Use whole numbers between 0 and 100.";
        if (Object.keys(results).length === 0) return "Please add subjects and enter your marks.";
        const hasEnglish = results.englishHome !== undefined || results.englishFAL !== undefined;
        if (!hasEnglish) return "Please enter English Home Language or English First Additional Language.";
        if (!results.mathematics && results.mathematics !== 0) {
            // Mathematical Literacy is an alternative in subject checks, but it is not required globally.
        }
        return null;
    }

    function calculateUniversityScore(key, results) {
        if (!window.UniCompanionAdmissionConfig) {
            return { score: null, unavailable: "Admission-scoring configuration is unavailable." };
        }
        return window.UniCompanionAdmissionConfig.calculate(key, results);
    }

    function normaliseSubjectName(name) {
        return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    const subjectAliases = new Map();
    subjectDefinitions.forEach((definition, key) => {
        subjectAliases.set(normaliseSubjectName(definition.name), key);
        subjectAliases.set(normaliseSubjectName(key), key);
    });
    [
        ["english", "englishFAL"], ["englishhome", "englishHome"],
        ["englishhomelanguage", "englishHome"], ["englishfirstadditionallanguage", "englishFAL"],
        ["maths", "mathematics"], ["mathematics", "mathematics"],
        ["mathliteracy", "mathLiteracy"], ["mathematicalliteracy", "mathLiteracy"],
        ["physicalscience", "physicalSciences"], ["lifescience", "lifeSciences"],
        ["cat", "computerApplicationsTechnology"], ["it", "informationTechnology"]
    ].forEach(([alias, key]) => subjectAliases.set(alias, key));

    function resolveSubjectKey(name) {
        const direct = subjectAliases.get(normaliseSubjectName(name));
        if (direct) return direct;
        const words = normaliseSubjectName(name);
        for (const [alias, key] of subjectAliases.entries()) {
            if (words.includes(alias) || alias.includes(words)) return key;
        }
        return null;
    }

    function assessProgramme(programme, results, universityScore) {
        if (!universityScore || universityScore.score === null) {
            return { status: "indeterminate", eligible: false, programme, apsPassed: null, subjectChecks: [], reason: universityScore?.unavailable || "Admission score could not be calculated." };
        }

        const apsItems = Array.isArray(programme.aps) ? programme.aps : [];
        const uniqueScores = [...new Set(apsItems.map(item => Number(item.score)).filter(Number.isFinite))];
        let apsRequirement = null;
        if (uniqueScores.length === 1) apsRequirement = uniqueScores[0];

        const subjectChecks = (programme.subjects || []).map(subject => {
            const key = resolveSubjectKey(subject.subject);
            const requiredLevel = Number(subject.minimumLevel);
            if (!key || !Number.isFinite(requiredLevel)) {
                return { subject: subject.subject, passed: null, needsReview: true, requiredLevel: null, studentLevel: null };
            }
            if (results[key] === undefined) {
                return { subject: subject.subject, passed: null, needsReview: true, requiredLevel, studentLevel: null };
            }
            const studentLevel = window.UniCompanionAdmissionConfig?.getNSCLevel(results[key]) ?? null;
            return { subject: subject.subject, passed: studentLevel >= requiredLevel, needsReview: false, requiredLevel, studentLevel };
        });

        if (apsRequirement === null) {
            return { status: "indeterminate", eligible: false, programme, apsPassed: null, apsRequirement, subjectChecks, reason: "APS/admission-score requirement could not be determined reliably." };
        }
        if (subjectChecks.some(item => item.needsReview)) {
            return { status: "indeterminate", eligible: false, programme, apsPassed: universityScore.score >= apsRequirement, apsRequirement, subjectChecks, reason: "One or more subject requirements could not be verified." };
        }

        if (programme.reviewStatus === "invalid") {
            return {
                status: "indeterminate",
                eligible: false,
                programme,
                apsPassed: null,
                apsRequirement,
                subjectChecks,
                reason: "The prospectus record is invalid or ambiguous and cannot be used for eligibility."
            };
        }

        const apsPassed = universityScore.score >= apsRequirement;
        const subjectsPassed = subjectChecks.every(item => item.passed);
        return {
            status: apsPassed && subjectsPassed ? "eligible" : "not-eligible",
            eligible: apsPassed && subjectsPassed,
            programme,
            apsPassed,
            apsRequirement,
            subjectChecks,
            reason: ""
        };
    }

    function renderCards() {
        universityGrid.replaceChildren();
        universityConfigs.forEach(config => {
            const card = document.createElement("article");
            card.className = "aps-university-card";
            card.dataset.university = config.key;
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">
                        <span class="university-logo">${config.shortName}</span>
                        <span>${config.name}</span>
                    </div>
                    <div class="card-back">
                        <h3>${config.name}</h3>
                        <div class="result-item">
                            <span>${config.scoreLabel}</span>
                            <strong class="university-aps">--</strong>
                        </div>
                        <div class="result-item">
                            <span>Eligible programmes</span>
                            <strong class="eligible-count">Pending</strong>
                        </div>
                        <button class="view-university-courses" type="button" disabled>View Courses</button>
                    </div>
                </div>`;
            universityGrid.appendChild(card);
        });
    }

    function resetResults() {
        resultsSection.hidden = true;
        activeUniversityKey = null;
        universityResults.clear();
        apsMessage.textContent = "";
        document.querySelectorAll(".aps-university-card").forEach(card => {
            card.classList.remove("is-flipped");
            card.querySelector(".university-aps").textContent = "--";
            card.querySelector(".eligible-count").textContent = "Pending";
            card.querySelector(".view-university-courses").disabled = true;
        });
        window.UniCompanionStudentResults = null;
    }

    function loadExtractedUniversities(data) {
        extractedUniversities = Array.isArray(data) ? data : [];
        universityConfigs.forEach(config => {
            const extracted = extractedUniversities.find(item => item.university === config.key);
            if (extracted) config.year = extracted.admissionYear || config.year;
        });
    }

    window.addEventListener("unicomp:all-prospectuses-ready", event => {
        loadExtractedUniversities(event.detail);
        if (prospectusStatus) prospectusStatus.textContent =
            `${extractedUniversities.length} university prospectuses processed.`;
    });

    if (window.UniCompanionExtractedUniversities) {
        loadExtractedUniversities(window.UniCompanionExtractedUniversities);
    }

    function renderActiveUniversity(key) {
        const result = universityResults.get(key);
        const config = universityConfigs.find(item => item.key === key);
        if (!result || !config) return;

        activeUniversityKey = key;
        document.querySelectorAll(".view-university-courses").forEach(button => {
            button.classList.toggle("is-active", button.closest(".aps-university-card")?.dataset.university === key);
        });

        activeUniversityName.textContent = config.name;
        activeUniversityYear.textContent = `Prospectus ${config.year}`;
        activeProgrammeList.replaceChildren();

        const eligible = result.assessments.filter(item => item.status === "eligible");
        const notEligible = result.assessments.filter(item => item.status === "not-eligible");
        const indeterminate = result.assessments.filter(item => item.status === "indeterminate");
        activeResultsSummary.textContent =
            `${eligible.length} eligible programme${eligible.length === 1 ? "" : "s"}; ` +
            `${notEligible.length} not eligible; ` +
            `${indeterminate.length} requirement${indeterminate.length === 1 ? "" : "s"} could not be determined.`;

        if (result.assessments.length === 0) {
            const empty = document.createElement("li");
            empty.className = "programme-result-empty";
            empty.textContent = result.error || "No programme candidates were extracted from this prospectus.";
            activeProgrammeList.appendChild(empty);
        } else {
            result.assessments.forEach(assessment => {
                const programme = assessment.programme;
                const item = document.createElement("li");
                item.className = "programme-result-item";

                const heading = document.createElement("div");
                heading.className = "programme-result-heading";
                const name = document.createElement("strong");
                name.textContent = programme.name;
                const badge = document.createElement("span");
                badge.className = `eligibility-badge ${assessment.status}`;
                badge.textContent =
                    assessment.status === "eligible" ? "Eligible" :
                    assessment.status === "not-eligible" ? "Not eligible" :
                    "Cannot determine";
                heading.append(name, badge);
                item.appendChild(heading);

                const aps = document.createElement("p");
                aps.textContent = assessment.apsRequirement === null
                    ? `Admission score requirement: Cannot determine. Student score: ${result.score ?? "N/A"}`
                    : `Admission score requirement: ${assessment.apsRequirement}; student score: ${result.score ?? "N/A"}.`;
                item.appendChild(aps);

                if (assessment.subjectChecks.length) {
                    const subjects = document.createElement("p");
                    subjects.textContent = "Subject requirements: " +
                        assessment.subjectChecks.map(check =>
                            check.needsReview
                                ? `${check.subject} - cannot determine`
                                : `${check.subject} - level ${check.requiredLevel} (your level ${check.studentLevel})`
                        ).join("; ");
                    item.appendChild(subjects);
                } else {
                    const subjects = document.createElement("p");
                    subjects.textContent = "Subject requirements: No extractable subject minimums found.";
                    item.appendChild(subjects);
                }

                if (assessment.reason) {
                    const reason = document.createElement("p");
                    reason.textContent = `Assessment: ${assessment.reason}`;
                    item.appendChild(reason);
                }

                if (programme.selectionRequirements?.length) {
                    const selection = document.createElement("p");
                    selection.textContent = "Additional selection criteria: " +
                        programme.selectionRequirements.map(item => item.description).join(" ");
                    item.appendChild(selection);
                }

                if (programme.sourcePages?.length) {
                    const source = document.createElement("small");
                    source.textContent = `Prospectus pages: ${programme.sourcePages.join(", ")}`;
                    item.appendChild(source);
                }
                activeProgrammeList.appendChild(item);
            });

            if (eligible.length === 0) {
                const empty = document.createElement("li");
                empty.className = "programme-result-empty";
                empty.textContent = indeterminate.length
                    ? "No programmes could be confirmed eligible; requirements need source verification."
                    : "No extracted programmes met the available admission-score and subject requirements.";
                activeProgrammeList.appendChild(empty);
            }
        }

        resultsSection.hidden = false;
        resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    calculateAPSButton.addEventListener("click", () => {
        const results = getStudentResults();
        const validationError = validateStudentResults(results);
        if (validationError) {
            apsMessage.textContent = validationError;
            return;
        }

        document.querySelectorAll(".aps-university-card").forEach(card =>
            card.classList.add("is-flipped")
        );
        universityResults.clear();
        activeUniversityKey = null;

        let firstAvailable = null;
        universityConfigs.forEach(config => {
            const card = document.querySelector(`.aps-university-card[data-university="${config.key}"]`);
            const apsDisplay = card.querySelector(".university-aps");
            const countDisplay = card.querySelector(".eligible-count");
            const button = card.querySelector(".view-university-courses");
            const extracted = extractedUniversities.find(item => item.university === config.key);

            if (!extracted) {
                apsDisplay.textContent = "--";
                countDisplay.textContent = "Loading";
                button.disabled = true;
                return;
            }

            if (extracted.extractionError) {
                apsDisplay.textContent = "Unavailable";
                countDisplay.textContent = "0";
                button.disabled = false;
                universityResults.set(config.key, {
                    score: null,
                    assessments: [],
                    error: extracted.extractionError
                });
            } else {
                const score = calculateUniversityScore(config.key, results);
                apsDisplay.textContent = score.score === null ? "N/A" : String(score.score);
                const assessments = (extracted.programmes || []).map(programme =>
                    assessProgramme(programme, results, score)
                );
                const eligibleCount = assessments.filter(item => item.status === "eligible").length;
                countDisplay.textContent = String(eligibleCount);
                button.disabled = assessments.length === 0;
                universityResults.set(config.key, {
                    score: score.score,
                    unavailable: score.unavailable,
                    assessments
                });
                if (!firstAvailable && assessments.length > 0) firstAvailable = config.key;
            }
        });

        if (!firstAvailable) firstAvailable = universityConfigs.map(config => config.key)
            .find(key => universityResults.get(key));
        if (firstAvailable) renderActiveUniversity(firstAvailable);

        window.UniCompanionStudentResults = {
            subjects: results,
            universities: Object.fromEntries([...universityResults.entries()].map(([key, value]) => [
                key,
                { score: value.score, eligibleCount: value.assessments.filter(item => item.status === "eligible").length }
            ])),
            calculatedAt: new Date().toISOString()
        };
        apsMessage.textContent = "University cards are open. Use View Courses to switch the active result.";
    });

    calculateAverageButton.addEventListener("click", () => {
        const results = getStudentResults();
        if (!results) {
            apsMessage.textContent = "Please correct your marks before calculating your average.";
            return;
        }
        const values = Object.values(results);
        if (!values.length) {
            apsMessage.textContent = "Please add subjects and enter your marks first.";
            return;
        }
        const average = values.reduce((sum, mark) => sum + mark, 0) / values.length;
        apsMessage.textContent = `Your average is ${average.toFixed(2)}%.`;
    });

    document.querySelectorAll(".view-university-courses").forEach(button => {
        button.addEventListener("click", () => renderActiveUniversity(
            button.closest(".aps-university-card").dataset.university
        ));
    });

    renderCards();
    // Card buttons are attached after cards are created.
    universityGrid.addEventListener("click", event => {
        const button = event.target.closest(".view-university-courses");
        if (!button || button.disabled) return;
        renderActiveUniversity(button.closest(".aps-university-card").dataset.university);
    });

    marksList.addEventListener("input", resetResults);
    updateSubjectOptions();
    setStatusFallback();

    function setStatusFallback() {
        if (prospectusStatus && !prospectusStatus.textContent.trim()) {
            prospectusStatus.textContent = "Loading university prospectuses...";
        }
    }
});
