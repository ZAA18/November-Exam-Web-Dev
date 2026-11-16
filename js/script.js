// /* ==========================================
//    UNICOMPANION - HOMEPAGE JAVASCRIPT
// ========================================== */


// /* ==========================================
//    1. PAGE LOADING STATE
// ========================================== */

// const loader = document.getElementById("loader");

// window.addEventListener("load", () => {

//     setTimeout(() => {
//         loader.classList.add("hidden");
//     }, 500);

// });

// // Fallback in case an external image takes too long
// setTimeout(() => {
//     loader.classList.add("hidden");
// }, 3000);


// /* ==========================================
//    2. MOBILE NAVIGATION
// ========================================== */

// const menuToggle = document.getElementById("menu-toggle");
// const navigation = document.getElementById("navigation");

// menuToggle.addEventListener("click", () => {

//     const isOpen = navigation.classList.toggle("open");

//     menuToggle.setAttribute("aria-expanded", isOpen);

//     menuToggle.setAttribute(
//         "aria-label",
//         isOpen ? "Close navigation" : "Open navigation"
//     );

// });


// // Close navigation after clicking a link

// const navigationLinks = document.querySelectorAll(".nav-link");

// navigationLinks.forEach(link => {

//     link.addEventListener("click", () => {

//         navigation.classList.remove("open");

//         menuToggle.setAttribute("aria-expanded", "false");

//         navigationLinks.forEach(navLink => {
//             navLink.classList.remove("active");
//         });

//         link.classList.add("active");

//     });

// });


// /* ==========================================
//    3. UNIVERSITY CAROUSEL
// ========================================== */

// const universityTrack = document.getElementById("university-track");

// const previousButton = document.getElementById("previous-university");
// const nextButton = document.getElementById("next-university");


// nextButton.addEventListener("click", () => {

//     const firstCard = universityTrack.firstElementChild;

//     if (firstCard) {

//         universityTrack.appendChild(firstCard);

//     }

// });


// previousButton.addEventListener("click", () => {

//     const lastCard = universityTrack.lastElementChild;

//     if (lastCard) {

//         universityTrack.prepend(lastCard);

//     }

// });


// /* ==========================================
//    4. WEBSITE SEARCH
// ========================================== */

// const searchForm = document.getElementById("search-form");
// const searchInput = document.getElementById("site-search");

// searchForm.addEventListener("submit", (event) => {

//     event.preventDefault();

//     const searchValue = searchInput.value.trim().toLowerCase();

//     if (!searchValue) {
//         return;
//     }

//     const universityCards = document.querySelectorAll(".university-card");

//     let resultsFound = 0;

//     universityCards.forEach(card => {

//         const universityName = card.textContent.toLowerCase();

//         const matches = universityName.includes(searchValue);

//         card.hidden = !matches;

//         if (matches) {
//             resultsFound++;
//         }

//     });

//     document.getElementById("universities").scrollIntoView({
//         behavior: "smooth"
//     });

//     if (resultsFound === 0) {

//         alert("No matching universities found.");

//     }

// });


// // Restore university cards when the search is cleared

// searchInput.addEventListener("input", () => {

//     if (searchInput.value.trim() === "") {

//         document.querySelectorAll(".university-card").forEach(card => {
//             card.hidden = false;
//         });

//     }

// });


// /* ==========================================
//    5. CHATBOT OPEN AND CLOSE
// ========================================== */

// const chatLauncher = document.getElementById("chat-launcher");

// const chatPanel = document.getElementById("chat-panel");

// const closeChatButton = document.getElementById("close-chat");

// const openChatButton = document.getElementById("open-chat");


// function openChat() {

//     chatPanel.classList.add("open");

//     chatPanel.setAttribute("aria-hidden", "false");

//     chatLauncher.setAttribute("aria-expanded", "true");

//     document.getElementById("chat-message").focus();

// }


// function closeChat() {

//     chatPanel.classList.remove("open");

//     chatPanel.setAttribute("aria-hidden", "true");

//     chatLauncher.setAttribute("aria-expanded", "false");

// }


// // Floating chatbot button

// chatLauncher.addEventListener("click", () => {

//     if (chatPanel.classList.contains("open")) {

//         closeChat();

//     } else {

//         openChat();

//     }

// });


// // Close button

// closeChatButton.addEventListener("click", closeChat);


// // Open chatbot from the feature card

// openChatButton.addEventListener("click", openChat);


// // Close chatbot with Escape

// document.addEventListener("keydown", (event) => {

//     if (event.key === "Escape" && chatPanel.classList.contains("open")) {

//         closeChat();

//         chatLauncher.focus();

//     }

// });


// /* ==========================================
//    6. CHAT MESSAGE INTERACTION
// ========================================== */

// const chatForm = document.getElementById("chat-form");

// const chatInput = document.getElementById("chat-message");

// const chatMessages = document.getElementById("chat-messages");


// chatForm.addEventListener("submit", (event) => {

//     event.preventDefault();

//     const message = chatInput.value.trim();

//     if (!message) {
//         return;
//     }


//     // Create the user's message

//     const userMessage = document.createElement("div");

//     userMessage.classList.add("user-message");

//     userMessage.textContent = message;

//     userMessage.style.cssText = `
//         align-self: flex-end;
//         background: #d9f3f3;
//         padding: 10px;
//         border-radius: 9px;
//         max-width: 90%;
//         font-size: 10px;
//         line-height: 1.5;
//     `;

//     chatMessages.appendChild(userMessage);


//     // Show connection information

//     const response = document.createElement("div");

//     response.classList.add("bot-message");

//     response.textContent =
//         "Thanks for your question! The Gemini AI connection still needs to be configured.";

//     chatMessages.appendChild(response);


//     // Clear input

//     chatInput.value = "";


//     // Scroll to latest message

//     chatMessages.scrollTop = chatMessages.scrollHeight;

// });


// /* ==========================================
//    7. INITIAL PAGE STATE
// ========================================== */

// document.addEventListener("DOMContentLoaded", () => {

//     console.log("UniCompanion homepage loaded successfully.");

// });