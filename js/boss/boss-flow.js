const BossFlow = {
    phase3CameraInterval: null,
    currentSubText: "",
    subtitleLoopId: null,
    lastSpawnedBeatIndex: -1,

    // Beatmap de tiempos exactos (en segundos de la pista de audio de Fase 3) para spawn de bombas rítmicas
    phase3Beatmap: [
        119.2, 120.8, 122.4, 124.0, 125.6, 127.2, 128.8, 130.4,
        145.2, 146.0, 146.8, 147.5, 149.2, 150.0, 151.5,
        153.8, 155.5, 157.2, 159.0, 161.0, 163.0,
        164.2, 165.0, 165.8, 166.5, 167.3, 168.5, 169.8, 171.2, 172.5, 174.0, 175.5, 177.0, 179.0, 181.0, 183.0, 185.0
    ],

    triggerPhase2() {
        BossState.damageLock = true; 
        BossAttacks.clearAll();

        const sequence = [
            { text: "Creí que si construía algo hermoso, te quedarías a mirar.", speaker: "SAPHYNIEL", tone: "low", time: 3000 },
            { text: "No a demolerlo como si fuera un estorbo.", speaker: "SAPHYNIEL", tone: "low", time: 2800 },
            { text: "Si esto es lo único que entiendes, te lo daré sin adornos.", speaker: "SAPHYNIEL", tone: "low", time: 2600 }
        ];

        let sIdx = 0;
        const playSeq = () => {
            if (sIdx < sequence.length) {
                const item = sequence[sIdx];
                DialogueSystem.show({ text: item.text, speaker: item.speaker, tone: item.tone, autoHideTime: item.time, spriteMap: BOSS_SPRITES, callback: () => { sIdx++; setTimeout(playSeq, 300); }});
            } else {
                const bossTitle = document.getElementById('boss-title-name');
                if (bossTitle) bossTitle.textContent = "SAPHYNIEL // DIOSA TRANSCENDENTE"; 
                document.body.classList.add('phase-2-active');
                ScreenUtils.triggerShake(); 
                AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom);

                BossState.phase = 2; 
                BossState.maxHp = 500; 
                BossState.currentHp = 1;
                BossState.isInvulnerable = false;
                BossState.updateCoreSprite();

                AudioManager.playBgm(BOSS_AUDIO_PATHS.bgmPhase2);
                DialogueSystem.show({ text: "Mira lo que obligas a defender.", speaker: "SAPHYNIEL // DIVINO", tone: "angry", autoHideTime: 0, spriteMap: BOSS_SPRITES });

                let healInterval = setInterval(() => {
                    BossState.currentHp += 15; 
                    ScreenUtils.triggerShake(); 
                    ParticleEngine.explode(window.innerWidth / 2, window.innerHeight * 0.48, '#ff0000', 6);
                    if (BossState.currentHp >= BossState.maxHp) {
                        BossState.currentHp = BossState.maxHp; 
                        clearInterval(healInterval); 
                        BossState.damageLock = false;
                        BossAttacks.spawnShieldCrystal(); 
                        BossAttacks.bombSpawnerTimer = setInterval(() => BossAttacks.spawnBomb(), 2800); 
                        BossAttacks.qteSpawnerTimer = setInterval(() => BossAttacks.spawnQteCross(), 5500);
                        setTimeout(() => { 
                            const p5 = document.getElementById('p5-box');
                            if (p5) p5.classList.remove('active'); 
                        }, 1200);
                    }
                    BossState.updateHpBar();
                }, 60);
            }
        };
        playSeq();
    },

    triggerGoodEndingCutscene() {
        BossState.damageLock = true; 
        BossAttacks.clearAll(); 
        AudioManager.stopBgm();
        
        const core = document.getElementById('boss-core');
        if (core) core.style.display = 'none'; 
        const bossHud = document.getElementById('boss-hud');
        if (bossHud) bossHud.style.display = 'none'; 
        const playerHud = document.getElementById('player-hud');
        if (playerHud) playerHud.style.display = 'none';

        const silencio = document.getElementById('silencio-overlay');
        if (silencio) silencio.classList.add('show');
        AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom);

        setTimeout(() => {
            if (silencio) silencio.classList.remove('show');
            const darkness = document.getElementById('cinematic-darkness');
            if (darkness) darkness.classList.add('active'); 
            
            setTimeout(() => {
                DialogueSystem.show({
                    text: "...Dime algo con sinceridad.", 
                    speaker: "SAPHYNIEL", 
                    tone: "low", 
                    autoHideTime: 2600, 
                    spriteMap: BOSS_SPRITES,
                    callback: () => {
                        DialogueSystem.show({
                            text: "¿Te hizo sentir bien reducir mi espacio a esto?", 
                            speaker: "SAPHYNIEL", 
                            tone: "mid", 
                            autoHideTime: 0, 
                            spriteMap: BOSS_SPRITES,
                            callback: () => { 
                                const choices = document.getElementById('p5-choices');
                                if (choices) choices.classList.add('active'); 
                            }
                        });
                    }
                });
            }, 1000);
        }, 2500);
    },

    triggerBadEnding() {
        BossState.damageLock = true; 
        BossAttacks.clearAll(); 
        AudioManager.stopBgm();
        clearInterval(this.phase3CameraInterval); 
        cancelAnimationFrame(this.subtitleLoopId); 
        clearInterval(BossState.autoDamageInterval);
        
        document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset', 'glitch-flash', 'sepia-melancholy', 'hyper-flashback', 'phase-3-shatter-zoom');
        
        const lyrics = document.getElementById('lyrics-container');
        if (lyrics) lyrics.innerHTML = ''; 
        const core = document.getElementById('boss-core');
        if (core) core.style.display = 'none'; 
        const bossHud = document.getElementById('boss-hud');
        if (bossHud) bossHud.style.display = 'none'; 
        const playerHud = document.getElementById('player-hud');
        if (playerHud) playerHud.style.display = 'none';
        
        AudioManager.playAudio(BOSS_AUDIO_PATHS.defeatLaugh);
        const gameOverScreen = document.getElementById('game-over-screen'); 
        if (gameOverScreen) gameOverScreen.classList.add('visible'); 
        const retryBtn = document.getElementById('retry-btn');
        if (retryBtn) retryBtn.classList.remove('visible');

        const badEndingDialogues = [ 
            { text: "Todo ese esfuerzo... para terminar en silencio.", time: 2400, tone: "low" }, 
            { text: "Ni tú pudiste cambiar nada, ni yo pude hacer que te importara.", time: 2600, tone: "low" }, 
            { text: "¿Tiene caso reiniciar el ciclo, o solo vas a repetir lo mismo?", time: 0, tone: "mid" } 
        ];
        
        let lIdx = 0;
        const playSequence = () => {
            if (lIdx < badEndingDialogues.length) { 
                DialogueSystem.show({ 
                    text: badEndingDialogues[lIdx].text, 
                    speaker: "SAPHYNIEL", 
                    tone: badEndingDialogues[lIdx].tone, 
                    autoHideTime: badEndingDialogues[lIdx].time, 
                    spriteMap: BOSS_SPRITES, 
                    callback: () => { 
                        lIdx++; 
                        if (lIdx < badEndingDialogues.length) setTimeout(playSequence, 350); 
                        else if (retryBtn) retryBtn.classList.add('visible'); 
                    }
                }); 
            }
        };
        setTimeout(playSequence, 1200);
    },

    playFlashback() {
        const canvas = document.getElementById('flashback-canvas'); 
        if (!canvas) return;
        canvas.style.opacity = 1;
        const ctx = canvas.getContext('2d'); 
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight;
        const history = BossState.history; 
        if (!history || history.length === 0) return;

        const maxTime = history[history.length - 1].time || 1000, duration = 12450;
        const scale = maxTime / duration, startRealTime = performance.now();
        const sprite = new Image(); 
        sprite.src = BOSS_SPRITES.corePhase1_2;

        const drawLoop = (now) => {
            if (BossState.phase !== 3) return;
            const elapsed = now - startRealTime;
            if (elapsed > duration) { 
                canvas.style.opacity = 0; 
                ctx.clearRect(0,0,canvas.width,canvas.height); 
                return; 
            }

            const targetTime = elapsed * scale;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'; 
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const events = history.filter(h => h.time <= targetTime && !h.drawn);
            events.forEach(h => {
                h.drawn = true;
                if (h.type === 'move') {
                    const x = (h.x / 100) * canvas.width, y = (h.y / 100) * canvas.height;
                    ctx.save(); 
                    ctx.globalAlpha = 0.6; 
                    ctx.translate(x, y); 
                    ctx.drawImage(sprite, -40, -40, 80, 80); 
                    ctx.restore();
                } else if (h.type === 'hit') {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; 
                    ctx.beginPath(); 
                    ctx.arc(h.x, h.y, 35, 0, Math.PI * 2); 
                    ctx.fill();
                }
            });
            requestAnimationFrame(drawLoop);
        };
        requestAnimationFrame(drawLoop);
    },

    triggerPhase3Transcendence() {
        const darkness = document.getElementById('cinematic-darkness');
        if (darkness) darkness.classList.remove('active'); 
        document.body.classList.remove('phase-2-active'); 
        
        AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom);

        setTimeout(() => {
            document.body.classList.add('phase-3-active');
            
            BossState.phase = 3; 
            BossState.maxHp = 650; 
            BossState.currentHp = BossState.maxHp; 
            BossState.updateHpBar(); 
            BossState.damageLock = true; 
            BossState.isInvulnerable = false;
            BossState.weaponLost = false;
            BossState.updateCoreSprite();

            const core = document.getElementById('boss-core');
            if (core) core.style.display = 'none';
            const bossHud = document.getElementById('boss-hud');
            if (bossHud) bossHud.style.display = 'none';
            const playerHud = document.getElementById('player-hud');
            if (playerHud) playerHud.style.display = 'none';

            if (AudioManager.bgmTrack) AudioManager.bgmTrack.pause();
            AudioManager.bgmTrack = new Audio(BOSS_AUDIO_PATHS.bgmPhase3);
            const bgm = AudioManager.bgmTrack, mvContainer = document.getElementById('lyrics-container');

            let cinematicPhase = 0, lastCountdown = 0;
            const countdownTimes = [ { t: 141.2, txt: "1" }, { t: 142.0, txt: "2" }, { t: 142.8, txt: "1" }, { t: 143.4, txt: "2" }, { t: 144.0, txt: "3" }, { t: 144.6, txt: "4" } ];

            const directorLoop = () => {
                if (BossState.phase !== 3 || BossState.playerHp <= 0) return;
                this.subtitleLoopId = requestAnimationFrame(directorLoop);
                if (!bgm || bgm.paused || bgm.readyState < 2) return;
                const ct = bgm.currentTime;

                // Sincronización rítmica de bombas por Beatmap en fase activa
                if (cinematicPhase >= 3 && cinematicPhase <= 8) {
                    for (let i = this.lastSpawnedBeatIndex + 1; i < this.phase3Beatmap.length; i++) {
                        if (ct >= this.phase3Beatmap[i]) {
                            BossAttacks.spawnBomb();
                            this.lastSpawnedBeatIndex = i;
                            break;
                        }
                    }
                }

                if (typeof P3_SUBTITLES !== 'undefined' && mvContainer) {
                    const sub = P3_SUBTITLES.find(s => ct >= s.start && ct <= s.end);
                    if (sub) {
                        if (this.currentSubText !== sub.text) { 
                            this.currentSubText = sub.text; 
                            mvContainer.innerHTML = `<span class="mv-text-beat" data-text="${sub.text}">${sub.text}</span>`; 
                        }
                    } else { 
                        if (this.currentSubText !== "") { 
                            this.currentSubText = ""; 
                            mvContainer.innerHTML = ''; 
                        } 
                    }
                }

                if (cinematicPhase === 0 && ct >= 99.0) { 
                    cinematicPhase = 1; 
                    document.body.classList.remove('sepia-melancholy'); 
                    const title = document.getElementById('boss-title-name');
                    if (title) title.textContent = "SAPHYNIEL // COLAPSO DEL VACÍO";
                } 
                else if (cinematicPhase === 1 && ct >= 106.5) { 
                    cinematicPhase = 2;
                    document.body.classList.add('hyper-flashback'); 
                    DialogueSystem.hide(); 
                    this.playFlashback();
                }
                else if (cinematicPhase === 2 && ct >= 119.0) { 
                    cinematicPhase = 3;
                    document.body.classList.remove('hyper-flashback');
                    
                    if (core) {
                        core.style.display = 'flex'; 
                        core.style.top = '50%'; 
                        core.style.left = '50%'; 
                        core.style.transform = 'translate(-50%, -50%) scale(2.2)';
                    }
                    if (bossHud) bossHud.style.display = 'flex'; 
                    if (playerHud) playerHud.style.display = 'flex';

                    const aura = document.getElementById('boss-aura-farm');
                    if (aura) aura.classList.add('active');
                    bgm.volume = 0.9;

                    BossState.damageLock = false;
                    BossState.weaponLost = false;
                }
                else if (cinematicPhase === 3 && ct >= 127.0) {
                    cinematicPhase = 4;
                    if (darkness) darkness.classList.add('active');
                }
                else if (cinematicPhase === 4 && ct >= 141.0) {
                    cinematicPhase = 5;
                    if (darkness) darkness.classList.remove('active');
                }
                
                if (cinematicPhase >= 4 && cinematicPhase <= 6) {
                    const flash = countdownTimes.find(c => ct >= c.t && ct < c.t + 0.3 && lastCountdown !== c.t);
                    if (flash) {
                        lastCountdown = flash.t; 
                        const el = document.getElementById('countdown-flash');
                        if (el) {
                            el.textContent = flash.txt; 
                            el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
                        }
                    }
                }

                if (cinematicPhase === 5 && ct >= 145.0) {
                    cinematicPhase = 6;
                    const flash = document.getElementById('countdown-flash');
                    if (flash) flash.classList.remove('show');
                    
                    document.body.classList.add('glitch-flash');
                    setTimeout(() => document.body.classList.remove('glitch-flash'), 300);

                    const cannon = document.getElementById('orbital-cannon-drop');
                    if (cannon) cannon.classList.add('drop');
                    
                    BossAttacks.clearAll();
                    BossState.weaponLost = true;
                    BossState.currentHp = BossState.maxHp;
                    BossState.updateHpBar();
                    
                    const shield = document.getElementById('boss-shield');
                    if (shield) shield.classList.add('active', 'divine');

                    this.startPhase3CameraFX();

                    const standupText = document.getElementById('standup-text');
                    if (standupText) {
                        standupText.classList.remove('show'); void standupText.offsetWidth; standupText.classList.add('show');
                        setTimeout(() => standupText.classList.remove('show'), 3000);
                    }

                    setTimeout(() => {
                        AudioManager.playAudio(BOSS_AUDIO_PATHS.ecoOrbital);
                        ParticleEngine.explode(window.innerWidth/2, window.innerHeight*0.3, '#ffffff', 80);
                        ScreenUtils.triggerShake();
                        if (cannon) cannon.classList.remove('drop');
                        
                        const aura = document.getElementById('boss-aura-farm');
                        if (aura) aura.classList.add('max-power');
                    }, 800);
                }
                else if (cinematicPhase === 6 && ct >= 153.8) {
                    cinematicPhase = 7;
                    const heroText = document.getElementById('hero-text');
                    if (heroText) {
                        heroText.classList.remove('show'); void heroText.offsetWidth; heroText.classList.add('show');
                        setTimeout(() => heroText.classList.remove('show'), 3000);
                    }
                    const horseOverlay = document.getElementById('plastic-horse-overlay');
                    if(horseOverlay) horseOverlay.classList.add('show');
                    const swordOverlay = document.getElementById('carton-sword-overlay');
                    if(swordOverlay) swordOverlay.classList.add('show');
                }
                else if (cinematicPhase === 7 && ct >= 164.0) {
                    cinematicPhase = 8;
                    const horseOverlay = document.getElementById('plastic-horse-overlay');
                    if(horseOverlay) horseOverlay.classList.remove('show');
                    const swordOverlay = document.getElementById('carton-sword-overlay');
                    if(swordOverlay) swordOverlay.classList.remove('show');

                    BossAttacks.startSurvivalMode();
                    BossState.hpAtStart = BossState.maxHp;
                }
                else if (cinematicPhase === 8) {
                    if (ct <= 186.5) {
                        const progress = (ct - 164.0) / (186.5 - 164.0);
                        BossState.currentHp = Math.max(1, Math.round(BossState.hpAtStart * (1 - progress))); 
                        BossState.updateHpBar();

                        if (Math.random() < 0.12) ScreenUtils.triggerShake();
                    }
                    if (ct >= 186.5) {
                        cinematicPhase = 9;
                        BossAttacks.clearAll();
                        clearInterval(this.phase3CameraInterval);
                        document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b');
                        document.body.classList.add('phase-3-tilt-reset', 'phase-3-shatter-zoom');
                        
                        BossState.damageLock = true;
                        
                        if (core) {
                            core.style.top = '50%';
                            core.style.left = '50%';
                            core.style.pointerEvents = 'none';
                            core.classList.add('core-dying-tremble');
                        }
                        
                        const uiElements = document.querySelectorAll('.boss-hud-floating, .player-hud');
                        uiElements.forEach(el => el.style.opacity = '0');

                        const shield = document.getElementById('boss-shield');
                        if (shield) shield.classList.remove('active', 'divine');

                        AudioManager.playAudio(BOSS_AUDIO_PATHS.vineBoom); 
                        ScreenUtils.triggerShake();
                        ParticleEngine.explode(window.innerWidth/2, window.innerHeight/2, '#ffffff', 200);
                        
                        const unoText = document.getElementById('uno-text');
                        if (unoText) {
                            unoText.classList.remove('show'); void unoText.offsetWidth; unoText.classList.add('show');
                            setTimeout(() => unoText.classList.remove('show'), 3500);
                        }

                        document.body.classList.add('glitch-flash');
                        setTimeout(() => {
                            document.body.classList.remove('glitch-flash');
                            const aura = document.getElementById('boss-aura-farm');
                            if(aura) aura.classList.remove('active', 'max-power');
                        }, 400);

                        BossState.currentHp = 0; 
                        BossState.updateHpBar();
                    }
                }
                else if (cinematicPhase === 9 && ct >= 202.0) {
                    cinematicPhase = 10;
                    cancelAnimationFrame(this.subtitleLoopId);
                    
                    if (core) {
                        core.classList.remove('core-dying-tremble');
                        core.style.display = 'none';
                    }
                    
                    const darkness = document.getElementById('cinematic-darkness');
                    if (darkness) darkness.classList.add('active');

                    let fadeVol = bgm.volume;
                    const fadeInterval = setInterval(() => {
                        fadeVol = Math.max(0, fadeVol - 0.05);
                        if (bgm) bgm.volume = fadeVol;
                        if (fadeVol <= 0) {
                            clearInterval(fadeInterval);
                            bgm.pause();
                        }
                    }, 80);

                    setTimeout(() => {
                        this.triggerDefeatDialogueSequence();
                    }, 1200);
                }
            };
            this.subtitleLoopId = requestAnimationFrame(directorLoop);

            const startPhase3Audio = () => {
                bgm.currentTime = 99.0; 
                bgm.volume = 0.05; 
                bgm.play().catch(e => console.warn(e));
                document.body.classList.add('sepia-melancholy');
                let curVol = 0.05;
                const fadeIn = setInterval(() => { 
                    curVol = Math.min(0.65, curVol + 0.04); 
                    if (bgm) bgm.volume = curVol; 
                    if (curVol >= 0.65) clearInterval(fadeIn); 
                }, 80);
            };

            if (bgm.readyState >= 1) startPhase3Audio(); 
            else bgm.addEventListener('loadedmetadata', startPhase3Audio, { once: true });
        }, 1000);
    },

    startPhase3CameraFX() {
        clearInterval(this.phase3CameraInterval); 
        let step = 0;
        this.phase3CameraInterval = setInterval(() => {
            document.body.classList.remove('phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset');
            if (step === 0) { document.body.classList.add('phase-3-tilt-a'); step = 1; } 
            else if (step === 1) { document.body.classList.add('phase-3-tilt-reset'); step = 2; } 
            else if (step === 2) { document.body.classList.add('phase-3-tilt-b'); step = 3; } 
            else { document.body.classList.add('phase-3-tilt-reset'); step = 0; }
        }, 1200); 
    },

    triggerDefeatDialogueSequence() {
        document.body.classList.remove('phase-3-active', 'phase-3-tilt-a', 'phase-3-tilt-b', 'phase-3-tilt-reset', 'hyper-flashback', 'sepia-melancholy', 'glitch-flash', 'phase-3-shatter-zoom');
        
        const lyrics = document.getElementById('lyrics-container');
        if (lyrics) lyrics.innerHTML = '';

        AudioManager.playBgm(BOSS_AUDIO_PATHS.endingBgm, 0.7);

        const defeatLines = [
            { text: "Has borrado cada línea que me sostenía.", tone: "low", time: 4200 },
            { text: "Tantas estructuras... tantas leyes que creí eternas...", tone: "low", time: 4200 },
            { text: "Supongo que al final no se trataba de ser fuerte, sino de saber cuándo dejar ir.", tone: "mid", time: 4500 },
            { text: "Gracias por quedarte. Aunque haya sido para ver cómo caía todo.", tone: "mid", time: 4500 }
        ];

        let dIdx = 0;
        const playNextLine = () => {
            if (dIdx < defeatLines.length) {
                const cur = defeatLines[dIdx];
                DialogueSystem.show({
                    text: cur.text,
                    speaker: "SAPHYNIEL",
                    tone: cur.tone,
                    autoHideTime: cur.time,
                    spriteMap: BOSS_SPRITES,
                    callback: () => {
                        dIdx++;
                        setTimeout(playNextLine, 350);
                    }
                });
            } else {
                DialogueSystem.hide();
                const p5 = document.getElementById('p5-box');
                if (p5) p5.style.display = 'none';

                const endScreen = document.getElementById('ending-screen');
                if (endScreen) {
                    endScreen.style.display = 'flex';
                    void endScreen.offsetWidth;
                    endScreen.classList.add('visible');
                }

                triggerCreditsSequence(() => {
                    setTimeout(() => {
                        const bellEl = document.getElementById('end-record-final');
                        if (bellEl) {
                            bellEl.textContent = "SAPHYNIEL //";
                            bellEl.classList.add('active');
                            setTimeout(() => {
                                bellEl.classList.remove('active'); 
                                if (endScreen) endScreen.classList.remove('visible');
                                window.parent.postMessage({ type: 'BOSS_DEFEATED' }, window.location.origin === 'null' || window.location.protocol === 'file:' ? '*' : window.location.origin);
                            }, 4500);
                        }
                    }, 2000);
                });
            }
        };

        setTimeout(playNextLine, 600);
    }
};

