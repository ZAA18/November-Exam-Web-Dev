document.addEventListener("DOMContentLoaded", () => {
    "use strict";
    const $ = id => document.getElementById(id);
    const marksList = $("marks-list"), picker = $("subject-select"), add = $("add-subject"), template = $("subject-options");
    const cards = [...document.querySelectorAll(".aps-university-card")];
    const panel = $("university-programme-results"), summary = $("university-results-summary"), list = $("university-programmes");
    const all = window.UniCompanionUniversities || {};
    const pageLoader = $("aps-page-loader");
    const apsMessage = $("aps-message");
    const calculateButton = $("calculate-aps");
    const averageButton = $("calculate-average");
    function setApsMessage(message, state = "idle") {
        if (!apsMessage) return;
        apsMessage.textContent = message;
        apsMessage.dataset.state = state;
        apsMessage.setAttribute("aria-busy", String(state === "loading"));
    }
    window.addEventListener("unicomp:prospectus-batch-complete", () => {
        pageLoader?.classList.add("is-hidden");
        pageLoader?.setAttribute("aria-hidden", "true");
        $("aps-main-content")?.setAttribute("aria-busy", "false");
    }, { once: true });
    if (!marksList || !picker || !template || !panel || !cards.length) { console.error("APS calculator markup is incomplete."); return; }
    const subjects = new Map();
    template.content.querySelectorAll(".mark-row").forEach(row => {
        const input = row.querySelector("[data-subject]"), label = row.querySelector("label");
        if (!input || !label) return;
        subjects.set(input.dataset.subject, { name: label.textContent.trim(), row });
        const option = document.createElement("option"); option.value = input.dataset.subject; option.textContent = label.textContent.trim(); picker.append(option);
    });
    let selected = null, studentResults = null;
    function reset() {
        selected = null; studentResults = null; panel.hidden = true;
        cards.forEach(card => { card.classList.remove("is-flipped"); card.querySelector(".university-aps").textContent = "--"; card.querySelector(".eligible-count").textContent = "Pending"; card.querySelector("button").disabled = true; card.querySelector("button").classList.remove("is-active"); });
        window.UniCompanionStudentResults = null;
        setApsMessage("Marks changed. Calculate again to refresh your results.", "idle");
    }
    function collect() {
        const result = {}; let invalid = false;
        marksList.querySelectorAll("input[data-subject]").forEach(input => {
            input.setCustomValidity(""); if (!input.value.trim()) return;
            const n = Number(input.value);
            if (!Number.isInteger(n) || n < 0 || n > 100) { input.setCustomValidity("Enter a whole-number mark from 0 to 100."); input.reportValidity(); invalid = true; }
            else result[input.dataset.subject] = n;
        });
        if (invalid) return null;
        if (!Object.keys(result).length) return null;
        return result;
    }
    function refreshPicker() { const used = new Set([...marksList.querySelectorAll("[data-subject]")].map(x=>x.dataset.subject)); [...picker.options].forEach(o=>{ if(o.value) o.disabled=used.has(o.value); }); }
    add.addEventListener("click", () => {
        const definition = subjects.get(picker.value); if (!definition) { setApsMessage("Choose a subject first.", "error"); return; }
        const row = definition.row.cloneNode(true), input = row.querySelector("[data-subject]"); input.value = "";
        const remove = document.createElement("button"); remove.type="button"; remove.className="remove-subject"; remove.textContent="Remove"; remove.addEventListener("click",()=>{row.remove();refreshPicker();reset();});
        row.append(remove); marksList.append(row); picker.value=""; refreshPicker(); input.addEventListener("input",reset); input.focus(); reset();
    });
    function renderUniversity(id) {
        const uni = all[id], result = studentResults?.[id]; if (!uni || !result) return;
        selected=id; cards.forEach(c=>c.querySelector("button").classList.toggle("is-active", c.dataset.university===id));
        panel.hidden=false; list.replaceChildren();
        window.UniCompanionMotion?.revealResponse(panel);
        $("university-results-heading").textContent = `${uni.name} programmes`;
        const assessed = result.assessments || [], counts = { eligible: 0, "not-eligible": 0, incomplete: 0 };
        assessed.forEach(a=>counts[a.status]++);
        const scoreText=result.score.value!==null&&result.score.value!==undefined?`${result.score.value}${result.score.available?"":" (base score)"}`:"Add marks to calculate";
        summary.textContent = `${uni.admissionYear ? `Prospectus ${uni.admissionYear}` : "Prospectus year unavailable"} · Admission score: ${scoreText}${result.score.unit?` ${result.score.unit}`:""} · ${counts.eligible} eligible · ${counts["not-eligible"]} below a confirmed minimum · ${counts.incomplete} with criteria still to assess. Meeting minimums does not guarantee admission.`;
        if (!assessed.length) {
            const empty=document.createElement("p");
            empty.className="results-empty";
            empty.setAttribute("role", "status");
            const extractionState = !uni.prospectus || uni.extractionStatus === "error"
                ? "error"
                : uni.extractionStatus === "processed" ? "empty" : "loading";
            empty.dataset.state = extractionState;
            empty.setAttribute("aria-busy", String(extractionState === "loading"));
            empty.textContent=!uni.prospectus
                ? "No prospectus is available for this university yet. Choose another university to view its programmes."
                : uni.extractionStatus==="error"
                    ? "This prospectus could not be loaded. Check that the site is running through a local web server, then reload the page to retry."
                    : uni.extractionStatus==="processed"
                        ? "No programme entries were detected in this prospectus. Try another university or open its prospectus directly."
                        : "This prospectus is still being processed. Its programme list will appear here when extraction finishes.";
            list.append(empty);
        }
        assessed.forEach((a,index)=>{
            const programmeName = a.programme.name || "Unnamed programme";
            const item = document.createElement("article");
            item.className = `programme-card status-${a.status}`;
            item.dataset.motionFlipCard = "";
            item.tabIndex = 0;
            item.setAttribute("role", "group");
            item.setAttribute("aria-label", `${programmeName} at ${uni.name}. Press Enter or Space to show admission details.`);

            const inner = document.createElement("div");
            inner.className = "programme-card-inner";
            const front = document.createElement("div");
            front.className = "programme-card-face programme-card-front";
            front.id = `programme-front-${id}-${index}`;
            const back = document.createElement("div");
            back.className = "programme-card-face programme-card-back";
            back.id = `programme-details-${id}-${index}`;
            back.setAttribute("aria-hidden", "true");
            back.inert = true;

            const addFlipButton = (parent, label, controlsId) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "programme-flip-control";
                button.textContent = label;
                button.setAttribute("aria-controls", controlsId);
                button.setAttribute("aria-expanded", "false");
                parent.append(button);
                return button;
            };

            const universityLabel = document.createElement("small");
            universityLabel.className = "programme-university-name";
            universityLabel.textContent = uni.name;
            const title = document.createElement("h3");
            title.textContent = programmeName;
            front.append(universityLabel, title);
            if (a.programme.faculty) {
                const faculty = document.createElement("p");
                faculty.className = "programme-faculty";
                faculty.textContent = a.programme.faculty;
                front.append(faculty);
            }
            const status = document.createElement("strong");
            status.className = "programme-status-label";
            status.textContent = a.status === "incomplete"
                ? "MORE REQUIREMENTS TO CHECK"
                : a.status.replaceAll("-", " ").toUpperCase();
            front.append(status);
            addFlipButton(front, "View Details", back.id);

            const backTitle = document.createElement("h3");
            backTitle.textContent = "Admission details";
            back.append(backTitle);
            if (a.score?.available) {
                const scoreLine = document.createElement("p");
                scoreLine.textContent = `Your programme-specific ${a.score.unit}: ${a.score.value}. ${a.score.details || ""}`;
                back.append(scoreLine);
            }
            [...a.reasons, ...a.unknown].forEach(reason => {
                const paragraph = document.createElement("p");
                paragraph.textContent = reason;
                back.append(paragraph);
            });
            if (a.programme.selectionRequirements?.length) {
                const paragraph = document.createElement("p");
                paragraph.textContent = "Additional criteria: " + a.programme.selectionRequirements.map(x => x.description).join("; ");
                back.append(paragraph);
            }
            if (a.programme.sourcePages?.length) {
                const pages = document.createElement("small");
                pages.append("Prospectus PDF page(s): ");
                a.programme.sourcePages.forEach((page, pageIndex) => {
                    if (pageIndex) pages.append(", ");
                    const link = document.createElement("a");
                    link.href = `${uni.prospectus}#page=${page}`;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                    link.textContent = String(page);
                    pages.append(link);
                });
                back.append(pages);
            }
            const sourceItems = [
                ...(a.programme.aps || []).map(x => ({ label: `${x.type || "Admission score"} requirement`, text: x.sourceText, page: x.sourcePage })),
                ...(a.programme.subjects || []).map(x => ({ label: `${x.subject} requirement`, text: x.sourceText, page: x.sourcePage })),
                ...(a.programme.selectionRequirements || []).map(x => ({ label: "Selection criterion", text: x.sourceText || x.description, page: x.sourcePage }))
            ].filter(x => x.text);
            if (sourceItems.length) {
                const details = document.createElement("details");
                const caption = document.createElement("summary");
                caption.textContent = "View extracted source text";
                details.append(caption);
                sourceItems.forEach(source => {
                    const paragraph = document.createElement("p");
                    paragraph.textContent = `${source.label}${source.page ? ` (PDF p. ${source.page})` : ""}: ${source.text}`;
                    details.append(paragraph);
                });
                back.append(details);
            }
            addFlipButton(back, "Back to programme", front.id);

            const setFlipped = flipped => {
                const moveFocus = document.activeElement?.classList.contains("programme-flip-control")
                    && item.contains(document.activeElement);
                item.classList.toggle("is-flipped", flipped);
                front.setAttribute("aria-hidden", String(flipped));
                front.inert = flipped;
                back.setAttribute("aria-hidden", String(!flipped));
                back.inert = !flipped;
                item.querySelectorAll(".programme-flip-control").forEach(button => {
                    button.setAttribute("aria-expanded", String(flipped));
                });
                window.UniCompanionMotion?.flipCard(item, flipped);
                if (moveFocus) {
                    requestAnimationFrame(() => {
                        (flipped ? back : front).querySelector(".programme-flip-control")
                            ?.focus({ preventScroll: true });
                    });
                }
            };
            item.addEventListener("click", event => {
                if (event.target.closest("a, summary")) return;
                setFlipped(!item.classList.contains("is-flipped"));
            });
            item.addEventListener("keydown", event => {
                if (event.target !== item || (event.key !== "Enter" && event.key !== " ")) return;
                event.preventDefault();
                setFlipped(!item.classList.contains("is-flipped"));
            });

            inner.append(front, back);
            item.append(inner);
            list.append(item);
        });
        requestAnimationFrame(() => {
            panel.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                block: "start"
            });
        });
    }
    let calculating = false;
    let calculationRefreshQueued = false;
    function calculate() {
        if (calculating) return;
        const marks=collect();
        if(!marks){setApsMessage("Add subjects and enter valid whole-number marks from 0 to 100.", "error");return;}
        const hasEnglish=marks.englishHome!==undefined||marks.englishFAL!==undefined;
        if(!hasEnglish){setApsMessage("Enter English Home Language or English First Additional Language.", "error");return;}
        const priorSelection=selected;
        calculating = true;
        reset();
        const markInputs = [...marksList.querySelectorAll("input[data-subject]")];
        const originalCalculateLabel = calculateButton.textContent;
        calculateButton.disabled = true;
        calculateButton.setAttribute("aria-busy", "true");
        averageButton.disabled = true;
        add.disabled = true;
        picker.disabled = true;
        markInputs.forEach(input => { input.disabled = true; });
        calculateButton.textContent = "Calculating...";
        setApsMessage("Calculating your APS and checking programme requirements...", "loading");

        requestAnimationFrame(() => {
            try {
                const students={};
                cards.forEach(card=>{
                    const id=card.dataset.university, uni=all[id]; if(!uni) return;
                    const score=window.UniCompanionEligibilityEngine.score(uni,marks);
                    const data=uni.programmes||[];
                    const assessments=data.map(programme=>window.UniCompanionEligibilityEngine.assess(uni,marks,programme,score));
                    const eligible=assessments.filter(a=>a.status==="eligible").length;
                    card.classList.add("is-flipped");
                    card.querySelector(".university-aps").textContent=score.value!==null&&score.value!==undefined?String(score.value):"Add marks";
                    const scoreLabel=card.querySelector(".result-item span");
                    if(scoreLabel) scoreLabel.textContent=score.available?`${score.unit||"Admission score"}${id==="uct"?" (base)":""}`:`${uni.name} score`;
                    let hint=card.querySelector(".score-hint");if(!hint){hint=document.createElement("small");hint.className="score-hint";card.querySelector(".result-item").append(hint);}hint.textContent=score.available?score.details||"":score.reason||"Enter your marks to calculate this score.";
                    card.querySelector(".eligible-count").textContent=data.length?`${eligible} eligible`:uni.extractionStatus==="error"?"Unavailable":(uni.prospectus?"Programmes loading":"No prospectus");
                    card.querySelector("button").disabled=!uni.prospectus;
                    window.UniCompanionMotion?.pulse(card, Object.keys(students).length * 0.045);
                    students[id]={score,assessments};
                });
                studentResults=students;
                setApsMessage("APS results are ready. Select View Courses on a university card to review the programme assessments.", "success");
                window.UniCompanionStudentResults={subjects:marks,universities:students,calculatedAt:new Date().toISOString()};
                if(priorSelection&&students[priorSelection]?.assessments.length) renderUniversity(priorSelection);
            } catch (error) {
                console.error("APS calculation failed:", error);
                reset();
                setApsMessage("APS results could not be calculated. Check your marks and try again.", "error");
            } finally {
                calculateButton.disabled = false;
                calculateButton.setAttribute("aria-busy", "false");
                averageButton.disabled = false;
                add.disabled = false;
                picker.disabled = false;
                calculating = false;
                markInputs.forEach(input => { input.disabled = false; });
                calculateButton.textContent = originalCalculateLabel;
                if (calculationRefreshQueued) {
                    calculationRefreshQueued = false;
                    calculate();
                }
            }
        });
    }
    cards.forEach(card=>card.querySelector("button").addEventListener("click",()=>renderUniversity(card.dataset.university)));
    $("calculate-aps").addEventListener("click",calculate);
    averageButton.addEventListener("click",()=>{const marks=collect(); if(!marks){setApsMessage("Enter valid marks before calculating your average.", "error");return;} const values=Object.values(marks);setApsMessage(`Your average is ${(values.reduce((a,b)=>a+b,0)/values.length).toFixed(1)}%.`, "success");
    });
    marksList.addEventListener("input",reset);
    cards.forEach(card=>card.querySelector("button").classList.remove("is-active"));
    window.addEventListener("unicomp:prospectus-ready",event=>{
        const data=event.detail, id=String(data?.university||"").toLowerCase();
        const uni=all[id]; if(!uni||!Array.isArray(data.programmes)) return;
        uni.programmes=data.programmes; uni.admissionYear=data.admissionYear||uni.admissionYear; uni.extractionStatus="processed";
        const status=$("prospectus-status"); if(status) { status.textContent=`${uni.name} (${uni.admissionYear||"year unknown"}): loaded ${data.programmes.length} programme entries from its prospectus.`; status.dataset.status="success"; }
        if(window.UniCompanionStudentResults) { if(calculating) calculationRefreshQueued=true; else calculate(); }
    });
    window.addEventListener("unicomp:prospectus-error",event=>{const id=event.detail?.university;if(id&&all[id])all[id].extractionStatus="error";const status=$("prospectus-status");if(status){status.textContent=`${event.detail?.university||"Prospectus"} could not be loaded. The other university cards remain available.`;status.dataset.status="error";}if(window.UniCompanionStudentResults){if(calculating)calculationRefreshQueued=true;else calculate();}});
    refreshPicker();
});
