const installBanner = document.getElementById("installBanner");
const installButton = document.getElementById("installButton");
const installHelp = document.getElementById("installHelp");
const themeColorMeta = document.getElementById("themeColorMeta");
const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
const storageKey = "NorthStar-secure-card";
const deviceLedgerKey = "northstar-device-ledger-v1";
const profileSettingsKey = "northstar-profile-settings-v1";
const faceIdEnabledKey = "northstar-face-id-enabled";
const faceIdUnlockedKey = "northstar-face-id-unlocked";
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
const autoChargeCatalog = [
    { title: "StreamFlix Premium", category: "Subscription", minAmount: 12.99, maxAmount: 19.99 },
    { title: "CloudBox Storage", category: "Subscription", minAmount: 2.99, maxAmount: 9.99 },
    { title: "Fitness+ Monthly", category: "Subscription", minAmount: 14.99, maxAmount: 24.99 },
    { title: "Ride share", category: "Transfer", minAmount: 9.5, maxAmount: 31.75 },
    { title: "Late-night food order", category: "Food", minAmount: 14.25, maxAmount: 48.9 },
    { title: "Corner market", category: "Shopping", minAmount: 8.45, maxAmount: 27.6 },
    { title: "Utility autopay", category: "Bills", minAmount: 42.1, maxAmount: 118.4 }
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
    const appName = document.body.dataset.appName || "this app";

    if (isStandalone()) {
        return;
    }

    if (isIosSafari()) {
        showInstallBanner("On iPhone, tap Share, then Add to Home Screen.", false);
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredPrompt = event;
        showInstallBanner(`Install ${appName} for a full-screen home-screen experience.`, true);
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

function isFaceIdEnabled() {
    return localStorage.getItem(faceIdEnabledKey) === "true";
}

function setFaceIdEnabled(enabled) {
    localStorage.setItem(faceIdEnabledKey, enabled ? "true" : "false");
    if (!enabled) {
        sessionStorage.removeItem(faceIdUnlockedKey);
    }
}

function setFaceIdToggleState(enabled) {
    const toggle = document.getElementById("faceIdToggle");
    const copy = document.getElementById("faceIdStatusCopy");

    if (!toggle || !copy) {
        return;
    }

    toggle.classList.toggle("is-on", enabled);
    toggle.setAttribute("aria-pressed", enabled ? "true" : "false");
    copy.textContent = enabled
        ? "Face ID quick unlock is currently on for this device."
        : "Face ID quick unlock is currently off for this device.";
}

function setupProfileSettings() {
    const toggle = document.getElementById("faceIdToggle");

    if (!toggle) {
        return;
    }

    setFaceIdToggleState(isFaceIdEnabled());

    toggle.addEventListener("click", () => {
        const nextValue = !isFaceIdEnabled();
        setFaceIdEnabled(nextValue);
        setFaceIdToggleState(nextValue);
    });
}

function getProfileSeed() {
    const seedElement = document.getElementById("profileSettingsSeed");

    if (!seedElement) {
        return null;
    }

    try {
        return JSON.parse(seedElement.textContent);
    } catch {
        return null;
    }
}

function getInitials(name) {
    const parts = String(name || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);

    if (!parts.length) {
        return "--";
    }

    return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function loadProfileSettings(seed) {
    try {
        const stored = JSON.parse(localStorage.getItem(profileSettingsKey) || "null");
        return {
            accountName: stored?.accountName ?? seed.account_name ?? "Jordan Banks",
            memberSince: String(stored?.memberSince ?? seed.member_since ?? "2024")
        };
    } catch {
        return {
            accountName: seed.account_name ?? "Jordan Banks",
            memberSince: String(seed.member_since ?? "2024")
        };
    }
}

function saveProfileSettings(state) {
    localStorage.setItem(profileSettingsKey, JSON.stringify(state));
}

function setupEditableProfile() {
    const seed = getProfileSeed();
    const nameInput = document.getElementById("profileAccountNameInput");
    const yearInput = document.getElementById("profileMemberSinceInput");
    const heading = document.getElementById("profileAccountNameHeading");
    const avatar = document.getElementById("profileAvatar");
    const memberSinceValue = document.getElementById("profileMemberSinceValue");
    const autosaveStatus = document.getElementById("profileAutosaveStatus");

    if (!seed || !nameInput || !yearInput || !heading || !avatar || !memberSinceValue || !autosaveStatus) {
        return;
    }

    const state = loadProfileSettings(seed);

    function updateProfileDisplay() {
        const trimmedName = state.accountName.trim();
        const displayName = trimmedName || "No name set";
        const displayYear = /^\d{4}$/.test(state.memberSince) ? state.memberSince : "----";

        heading.textContent = displayName;
        avatar.textContent = getInitials(trimmedName);
        memberSinceValue.textContent = displayYear;
    }

    function persistProfileState(statusMessage) {
        saveProfileSettings(state);
        updateProfileDisplay();
        autosaveStatus.textContent = statusMessage;
    }

    nameInput.addEventListener("input", () => {
        state.accountName = nameInput.value.slice(0, 32);
        persistProfileState("Account name saved automatically on this device.");
    });

    yearInput.addEventListener("input", () => {
        state.memberSince = yearInput.value.replace(/\D/g, "").slice(0, 4);
        yearInput.value = state.memberSince;
        persistProfileState("Member since year saved automatically on this device.");
    });

    nameInput.value = state.accountName;
    yearInput.value = state.memberSince;
    updateProfileDisplay();
}

function setupFaceIdOverlay() {
    const overlay = document.getElementById("faceIdOverlay");
    const unlockButton = document.getElementById("faceIdUnlockButton");
    const cancelButton = document.getElementById("faceIdCancelButton");
    const copy = document.getElementById("faceIdCopy");
    const icon = document.getElementById("faceIdIcon");
    const appName = document.body.dataset.appName || "this app";

    if (!overlay || !unlockButton || !cancelButton || !copy || !icon) {
        return;
    }

    if (!isFaceIdEnabled() || sessionStorage.getItem(faceIdUnlockedKey) === "true") {
        return;
    }

    document.body.classList.add("face-id-locked");
    overlay.classList.remove("is-hidden");
    copy.textContent = `Unlock ${appName} with Face ID on this device.`;

    unlockButton.addEventListener("click", async () => {
        unlockButton.disabled = true;
        icon.textContent = "...";
        copy.textContent = "Checking Face ID...";
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        sessionStorage.setItem(faceIdUnlockedKey, "true");
        overlay.classList.add("is-hidden");
        document.body.classList.remove("face-id-locked");
    });

    cancelButton.addEventListener("click", () => {
        sessionStorage.setItem(faceIdUnlockedKey, "true");
        overlay.classList.add("is-hidden");
        document.body.classList.remove("face-id-locked");
    });
}

function roundCurrency(value) {
    return Math.round(value * 100) / 100;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
    }).format(value);
}

function formatSignedCurrency(value) {
    return `${value >= 0 ? "+" : "-"}${formatCurrency(Math.abs(value))}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function parseAmount(value) {
    if (typeof value === "number") {
        return roundCurrency(value);
    }

    const numeric = Number.parseFloat(String(value || "").replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(numeric)) {
        return 0;
    }

    return roundCurrency(numeric);
}

function randomBetween(min, max) {
    return roundCurrency(Math.random() * (max - min) + min);
}

function randomChoice(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function buildDeviceId() {
    return `Device ${randomDigits(4)}`;
}

function buildAutoChargeIntervalMs() {
    const minutes = 40 + Math.floor(Math.random() * 260);
    return minutes * 60 * 1000;
}

function getLedgerSeed() {
    const seedElement = document.getElementById("deviceLedgerSeed");

    if (!seedElement) {
        return null;
    }

    try {
        return JSON.parse(seedElement.textContent);
    } catch {
        return null;
    }
}

function createDefaultLedgerState() {
    return {
        version: 1,
        deviceId: buildDeviceId(),
        deviceTransactions: [],
        nextAutoChargeAt: Date.now() + buildAutoChargeIntervalMs()
    };
}

function loadLedgerState() {
    try {
        const parsed = JSON.parse(localStorage.getItem(deviceLedgerKey) || "null");
        if (!parsed || typeof parsed !== "object") {
            return createDefaultLedgerState();
        }

        return {
            version: 1,
            deviceId: parsed.deviceId || buildDeviceId(),
            deviceTransactions: Array.isArray(parsed.deviceTransactions) ? parsed.deviceTransactions : [],
            nextAutoChargeAt: parsed.nextAutoChargeAt || (Date.now() + buildAutoChargeIntervalMs())
        };
    } catch {
        return createDefaultLedgerState();
    }
}

function saveLedgerState(state) {
    localStorage.setItem(deviceLedgerKey, JSON.stringify(state));
}

function normalizeSeedTransactions(seedTransactions) {
    const now = Date.now();

    return (Array.isArray(seedTransactions) ? seedTransactions : []).map((tx, index) => ({
        id: `seed-${index}`,
        title: tx.title || "Posted activity",
        subtitle: tx.subtitle || "",
        signedAmount: parseAmount(tx.amount),
        category: tx.category || "Activity",
        timestamp: now - ((index + 1) * 6 * 60 * 60 * 1000),
        seed: true
    }));
}

function createLedgerTransaction({ title, signedAmount, category, timestamp }) {
    const txTimestamp = timestamp || Date.now();

    return {
        id: `device-${txTimestamp}-${randomDigits(5)}`,
        title,
        signedAmount: roundCurrency(signedAmount),
        category,
        timestamp: txTimestamp,
        seed: false
    };
}

function buildAutoCharge(timestamp) {
    const charge = randomChoice(autoChargeCatalog);
    const signedAmount = -randomBetween(charge.minAmount, charge.maxAmount);

    return createLedgerTransaction({
        title: charge.title,
        signedAmount,
        category: charge.category,
        timestamp
    });
}

function applyDueAutoCharges(state) {
    let didChange = false;
    let guard = 0;
    const now = Date.now();

    if (!state.nextAutoChargeAt) {
        state.nextAutoChargeAt = now + buildAutoChargeIntervalMs();
        return true;
    }

    while (state.nextAutoChargeAt <= now && guard < 12) {
        state.deviceTransactions.unshift(buildAutoCharge(state.nextAutoChargeAt));
        state.nextAutoChargeAt += buildAutoChargeIntervalMs();
        didChange = true;
        guard += 1;
    }

    if (guard === 12 && state.nextAutoChargeAt <= now) {
        state.nextAutoChargeAt = now + buildAutoChargeIntervalMs();
        didChange = true;
    }

    if (state.deviceTransactions.length > 60) {
        state.deviceTransactions = state.deviceTransactions.slice(0, 60);
        didChange = true;
    }

    return didChange;
}

function getLiveBalance(runtime) {
    const deviceDelta = runtime.state.deviceTransactions.reduce((sum, tx) => sum + parseAmount(tx.signedAmount), 0);
    return roundCurrency(runtime.seed.balance + deviceDelta);
}

function formatActivityTime(timestamp) {
    if (!timestamp) {
        return "Posted recently";
    }

    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((today - target) / (24 * 60 * 60 * 1000));
    const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);

    if (diffDays <= 0) {
        return `Today, ${time}`;
    }

    if (diffDays === 1) {
        return `Yesterday, ${time}`;
    }

    if (diffDays < 7) {
        const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
        return `${weekday}, ${time}`;
    }

    const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
    return `${shortDate}, ${time}`;
}

function getMergedTransactions(runtime) {
    const deviceTransactions = [...runtime.state.deviceTransactions].sort((left, right) => right.timestamp - left.timestamp);
    return [...deviceTransactions, ...runtime.seed.transactions];
}

function getTransactionStatus(transaction) {
    return transaction.signedAmount >= 0 ? "Completed deposit" : "Posted charge";
}

function matchesTransactionFilter(transaction, filterName) {
    if (filterName === "All") {
        return true;
    }

    if (filterName === "Deposits") {
        return transaction.signedAmount >= 0 || transaction.category === "Deposit" || transaction.category === "Income";
    }

    if (filterName === "Transfers") {
        return transaction.category === "Transfer";
    }

    if (filterName === "Card") {
        return transaction.signedAmount < 0 && transaction.category !== "Transfer";
    }

    return true;
}

function renderActivityList(container, transactions, richItems) {
    if (!container) {
        return;
    }

    if (!transactions.length) {
        container.innerHTML = `
            <div class="info-strip">
                <p>No device activity yet. Leave the app open and random charges will start posting here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = transactions.map((tx) => {
        const title = escapeHtml(tx.title);
        const subtitle = escapeHtml(tx.subtitle || formatActivityTime(tx.timestamp));
        const amount = escapeHtml(formatSignedCurrency(tx.signedAmount));
        const categoryBadge = escapeHtml((tx.category || "A").charAt(0).toUpperCase());
        const amountClass = tx.signedAmount >= 0 ? "activity-amount positive" : "activity-amount";
        const interactionAttrs = `type="button" class="activity-item activity-item-button${richItems ? " rich-item" : ""}" data-transaction-open="${escapeHtml(tx.id)}" aria-label="Open details for ${title}"`;

        if (richItems) {
            return `
                <button ${interactionAttrs}>
                    <div class="transaction-leading">${categoryBadge}</div>
                    <div class="transaction-body">
                        <p class="activity-title">${title}</p>
                        <p class="activity-subtitle">${subtitle}</p>
                    </div>
                    <p class="${amountClass}">${amount}</p>
                </button>
            `;
        }

        return `
            <button ${interactionAttrs}>
                <div>
                    <p class="activity-title">${title}</p>
                    <p class="activity-subtitle">${subtitle}</p>
                </div>
                <p class="${amountClass}">${amount}</p>
            </button>
        `;
    }).join("");
}

function updateLiveBalanceText(runtime) {
    const liveBalance = getLiveBalance(runtime);

    document.querySelectorAll("[data-live-balance]").forEach((element) => {
        element.textContent = formatCurrency(liveBalance);
    });

    const activityBadge = document.getElementById("deviceActivityBadge");
    if (activityBadge) {
        activityBadge.textContent = `${runtime.state.deviceTransactions.length} tx`;
    }

    const activityCopy = document.getElementById("deviceActivityCopy");
    if (activityCopy) {
        activityCopy.textContent = `${runtime.state.deviceId} keeps its own live balance, random charges, and subscription renewals on this browser.`;
    }
}

function renderLedger(runtime) {
    updateLiveBalanceText(runtime);

    const mergedTransactions = getMergedTransactions(runtime);
    const homeList = document.getElementById("homeActivityList");
    if (homeList) {
        const limit = Number.parseInt(homeList.dataset.activityLimit || "3", 10);
        renderActivityList(homeList, mergedTransactions.slice(0, limit), false);
    }

    const transactionsList = document.getElementById("transactionsActivityList");
    if (transactionsList) {
        renderActivityList(
            transactionsList,
            mergedTransactions.filter((tx) => matchesTransactionFilter(tx, runtime.activeFilter)),
            true
        );
    }
}

function persistAndRenderLedger(runtime) {
    saveLedgerState(runtime.state);
    renderLedger(runtime);
}

function addDeviceTransaction(runtime, transaction) {
    runtime.state.deviceTransactions.unshift(createLedgerTransaction(transaction));
    if (runtime.state.deviceTransactions.length > 60) {
        runtime.state.deviceTransactions = runtime.state.deviceTransactions.slice(0, 60);
    }
    persistAndRenderLedger(runtime);
}

function setupTransactionFilters(runtime) {
    const filters = document.querySelectorAll("[data-transaction-filter]");
    if (!filters.length) {
        return;
    }

    filters.forEach((filterButton) => {
        filterButton.addEventListener("click", () => {
            runtime.activeFilter = filterButton.dataset.transactionFilter || "All";

            filters.forEach((button) => {
                button.classList.toggle("active", button === filterButton);
            });

            renderLedger(runtime);
        });
    });
}

function setupManualTransactionForm(runtime) {
    const form = document.getElementById("manualTransactionForm");
    const status = document.getElementById("manualTransactionStatus");

    if (!form || !status) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = document.getElementById("transactionTitle").value.trim();
        const amount = parseAmount(document.getElementById("transactionAmount").value);
        const direction = document.getElementById("transactionDirection").value;
        const category = document.getElementById("transactionCategory").value;

        if (!title || amount <= 0) {
            status.textContent = "Add a description and amount to create the transaction.";
            return;
        }

        addDeviceTransaction(runtime, {
            title,
            signedAmount: direction === "credit" ? amount : -amount,
            category
        });

        status.textContent = `${title} was added on ${runtime.state.deviceId} and the live balance updated immediately.`;
        form.reset();
        document.getElementById("transactionDirection").value = "debit";
        document.getElementById("transactionCategory").value = "Subscription";
    });
}

