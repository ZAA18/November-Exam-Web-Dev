/* Homepage loader, searchable university carousel, and entry transitions. */
document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("loader");
    const hideLoader = () => loader?.classList.add("hidden");
    window.addEventListener("load", hideLoader, { once: true });
    window.setTimeout(hideLoader, 700);

    const universityTrack = document.getElementById("university-track");
    const previousButton = document.getElementById("previous-university");
    const nextButton = document.getElementById("next-university");
    const catalog = window.UniCompanionUniversityCatalog || [];
    const searchForm = document.getElementById("search-form");
    const searchInput = document.getElementById("site-search");
    const searchStatus = document.getElementById("university-search-status");
    if (!universityTrack) return;
    if (!catalog.length) {
        if (searchStatus) {
            searchStatus.textContent = "The university list could not be loaded. Reload the page to try again.";
            searchStatus.dataset.state = "error";
        }
        return;
    }

    const cards = catalog.map(university => {
        const card = document.createElement("a");
        card.className = "university-card";
        card.href = `Pages/view-courses.html#university-${encodeURIComponent(university.id)}`;
        card.dataset.universityLink = "";
        card.dataset.universityId = university.id;
        card.setAttribute("aria-label", `Explore courses at ${university.name}`);

        const logo = document.createElement("img");
        logo.className = "university-logo";
        logo.src = `assets/University%20Icons/${encodeURIComponent(university.icon)}`;
        logo.alt = "";
        logo.setAttribute("aria-hidden", "true");

        const name = document.createElement("h3");
        name.textContent = university.name;
        card.append(logo, name);
        return card;
    });

    let activeCards = cards;
    let startIndex = 0;
    const visibleCount = () => window.matchMedia("(max-width: 950px)").matches ? 2 : 4;

    function renderCarousel(direction = 1) {
        const count = Math.min(visibleCount(), activeCards.length);
        if (startIndex >= activeCards.length) startIndex = 0;
        const visible = Array.from({ length: count }, (_, offset) =>
            activeCards[(startIndex + offset) % activeCards.length]
        );
        universityTrack.replaceChildren(...visible);
        universityTrack.dataset.direction = direction < 0 ? "previous" : "next";
        universityTrack.setAttribute("aria-label", `${activeCards.length} matching universities; showing ${count}`);
    }

    nextButton?.addEventListener("click", () => {
        if (activeCards.length <= visibleCount()) return;
        startIndex = (startIndex + 1) % activeCards.length;
        renderCarousel(1);
    });
    previousButton?.addEventListener("click", () => {
        if (activeCards.length <= visibleCount()) return;
        startIndex = (startIndex - 1 + activeCards.length) % activeCards.length;
        renderCarousel(-1);
    });

    let resizeFrame = 0;
    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => renderCarousel());
    }, { passive: true });

    function searchUniversities(query) {
        const normalized = query.trim().toLocaleLowerCase();
        activeCards = normalized
            ? cards.filter(card => card.textContent.toLocaleLowerCase().includes(normalized))
            : cards;
        startIndex = 0;
        renderCarousel();
        if (searchStatus) {
            searchStatus.dataset.state = !normalized ? "idle" : activeCards.length ? "success" : "empty";
            searchStatus.textContent = !normalized
                ? "Browse popular universities or search by name."
                : activeCards.length
                    ? `Showing ${activeCards.length} matching ${activeCards.length === 1 ? "university" : "universities"}.`
                    : `No universities match “${query.trim()}”. Try another spelling or a shorter search.`;
        }
        return activeCards.length;
    }

    searchForm?.addEventListener("submit", event => {
        event.preventDefault();
        searchUniversities(searchInput?.value || "");
        document.getElementById("universities")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    searchInput?.addEventListener("input", () => {
        if (!searchInput.value.trim()) searchUniversities("");
    });

    renderCarousel();
});
