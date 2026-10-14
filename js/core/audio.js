// =========================================================
// GESTOR DE AUDIO NIER (REPRODUCCIÓN NATIVA SIN BLOQUEO CORS)
// =========================================================
const AudioManager = {
    ctx: null,
    enabled: true,
    bgmTrack: null,
    pendingBgmUrl: null,
    pendingBgmVol: 0.45,
    pendingBgmLoop: true,

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        if (this.bgmTrack && this.bgmTrack.paused && this.enabled) {
            this.bgmTrack.play().catch(() => {});
        }
    },

    getAudioPulse() {
        if (!this.enabled || !this.bgmTrack || this.bgmTrack.paused) return 0;
        const t = this.bgmTrack.currentTime || (performance.now() * 0.001);
        return Math.pow(Math.sin(t * Math.PI * 2.2), 4) * 0.55;
    },

    toggleSound(buttonId = 'sound-btn') {
        this.init();
        this.enabled = !this.enabled;
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.textContent = this.enabled ? "[ AUDIO: ACTIVO ]" : "[ AUDIO: SILENCIADO ]";
        }
        if (this.enabled) {
            this.beep(880, 0.05, 'sine');
            if (this.pendingBgmUrl) this.playBgm(this.pendingBgmUrl, this.pendingBgmVol, this.pendingBgmLoop);
        } else {
            this.stopBgm();
        }
        return this.enabled;
    },

    beep(freq, duration, type = 'sine', volume = 0.04) {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    },

    podFireSound() {
        this.beep(1180, 0.03, 'triangle', 0.018);
    },

    railgunFireSound() {
        this.beep(150, 0.45, 'sawtooth', 0.09);
        this.beep(880, 0.35, 'sine', 0.07);
        setTimeout(() => this.beep(1760, 0.4, 'triangle', 0.06), 60);
    },

    evadeOverclockSound() {
        const freqs = [330, 440, 659.25, 880];
        freqs.forEach((f, i) => {
            setTimeout(() => this.beep(f, 0.12, 'sine', 0.045), i * 25);
        });
    },

    synthBell() {
        const partials = [523.25, 1046.5, 1567.98, 2093.0];
        partials.forEach((f, idx) => {
            this.beep(f, 2.5 - idx * 0.4, 'sine', 0.06 / (idx + 1));
        });
    },

    synthRewind() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => this.beep(220 + i * 110, 0.05, 'sawtooth', 0.03), i * 35);
        }
    },

    balatroVoice(tone = 'mid') {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const tones = {
                low: [160, 210, 185],
                mid: [320, 420, 360, 480],
                high: [580, 720, 640, 800],
                angry: [110, 140, 95, 130],
                yandere: [420, 560, 680, 820]
            };
            const pool = tones[tone] || tones.mid;
            for (let k = 0; k < 4; k++) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const freq = pool[Math.floor(Math.random() * pool.length)];
                osc.type = tone === 'angry' ? 'sawtooth' : 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + (k * 0.045));
                gain.gain.setValueAtTime(0.03, this.ctx.currentTime + (k * 0.045));
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + (k * 0.045) + 0.04);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + (k * 0.045));
                osc.stop(this.ctx.currentTime + (k * 0.045) + 0.045);
            }
        } catch (e) {}
    },

    liturgicalChime() {
        this.beep(523.25, 2.0, 'sine', 0.07);
        setTimeout(() => this.beep(659.25, 1.8, 'sine', 0.05), 180);
        setTimeout(() => this.beep(783.99, 2.2, 'sine', 0.04), 360);
    },

    cardSlideSound() {
        this.beep(480, 0.06, 'triangle', 0.03);
    },

    playCardJingle(tier = "silver") {
        if (tier === "gold") {
            this.beep(523.25, 0.4, 'sine', 0.07);
            setTimeout(() => this.beep(659.25, 0.4, 'sine', 0.06), 80);
            setTimeout(() => this.beep(783.99, 0.5, 'triangle', 0.05), 160);
        } else if (tier === "crimson") {
            this.beep(160, 0.45, 'sawtooth', 0.08);
            setTimeout(() => this.beep(220, 0.5, 'sawtooth', 0.07), 90);
        } else {
            this.beep(440, 0.3, 'sine', 0.05);
            setTimeout(() => this.beep(587.33, 0.35, 'triangle', 0.04), 80);
        }
    },

    swordImpactSound() {
        this.beep(120, 0.4, 'sawtooth', 0.08);
        this.beep(880, 0.5, 'triangle', 0.05);
    },

    legoClickPop() {
        [620, 840, 1120, 1480].forEach((f, idx) => {
            setTimeout(() => this.beep(f, 0.06, 'triangle', 0.06), idx * 40);
        });
    },

    playAudio(url, volume = 0.4) {
        if (!this.enabled || !url) return;
        this.init();
        if (url.includes('bell.mp3')) { this.synthBell(); return; }
        if (url.includes('rewind.mp3')) { this.synthRewind(); return; }
        try {
            const audio = new Audio(url);
            audio.volume = Math.min(1, Math.max(0, volume));
            audio.play().catch(() => {});
        } catch (e) {}
    },

    playBgm(trackUrl, volume = 0.45, loop = true) {
        this.pendingBgmUrl = trackUrl;
        this.pendingBgmVol = volume;
        this.pendingBgmLoop = loop;
        if (!this.enabled || !trackUrl) return;
        this.init();
        try {
            if (this.bgmTrack) {
                this.bgmTrack.pause();
                this.bgmTrack.currentTime = 0;
            }
            const audio = new Audio(trackUrl);
            audio.volume = Math.min(1, Math.max(0, volume));
            audio.loop = loop;
            this.bgmTrack = audio;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Si el navegador bloquea el autoplay en el iframe, lo reanuda al primer input
                    const unlock = () => {
                        if (this.bgmTrack && this.bgmTrack.paused && this.enabled) {
                            this.bgmTrack.play().catch(() => {});
                        }
                    };
                    ['keydown', 'pointerdown', 'touchstart', 'mousemove'].forEach(evt => {
                        window.addEventListener(evt, unlock, { once: true });
                    });
                });
            }
        } catch (e) {}
    },

    stopBgm() {
        if (this.bgmTrack) {
            this.bgmTrack.pause();
            this.bgmTrack.currentTime = 0;
            this.bgmTrack = null;
        }
    }
};

['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => AudioManager.init(), { once: true });
});