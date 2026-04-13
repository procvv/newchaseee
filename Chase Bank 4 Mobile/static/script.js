const installBanner = document.getElementById("installBanner");
const installButton = document.getElementById("installButton");
const installHelp = document.getElementById("installHelp");
const themeColorMeta = document.getElementById("themeColorMeta");
const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const storageKey = "chase-secure-card";
let deferredPrompt = null;

function syncThemeColor() {
    if (!themeColorMeta) {
        return;
    }

    themeColorMeta.setAttribute("content", darkModeQuery.matches ? "#08111d" : "#f3f7fc");
}

function showInstallBanner(message, canInstall) {
    if (!installBanner || !installButton || !installHelp) {
        return;
    }

    installHelp.textContent = message;
    installButton.disabled = !canInstall;
    installBanner.classList.remove("is-hidden");
}

function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isIosSafari() {
    const ua = window.navigator.userAgent;
    const isAppleMobile = /iPad|iPhone|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    return isAppleMobile && isSafari;
}

function registerInstallFlow() {
    if (isStandalone()) {
        return;
    }

    if (isIosSafari()) {
        showInstallBanner("On iPhone, tap Share, then Add to Home Screen.", false);
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event;
        showInstallBanner("Install Chase Secure for a full-screen home-screen experience.", true);
    });

    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        if (installBanner) {
            installBanner.classList.add("is-hidden");
        }
    });

    if (installButton) {
        installButton.addEventListener("click", async () => {
            if (!deferredPrompt) {
                return;
            }

            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installButton.disabled = true;
        });
    }
}

function registerThemeListener() {
    syncThemeColor();

    if (darkModeQuery.addEventListener) {
        darkModeQuery.addEventListener("change", syncThemeColor);
        return;
    }

    darkModeQuery.addListener(syncThemeColor);
}

function loadCardState() {
    const defaults = {
        number: "4921 6620 1948 1203",
        name: "JORDAN BANKS",
        hidden: false,
        x: 28,
        y: 42
    };

    try {
        return { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || "{}") };
    } catch {
        return defaults;
    }
}

function saveCardState(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
}

function maskCardNumber(number) {
    const groups = number.split(" ");
    if (groups.length < 4) {
        return "**** **** **** " + number.slice(-4).padStart(4, "*");
    }

    return "**** **** **** " + groups[groups.length - 1];
}

function formatCardNumber(value) {
    return value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function setupInteractiveCard() {
    const card = document.getElementById("bankCard");
    const stage = document.getElementById("cardStage");
    const controlsPanel = document.getElementById("cardControlsPanel");
    const numberDisplay = document.getElementById("cardNumberDisplay");
    const nameDisplay = document.getElementById("cardNameDisplay");
    const numberInput = document.getElementById("cardNumberInput");
    const nameInput = document.getElementById("cardNameInput");
    const toggleButton = document.getElementById("toggleCardNumber");

    if (!card || !stage || !controlsPanel || !numberDisplay || !nameDisplay || !numberInput || !nameInput || !toggleButton) {
        return;
    }

    const state = loadCardState();

    function applyState() {
        const formattedNumber = formatCardNumber(state.number);
        state.number = formattedNumber || "4921 6620 1948 1203";
        state.name = state.name.trim().toUpperCase() || "JORDAN BANKS";
        clampPosition(state.x, state.y);
        numberInput.value = state.number;
        nameInput.value = state.name;
        numberDisplay.textContent = state.hidden ? maskCardNumber(state.number) : state.number;
        nameDisplay.textContent = state.name;
        toggleButton.textContent = state.hidden ? "Show number" : "Hide number";
        card.style.left = `${state.x}px`;
        card.style.top = `${state.y}px`;
        saveCardState(state);
    }

    function clampPosition(nextX, nextY) {
        const maxX = Math.max(0, stage.clientWidth - card.offsetWidth);
        const maxY = Math.max(0, stage.clientHeight - card.offsetHeight);
        state.x = Math.min(Math.max(0, nextX), maxX);
        state.y = Math.min(Math.max(0, nextY), maxY);
    }

    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let movedCard = false;

    function activateEditor() {
        controlsPanel.classList.add("active");
        controlsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
        window.setTimeout(() => {
            numberInput.focus();
            numberInput.setSelectionRange(numberInput.value.length, numberInput.value.length);
        }, 180);
    }

    card.addEventListener("pointerdown", (event) => {
        dragOffsetX = event.clientX - card.offsetLeft;
        dragOffsetY = event.clientY - card.offsetTop;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        movedCard = false;
        card.classList.add("dragging");
        card.setPointerCapture(event.pointerId);
    });

    card.addEventListener("pointermove", (event) => {
        if (!card.classList.contains("dragging")) {
            return;
        }

        const stageRect = stage.getBoundingClientRect();
        if (Math.abs(event.clientX - pointerStartX) > 6 || Math.abs(event.clientY - pointerStartY) > 6) {
            movedCard = true;
        }
        clampPosition(event.clientX - stageRect.left - dragOffsetX, event.clientY - stageRect.top - dragOffsetY);
        card.style.left = `${state.x}px`;
        card.style.top = `${state.y}px`;
    });

    function endDrag() {
        if (!card.classList.contains("dragging")) {
            return;
        }

        card.classList.remove("dragging");
        saveCardState(state);

        if (!movedCard) {
            activateEditor();
        }
    }

    card.addEventListener("pointerup", endDrag);
    card.addEventListener("pointercancel", endDrag);

    toggleButton.addEventListener("click", () => {
        state.hidden = !state.hidden;
        applyState();
    });

    numberInput.addEventListener("input", (event) => {
        controlsPanel.classList.add("active");
        state.number = formatCardNumber(event.target.value);
        applyState();
    });

    nameInput.addEventListener("input", (event) => {
        controlsPanel.classList.add("active");
        state.name = event.target.value.toUpperCase().slice(0, 26);
        applyState();
    });

    numberInput.addEventListener("focus", () => controlsPanel.classList.add("active"));
    nameInput.addEventListener("focus", () => controlsPanel.classList.add("active"));

    window.addEventListener("resize", () => {
        clampPosition(state.x, state.y);
        applyState();
    });

    applyState();
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js");
    });
}

registerThemeListener();
registerInstallFlow();
setupInteractiveCard();
registerServiceWorker();