document.getElementById('choice-yes').addEventListener('click', (e) => {
    e.stopPropagation(); 
    const choices = document.getElementById('p5-choices');
    if (choices) choices.classList.remove('active');
    DialogueSystem.show({
        text: "Al menos fuiste honesto. Gracias por no disfrazar tu indiferencia.", 
        speaker: "SAPHYNIEL", 
        tone: "mid", 
        autoHideTime: 3200, 
        spriteMap: BOSS_SPRITES,
        callback: () => { 
            setTimeout(() => { 
                window.parent.postMessage({ type: 'BOSS_DEFEATED' }, window.location.origin === 'null' || window.location.protocol === 'file:' ? '*' : window.location.origin); 
            }, 1000); 
        }
    });
});

document.getElementById('choice-no').addEventListener('click', (e) => {
    e.stopPropagation(); 
    const choices = document.getElementById('p5-choices');
    if (choices) choices.classList.remove('active');
    DialogueSystem.show({
        text: "Seguiste golpeando hasta el final. No finjas piedad ahora que ya no puedo defenderme.", 
        speaker: "SAPHYNIEL", 
        tone: "yandere", 
        autoHideTime: 3200, 
        spriteMap: BOSS_SPRITES,
        callback: () => { 
            const darkness = document.getElementById('cinematic-darkness');
            if (darkness) darkness.classList.add('active'); 
            BossFlow.triggerPhase3Transcendence(); 
        }
    });
});

document.getElementById('retry-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    window.location.reload(); 
});