function setupWithdrawForm(runtime) {
    const form = document.getElementById("withdrawForm");
    const status = document.getElementById("withdrawStatus");

    if (!form || !status) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const amount = parseAmount(document.getElementById("withdrawAmount").value);
        const handle = document.getElementById("withdrawHandle").value.trim();
        const provider = form.querySelector('input[name="withdrawProvider"]:checked')?.value || "Cash App";

        if (amount <= 0) {
            status.textContent = "Enter a valid amount to withdraw.";
            return;
        }

        if (amount > getLiveBalance(runtime)) {
            status.textContent = "That fake wallet transfer is larger than the live balance on this device.";
            return;
        }

        const destination = handle ? ` to ${handle}` : "";
        addDeviceTransaction(runtime, {
            title: `${provider} cash out${destination}`,
            signedAmount: -amount,
            category: "Transfer"
        });

        status.textContent = `${formatCurrency(amount)} sent to fake ${provider}${destination}.`;
        form.reset();

        const firstProvider = form.querySelector('input[name="withdrawProvider"]');
        if (firstProvider) {
            firstProvider.checked = true;
        }
    });
}

function ensureTransactionModal() {
    let overlay = document.getElementById("transactionDetailOverlay");
    if (overlay) {
        return overlay;
    }

    overlay = document.createElement("section");
    overlay.className = "transaction-detail-overlay is-hidden";
    overlay.id = "transactionDetailOverlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
        <div class="transaction-detail-backdrop" data-transaction-close></div>
        <div class="transaction-detail-card" role="dialog" aria-modal="true" aria-labelledby="transactionDetailTitle">
            <div class="section-header compact">
                <div>
                    <p class="section-label">Transaction details</p>
                    <h2 class="section-title" id="transactionDetailTitle">Activity</h2>
                </div>
                <button class="secondary-button" type="button" data-transaction-close>Close</button>
            </div>
            <div class="detail-list">
                <div class="detail-row">
                    <span class="detail-label">Description</span>
                    <span class="detail-value" id="transactionDetailDescription"></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Amount</span>
                    <span class="detail-value" id="transactionDetailAmount"></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category</span>
                    <span class="detail-value" id="transactionDetailCategory"></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">When</span>
                    <span class="detail-value" id="transactionDetailTime"></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value" id="transactionDetailStatus"></span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
}

