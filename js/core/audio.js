// =========================================================
// GESTOR DE AUDIO NIER (REPRODUCCIÓN NATIVA HTML5 COMPATIBLE CON
// IFRAME/LOCAL + EFECTO SUMERGIDO "BUT IT REFUSED")
// =========================================================
const AudioManager = {
    ctx: null,
    enabled: true,
    masterVolume: 0.65,
    bgmTrack: null,
    currentBaseVol: 0.55,
    pendingBgmUrl: null,
    pendingBgmVol: 0.45,
    pendingBgmLoop: true,
    muffleInterval: null,
    lastHitBossSfxTime: 0,

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

    scaleVol(v) {
        return Math.min(1.0, Math.max(0.0, v * this.masterVolume));
    },

    getAudioPulse() {
        if (!this.enabled || !this.bgmTrack || this.bgmTrack.paused) return 0;
        const t = this.bgmTrack.currentTime || (performance.now() * 0.001);
        const fastBeat = Math.pow(Math.sin(t * Math.PI * 2.45), 4);
        const accent = Math.pow(Math.cos(t * Math.PI * 1.225), 6);
        return Math.min(1.0, fastBeat * 0.55 + accent * 0.35);
    },

    getHighFreqSparkle() {
        if (!this.enabled || !this.bgmTrack || this.bgmTrack.paused) return 0;
        const t = this.bgmTrack.currentTime || (performance.now() * 0.001);
        return Math.pow(Math.sin(t * Math.PI * 4.8), 2) * 0.65;
    },

    // Ahoga y ralentiza la canción cuando caes en Fase S SIN detener el MP3
    muffleBgmForRefusal() {
        if (!this.enabled || !this.bgmTrack) return;
        this.init();
        clearInterval(this.muffleInterval);
        try {
            this.bgmTrack.volume = this.scaleVol(this.currentBaseVol * 0.22);
            this.bgmTrack.playbackRate = 0.76;

            // Latido profundo subacuático sintetizado
            this.beep(55, 0.32, 'sine', 0.16);
            setTimeout(() => this.beep(46, 0.38, 'sine', 0.14), 230);
            setTimeout(() => this.beep(55, 0.32, 'sine', 0.14), 950);
            setTimeout(() => this.beep(46, 0.38, 'sine', 0.12), 1180);
        } catch (e) {}
    },

    // Devuelve la canción al 100% con un acorde de resurrección
    restoreBgmFromRefusal() {
        if (!this.enabled || !this.bgmTrack) return;
        this.init();
        clearInterval(this.muffleInterval);
        try {
            this.bgmTrack.playbackRate = 1.0;
            const targetVol = this.scaleVol(this.currentBaseVol);
            let step = 0;
            this.muffleInterval = setInterval(() => {
                step++;
                if (!this.bgmTrack) {
                    clearInterval(this.muffleInterval);
                    return;
                }
                const ratio = Math.min(1, step / 10);
                this.bgmTrack.volume = targetVol * (0.22 + 0.78 * ratio);
                if (ratio >= 1) clearInterval(this.muffleInterval);
            }, 40);

            if (this.ctx) {
                const now = this.ctx.currentTime;
                const subOsc = this.ctx.createOscillator();
                const subGain = this.ctx.createGain();
                subOsc.type = 'sine';
                subOsc.frequency.setValueAtTime(55, now);
                subOsc.frequency.exponentialRampToValueAtTime(115, now + 0.45);
                subGain.gain.setValueAtTime(this.scaleVol(0.15), now);
                subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
                subOsc.connect(subGain);
                subGain.connect(this.ctx.destination);
                subOsc.start(now);
                subOsc.stop(now + 0.68);
            }

            const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
            chord.forEach((f, idx) => {
                setTimeout(() => {
                    this.beep(f, 0.55, 'triangle', 0.055);
                    this.beep(f * 1.5, 0.4, 'sine', 0.03);
                }, idx * 42);
            });
        } catch (e) {}
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
            gain.gain.setValueAtTime(this.scaleVol(volume), this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    },

    waterDropSound() {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(580, now);
            osc.frequency.exponentialRampToValueAtTime(1850, now + 0.075);
            gain.gain.setValueAtTime(this.scaleVol(0.065), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.23);
            setTimeout(() => this.beep(2420, 0.18, 'sine', 0.03), 65);
        } catch (e) {}
    },

    laserChargeSound() {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(280, now);
            osc.frequency.exponentialRampToValueAtTime(1240, now + 0.35);
            gain.gain.setValueAtTime(this.scaleVol(0.04), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.39);
        } catch (e) {}
    },

    laserFireSynth() {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.25;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1100, now);
            filter.frequency.exponentialRampToValueAtTime(260, now + 0.24);
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(this.scaleVol(0.09), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);
            noise.start(now);
            noise.stop(now + 0.25);
            this.beep(140, 0.22, 'sawtooth', 0.06);
        } catch (e) {}
    },

    phaseTransitionBassDrop() {
        if (!this.enabled) return;
        this.init();
        try {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(135, now);
            osc.frequency.exponentialRampToValueAtTime(28, now + 1.45);
            gain.gain.setValueAtTime(this.scaleVol(0.14), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 1.55);
        } catch (e) {}
    },

    parryClangSound() {
        if (!this.enabled) return;
        this.beep(1340, 0.14, 'square', 0.055);
        this.beep(1980, 0.22, 'triangle', 0.05);
        setTimeout(() => this.beep(2640, 0.18, 'sine', 0.04), 30);
    },

    undertaleRefuseRumble() {
        for (let i = 0; i < 6; i++) {
            setTimeout(() => this.beep(95 + (i % 2) * 25, 0.05, 'square', 0.06), i * 65);
        }
    },

    undertaleRefuseHeal() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((n, idx) => {
            setTimeout(() => this.beep(n, 0.16, 'square', 0.065), idx * 55);
        });
    },

    astralResonancePulseSound() {
        if (!this.enabled) return;
        const notes = [440, 659.25, 880, 1318.5, 1760];
        notes.forEach((f, i) => {
            setTimeout(() => this.beep(f, 0.38, 'sine', 0.055), i * 32);
        });
    },

    pitchDownStopBgm(durationMs = 1400) {
        if (!this.bgmTrack) return;
        clearInterval(this.muffleInterval);
        const track = this.bgmTrack;
        const startVol = track.volume;
        const steps = 16;
        const stepTime = durationMs / steps;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            const ratio = Math.max(0, 1 - currentStep / steps);
            try {
                track.volume = startVol * ratio;
                track.playbackRate = Math.max(0.35, 0.35 + ratio * 0.65);
            } catch (e) {}
            if (currentStep >= steps) {
                clearInterval(timer);
                track.pause();
                track.playbackRate = 1.0;
            }
        }, stepTime);
    },

    podFireSound() {
        this.beep(1180, 0.03, 'triangle', 0.016);
    },

    railgunFireSound() {
        this.beep(150, 0.45, 'sawtooth', 0.085);
        this.beep(880, 0.35, 'sine', 0.065);
        setTimeout(() => this.beep(1760, 0.4, 'triangle', 0.055), 60);
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
                gain.gain.setValueAtTime(this.scaleVol(0.028), this.ctx.currentTime + (k * 0.045));
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
        this.beep(120, 0.4, 'sawtooth', 0.075);
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
            audio.volume = this.scaleVol(volume);
            audio.play().catch(() => {});
        } catch (e) {}
    },

    playBgm(trackUrl, volume = 0.45, loop = true) {
        this.pendingBgmUrl = trackUrl;
        this.pendingBgmVol = volume;
        this.pendingBgmLoop = loop;
        this.currentBaseVol = volume;
        clearInterval(this.muffleInterval);

        if (!this.enabled || !trackUrl) return;
        this.init();
        try {
            if (this.bgmTrack) {
                this.bgmTrack.pause();
                this.bgmTrack.currentTime = 0;
            }
            const audio = new Audio(trackUrl);
            audio.volume = this.scaleVol(volume);
            audio.loop = loop;
            audio.playbackRate = 1.0;
            this.bgmTrack = audio;

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
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
        clearInterval(this.muffleInterval);
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