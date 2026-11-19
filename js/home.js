


/* =========================================
   UNICOMPANION — HOMEPAGE JAVASCRIPT
   Homepage functionality only
========================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =====================================
       1. PAGE LOADING
    ===================================== */

    const loader = document.getElementById("loader");


    const hideLoader = () => {

        loader?.classList.add("hidden");

    };


    window.addEventListener("load", hideLoader, {
        once: true
    });


    // Keep the startup state brief so it never traps users away from the nav.
    window.setTimeout(hideLoader, 700);



    /* =====================================
       2. UNIVERSITY CAROUSEL
    ===================================== */

    const universityTrack =
        document.getElementById("university-track");


    const previousButton =
        document.getElementById("previous-university");


    const nextButton =
        document.getElementById("next-university");


    // NEXT UNIVERSITY

    nextButton?.addEventListener("click", () => {

        if (universityTrack?.firstElementChild) {

            universityTrack.append(
                universityTrack.firstElementChild
            );

        }

    });


    // PREVIOUS UNIVERSITY

    previousButton?.addEventListener("click", () => {

        if (universityTrack?.lastElementChild) {

            universityTrack.prepend(
                universityTrack.lastElementChild
            );

        }

    });



    /* =====================================
       3. HOMEPAGE UNIVERSITY SEARCH
    ===================================== */

    const searchForm =
        document.getElementById("search-form");


    const searchInput =
        document.getElementById("site-search");


    searchForm?.addEventListener("submit", event => {

        event.preventDefault();


        const query =
            searchInput?.value.trim().toLowerCase();


        if (!query) {
            return;
        }


        const cards = [
            ...document.querySelectorAll(".university-card")
        ];


        let matches = 0;


        cards.forEach(card => {

            const isMatch =
                card.textContent.toLowerCase().includes(query);


            card.hidden = !isMatch;


            if (isMatch) {
                matches++;
            }

        });


        document.getElementById("universities")?.scrollIntoView({

            behavior: "smooth",

            block: "start"

        });


        if (!matches) {

            window.alert(
                "No matching universities found. Try another search."
            );

        }

    });



    /* =====================================
       4. RESTORE UNIVERSITY CARDS
       WHEN SEARCH IS CLEARED
    ===================================== */

    searchInput?.addEventListener("input", () => {

        if (!searchInput.value.trim()) {

            document.querySelectorAll(".university-card").forEach(card => {

                card.hidden = false;

            });

        }

    });



    /* =====================================
       5. HOMEPAGE INITIALISATION
    ===================================== */

    console.log("UniCompanion homepage loaded successfully.");

});
// /* =========================================
//    UNICOMPANION — HOMEPAGE JAVASCRIPT
// ========================================= */

// document.addEventListener("DOMContentLoaded", () => {


//     /* =====================================
//        1. PAGE LOADING
//     ===================================== */

//     const loader = document.getElementById("loader");

//     const hideLoader = () => {

//         loader?.classList.add("hidden");

//     };

//     window.addEventListener("load", hideLoader, {
//         once: true
//     });

//     // Fallback if loading takes too long

//     window.setTimeout(hideLoader, 2500);



//     /* =====================================
//        2. UNIVERSITY CAROUSEL
//     ===================================== */

//     const universityTrack = document.getElementById("university-track");

//     const previousButton = document.getElementById("previous-university");

//     const nextButton = document.getElementById("next-university");


//     // Next University

//     nextButton?.addEventListener("click", () => {

//         if (universityTrack?.firstElementChild) {

//             universityTrack.append(
//                 universityTrack.firstElementChild
//             );

//         }

//     });


//     // Previous University

//     previousButton?.addEventListener("click", () => {

//         if (universityTrack?.lastElementChild) {

//             universityTrack.prepend(
//                 universityTrack.lastElementChild
//             );

//         }

//     });



//     /* =====================================
//        3. WEBSITE SEARCH
//     ===================================== */

//     const searchForm = document.getElementById("search-form");

//     const searchInput = document.getElementById("site-search");


//     searchForm?.addEventListener("submit", event => {

//         event.preventDefault();

//         const query = searchInput?.value.trim().toLowerCase();

//         if (!query) {
//             return;
//         }


//         const cards = [
//             ...document.querySelectorAll(".university-card")
//         ];

//         let matches = 0;


//         cards.forEach(card => {

