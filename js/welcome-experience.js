/* A book-themed first-visit welcome. Learner details stay in this tab only. */
(() => {
    "use strict";

    const profileKey = "unicomp:student-profile";
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function readProfile() {
        try {
            const profile = JSON.parse(sessionStorage.getItem(profileKey) || "null");
            if (!profile || typeof profile.name !== "string" || !profile.name.trim()) return null;
            if (!Number.isInteger(Number(profile.age)) || Number(profile.age) < 10 || Number(profile.age) > 120) return null;
            if (typeof profile.grade !== "string" || !profile.grade.trim()) return null;
            return { name: profile.name.trim(), age: Number(profile.age), grade: profile.grade.trim() };
        } catch (_) {
            return null;
        }
    }

    function showSession(profile) {
        const label = document.querySelector(".logo-text small");
        if (!label || !profile) return;
        label.textContent = `Session active · ${profile.name} · ${profile.grade}`;
        label.classList.add("student-session-active");
        label.title = `This browser-tab session is for ${profile.name}, age ${profile.age}, ${profile.grade}.`;
    }

    function initializeWelcomeExperience() {
        let profile = readProfile();
        if (profile) showSession(profile);

        const experience = document.getElementById("welcome-experience");
        if (!experience) return;
        if (profile) {
            experience.remove();
            return;
        }

        const startButton = document.getElementById("welcome-start");
        const cover = document.getElementById("welcome-book-cover");
        const pages = document.getElementById("welcome-book-pages");
        const formPanel = document.getElementById("student-welcome-form");
        const nameInput = document.getElementById("student-name");
        const ageInput = document.getElementById("student-age");
        const gradeSelect = document.getElementById("student-grade");
        const formError = document.getElementById("welcome-form-error");
        const submitButton = document.getElementById("welcome-submit");
        const finale = document.getElementById("welcome-finale");
        const finaleHeading = document.getElementById("welcome-finale-heading");
        const finaleSubtitle = document.getElementById("welcome-finale-subtitle");
        if (formPanel) formPanel.noValidate = true;

        document.body.classList.add("welcome-active");
        startButton?.focus({ preventScroll: true });

        experience.addEventListener("keydown", event => {
            if (event.key !== "Tab") return;
            const focusable = [...experience.querySelectorAll("button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")]
                .filter(element => element.getClientRects().length && !element.closest("[hidden]") && !element.closest("[inert]"));
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === experience)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        const openBook = () => {
            if (startButton.disabled) return;
            startButton.disabled = true;
            startButton.setAttribute("aria-expanded", "true");
            experience.classList.add("lights-on", "book-open");
            pages?.removeAttribute("aria-hidden");
            if (pages) pages.inert = false;
            if (formPanel) {
                formPanel.hidden = false;
                formPanel.inert = true;
            }
            if (cover) {
                cover.setAttribute("aria-hidden", "true");
                cover.inert = true;
                cover.style.pointerEvents = "none";
            }
            experience.setAttribute("aria-labelledby", "welcome-form-heading");

            if (!reduceMotion && window.gsap) {
                const beams = experience.querySelector(".welcome-light-beams");
                if (beams) window.gsap.fromTo(beams, { opacity: 0 }, { opacity: 1, duration: .8, ease: "sine.out" });
            }

            window.setTimeout(() => {
                if (pages) pages.inert = false;
                if (formPanel) formPanel.inert = false;
                nameInput.focus({ preventScroll: true });
            }, reduceMotion ? 0 : 1000);
        };

        startButton?.addEventListener("click", openBook);
        cover?.addEventListener("click", event => {
            if (event.target instanceof Element && event.target.closest("button")) return;
            openBook();
        });

        formPanel?.addEventListener("input", () => {
            formError.hidden = true;
            nameInput.setCustomValidity("");
        });

        function finishWelcome() {
            experience.remove();
            document.body.classList.remove("welcome-active");
            document.querySelector(".nav-link.active")?.focus({ preventScroll: true });
            window.UniCompanionMotion?.revealResponse(document.querySelector(".hero-content"));
        }

        formPanel?.addEventListener("submit", event => {
            event.preventDefault();
            nameInput.value = nameInput.value.trim();
            nameInput.setCustomValidity(nameInput.value.length < 2 ? "Please enter at least two characters for your name." : "");
            if (!formPanel.reportValidity()) {
                formError.textContent = "Please complete your name, age and current grade or stage to continue.";
                formError.hidden = false;
                return;
            }

            profile = {
                name: nameInput.value,
                age: Number(ageInput.value),
                grade: gradeSelect.value
            };
            try {
                sessionStorage.setItem(profileKey, JSON.stringify(profile));
            } catch (_) {
                // The current visit still works if browser storage is unavailable.
            }
            showSession(profile);
            window.dispatchEvent(new CustomEvent("unicomp:student-profile-updated", { detail: profile }));

            submitButton.disabled = true;
            submitButton.setAttribute("aria-busy", "true");
            formPanel.inert = true;
            pages.inert = true;
            finaleHeading.textContent = `Welcome, ${profile.name}!`;
            finaleSubtitle.textContent = `${profile.grade} · Your next chapter starts now.`;
            finale.hidden = false;
            finale.focus({ preventScroll: true });
            experience.setAttribute("aria-labelledby", "welcome-finale-heading");
            experience.classList.add("is-transitioning");

            if (!reduceMotion && window.gsap) {
                const gsap = window.gsap;
                const orbit = finale.querySelector(".welcome-finale-orbit");
                const mark = finale.querySelector("img");
                gsap.set(experience, { clipPath: "circle(150% at 50% 50%)" });
                gsap.timeline({ onComplete: finishWelcome })
                    .to(book, { autoAlpha: 0, scale: .68, y: -35, rotateY: 18, filter: "blur(8px)", duration: .5, ease: "power3.in" })
                    .fromTo(finale, { autoAlpha: 0, scale: .72, clipPath: "circle(18% at 50% 48%)" }, { autoAlpha: 1, scale: 1, clipPath: "circle(100% at 50% 48%)", duration: .88, ease: "power3.out" }, "-=.12")
                    .fromTo(mark, { scale: .25, rotate: -45 }, { scale: 1, rotate: 0, duration: .72, ease: "back.out(1.8)" }, "-=.54")
                    .fromTo([finale.querySelector("p"), finaleHeading, finaleSubtitle], { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: .48, stagger: .1, ease: "power3.out" }, "-=.42")
                    .to(orbit, { rotate: 180, scale: 1.16, duration: 1.25, ease: "power2.out" }, "<")
                    .to(experience, { clipPath: "circle(0% at 50% 50%)", duration: .85, delay: .45, ease: "power4.inOut" });
            } else {
                window.setTimeout(finishWelcome, 700);
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeWelcomeExperience, { once: true });
    } else {
        initializeWelcomeExperience();
    }

    window.addEventListener("unicomp:student-profile-updated", event => showSession(event.detail));
})();
