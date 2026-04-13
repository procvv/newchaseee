const installBanner = document.getElementById("installBanner");
const installButton = document.getElementById("installButton");
const installHelp = document.getElementById("installHelp");
const themeColorMeta = document.getElementById("themeColorMeta");
const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const storageKey = "chase-secure-card";
let deferredPrompt = null;
const cardThemes = [
    { network: "Aurora", start: "#071a33", mid: "#0c4fa7", end: "#2c7ef0", glow: "rgba(255, 255, 255, 0.26)" },
    { network: "Summit", start: "#231235", mid: "#6c2bd9", end: "#f25d9c", glow: "rgba(255, 210, 236, 0.28)" },
    { network: "Atlas", start: "#16251e", mid: "#1f7a5f", end: "#5bc58f", glow: "rgba(218, 255, 234, 0.24)" },
    { network: "Ember", start: "#2f160d", mid: "#b84d1f", end: "#f0a84a", glow: "rgba(255, 234, 205, 0.28)" }
];
const sampleNames = [
    "JORDAN BANKS",
    "RILEY CARTER",
    "MORGAN REED",
    "TAYLOR BROOKS",
    "CAMERON HAYES",
    "ALEX RIVERS"
];

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
    const defaults = generateDeviceCardDefaults();

    try {
        const savedState = JSON.parse(localStorage.getItem(storageKey) || "{}");
        const mergedState = { ...defaults, ...savedState };

        if (!savedState.theme || !savedState.expiry || !savedState.network) {
            saveCardState(mergedState);
        }

        return mergedState;
    } catch {
        return defaults;
    }
}

function saveCardState(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
}

function randomDigits(length) {
    let value = "";
    for (let index = 0; index < length; index += 1) {
        value += Math.floor(Math.random() * 10);
    }
    return value;
}

function buildCardNumber() {
    return ["4" + randomDigits(3), randomDigits(4), randomDigits(4), randomDigits(4)].join(" ");
}

function buildExpiry() {
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    const year = String((new Date().getFullYear() + 2 + Math.floor(Math.random() * 5)) % 100).padStart(2, "0");
    return `${month}/${year}`;
}

function generateDeviceCardDefaults() {
    const theme = cardThemes[Math.floor(Math.random() * cardThemes.length)];
    return {
        number: buildCardNumber(),
        name: sampleNames[Math.floor(Math.random() * sampleNames.length)],
        expiry: buildExpiry(),
        network: theme.network,
        theme,
        hidden: false,
        x: 28,
        y: 42
    };
}

function applyCardTheme(cardElement, theme) {
    if (!cardElement || !theme) {
        return;
    }

    cardElement.style.setProperty("--card-start", theme.start);
    cardElement.style.setProperty("--card-mid", theme.mid);
    cardElement.style.setProperty("--card-end", theme.end);
    cardElement.style.setProperty("--card-glow", theme.glow);
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
    const expiryDisplay = document.getElementById("cardExpiryDisplay");
    const networkDisplay = document.getElementById("cardNetworkDisplay");
    const numberInput = document.getElementById("cardNumberInput");
    const nameInput = document.getElementById("cardNameInput");
    const toggleButton = document.getElementById("toggleCardNumber");

    if (!card || !stage || !controlsPanel || !numberDisplay || !nameDisplay || !expiryDisplay || !networkDisplay || !numberInput || !nameInput || !toggleButton) {
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
        expiryDisplay.textContent = state.expiry || "08/29";
        networkDisplay.textContent = state.network || "Aurora";
        toggleButton.textContent = state.hidden ? "Show number" : "Hide number";
        card.style.left = `${state.x}px`;
        card.style.top = `${state.y}px`;
        applyCardTheme(card, state.theme);
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
    let suppressCardTap = false;

    function activateEditor() {
        controlsPanel.classList.add("active");
        controlsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
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
        if (card.setPointerCapture) {
            card.setPointerCapture(event.pointerId);
        }
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

        if (movedCard) {
            suppressCardTap = true;
            window.setTimeout(() => {
                suppressCardTap = false;
            }, 220);
        }
    }

    card.addEventListener("pointerup", endDrag);
    card.addEventListener("pointercancel", endDrag);
    card.addEventListener("click", (event) => {
        if (suppressCardTap) {
            event.preventDefault();
            return;
        }

        activateEditor();
    });
    card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
            return;
        }

        event.preventDefault();
        activateEditor();
    });

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

function setupCardPreview() {
    const cardPreview = document.getElementById("bankCardPreview");
    const numberPreview = document.getElementById("cardNumberPreview");
    const namePreview = document.getElementById("cardNamePreview");
    const expiryPreview = document.getElementById("cardExpiryPreview");
    const networkPreview = document.getElementById("cardNetworkPreview");

    if (!cardPreview || !numberPreview || !namePreview || !expiryPreview || !networkPreview) {
        return;
    }

    const state = loadCardState();
    const formattedNumber = formatCardNumber(state.number) || "4921 6620 1948 1203";
    const formattedName = (state.name || "JORDAN BANKS").trim().toUpperCase() || "JORDAN BANKS";

    numberPreview.textContent = state.hidden ? maskCardNumber(formattedNumber) : formattedNumber;
    namePreview.textContent = formattedName;
    expiryPreview.textContent = state.expiry || "08/29";
    networkPreview.textContent = state.network || "Aurora";
    applyCardTheme(cardPreview, state.theme);
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
setupCardPreview();
setupInteractiveCard();
registerServiceWorker();