//             const isMatch = card.textContent
//                 .toLowerCase()
//                 .includes(query);

//             card.hidden = !isMatch;

//             if (isMatch) {
//                 matches++;
//             }

//         });


//         document.getElementById("universities")?.scrollIntoView({

//             behavior: "smooth",

//             block: "start"

//         });


//         if (!matches) {

//             window.alert(
//                 "No matching universities found. Try another search."
//             );

//         }

//     });


//     // Restore cards when search is cleared

//     searchInput?.addEventListener("input", () => {

//         if (!searchInput.value.trim()) {

//             document.querySelectorAll(".university-card")
//                 .forEach(card => {

//                     card.hidden = false;

//                 });

//         }

//     });



//     /* =====================================
//        4. AI CHATBOT ELEMENTS
//     ===================================== */

//     const chatLauncher = document.getElementById("chat-launcher");

//     const chatPanel = document.getElementById("chat-panel");

//     const closeChatButton = document.getElementById("close-chat");

//     const openChatButton = document.getElementById("open-chat");

//     const chatInput = document.getElementById("chat-message");


//     if (!chatLauncher || !chatPanel) {
//         return;
//     }


//     /* =====================================
//        5. CHAT PANEL POSITIONING
//     ===================================== */

//     let dragged = false;

//     let suppressNextClick = false;

//     let pointerStartX = 0;

//     let pointerStartY = 0;

//     let launcherStartX = 0;

//     let launcherStartY = 0;


//     // Keep the assistant inside the screen

//     const clamp = (value, min, max) => {

//         return Math.min(
//             Math.max(value, min),
//             max
//         );

//     };


//     // Position the chatbot near its floating launcher

//     const positionChatPanel = () => {

//         if (!chatPanel.classList.contains("open")) {
//             return;
//         }


//         const launcherRect = chatLauncher.getBoundingClientRect();

//         const panelRect = chatPanel.getBoundingClientRect();

//         const margin = 12;

//         const gap = 12;


//         let left = launcherRect.left
//             + launcherRect.width
//             - panelRect.width;

//         let top = launcherRect.top
//             - panelRect.height
//             - gap;


//         // If there is insufficient space above,
//         // display the chatbot below the launcher.

//         if (top < margin) {

//             top = launcherRect.bottom + gap;

//         }


//         // Prevent the chat window from leaving the screen

//         left = clamp(
//             left,
//             margin,
//             window.innerWidth - panelRect.width - margin
//         );

//         top = clamp(
//             top,
//             margin,
//             window.innerHeight - panelRect.height - margin
//         );


//         chatPanel.style.left = `${left}px`;

//         chatPanel.style.top = `${top}px`;

//         chatPanel.style.right = "auto";

//         chatPanel.style.bottom = "auto";

//     };



//     /* =====================================
//        6. OPEN CHATBOT
//     ===================================== */

//     const openChat = () => {

//         chatPanel.classList.add("open");

//         chatPanel.setAttribute("aria-hidden", "false");

//         chatLauncher.setAttribute("aria-expanded", "true");


//         requestAnimationFrame(positionChatPanel);


//         window.setTimeout(() => {

//             chatInput?.focus();

//         }, 180);

//     };



//     /* =====================================
//        7. CLOSE CHATBOT
//     ===================================== */

//     const closeChat = () => {

//         chatPanel.classList.remove("open");

//         chatPanel.setAttribute("aria-hidden", "true");

//         chatLauncher.setAttribute("aria-expanded", "false");


//         chatPanel.style.left = "";

//         chatPanel.style.top = "";

//         chatPanel.style.right = "";

//         chatPanel.style.bottom = "";

//     };



//     /* =====================================
//        8. CHAT LAUNCHER CLICK
//     ===================================== */

//     chatLauncher.addEventListener("click", () => {

//         if (suppressNextClick) {

//             suppressNextClick = false;

//             return;

//         }


//         if (chatPanel.classList.contains("open")) {

//             closeChat();

//         } else {

//             openChat();

//         }

//     });


//     // Close Button

//     closeChatButton?.addEventListener("click", closeChat);


//     // Open From Feature Card

//     openChatButton?.addEventListener("click", openChat);



//     /* =====================================
//        9. CLOSE CHAT WITH ESCAPE
//     ===================================== */

//     document.addEventListener("keydown", event => {

