/* Site-wide GSAP motion with visible-content fallbacks and reduced-motion support. */
(() => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionEnabled = Boolean(gsap && !reduceMotion);
    const scrollMotionEnabled = Boolean(motionEnabled && ScrollTrigger);

    if (scrollMotionEnabled) gsap.registerPlugin(ScrollTrigger);

    function revealResponse(element) {
        if (!motionEnabled || !element) return;
        gsap.fromTo(element,
            { autoAlpha: 0, y: 10, filter: "blur(3px)" },
            {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.38,
                ease: "power2.out",
                clearProps: "transform,opacity,visibility,filter"
            }
        );
    }

    function flipCard(card, flipped) {
        if (!motionEnabled) return;
        const inner = card?.querySelector(".programme-card-inner");
        if (!inner) return;
        gsap.killTweensOf(inner);
        gsap.fromTo(inner,
            { rotationY: flipped ? 0 : 180 },
            {
                rotationY: flipped ? 180 : 0,
                duration: 0.62,
                ease: "power3.inOut",
                overwrite: true
            }
        );
    }

    function pulse(element, delay = 0) {
        if (!motionEnabled || !element) return;
        gsap.fromTo(element,
            { scale: 0.975, filter: "brightness(1.08)" },
            { scale: 1, filter: "brightness(1)", duration: 0.42, delay, ease: "back.out(1.7)", clearProps: "transform,filter" }
        );
    }

    function highlightUniversity(card) {
        if (!card) return;
        card.classList.add("is-highlighted");
        if (!motionEnabled) return;
        gsap.killTweensOf(card);
        gsap.fromTo(card,
            { scale: 0.9, y: 26, rotationY: -7, boxShadow: "0 0 0 0 #00bdc900" },
            { scale: 1, y: 0, rotationY: 0, boxShadow: "0 0 0 5px #00bdc955, 0 1.2rem 2.5rem #123b3b28", duration: 0.85, ease: "back.out(1.45)", clearProps: "transform" }
        );
        gsap.to(card, {
            boxShadow: "0 0 0 2px #00bdc955, 0 1rem 2rem #123b3b1f",
            duration: 0.65,
            repeat: 3,
            yoyo: true,
            delay: 0.85,
            ease: "sine.inOut",
            overwrite: "auto"
        });
    }

    window.UniCompanionMotion = { flipCard, revealResponse, pulse, highlightUniversity };

    // A branded curtain bridges the university choice and its course directory.
    const destinationPage = document.querySelector(".courses-page");
    let incomingTransition = false;
    try {
        incomingTransition = sessionStorage.getItem("unicomp:university-transition") === "1";
        if (incomingTransition) sessionStorage.removeItem("unicomp:university-transition");
    } catch (_) { /* Storage may be disabled; navigation still works normally. */ }

    function makeTransitionOverlay() {
        const overlay = document.createElement("div");
        overlay.className = "page-transition-overlay";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = '<span class="page-transition-orbit" aria-hidden="true"></span><span class="page-transition-mark">UniCompanion</span><span class="page-transition-label">Finding your university</span>';
        document.body.append(overlay);
        return overlay;
    }

    if (incomingTransition && destinationPage) {
        const overlay = makeTransitionOverlay();
        if (motionEnabled) {
            gsap.set(overlay, { clipPath: "circle(150% at 50% 50%)" });
            gsap.fromTo(overlay.querySelector(".page-transition-mark"),
                { autoAlpha: 0, y: 20, scale: 0.82 },
                { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.8)" }
            );
            gsap.to(overlay, {
                clipPath: "circle(0% at 50% 50%)",
                duration: 0.9,
                delay: 0.22,
                ease: "power4.inOut",
                onComplete: () => overlay.remove()
            });
        } else {
            overlay.remove();
        }
    }

    document.addEventListener("click", event => {
        const featureLink = event.target instanceof Element ? event.target.closest("a.feature-card[href]") : null;
        if (featureLink && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && !featureLink.target && !featureLink.hasAttribute("download") && motionEnabled) {
            event.preventDefault();
            const bounds = featureLink.getBoundingClientRect();
            const originX = `${((bounds.left + bounds.width / 2) / window.innerWidth) * 100}%`;
            const originY = `${((bounds.top + bounds.height / 2) / window.innerHeight) * 100}%`;
            const title = featureLink.querySelector("h2")?.textContent.trim() || "UniCompanion";
            const iconText = featureLink.querySelector(".feature-icon")?.textContent.trim() || "✦";
            const accent = featureLink.classList.contains("aps-card") ? "#cfe9e9" : featureLink.classList.contains("explore-card") ? "#d9f1d3" : "#ead9ef";
            const overlay = document.createElement("div");
            overlay.className = "feature-transition-overlay";
            overlay.setAttribute("aria-hidden", "true");
            overlay.style.setProperty("--feature-accent", accent);

            const portal = document.createElement("div");
            portal.className = "feature-transition-portal";
            const orbit = document.createElement("span");
            orbit.className = "feature-transition-orbit";
            const icon = document.createElement("span");
            icon.className = "feature-transition-icon";
            icon.textContent = iconText;
            const brand = document.createElement("span");
            brand.className = "feature-transition-brand";
            brand.textContent = "UNICOMPANION";
            const heading = document.createElement("span");
            heading.className = "feature-transition-title";
            heading.textContent = title;
            portal.append(orbit, icon, brand, heading);
            overlay.append(portal);
            document.body.append(overlay);

            gsap.set(overlay, { clipPath: `circle(0% at ${originX} ${originY})` });
            gsap.timeline({ onComplete: () => { window.location.href = featureLink.href; } })
                .to(overlay, { clipPath: `circle(150% at ${originX} ${originY})`, duration: 0.82, ease: "power4.inOut" })
                .fromTo(orbit, { scale: 0.38, rotate: -48 }, { scale: 1, rotate: 0, duration: 0.72, ease: "power3.out" }, "-=0.5")
                .fromTo(icon, { autoAlpha: 0, y: 30, scale: 0.45, rotate: -24 }, { autoAlpha: 1, y: 0, scale: 1, rotate: 0, duration: 0.55, ease: "back.out(2)" }, "-=0.44")
                .fromTo([brand, heading], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.42, stagger: 0.09, ease: "power3.out" }, "-=0.28");
            return;
        }

        const featureButton = event.target instanceof Element ? event.target.closest("button.feature-card") : null;
        if (featureButton && motionEnabled) {
            const bounds = featureButton.getBoundingClientRect();
            const originX = `${((bounds.left + bounds.width / 2) / window.innerWidth) * 100}%`;
            const originY = `${((bounds.top + bounds.height / 2) / window.innerHeight) * 100}%`;
            const overlay = document.createElement("div");
            overlay.className = "feature-transition-overlay";
            overlay.setAttribute("aria-hidden", "true");
            overlay.style.setProperty("--feature-accent", "#f5e5d0");

            const portal = document.createElement("div");
            portal.className = "feature-transition-portal";
            const orbit = document.createElement("span");
            orbit.className = "feature-transition-orbit";
            const icon = document.createElement("span");
            icon.className = "feature-transition-icon";
            icon.textContent = featureButton.querySelector(".feature-icon")?.textContent.trim() || "✦";
            const brand = document.createElement("span");
            brand.className = "feature-transition-brand";
            brand.textContent = "UNICOMPANION AI";
            const heading = document.createElement("span");
            heading.className = "feature-transition-title";
            heading.textContent = "Your guide is ready";
            portal.append(orbit, icon, brand, heading);
            overlay.append(portal);
            document.body.append(overlay);

            gsap.set(overlay, { clipPath: `circle(0% at ${originX} ${originY})` });
            gsap.timeline({ onComplete: () => overlay.remove() })
                .to(overlay, { clipPath: `circle(150% at ${originX} ${originY})`, duration: 0.72, ease: "power4.inOut" })
                .fromTo(orbit, { scale: 0.4, rotate: -45 }, { scale: 1, rotate: 0, duration: 0.58, ease: "power3.out" }, "-=0.42")
                .fromTo(icon, { autoAlpha: 0, y: 24, scale: 0.5, rotate: -20 }, { autoAlpha: 1, y: 0, scale: 1, rotate: 0, duration: 0.46, ease: "back.out(2)" }, "-=0.35")
                .fromTo([brand, heading], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.36, stagger: 0.08, ease: "power3.out" }, "-=0.22")
                .to(overlay, { clipPath: `circle(0% at ${originX} ${originY})`, duration: 0.58, delay: 0.22, ease: "power4.inOut" });
            return;
        }

        const allUniversitiesLink = event.target instanceof Element
            ? event.target.closest(".section-heading a[href*='view-courses']")
            : null;
        const universityCatalog = window.UniCompanionUniversityCatalog || [];
        if (allUniversitiesLink && universityCatalog.length && motionEnabled
            && !event.defaultPrevented && event.button === 0
            && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
            && !allUniversitiesLink.target && !allUniversitiesLink.hasAttribute("download")) {
            event.preventDefault();
            try { sessionStorage.setItem("unicomp:university-transition", "1"); } catch (_) { /* Navigation still works without transition state. */ }

            const overlay = document.createElement("div");
            overlay.className = "university-launch-overlay";
            overlay.setAttribute("aria-hidden", "true");

            const orbit = document.createElement("span");
            orbit.className = "university-launch-orbit";
            const content = document.createElement("div");
            content.className = "university-launch-content";
            const kicker = document.createElement("p");
            kicker.className = "university-launch-kicker";
            kicker.textContent = "UNICOMPANION UNIVERSITY GUIDE";
            const heading = document.createElement("h2");
            heading.className = "university-launch-heading";
            heading.textContent = "Every university. One next step.";
            const grid = document.createElement("div");
            grid.className = "university-launch-grid";

            universityCatalog.forEach(university => {
                const tile = document.createElement("div");
                tile.className = "university-launch-card";
                const logo = document.createElement("img");
                logo.src = `assets/University%20Icons/${encodeURIComponent(university.icon)}`;
                logo.alt = "";
                logo.setAttribute("aria-hidden", "true");
                const name = document.createElement("span");
                name.textContent = university.name;
                tile.append(logo, name);
                grid.append(tile);
            });

            const caption = document.createElement("p");
            caption.className = "university-launch-caption";
            caption.textContent = "Opening all universities and undergraduate courses";
            content.append(kicker, heading, grid, caption);
            overlay.append(orbit, content);
            document.body.append(overlay);

            const bounds = allUniversitiesLink.getBoundingClientRect();
            const originX = `${((bounds.left + bounds.width / 2) / window.innerWidth) * 100}%`;
            const originY = `${((bounds.top + bounds.height / 2) / window.innerHeight) * 100}%`;
            gsap.set(overlay, { clipPath: `circle(0% at ${originX} ${originY})` });
            gsap.timeline({ onComplete: () => { window.location.href = allUniversitiesLink.href; } })
                .to(overlay, { clipPath: `circle(150% at ${originX} ${originY})`, duration: .72, ease: "power4.inOut" })
                .fromTo([kicker, heading],
                    { autoAlpha: 0, y: 28 },
                    { autoAlpha: 1, y: 0, duration: .42, stagger: .08, ease: "power3.out" },
                    "-=.28"
                )
                .fromTo([...grid.children],
                    { autoAlpha: 0, x: index => index % 2 ? 90 : -90, y: 26, rotateY: index => index % 2 ? 12 : -12, scale: .84 },
                    { autoAlpha: 1, x: 0, y: 0, rotateY: 0, scale: 1, duration: .5, stagger: { each: .075, from: "random" }, ease: "back.out(1.35)" },
                    "-=.16"
                )
                .fromTo(caption, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .3, ease: "power2.out" }, "-=.22")
                .to(orbit, { rotate: 300, scale: 1.08, duration: 1.2, ease: "power2.inOut" }, 0);
            return;
        }

        const link = event.target instanceof Element ? event.target.closest("a[data-university-link]") : null;
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (!motionEnabled) return;
        event.preventDefault();
        try { sessionStorage.setItem("unicomp:university-transition", "1"); } catch (_) { /* Continue with the same-page transition. */ }
        const overlay = makeTransitionOverlay();
        const mark = overlay.querySelector(".page-transition-mark");
        const label = overlay.querySelector(".page-transition-label");
        mark.textContent = link.querySelector("h3")?.textContent.trim() || "UniCompanion";
        label.textContent = "Opening course directory";
        gsap.set(overlay, { clipPath: "circle(0% at 50% 50%)" });
        gsap.timeline({ onComplete: () => { window.location.href = link.href; } })
            .to(overlay, { clipPath: "circle(150% at 50% 50%)", duration: 0.88, ease: "power4.inOut" })
            .fromTo(mark, { autoAlpha: 0, y: 22, scale: 0.8 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, ease: "back.out(1.8)" }, "-=0.42")
            .fromTo(overlay.querySelector(".page-transition-orbit"), { scale: 0.4, rotate: -35 }, { scale: 1, rotate: 0, duration: 0.7, ease: "power3.out" }, "<");
    });

    if (!motionEnabled) return;

    document.documentElement.classList.add("gsap-motion");

    const homeLoader = document.querySelector(".loader");
    const loaderLogo = homeLoader?.querySelector(".loader-logo");
    if (loaderLogo) {
        const loaderMotion = gsap.to(loaderLogo, {
            y: -5,
            rotate: 5,
            duration: 0.75,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
        new MutationObserver(() => {
            if (homeLoader.classList.contains("hidden")) loaderMotion.kill();
        }).observe(homeLoader, { attributes: true, attributeFilter: ["class"] });
    }

    // Global scroll progress gives continuous, low-key feedback while browsing.
    if (scrollMotionEnabled) {
        const progress = document.createElement("div");
        progress.className = "motion-scroll-progress";
        progress.setAttribute("aria-hidden", "true");
        progress.innerHTML = "<span></span>";
        document.body.append(progress);
        gsap.to(progress.firstElementChild, {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: document.documentElement, start: "top top", end: "max", scrub: 0.25 }
        });
    }

    // Shared navigation enters first, then each page's main heading and intro.
    const header = document.querySelector(".header");
    if (header) {
        const headerParts = header.querySelectorAll(".logo, .navigation .nav-link, .search-form");
        gsap.from(headerParts, {
            autoAlpha: 0,
            y: -10,
            duration: 0.46,
            stagger: 0.045,
            ease: "power2.out",
            clearProps: "transform,opacity,visibility"
        });
    }

    const hero = document.querySelector(".hero");
    if (hero) {
        const heroText = hero.querySelectorAll(".hero-badge, h1, p");
        const heroVisual = hero.querySelector(".hero-visual");
        const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
        entrance.from(heroText, {
            autoAlpha: 0,
            x: -28,
            y: 10,
            duration: 0.68,
            stagger: 0.12,
            clearProps: "transform,opacity,visibility"
        });
        if (heroVisual) {
            entrance.from(heroVisual, {
                autoAlpha: 0,
                x: 28,
                rotateY: -5,
                duration: 0.8,
                clearProps: "transform,opacity,visibility"
            }, "-=0.5");
        }

        const labels = hero.querySelectorAll(".floating-label");
        if (labels.length) {
            gsap.from(labels, {
                autoAlpha: 0,
                scale: 0.8,
                duration: 0.5,
                stagger: 0.1,
                delay: 0.6,
                ease: "back.out(1.8)",
                clearProps: "transform,opacity,visibility"
            });
            gsap.to(labels, {
                y: -5,
                duration: 1.8,
                stagger: { each: 0.22, from: "random" },
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                scrollTrigger: scrollMotionEnabled ? {
                    trigger: hero,
                    start: "top bottom",
                    end: "bottom top",
                    toggleActions: "play pause play pause"
                } : undefined
            });
        }
        if (scrollMotionEnabled && window.matchMedia("(min-width: 760px)").matches) {
            const image = hero.querySelector(".hero-image");
            if (image) {
                gsap.to(image, {
                    yPercent: 8,
                    ease: "none",
                    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.7 }
                });
            }
        }
    } else {
        const heading = document.querySelector(".find-course-heading, .aps-page-title");
        if (heading) {
            const headingTargets = heading.matches("h1, h2")
                ? [heading]
                : heading.querySelectorAll("h1, h2, p");
            gsap.from(headingTargets, {
                autoAlpha: 0,
                y: 18,
                duration: 0.62,
                stagger: 0.1,
                ease: "power3.out",
                clearProps: "transform,opacity,visibility"
            });
        }
    }

    function revealSection(section, targets, options = {}) {
        if (!scrollMotionEnabled || !section) return;
        const elements = typeof targets === "string"
            ? [...section.querySelectorAll(targets)]
            : [...targets];
        if (!elements.length) return;
        gsap.from(elements, {
            autoAlpha: 0,
            x: options.x || 0,
            y: options.y ?? 22,
            duration: options.duration || 0.62,
            stagger: options.stagger || 0.09,
            ease: options.ease || "power3.out",
            clearProps: "transform,opacity,visibility",
            scrollTrigger: {
                trigger: section,
                start: options.start || "top 84%",
                once: true
            }
        });
    }

    function revealCardsInBatches(cards) {
        const targets = [...cards].filter(card => !card.dataset.motionRevealed);
        if (!targets.length) return;
        targets.forEach(card => { card.dataset.motionRevealed = "true"; });

        if (!scrollMotionEnabled) {
            gsap.from(targets, {
                autoAlpha: 0,
                y: 18,
                duration: 0.48,
                stagger: Math.min(0.055, 0.22 / targets.length),
                ease: "power2.out",
                clearProps: "transform,opacity,visibility"
            });
            return;
        }

        ScrollTrigger.batch(targets, {
            start: "top 90%",
            once: true,
            interval: 0.12,
            batchMax: 8,
            onEnter(batch) {
                gsap.fromTo(batch,
                    { autoAlpha: 0, y: 22, rotateX: 3, transformOrigin: "50% 100%" },
                    {
                        autoAlpha: 1,
                        y: 0,
                        rotateX: 0,
                        duration: 0.62,
                        stagger: 0.065,
                        ease: "power3.out",
                        clearProps: "transform,opacity,visibility"
                    }
                );
            }
        });
    }

    // Reveal content groups only as they approach the viewport.
    const features = document.querySelector(".features");
    revealSection(features, ".feature-card", { y: 26, stagger: 0.12 });

    const universities = document.querySelector(".universities");
    revealSection(universities, ".section-heading", { x: -24, y: 0 });
    revealSection(universities, ".carousel-button", { y: 0, stagger: 0.08 });
    revealCardsInBatches(universities?.querySelectorAll(".university-card") || []);

    const howItWorks = document.querySelector(".how-it-works");
    revealSection(howItWorks, "h2", { x: -20, y: 0 });
    revealCardsInBatches(howItWorks?.querySelectorAll(".step-card") || []);

    const marksSection = document.querySelector(".marks-section");
    revealSection(marksSection, ":scope > *", { x: -18, y: 0, stagger: 0.055 });

    const apsUniversities = document.querySelector(".aps-universities");
    revealCardsInBatches(apsUniversities?.querySelectorAll(".aps-university-card") || []);

    const progress = document.querySelector(".recommendation-progress");
    revealSection(progress, ".progress-step, .progress-connector", { y: 12, stagger: 0.12 });
    const recommendationForm = document.querySelector(".recommendation-layout");
    revealSection(recommendationForm, ".interest-panel, .ai-panel", { y: 28, stagger: 0.16 });

    const coursesHeading = document.querySelector(".courses-page > h1");
    if (coursesHeading && scrollMotionEnabled) {
        gsap.from(coursesHeading, {
            autoAlpha: 0,
            y: 18,
            duration: 0.62,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility"
        });
    }

    const observedCardGroups = [
        ["#university-directory", ".directory-card"],
        ["#university-programmes", ".programme-card"]
    ];
    observedCardGroups.forEach(([containerSelector, cardSelector]) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        revealCardsInBatches(container.querySelectorAll(cardSelector));
        new MutationObserver(records => {
            const addedCards = records.flatMap(record => [...record.addedNodes])
                .filter(node => node.nodeType === Node.ELEMENT_NODE)
                .flatMap(node => {
                    const found = node.matches?.(cardSelector) ? [node] : [];
                    if (node.querySelectorAll) found.push(...node.querySelectorAll(cardSelector));
                    return found;
                });
            revealCardsInBatches(addedCards);
            if (scrollMotionEnabled) requestAnimationFrame(() => {
                ScrollTrigger.getAll().forEach(trigger => {
                    if (trigger.trigger && !trigger.trigger.isConnected) trigger.kill();
                });
                ScrollTrigger.refresh();
            });
        }).observe(container, { childList: true });
    });
    if (scrollMotionEnabled) window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });

    // Search and carousel actions animate the newly visible university set.
    const universityTrack = document.querySelector("#university-track");
    if (universityTrack) {
        ["#next-university", "#previous-university"].forEach(selector => {
            document.querySelector(selector)?.addEventListener("click", () => {
                requestAnimationFrame(() => gsap.from(universityTrack.querySelectorAll(".university-card:not([hidden])"), {
                    autoAlpha: 0.72,
                    y: 10,
                    scale: 0.97,
                    duration: 0.34,
                    stagger: 0.045,
                    ease: "power2.out",
                    clearProps: "transform,opacity,visibility"
                }));
            });
        });
    }
    const searchForm = document.querySelector("#search-form");
    const siteSearch = document.querySelector("#site-search");
    const animateSearchResults = () => requestAnimationFrame(() => {
        const results = document.querySelectorAll(".university-card:not([hidden])");
        if (results.length) gsap.from(results, {
            autoAlpha: 0.72,
            y: 8,
            duration: 0.32,
            stagger: 0.045,
            ease: "power2.out",
            clearProps: "transform,opacity,visibility"
        });
    });
    searchForm?.addEventListener("submit", animateSearchResults);
    siteSearch?.addEventListener("input", () => {
        if (!siteSearch.value.trim()) animateSearchResults();
    });

    // Keep the recommendation progress steps lively as selections change.
    if (progress) {
        let changedSteps = new Set();
        let progressFrame = 0;
        new MutationObserver(records => {
            records.forEach(record => changedSteps.add(record.target));
            if (progressFrame) return;
            progressFrame = requestAnimationFrame(() => {
                changedSteps.forEach(step => {
                    const number = step.querySelector(".progress-number");
                    if (number) gsap.fromTo(number,
                        { scale: 0.78, rotate: -10 },
                        { scale: 1, rotate: 0, duration: 0.42, ease: "back.out(2)", clearProps: "transform" }
                    );
                });
                changedSteps = new Set();
                progressFrame = 0;
            });
        }).observe(progress, { subtree: true, attributes: true, attributeFilter: ["class", "aria-current"] });
    }

    // Subtle 3D tracking for programme cards; other cards get a clean lift.
    function programmeCardFrom(target) {
        return target instanceof Element
            ? target.closest(".programme-card[data-motion-flip-card]")
            : null;
    }

    const tiltFunctions = new WeakMap();
    const cardLiftSelector = ".feature-card, .university-card, .directory-card, .aps-university-card";

    function getTiltFunctions(card) {
        if (tiltFunctions.has(card)) return tiltFunctions.get(card);
        const functions = {
            x: gsap.quickTo(card, "rotationX", { duration: 0.26, ease: "power2.out" }),
            y: gsap.quickTo(card, "rotationY", { duration: 0.26, ease: "power2.out" }),
            lift: gsap.quickTo(card, "y", { duration: 0.26, ease: "power2.out" })
        };
        tiltFunctions.set(card, functions);
        return functions;
    }

    document.addEventListener("pointermove", event => {
        if (event.pointerType !== "mouse") return;
        const programmeCard = programmeCardFrom(event.target);
        if (programmeCard) {
            const rect = programmeCard.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            const tilt = getTiltFunctions(programmeCard);
            tilt.x(-y * 5);
            tilt.y(x * 5);
            tilt.lift(-3);
            gsap.to(programmeCard, { boxShadow: "0 0.8rem 1.5rem #233b3b35", duration: 0.24, overwrite: "auto" });
            return;
        }
    });

    function resetTilt(card) {
        const tilt = getTiltFunctions(card);
        tilt.x(0);
        tilt.y(0);
        tilt.lift(0);
        gsap.to(card, { boxShadow: "0 0.2rem 0.7rem #00000010", duration: 0.3, overwrite: "auto" });
    }

    function cardFromPointerTarget(target) {
        if (!(target instanceof Element)) return null;
        return programmeCardFrom(target) || target.closest(cardLiftSelector);
    }

    document.addEventListener("pointerover", event => {
        if (event.pointerType !== "mouse") return;
        const card = cardFromPointerTarget(event.target);
        if (!card || card.contains(event.relatedTarget)) return;
        if (card.matches(".programme-card")) return;
        gsap.to(card, { y: -4, scale: 1.018, boxShadow: "0 0.75rem 1.5rem #233b3b24", duration: 0.28, ease: "power2.out", overwrite: "auto" });
    });

    document.addEventListener("pointerout", event => {
        const card = cardFromPointerTarget(event.target);
        if (!card || card.contains(event.relatedTarget)) return;
        if (card.matches(".programme-card")) {
            resetTilt(card);
            return;
        }
        gsap.to(card, { y: 0, scale: 1, boxShadow: "0 0.2rem 0.7rem #00000010", duration: 0.3, ease: "power2.out", overwrite: "auto" });
    });

    document.addEventListener("focusin", event => {
        const card = cardFromPointerTarget(event.target);
        if (!card) return;
        if (card.matches(".programme-card")) {
            const tilt = getTiltFunctions(card);
            tilt.x(-1.2);
            tilt.y(1.2);
            tilt.lift(-2);
        } else {
            gsap.to(card, { y: -2, boxShadow: "0 0.55rem 1.2rem #233b3b20", duration: 0.22, overwrite: "auto" });
        }
    });

    document.addEventListener("focusout", event => {
        const card = cardFromPointerTarget(event.target);
        if (!card || card.contains(event.relatedTarget)) return;
        if (card.matches(".programme-card")) resetTilt(card);
        else gsap.to(card, { y: 0, scale: 1, boxShadow: "0 0.2rem 0.7rem #00000010", duration: 0.25, overwrite: "auto" });
    });

    // Buttons give a quick tactile response without delaying their action.
    document.addEventListener("pointerdown", event => {
        const button = event.target instanceof Element ? event.target.closest("button:not(:disabled)") : null;
        if (button) gsap.to(button, { scale: 0.965, duration: 0.1, ease: "power1.out", overwrite: "auto" });
    });
    ["pointerup", "pointercancel"].forEach(type => document.addEventListener(type, () => {
        gsap.to("button", { scale: 1, duration: 0.16, ease: "power2.out", overwrite: "auto" });
    }));

    // Animate menu links and chat contents when their panels open.
    document.querySelectorAll(".navigation").forEach(navigation => {
        new MutationObserver(() => {
            if (!navigation.classList.contains("open")) return;
            gsap.fromTo(navigation.querySelectorAll(".nav-link"),
                { autoAlpha: 0, x: 12 },
                { autoAlpha: 1, x: 0, duration: 0.28, stagger: 0.045, ease: "power2.out", clearProps: "transform,opacity,visibility" }
            );
        }).observe(navigation, { attributes: true, attributeFilter: ["class"] });
    });

    function watchChatPanel(chatPanel) {
        if (!chatPanel || chatPanel.dataset.motionObserved) return;
        chatPanel.dataset.motionObserved = "true";
        new MutationObserver(() => {
            if (!chatPanel.classList.contains("open")) return;
            gsap.fromTo([chatPanel.querySelector(".chat-header"), chatPanel.querySelector(".chat-messages"), chatPanel.querySelector(".chat-input")].filter(Boolean),
                { autoAlpha: 0, y: 10 },
                { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.055, ease: "power2.out", clearProps: "transform,opacity,visibility" }
            );
        }).observe(chatPanel, { attributes: true, attributeFilter: ["class"] });
    }

    const existingChatPanel = document.querySelector(".chat-panel");
    if (existingChatPanel) watchChatPanel(existingChatPanel);
    else {
        const assistantObserver = new MutationObserver(() => {
            const chatPanel = document.querySelector(".chat-panel");
            if (!chatPanel) return;
            watchChatPanel(chatPanel);
            assistantObserver.disconnect();
        });
        assistantObserver.observe(document.body, { childList: true, subtree: true });
    }

    console.info("UniCompanion GSAP motion is active.");
})();
