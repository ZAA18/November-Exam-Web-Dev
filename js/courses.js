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

        const crest = document.createElement("span");
        crest.className = "directory-crest";
        crest.setAttribute("aria-hidden", "true");
        crest.textContent = university.crest;

        const stats = document.createElement("div");
        stats.className = "directory-stats";
        stats.append(
            makeStat("🎓", "Programmes Offered", university.programmes),
            makeStat("🏛️", "Faculties", university.faculties)
        );

        const link = document.createElement("a");
        link.className = "directory-card-link";
        link.href = university.prospectus;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "View courses";
        link.setAttribute("aria-label", `View courses in the ${university.name} prospectus`);

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
