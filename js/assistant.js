/* =========================================
   UNICOMPANION — SHARED AI ASSISTANT
   Reusable across all website pages
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================
       1. PREVENT DUPLICATE ASSISTANTS
    ===================================== */

    if (document.getElementById("chat-launcher")) {
        return;
    }


    /* =====================================
       2. CREATE ASSISTANT HTML
    ===================================== */

    const assistantHTML = `

        <!-- FLOATING AI LAUNCHER -->

        <button class="chat-launcher"
            id="chat-launcher"
            aria-label="Open UniCompanion AI assistant"
            aria-expanded="false"
            aria-controls="chat-panel"
            title="Drag to move; click to open the assistant">

            <span class="chat-launcher-icon">🤖</span>

            <span class="chat-launcher-text">

                <strong>Ask UniCompanion AI</strong>

                <small>How can I help you today?</small>

            </span>

        </button>


        <!-- CHAT WINDOW -->

        <section class="chat-panel"
            id="chat-panel"
            aria-label="UniCompanion AI chat"
            aria-hidden="true">

            <div class="chat-header">

                <div>

                    <strong>🤖 UniCompanion AI</strong>

                    <small>Your university guide</small>

                </div>

                <button id="close-chat"
                    type="button"
                    aria-label="Close chatbot">

                    ×

                </button>

            </div>


            <!-- CHAT MESSAGES -->

            <div class="chat-messages"
                id="chat-messages"
                aria-live="polite">

                <div class="bot-message">

                    Hi! Welcome to UniCompanion.

                    I'm here to help you with university applications,
                    APS calculations and finding courses.

                    What would you like to know?

                </div>

            </div>


            <!-- CHAT INPUT -->

            <form class="chat-input" id="chat-form">

                <label for="chat-message" class="sr-only">

                    Enter your message

                </label>

                <input type="text"
                    id="chat-message"
                    placeholder="Ask me anything..."
                    autocomplete="off">

                <button type="submit"
                    aria-label="Send message">

                    ➤

                </button>

            </form>

        </section>

    `;


    /* =====================================
       3. INSERT ASSISTANT INTO PAGE
    ===================================== */

    document.body.insertAdjacentHTML(
        "beforeend",
        assistantHTML
    );


    /* =====================================
       4. GET HTML ELEMENTS
    ===================================== */

    const launcher = document.getElementById("chat-launcher");

    const panel = document.getElementById("chat-panel");

    const closeButton = document.getElementById("close-chat");

    const chatForm = document.getElementById("chat-form");

    const chatInput = document.getElementById("chat-message");

    const chatMessages = document.getElementById("chat-messages");

    const homepageOpenButton = document.getElementById("open-chat");


    /* =====================================
       5. HELPER FUNCTION
    ===================================== */

    function clamp(value, min, max) {

        return Math.min(
            Math.max(value, min),
            Math.max(min, max)
        );

    }


    /* =====================================
       6. POSITION CHAT WINDOW
    ===================================== */

    function positionChatPanel() {

        if (!panel.classList.contains("open")) {
            return;
        }

        const launcherRect = launcher.getBoundingClientRect();

        const panelRect = panel.getBoundingClientRect();

        const margin = 12;

        const gap = 12;


        let left =
            launcherRect.left +
            launcherRect.width -
            panelRect.width;


        let top =
            launcherRect.top -
            panelRect.height -
            gap;


        // If there is insufficient space above,
        // place the chat window below the launcher.

        if (top < margin) {

            top = launcherRect.bottom + gap;

        }


        left = clamp(
            left,
            margin,
            window.innerWidth - panelRect.width - margin
        );


        top = clamp(
            top,
            margin,
            window.innerHeight - panelRect.height - margin
        );


        panel.style.left = `${left}px`;

        panel.style.top = `${top}px`;

        panel.style.right = "auto";

        panel.style.bottom = "auto";

    }


    /* =====================================
       7. OPEN ASSISTANT
    ===================================== */

    function openChat() {

        panel.classList.add("open");

        panel.setAttribute("aria-hidden", "false");

        launcher.setAttribute("aria-expanded", "true");


        requestAnimationFrame(() => {

            positionChatPanel();

            chatInput.focus();

        });

    }


    /* =====================================
       8. CLOSE ASSISTANT
    ===================================== */

    function closeChat() {

        panel.classList.remove("open");

        panel.setAttribute("aria-hidden", "true");

        launcher.setAttribute("aria-expanded", "false");


        panel.style.left = "";

        panel.style.top = "";

        panel.style.right = "";

        panel.style.bottom = "";

    }


    /* =====================================
       9. LAUNCHER CLICK
    ===================================== */

    let suppressNextClick = false;

    launcher.addEventListener("click", () => {

        if (suppressNextClick) {

            suppressNextClick = false;

            return;

        }


        if (panel.classList.contains("open")) {

            closeChat();

        } else {

            openChat();

        }

    });


    /* =====================================
       10. CLOSE BUTTON
    ===================================== */

    closeButton.addEventListener("click", closeChat);


    /* =====================================
       11. HOMEPAGE AI GUIDANCE BUTTON
    ===================================== */

    homepageOpenButton?.addEventListener("click", openChat);


    /* =====================================
       12. ESCAPE KEY
    ===================================== */

    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" &&
            panel.classList.contains("open")
        ) {

            closeChat();

            launcher.focus();

        }

    });


    /* =====================================
       13. DRAGGING VARIABLES
    ===================================== */

    let pointerStartX = 0;

    let pointerStartY = 0;

    let launcherStartX = 0;

    let launcherStartY = 0;

    let isDragging = false;


    /* =====================================
       14. START DRAGGING
    ===================================== */

    launcher.addEventListener("pointerdown", event => {

        if (!event.isPrimary || event.button !== 0) {
            return;
        }


        const rect = launcher.getBoundingClientRect();


        pointerStartX = event.clientX;

        pointerStartY = event.clientY;

        launcherStartX = rect.left;

        launcherStartY = rect.top;

        isDragging = false;


        launcher.style.left = `${rect.left}px`;

        launcher.style.top = `${rect.top}px`;

        launcher.style.right = "auto";

        launcher.style.bottom = "auto";


        launcher.setPointerCapture(event.pointerId);

    });


    /* =====================================
       15. MOVE THE LAUNCHER
    ===================================== */

    launcher.addEventListener("pointermove", event => {

        if (!launcher.hasPointerCapture(event.pointerId)) {
            return;
        }


        const deltaX = event.clientX - pointerStartX;

        const deltaY = event.clientY - pointerStartY;


        if (
            Math.abs(deltaX) > 5 ||
            Math.abs(deltaY) > 5
        ) {

            isDragging = true;

        }


        if (!isDragging) {
            return;
        }


        const rect = launcher.getBoundingClientRect();


        const maxLeft =
            window.innerWidth - rect.width - 8;

        const maxTop =
            window.innerHeight - rect.height - 8;


        const newLeft = clamp(
            launcherStartX + deltaX,
            8,
            maxLeft
        );


        const newTop = clamp(
            launcherStartY + deltaY,
            8,
            maxTop
        );


        launcher.style.left = `${newLeft}px`;

        launcher.style.top = `${newTop}px`;


        positionChatPanel();

    });


    /* =====================================
       16. FINISH DRAGGING
    ===================================== */

    function finishDragging(event) {

        if (launcher.hasPointerCapture(event.pointerId)) {

            launcher.releasePointerCapture(event.pointerId);

        }


        if (isDragging) {

            suppressNextClick = true;

            positionChatPanel();

        }

        isDragging = false;

    }


    launcher.addEventListener("pointerup", finishDragging);

    launcher.addEventListener("pointercancel", finishDragging);


    /* =====================================
       17. RESPONSIVE POSITIONING
    ===================================== */

    window.addEventListener("resize", () => {

        const rect = launcher.getBoundingClientRect();

        const maxLeft = window.innerWidth - rect.width - 8;

        const maxTop = window.innerHeight - rect.height - 8;


        launcher.style.left = `${clamp(rect.left, 8, maxLeft)}px`;

        launcher.style.top = `${clamp(rect.top, 8, maxTop)}px`;

        launcher.style.right = "auto";

        launcher.style.bottom = "auto";


        positionChatPanel();

    });


    window.addEventListener("scroll", positionChatPanel, {
        passive: true
    });


  /* =====================================
   18. SEND CHAT MESSAGE TO GEMINI
===================================== */