function closeTransactionModal() {
    const overlay = document.getElementById("transactionDetailOverlay");
    if (!overlay) {
        return;
    }

    overlay.classList.add("is-hidden");
    overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("transaction-detail-open");
}

function openTransactionModal(transaction) {
    const overlay = ensureTransactionModal();

    document.getElementById("transactionDetailTitle").textContent = transaction.title;
    document.getElementById("transactionDetailDescription").textContent = transaction.title;

    const amountElement = document.getElementById("transactionDetailAmount");
    amountElement.textContent = formatSignedCurrency(transaction.signedAmount);
    amountElement.className = transaction.signedAmount >= 0 ? "detail-value success" : "detail-value";

    document.getElementById("transactionDetailCategory").textContent = transaction.category || "Activity";
    document.getElementById("transactionDetailTime").textContent = transaction.subtitle || formatActivityTime(transaction.timestamp);
    document.getElementById("transactionDetailStatus").textContent = getTransactionStatus(transaction);

    overlay.classList.remove("is-hidden");
    overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("transaction-detail-open");
}

function setupTransactionInteractions(runtime) {
    ensureTransactionModal();

    document.addEventListener("click", (event) => {
        const openButton = event.target.closest("[data-transaction-open]");
        if (openButton) {
            const transactionId = openButton.dataset.transactionOpen;
            const transaction = getMergedTransactions(runtime).find((item) => item.id === transactionId);
            if (transaction) {
                openTransactionModal(transaction);
            }
            return;
        }

        if (event.target.closest("[data-transaction-close]")) {
            closeTransactionModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeTransactionModal();
        }
    });
}

function setupDeviceLedger() {
    const seed = getLedgerSeed();

    if (!seed) {
        return;
    }

    const runtime = {
        seed: {
            balance: parseAmount(seed.balance),
            transactions: normalizeSeedTransactions(seed.transactions)
        },
        state: loadLedgerState(),
        activeFilter: "All"
    };

    if (applyDueAutoCharges(runtime.state)) {
        saveLedgerState(runtime.state);
    }

    renderLedger(runtime);
    setupTransactionFilters(runtime);
    setupManualTransactionForm(runtime);
    setupWithdrawForm(runtime);
    setupTransactionInteractions(runtime);
}

registerThemeListener();
registerInstallFlow();
setupCardPreview();
setupInteractiveCard();
setupProfileSettings();
setupEditableProfile();
setupFaceIdOverlay();
setupDeviceLedger();
registerServiceWorker();
