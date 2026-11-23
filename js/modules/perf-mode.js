window.PerfMode = {
    isLite: false,
    theme: "default",

    init() {
        const savedPerf = localStorage.getItem("solyn_perf_mode");
        const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const isSmallMobile = window.innerWidth < 960;

        if (savedPerf === "lite") {
            this.isLite = true;
        } else if (savedPerf === "full") {
            this.isLite = false;
        } else {
            // En dispositivos con prefers-reduced-motion arranca en LITE automáticamente
            this.isLite = prefersReduced;
        }

        this.theme = localStorage.getItem("solyn_theme_mode") || "default";
        this.applyState();

        document.getElementById("btn-perf-toggle")?.addEventListener("click", () => {
            this.isLite = !this.isLite;
            localStorage.setItem("solyn_perf_mode", this.isLite ? "lite" : "full");
            this.applyState();
            if (window.ReworkApp) {
                window.ReworkApp.toast(this.isLite
                    ? "MODO LITE ACTIVO (SIN ACELERACIÓN DE HARDWARE)"
                    : "MODO FULL ACTIVO (EFECTOS COMPLETOS)");
            }
        });

        document.getElementById("btn-theme-invert")?.addEventListener("click", () => {
            this.theme = this.theme === "invert" ? "default" : "invert";
            localStorage.setItem("solyn_theme_mode", this.theme);
            this.applyState();
        });

        document.getElementById("btn-theme-alert")?.addEventListener("click", () => {
            this.theme = this.theme === "alert" ? "default" : "alert";
            localStorage.setItem("solyn_theme_mode", this.theme);
            this.applyState();
        });

        if (isSmallMobile) {
            document.body.classList.add("is-mobile-viewport");
        }
    },

    applyState() {
        document.body.classList.toggle("perf-lite", this.isLite);
        document.body.classList.toggle("perf-full", !this.isLite);

        document.body.classList.remove("theme-invert", "theme-alert");
        if (this.theme === "invert") document.body.classList.add("theme-invert");
        if (this.theme === "alert") document.body.classList.add("theme-alert");

        const btnPerf = document.getElementById("btn-perf-toggle");
        if (btnPerf) {
            btnPerf.textContent = this.isLite ? "PERF: LITE" : "PERF: FULL";
            btnPerf.classList.toggle("primary", !this.isLite);
        }

        const btnInv = document.getElementById("btn-theme-invert");
        if (btnInv) btnInv.classList.toggle("primary", this.theme === "invert");

        const btnAlert = document.getElementById("btn-theme-alert");
        if (btnAlert) btnAlert.classList.toggle("primary", this.theme === "alert");

        if (window.ReactBitsFX) {
            if (this.isLite) window.ReactBitsFX.stop();
            else window.ReactBitsFX.start();
        }
    }
};