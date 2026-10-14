// =========================================================
// MÁQUINA DE ESTADOS FINITOS (FSM) SINCRONIZADA AL CANVAS
// =========================================================
const BossEngine = {
    currentPhase: null,
    phases: {},
    lastFrameTime: 0,

    register(name, phaseInstance) {
        this.phases[name] = phaseInstance;
    },

    startLoop() {
        this.lastFrameTime = performance.now();
        if (typeof ParticleEngine !== 'undefined') {
            ParticleEngine.customOverlayRender = (ctx) => {
                const now = performance.now();
                const dt = Math.min(0.1, (now - this.lastFrameTime) / 1000);
                this.lastFrameTime = now;
                this.update(dt, now, ctx);
            };
        }
    },

    transitionTo(phaseName, ...args) {
        if (this.currentPhase && typeof this.currentPhase.exit === 'function') {
            this.currentPhase.exit();
        }
        const next = this.phases[phaseName];
        if (!next) return;
        this.currentPhase = next;
        if (typeof this.currentPhase.enter === 'function') {
            this.currentPhase.enter(...args);
        }
        this.startLoop();
    },

    update(dt, now, ctx) {
        if (this.currentPhase && typeof this.currentPhase.update === 'function') {
            this.currentPhase.update(dt, now);
        }
        if (ctx) {
            BossState.updateAndRenderShip(dt, ctx);
            BossAttacks.updateProjectilesAndLasers(dt, ctx);
        }
    },

    handleHit(dmg, coords) {
        if (this.currentPhase && typeof this.currentPhase.onHit === 'function') {
            return this.currentPhase.onHit(dmg, coords);
        }
        return true;
    },

    checkDebugParams() {
        const params = new URLSearchParams(window.location.search);
        return params.get('phase');
    }
};

window.BossEngine = BossEngine;