// Stores the conversation so the assistant
// can understand follow-up questions.
const conversationHistory = [{
    role: "model",
    parts: [{ text: "Hi! Welcome to UniCompanion. I'm here to help you with university applications, APS calculations and finding courses. What would you like to know?" }]
}];

function getAssistantResponseText(response) {

    if (typeof response === "string") {
        return response;
    }

    if (response && typeof response.text === "string") {
        return response.text;
    }

    if (response && typeof response.response === "string") {
        return response.response;
    }

    if (response?.candidates?.[0]?.content?.parts) {
        return response.candidates[0].content.parts
            .map(part => part.text || "")
            .join("\n");
    }

    throw new Error("Unexpected Gemini response.");
}

function formatAssistantResponse(text, isFollowUp) {
    let formatted = String(text || "")
        .replace(/\r\n?/g, "\n")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1 ($2)")
        .split("\n")
        .map(line => {
            let clean = line
                .replace(/^\s{0,3}#{1,6}\s*/, "")
                .replace(/^\s*>\s?/, "")
                .replace(/^\s*[*+-]\s+/, "\u2022 ")
                .replace(/\*\*/g, "")
                .replace(/__/g, "")
                .replace(/`+/g, "")
                .replace(/\*/g, "");
            if (/^\s*[-_]{3,}\s*$/.test(clean)) return "";
            return clean;
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    // Avoid repeating a greeting when the initial welcome is already in the chat.
    if (isFollowUp) {
        formatted = formatted.replace(/^(?:hi|hello|hey)(?:\s+there)?\b[!,.:]?\s*/i, "");
        formatted = formatted.replace(/^(?:good\s+(?:morning|afternoon|evening)|greetings|welcome\s+back)\b[!,.:]?\s*/i, "");
        formatted = formatted.replace(/^welcome\s+to\s+unicomp\w*\b[!,.:]?\s*/i, "");
    }
    return formatted;
}

function addChatMessage(message, className) {

    const element = document.createElement("div");

    element.className = className;

    // textContent prevents AI output from being
    // interpreted as HTML.
    element.textContent = message;

    chatMessages.appendChild(element);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return element;
}

chatForm.addEventListener("submit", async event => {

    event.preventDefault();

    const message = chatInput.value.trim();

    if (!message) {
        return;
    }

    // Check Gemini connection.
    if (!window.UniCompanionGemini?.chat) {

        addChatMessage(
            "The AI service is not connected yet. Please check the Gemini configuration.",
            "bot-message"
        );

        return;
    }

    // Display the user's message.
    addChatMessage(message, "user-message");

    // Clear input.
    chatInput.value = "";

    // Prevent duplicate requests.
    chatInput.disabled = true;

    const sendButton = chatForm.querySelector(
        'button[type="submit"]'
    );

    if (sendButton) {
        sendButton.disabled = true;
    }

    // Announce that the response is in progress and show animated typing dots.
    const loadingMessage = document.createElement("div");
    loadingMessage.className = "bot-message typing-indicator";
    loadingMessage.setAttribute("role", "status");
    const typingLabel = document.createElement("span");
    typingLabel.className = "sr-only";
    typingLabel.textContent = "UniCompanion is typing";
    loadingMessage.append(typingLabel);
    for (let dot = 0; dot < 3; dot += 1) {
        const element = document.createElement("span");
        element.className = "typing-dot";
        element.setAttribute("aria-hidden", "true");
        loadingMessage.append(element);
    }
    chatMessages.setAttribute("aria-busy", "true");
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {

        // Ask Gemini using the shared service.
        const response = await window.UniCompanionGemini.chat(
            message,
            conversationHistory
        );

        const answer = formatAssistantResponse(
            getAssistantResponseText(response),
            conversationHistory.length > 0
        );

        loadingMessage.classList.remove("typing-indicator");
        loadingMessage.textContent = answer;
        window.UniCompanionMotion?.revealResponse(loadingMessage);

        // Save both messages for follow-up questions.
        conversationHistory.push(
            {
                role: "user",
                parts: [{ text: message }]
            },
            {
                role: "model",
                parts: [{ text: answer }]
            }
        );

    } catch (error) {

        console.error("Gemini assistant error:", error);

        loadingMessage.classList.remove("typing-indicator");
        loadingMessage.textContent =
            "I'm having trouble connecting right now. Please try again shortly.";
        window.UniCompanionMotion?.revealResponse(loadingMessage);

    } finally {

        chatMessages.setAttribute("aria-busy", "false");

        chatInput.disabled = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        chatInput.focus();

        chatMessages.scrollTop = chatMessages.scrollHeight;

    }

});


    console.log("UniCompanion shared AI assistant loaded.");

});
