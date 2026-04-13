const themeKey = "chase-secure-theme";
const installBanner = document.getElementById("installBanner");
const installButton = document.getElementById("installButton");
const installHelp = document.getElementById("installHelp");
let deferredPrompt = null;

function applySavedTheme() {
    const savedTheme = localStorage.getItem(themeKey);

    if (savedTheme === "dark") {
        document.body.classList.add("dark");
    }
}

function toggleDark() {
    document.body.classList.toggle("dark");
    localStorage.setItem(themeKey, document.body.classList.contains("dark") ? "dark" : "light");
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

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/service-worker.js");
    });
}

applySavedTheme();
registerInstallFlow();
registerServiceWorker();
