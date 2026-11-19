document.addEventListener("DOMContentLoaded", () => {
    const directory = document.getElementById("university-directory");
    if (!directory) return;

    // Counts and order follow the supplied view-courses wireframe.
    const universities = [
        { id: "wits", name: "Wits University", crest: "W", color: "#173d66", programmes: 92, faculties: 16, prospectus: "../prospectuses/wits/wits-2027.pdf" },
        { id: "uct", name: "University of Cape Town", crest: "UCT", color: "#1b4770", programmes: 34, faculties: 6, prospectus: "../prospectuses/UCT/2027-uct-undergraduate-prospectus-1-april-2026.pdf" },
        { id: "ufh", name: "University of Fort Hare", crest: "UFH", color: "#39743f", programmes: 49, faculties: 6, prospectus: "../prospectuses/UFH/Study-Guide-2027.pdf" },
        { id: "wsu", name: "Walter Sisulu University", crest: "WSU", color: "#bc6428", programmes: 50, faculties: 16, prospectus: "../prospectuses/WSU/2027-information-brochure-admission-requirements walter sisulu.pdf" },
        { id: "uj", name: "University of Johannesburg", crest: "UJ", color: "#d66f27", programmes: 104, faculties: 7, prospectus: "../prospectuses/UJ/uj_undergrad_prospectus2027_online_25jun2026.pdf" },
        { id: "rhodes", name: "Rhodes University", crest: "RU", color: "#694182", programmes: 16, faculties: 6, prospectus: "../prospectuses/Rhodes/RU_READY_Undergraduate_Prospectus_2026_DIGITAL_A5_Landscape_24pp_18Mar2026.pdf" },
        { id: "ufs", name: "University of the Free State", crest: "UFS", color: "#a43b45", programmes: 60, faculties: 15, prospectus: "../prospectuses/UFS/ufs---ug-prospectus-2027---jan.pdf" },
        { id: "stellenbosch", name: "Stellenbosch University", crest: "SU", color: "#8d6b37", programmes: 77, faculties: 10, prospectus: "../prospectuses/SU/stellenbosch university prospectus 2027.pdf" },
        { id: "up", name: "University of Pretoria", crest: "UP", color: "#a33d47", programmes: 55, faculties: 10, prospectus: "../prospectuses/UP/UP_UG Prospectus 2027_NSC-IEB_DevV5_web_0.pdf" }
    ];

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
});