//         if (
//             event.key === "Escape" &&
//             chatPanel.classList.contains("open")
//         ) {

//             closeChat();

//             chatLauncher.focus();

//         }

//     });



//     /* =====================================
//        10. RESPONSIVE CHAT POSITIONING
//     ===================================== */

//     window.addEventListener("resize", positionChatPanel);

//     window.addEventListener("scroll", positionChatPanel, {
//         passive: true
//     });



//     /* =====================================
//        11. DRAGGABLE AI ASSISTANT
//     ===================================== */

//     chatLauncher.addEventListener("pointerdown", event => {

//         // Only respond to the main mouse button

//         if (event.button !== 0) {
//             return;
//         }


//         const rect = chatLauncher.getBoundingClientRect();


//         // Record starting pointer position

//         pointerStartX = event.clientX;

//         pointerStartY = event.clientY;


//         // Record starting launcher position

//         launcherStartX = rect.left;

//         launcherStartY = rect.top;


//         dragged = false;


//         // Switch from right/bottom positioning
//         // to direct screen positioning.

//         chatLauncher.style.left = `${rect.left}px`;

//         chatLauncher.style.top = `${rect.top}px`;

//         chatLauncher.style.right = "auto";

//         chatLauncher.style.bottom = "auto";


//         // Capture pointer for smooth dragging

//         chatLauncher.setPointerCapture(event.pointerId);

//     });



//     // Move AI Assistant

//     chatLauncher.addEventListener("pointermove", event => {

//         if (!chatLauncher.hasPointerCapture(event.pointerId)) {
//             return;
//         }


//         const deltaX = event.clientX - pointerStartX;

//         const deltaY = event.clientY - pointerStartY;


//         // Ignore tiny movements so normal clicks still work

//         if (
//             Math.abs(deltaX) > 5 ||
//             Math.abs(deltaY) > 5
//         ) {

//             dragged = true;

//         }


//         if (!dragged) {
//             return;
//         }


//         const rect = chatLauncher.getBoundingClientRect();


//         const maxLeft = window.innerWidth - rect.width - 8;

//         const maxTop = window.innerHeight - rect.height - 8;


//         // Calculate new position

//         const newLeft = clamp(
//             launcherStartX + deltaX,
//             8,
//             maxLeft
//         );

//         const newTop = clamp(
//             launcherStartY + deltaY,
//             8,
//             maxTop
//         );


//         // Apply new position

//         chatLauncher.style.left = `${newLeft}px`;

//         chatLauncher.style.top = `${newTop}px`;


//         // Keep chatbot window near the launcher

//         positionChatPanel();

//     });



//     /* =====================================
//        12. FINISH DRAGGING
//     ===================================== */

//     const finishDragging = event => {

//         if (chatLauncher.hasPointerCapture(event.pointerId)) {

//             chatLauncher.releasePointerCapture(event.pointerId);

//         }


//         if (dragged) {

//             // Prevent dragging from opening the chatbot

//             suppressNextClick = true;

//             positionChatPanel();

//         }

//     };


//     chatLauncher.addEventListener("pointerup", finishDragging);

//     chatLauncher.addEventListener("pointercancel", finishDragging);



//     /* =====================================
//        13. CHAT MESSAGE INTERACTION
//     ===================================== */

//     const chatForm = document.getElementById("chat-form");

//     const chatMessages = document.getElementById("chat-messages");


//     chatForm?.addEventListener("submit", event => {

//         event.preventDefault();


//         const message = chatInput?.value.trim();


//         if (!message || !chatMessages) {
//             return;
//         }


//         // Create user message

//         const userMessage = document.createElement("div");

//         userMessage.className = "user-message";

//         userMessage.textContent = message;

//         chatMessages.append(userMessage);



//         // Temporary AI response

//         const response = document.createElement("div");

//         response.className = "bot-message";

//         response.textContent =
//             "Thanks for your question! The Gemini AI connection still needs to be configured.";

//         chatMessages.append(response);



//         // Clear input

//         chatInput.value = "";



//         // Scroll to latest message

//         chatMessages.scrollTop = chatMessages.scrollHeight;

//         chatInput.focus();

//     });



//     /* =====================================
//        14. HOMEPAGE INITIALISED
//     ===================================== */

//     console.log("UniCompanion homepage loaded successfully.");

// });
