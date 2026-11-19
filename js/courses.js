document.addEventListener("DOMContentLoaded", () => {
    const directory = document.getElementById("university-directory");
    if (!directory) return;

    const universities = window.UniCompanionUniversityCatalog || [];

    const makeStat = (icon, label, count) => {
        const row = document.createElement("div");
        row.className = "directory-stat";

        const symbol = document.createElement("span");
        symbol.className = "directory-stat-icon";
        symbol.setAttribute("aria-hidden", "true");
        symbol.textContent = icon;

        const text = document.createElement("span");
        text.textContent = label;

        const total = document.createElement("span");
        total.className = "directory-stat-count";
        total.textContent = String(count);

        row.append(symbol, text, total);
        return row;
    };

    universities.forEach(university => {
        const card = document.createElement("article");
        card.className = "directory-card";
        card.dataset.university = university.id;
        card.id = `university-${university.id}`;
        card.style.setProperty("--crest-color", university.color);

        const crest = document.createElement("img");
        crest.className = "directory-crest";
        crest.src = `../assets/University%20Icons/${encodeURIComponent(university.icon)}`;
        crest.alt = "";
        crest.setAttribute("aria-hidden", "true");

        const stats = document.createElement("div");
        stats.className = "directory-stats";
        stats.append(
            makeStat("🎓", "Programmes Offered", university.programmes ?? "See list"),
            makeStat("🏛️", university.facultyLabel || "Faculties", university.faculties)
        );
        const programmeStat = stats.querySelector(".directory-stat");
        if (programmeStat) {
            const source = university.programmeSource || university.prospectus;
            programmeStat.title = `${university.programmeBasis || "A verified total of distinct undergraduate programme choices is not available yet. Open the prospectus to browse the listed qualifications."}${source ? ` Source: ${source}` : ""}`;
        }
        const facultyStat = stats.querySelectorAll(".directory-stat")[1];
        if (facultyStat && university.facultySource) {
            facultyStat.title = `Faculty count verified from the university source: ${university.facultySource}`;
        }

        const link = document.createElement("a");
        link.className = "directory-card-link";
        link.href = university.prospectus;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "View programmes";
        link.setAttribute("aria-label", `View programmes in the ${university.name} prospectus`);

        const name = document.createElement("h2");
        name.className = "directory-card-name";
        name.textContent = university.name;

        card.append(crest, stats, link, name);
        directory.append(card);
    });

    // A university selected on the homepage gets brought into view and called out.
    const selectedCard = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (selectedCard?.classList.contains("directory-card")) {
        window.setTimeout(() => {
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            selectedCard.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
            selectedCard.classList.add("is-highlighted");
            selectedCard.setAttribute("aria-current", "location");
            window.UniCompanionMotion?.highlightUniversity(selectedCard);
            window.setTimeout(() => {
                selectedCard.classList.remove("is-highlighted");
                selectedCard.removeAttribute("aria-current");
            }, 5200);
        }, 450);
    }
});
