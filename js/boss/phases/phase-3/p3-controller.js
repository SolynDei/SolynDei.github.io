// =========================================================
// CONTROLADOR EXCLUSIVO DE LA FASE 3 (COLAPSO DEL VACÍO // HERO)
// =========================================================
const Phase3 = {
    cinematicPhase: 0,
    lastCountdown: 0,
    lastSpawnedBeatIndex: -1,
    currentSubText: "",
    virtualTime: 99.0,
    introStartTime: 0,
    activeSessionId: 0,
    phase3Beatmap: [
        119.4, 120.4, 121.4, 122.4, 123.4, 124.4, 125.4, 126.2,
        145.4, 146.6, 147.8, 149.0, 150.2, 151.4, 152.6,
        154.0, 155.4, 156.8, 158.2, 159.6, 161.0, 162.4,
        164.5, 166.0, 167.5, 169.0, 170.5, 172.0, 173.5, 175.0, 176.8, 178.5, 180.5, 182.5, 184.5
    ],

    enter() {
        this.activeSessionId++;
        BossAttacks.clearAll();
        document.getElementById('cinematic-darkness')?.classList.remove('active');
        document.body.classList.remove('phase-2-active');
        document.body.classList.add('phase-3-active', 'cinema-wide-bars', 'combat-no-cursor');

        AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom);
        if (typeof BalatroEngine !== 'undefined') {
            BalatroEngine.triggerHit(window.innerWidth / 2, window.innerHeight / 2, 1.8);
        }

        BossState.phase = 3;
        BossState.maxHp = 650;
        BossState.currentHp = BossState.maxHp;
        BossState.updateHpBar();
        BossState.damageLock = true;
        BossState.isInvulnerable = false;
        BossState.weaponLost = false;
        BossState.impaledSwords = [];
        BossState.updateCoreSprite();

        this.cinematicPhase = 0;
        this.lastCountdown = 0;
        this.lastSpawnedBeatIndex = -1;
        this.currentSubText = "";
        this.virtualTime = 99.0;
        this.introStartTime = performance.now();

        document.getElementById('boss-core').style.display = 'none';
        document.getElementById('boss-hud').style.display = 'none';
        document.getElementById('player-hud').style.display = 'none';

        AudioManager.playBgm(BOSS_AUDIO_PATHS.bgmPhase3, 0.85, false);
        const bgm = AudioManager.bgmTrack;
        if (bgm) {
            const setStart = () => { try { bgm.currentTime = 99.0; } catch (e) {} };
            if (bgm.readyState >= 1) setStart();
            else bgm.addEventListener('loadedmetadata', setStart, { once: true });
        }
    },

    renderCinematicEntrance(ctx) {
        if (!ctx) return;
        const w = window.innerWidth, h = window.innerHeight;
        const elapsed = (performance.now() - this.introStartTime) * 0.001;

        ctx.save();
        ctx.translate(w / 2, h / 2);

        for (let r = 1; r <= 4; r++) {
            const rad = ((elapsed * 95 + r * 85) % 440);
            const alpha = Math.max(0, 1 - rad / 440) * 0.6;
            ctx.strokeStyle = `rgba(218, 212, 187, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, rad, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.strokeStyle = '#f7f5ed';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#dad4bb';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        for (let x = -w * 0.35; x <= w * 0.35; x += 8) {
            const env = Math.exp(-(x * x) / (w * w * 0.04));
            const y = Math.sin(x * 0.045 - elapsed * 14) * 55 * env;
            if (x === -w * 0.35) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    },

    update(dt) {
        if (BossState.phase !== 3 || BossState.playerHp <= 0 || BossState.isDying) return;
        this.virtualTime += dt;
        const bgm = AudioManager.bgmTrack;
        const ct = (bgm && !bgm.paused && bgm.currentTime >= 98.5) ? bgm.currentTime : this.virtualTime;

        const mvContainer = document.getElementById('lyrics-container');
        const core = document.getElementById('boss-core');
        const bossHud = document.getElementById('boss-hud');
        const playerHud = document.getElementById('player-hud');
        const darkness = document.getElementById('cinematic-darkness');

        if (typeof P3_SUBTITLES !== 'undefined' && mvContainer) {
            const sub = P3_SUBTITLES.find(s => ct >= s.start && ct <= s.end);
            if (sub) {
                if (this.currentSubText !== sub.text) {
                    this.currentSubText = sub.text;
                    mvContainer.innerHTML = `<span class="mv-text-beat" id="active-mv-sub" data-text="${sub.text}">${sub.text}</span>`;
                    if (/Hero|Stand up|Uno|Who am I/i.test(sub.text) && typeof BalatroEngine !== 'undefined') {
                        BalatroEngine.triggerHit(window.innerWidth / 2, window.innerHeight / 2, 1.4);
                    }
                }
                const subEl = document.getElementById('active-mv-sub');
                if (subEl && typeof AudioManager !== 'undefined') {
                    const p = AudioManager.getAudioPulse();
                    subEl.style.transform = `scale(${(1 + p * 0.16).toFixed(3)})`;
                }
            } else if (this.currentSubText !== "") {
                this.currentSubText = "";
                mvContainer.innerHTML = '';
            }
        }

        const arenaVisible = (this.cinematicPhase === 3 || (this.cinematicPhase >= 6 && this.cinematicPhase <= 8));
        if (arenaVisible && BossState.currentHp > 0) {
            for (let i = this.lastSpawnedBeatIndex + 1; i < this.phase3Beatmap.length; i++) {
                if (ct >= this.phase3Beatmap[i]) {
                    const realCore = BossState.getBossCoreCenter();
                    BossAttacks.spawnDanmakuRing(realCore.x, realCore.y, 10, 3.4, i % 2 === 0 ? 'aimed' : 'ring');
                    if (i % 2 === 1) BossState.startBossTackle();
                    if (i % 3 === 0) BossAttacks.spawnSpiralVolley(3, 2, 3.5);
                    this.lastSpawnedBeatIndex = i;
                    break;
                }
            }
        }

        if (this.cinematicPhase === 0 && ct >= 99.0) {
            this.cinematicPhase = 1;
            const title = document.getElementById('boss-title-name');
            if (title) title.textContent = "SAPHYNIEL // COLAPSO DEL VACÍO";
        } else if (this.cinematicPhase === 1) {
            if (typeof ParticleEngine !== 'undefined' && ParticleEngine.ctx) {
                this.renderCinematicEntrance(ParticleEngine.ctx);
            }
            if (ct >= 106.5) {
                this.cinematicPhase = 2;
                if (typeof SubphaseFlashback !== 'undefined') SubphaseFlashback.enter();
            }
        } else if (this.cinematicPhase === 2) {
            if (typeof SubphaseFlashback !== 'undefined') SubphaseFlashback.update(ct);
            if (ct >= 119.0) {
                this.cinematicPhase = 3;
                if (typeof SubphaseFlashback !== 'undefined') SubphaseFlashback.exit();
                BossState.triggerAnimeImpactFrame();
                document.body.classList.add('glitch-flash');
                setTimeout(() => document.body.classList.remove('glitch-flash'), 300);
                ScreenUtils.triggerShake();

                if (core) {
                    core.style.display = 'flex';
                    core.style.top = '30%';
                    core.style.left = '50%';
                    core.style.transform = 'translate(-50%, -50%) scale(2.0)';
                }
                if (bossHud) bossHud.style.display = 'flex';
                if (playerHud) playerHud.style.display = 'flex';
                document.getElementById('boss-aura-farm')?.classList.add('active');
                BossState.damageLock = false;
                BossState.weaponLost = false;
                BossState.startBossTackle();
            }
        } else if (this.cinematicPhase === 3 && ct >= 127.0) {
            this.cinematicPhase = 4;
            BossAttacks.clearAll();
            BossState.tackleState = 'idle';
            BossState.damageLock = true;
            if (darkness) darkness.classList.add('active');
        } else if (this.cinematicPhase === 4 && ct >= 141.0) {
            this.cinematicPhase = 5;
            if (darkness) darkness.classList.remove('active');
        } else if (this.cinematicPhase === 5 && ct >= 145.0) {
            this.cinematicPhase = 6;
            BossState.triggerAnimeImpactFrame();
            if (typeof SubphaseOrbitalFall !== 'undefined') SubphaseOrbitalFall.enter();
        } else if (this.cinematicPhase === 6 && ct >= 153.8) {
            this.cinematicPhase = 7;
            document.getElementById('plastic-horse-overlay')?.classList.add('show');
            document.getElementById('carton-sword-overlay')?.classList.add('show');
            BossState.startBossTackle();
        } else if (this.cinematicPhase === 7 && ct >= 164.0) {
            this.cinematicPhase = 8;
            BossState.triggerAnimeImpactFrame();
            if (typeof SubphaseOrbitalFall !== 'undefined') SubphaseOrbitalFall.exit();
            if (typeof SubphaseSurvival !== 'undefined') SubphaseSurvival.enter();
        } else if (this.cinematicPhase === 8) {
            if (typeof SubphaseSurvival !== 'undefined') SubphaseSurvival.update(ct);
            if (SubphaseSurvival.climaxTriggered) {
                this.cinematicPhase = 9;
                BossState.triggerAnimeImpactFrame();
            }
        } else if (this.cinematicPhase === 9 && ct >= 200.5) {
            this.cinematicPhase = 10;
            if (core) {
                core.classList.remove('core-dying-tremble');
                core.style.transition = 'opacity 2s ease, transform 2s ease';
                core.style.opacity = '0';
                setTimeout(() => { core.style.display = 'none'; core.style.opacity = '1'; }, 2000);
            }
            if (darkness) darkness.classList.add('active');
            AudioManager.stopBgm();
            setTimeout(() => this.triggerDefeatDialogueSequence(), 1600);
        }
    },

    triggerDefeatDialogueSequence() {
        const currentSession = this.activeSessionId;
        document.body.classList.remove('combat-no-cursor', 'phase-3-active', 'phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset', 'hyper-flashback', 'sepia-melancholy', 'glitch-flash', 'phase-3-shatter-zoom');
        const lyrics = document.getElementById('lyrics-container');
        if (lyrics) lyrics.innerHTML = '';

        ParticleEngine.startPetalRain(55);
        AudioManager.playBgm(BOSS_AUDIO_PATHS.endingBgm, 0.7, true);

        const defeatLines = [
            { text: "Cada espada que atravesó este núcleo... llevaba el peso de lo que callé por tanto tiempo.", tone: "low", time: 4000 },
            { text: "Creí que si alzaba suficientes muros, nadie volvería a lastimarme...", tone: "low", time: 4000 },
            { text: "Pero al final, sostener una armadura tan pesada duele más que dejarla caer.", tone: "mid", time: 4200 },
            { text: "Gracias por quedarte conmigo en medio de las cenizas... hasta el final de la canción.", tone: "mid", time: 4400 }
        ];

        let dIdx = 0;
        const playNextLine = () => {
            if (this.activeSessionId !== currentSession) return;
            if (dIdx < defeatLines.length) {
                const cur = defeatLines[dIdx];
                DialogueSystem.show({
                    text: cur.text,
                    speaker: "SAPHYNIEL",
                    tone: cur.tone,
                    autoHideTime: cur.time,
                    spriteMap: BOSS_SPRITES,
                    callback: () => { dIdx++; setTimeout(playNextLine, 350); }
                });
            } else {
                DialogueSystem.hide();
                const endScreen = document.getElementById('ending-screen');
                if (endScreen) {
                    endScreen.style.display = 'flex';
                    void endScreen.offsetWidth;
                    endScreen.classList.add('visible');
                }
                triggerCreditsSequence((choiceResult) => {
                    window.parent.postMessage({
                        type: 'BOSS_DEFEATED',
                        ending: choiceResult || 'SACRIFICE'
                    }, '*');
                });
            }
        };
        setTimeout(playNextLine, 900);
    },

    exit() {
        this.activeSessionId++;
        if (typeof SubphaseFlashback !== 'undefined') SubphaseFlashback.exit();
        if (typeof SubphaseOrbitalFall !== 'undefined') SubphaseOrbitalFall.exit();
        if (typeof SubphaseSurvival !== 'undefined') SubphaseSurvival.exit();
        BossAttacks.clearAll();
    }
};

BossEngine.register('phase3', Phase3);