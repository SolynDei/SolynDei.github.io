// ============================================================================
// ARCHIVO INDEPENDIENTE: js/boss/phases/phase-s/phase-s-ui-arena.js
// Implementa:
// 1. Reflector Teatral 100% anclado a tu nave en todo momento + Reflector de Saphyniel
// 2. Mariposas y Pétalos en Libertad (Al usar [E] o Escudo, los ataques se convierten
//    en mariposas luminosas que se dispersan hacia el cielo sin ir contra Saphyniel)
// 3. Sin hilo de curación: nuestras armas son únicamente defensivas
// ============================================================================
const PhaseSUIArena = {
    backdropEl: null,
    spotlightEl: null,
    blackoutEl: null,
    slotElements: [],
    purifiedSlotIds: new Set(),
    sacrificeComets: [],
    memoryRainWords: [],

    stageDust: [],
    freeButterflies: [],
    resonanceWaves: [],
    terminalLances: [],
    tarotCards: [],
    kindredWolf: null,
    parentOriginalTitle: null,
    lastFourthWallTick: 0,

    spotBossX: window.innerWidth / 2,
    spotBossY: window.innerHeight * 0.25,
    spotShipX: window.innerWidth / 2,
    spotShipY: window.innerHeight * 0.75,

    SLOTS_DATA: [
        { id: "ds", title: "VOZ EN LA PENUMBRA // DISCORD", tag: "[MEMORIA I]" },
        { id: "st", title: "NOCHES COMPARTIDAS // STEAM", tag: "[MEMORIA II]" },
        { id: "sp", title: "CANCIONES PARA NO OLVIDAR // AUDIO", tag: "[MEMORIA III]" },
        { id: "tk", title: "ECOS DE OTRO TIEMPO // ARCHIVO", tag: "[MEMORIA IV]" },
        { id: "yt", title: "FRAGMENTOS DE LUZ // VISIÓN", tag: "[MEMORIA V]" },
        { id: "lol", title: "NUNCA UNO SIN EL OTRO // PACTO", tag: "[MEMORIA VI]" }
    ],

    MELANCHOLIC_WORDS: [
        "NUNCA UNO SIN EL OTRO",
        "NO ME DEJES CAER",
        "EN SILENCIO Y ESPERANZA",
        "QUÉDATE UN POCO MÁS",
        "PROMESA INTACTA",
        "BAILEMOS HASTA EL FINAL",
        "SOLI DEO GLORIA",
        "DOS ALMAS EN EL ESCENARIO"
    ],

    FOURTH_WALL_THOUGHTS: [
        "SAPHYNIEL // ¿POR QUÉ NO DISPARASTE?",
        "SAPHYNIEL // RESISTE CONMIGO HASTA EL FINAL",
        "SAPHYNIEL // NUNCA UNO SIN EL OTRO",
        "SAPHYNIEL // NO TE SALGAS DE LA LUZ",
        "SAPHYNIEL // EL MUNDO ES UN ESCENARIO"
    ],

    initArenaDOM() {
        this.purifiedSlotIds.clear();
        this.sacrificeComets = [];
        this.memoryRainWords = [];
        this.freeButterflies = [];
        this.resonanceWaves = [];
        this.terminalLances = [];
        this.tarotCards = [];
        this.kindredWolf = null;

        this.stageDust = [];
        const dustCount = window.innerWidth <= 920 ? 22 : 52;
        for (let i = 0; i < dustCount; i++) {
            this.stageDust.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 0.45,
                vy: -0.25 - Math.random() * 0.55,
                size: 1.2 + Math.random() * 2.2,
                phase: Math.random() * Math.PI * 2
            });
        }

        try {
            if (window.parent && window.parent.document && !this.parentOriginalTitle) {
                this.parentOriginalTitle = window.parent.document.title;
            }
        } catch (e) {}

        if (!document.getElementById('phase-s-ui-backdrop')) {
            const backdrop = document.createElement('div');
            backdrop.id = 'phase-s-ui-backdrop';
            backdrop.className = 'phase-s-ui-backdrop';
            backdrop.innerHTML = `
                <div class="phase-s-hud-replica" id="phase-s-hud-replica">
                    <div class="ps-ui-left-col">
                        <div class="ps-ui-avatar-ring">
                            <span style="font-size:1.8rem; color:#e5c158;">❖</span>
                        </div>
                        <div class="ps-ui-name">SAPHYNIEL</div>
                        <div style="font-size:0.68rem; color:#8b8778; letter-spacing:2px;">ESCENARIO // MEMORIA VIVA</div>
                        <div class="ps-ui-bio" id="ps-ui-live-bio">
                            Lucerna pedibus meis verbum tuum et lumen semitis meis.<br>
                            In silentio et in spe erit fortitudo vestra.
                        </div>
                        <div class="ps-ui-rp-box">
                            <div style="color:#e5c158; margin-bottom:4px;">[BAILE DE DOS ALMAS]</div>
                            <div id="ps-ui-sync-status">RESISTE HASTA EL FINAL DE LA CANCIÓN...</div>
                        </div>
                    </div>
                    <div class="ps-ui-right-col">
                        <div class="ps-ui-tabs">
                            <div class="ps-ui-tab active" id="ps-tab-0">[MEMORIAS]</div>
                            <div class="ps-ui-tab" id="ps-tab-1">[KINDRED]</div>
                            <div class="ps-ui-tab" id="ps-tab-2">[SALMOS]</div>
                            <div class="ps-ui-tab" id="ps-tab-3">[CARTAS]</div>
                            <div class="ps-ui-tab" id="ps-tab-4">[MANDATOS]</div>
                        </div>
                        <div class="ps-ui-links-list" id="ps-ui-links-list"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(backdrop);
        }

        if (!document.getElementById('stage-spotlight-layer')) {
            const spot = document.createElement('div');
            spot.id = 'stage-spotlight-layer';
            spot.className = 'stage-spotlight-layer';
            document.body.appendChild(spot);
        }

        if (!document.getElementById('phase-s-blackout-ending')) {
            const blk = document.createElement('div');
            blk.id = 'phase-s-blackout-ending';
            blk.className = 'phase-s-blackout-ending';
            blk.innerHTML = `
                <div class="phase-s-blackout-subtitle">// TELÓN FINAL // PURIFICACIÓN COMPLETA [100%]</div>
                <div class="phase-s-blackout-title" id="phase-s-blackout-title">FINAL [S] // EL MUNDO ES UN ESCENARIO</div>
            `;
            document.body.appendChild(blk);
        }

        this.backdropEl = document.getElementById('phase-s-ui-backdrop');
        this.spotlightEl = document.getElementById('stage-spotlight-layer');
        this.blackoutEl = document.getElementById('phase-s-blackout-ending');
        if (this.blackoutEl) this.blackoutEl.classList.remove('active');
        this.renderSlots();
    },

    renderSlots() {
        const list = document.getElementById('ps-ui-links-list');
        if (!list) return;
        list.innerHTML = '';
        this.slotElements = [];

        this.SLOTS_DATA.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'ps-ui-link-slot';
            div.id = `ps-slot-${index}`;
            div.innerHTML = `
                <span>${item.title}</span>
                <span class="ps-slot-tag" style="font-size:0.68rem; color:#e5c158;">${item.tag}</span>
            `;
            list.appendChild(div);
            this.slotElements.push(div);
        });
    },

    // =========================================================================
    // PUNTO 5: REFLECTOR DE TEATRO SIGUIENDO E ILUMINANDO TU NAVE EN TODO MOMENTO
    // =========================================================================
    renderTheaterDanceSpotlights(dt, ctx, isEmotionalBlackout = false, isClimax = false) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const corePos = BossState.getBossCoreCenter();
        const pulse = (typeof AudioManager !== 'undefined') ? AudioManager.getAudioPulse() : 0;

        // El reflector de la nave sigue tus coordenadas exactas en todo momento sin desfase
        this.spotShipX = BossState.shipX;
        this.spotShipY = BossState.shipY;

        const lerpBoss = Math.min(1, dt * 9.0);
        this.spotBossX += (corePos.x - this.spotBossX) * lerpBoss;
        this.spotBossY += (corePos.y - this.spotBossY) * lerpBoss;

        ctx.save();
        const stageDarkness = isEmotionalBlackout ? 0.88 : (isClimax ? 0.42 : 0.62);
        ctx.fillStyle = `rgba(3, 3, 6, ${stageDarkness})`;
        ctx.fillRect(0, 0, w, h);

        ctx.globalCompositeOperation = 'lighter';

        const distBetweenDancers = Math.hypot(this.spotBossX - this.spotShipX, this.spotBossY - this.spotShipY);
        const mergeFactor = Math.max(0, 1 - distBetweenDancers / 320);

        const drawCone = (rigX, targetX, targetY, baseRadius, colInner, colOuter, isPlayerSpot = false) => {
            const dx = targetX - rigX;
            const dy = targetY - (-60);
            const angle = Math.atan2(dy, dx);
            const perpX = -Math.sin(angle);
            const perpY = Math.cos(angle);
            const r = baseRadius * (1 + pulse * 0.14 + mergeFactor * 0.22);

            const grad = ctx.createLinearGradient(rigX, -60, targetX, targetY + r * 0.7);
            grad.addColorStop(0, colInner);
            grad.addColorStop(0.7, colOuter);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(rigX - 16, -60);
            ctx.lineTo(rigX + 16, -60);
            ctx.lineTo(targetX + perpX * r, targetY + perpY * r * 0.48);
            ctx.lineTo(targetX - perpX * r, targetY - perpY * r * 0.48);
            ctx.closePath();
            ctx.fill();

            // Halo de piso que ilumina directamente la nave o a Saphyniel
            const floorGrad = ctx.createRadialGradient(targetX, targetY, 2, targetX, targetY, r * 1.15);
            floorGrad.addColorStop(0, isPlayerSpot ? 'rgba(255, 252, 235, 0.38)' : colInner);
            floorGrad.addColorStop(0.55, colOuter);
            floorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.save();
            ctx.translate(targetX, targetY);
            ctx.scale(1, 0.62);
            ctx.fillStyle = floorGrad;
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isPlayerSpot
                ? (BossState.solynCompanionActive ? 'rgba(255, 215, 0, 0.75)' : 'rgba(255, 255, 255, 0.55)')
                : 'rgba(229, 193, 88, 0.35)';
            ctx.lineWidth = isPlayerSpot ? 1.8 : 1.4;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        };

        // Reflector 1: Ilumina a Saphyniel
        drawCone(
            w * 0.24,
            this.spotBossX,
            this.spotBossY,
            window.innerWidth <= 920 ? 68 : 105,
            'rgba(255, 235, 175, 0.24)',
            'rgba(229, 193, 88, 0.08)',
            false
        );

        // Reflector 2: Sigue a tu nave en todo momento desde arriba
        const shipRigX = w * 0.5 + (this.spotShipX - w * 0.5) * 0.35;
        const shipColInner = BossState.solynCompanionActive
            ? 'rgba(255, 248, 215, 0.32)'
            : 'rgba(235, 245, 255, 0.28)';
        const shipColOuter = BossState.solynCompanionActive
            ? 'rgba(255, 215, 0, 0.11)'
            : 'rgba(190, 220, 255, 0.08)';

        drawCone(
            shipRigX,
            this.spotShipX,
            this.spotShipY,
            window.innerWidth <= 920 ? 64 : 96,
            shipColInner,
            shipColOuter,
            true
        );

        // Motas de polvo teatral iluminadas por los reflectores
        for (let i = 0; i < this.stageDust.length; i++) {
            const d = this.stageDust[i];
            d.phase += dt * 2.2;
            d.x += d.vx + Math.sin(d.phase) * 0.25;
            d.y += d.vy;
            if (d.y < -10) {
                d.y = h + 10;
                d.x = Math.random() * w;
            }
            const distB = Math.hypot(d.x - this.spotBossX, d.y - this.spotBossY);
            const distS = Math.hypot(d.x - this.spotShipX, d.y - this.spotShipY);
            if (distB < 150 || distS < 140) {
                ctx.fillStyle = 'rgba(255, 248, 220, 0.78)';
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    },

    // =========================================================================
    // PUNTO 3: MARIPOSAS Y PÉTALOS QUE SE DISPERSAN EN LIBERTAD (NO ATACAN NI CURAN)
    // =========================================================================
    spawnFreeButterflyBurst(originX, originY, count = 6) {
        const limit = window.innerWidth <= 920 ? Math.max(2, Math.floor(count * 0.6)) : count;
        for (let i = 0; i < limit; i++) {
            const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI * 1.4;
            const speed = 1.4 + Math.random() * 2.8;
            this.freeButterflies.push({
                x: originX + (Math.random() - 0.5) * 14,
                y: originY + (Math.random() - 0.5) * 14,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.8,
                size: (window.innerWidth <= 920 ? 5 : 7.5) + Math.random() * 3.5,
                flapPhase: Math.random() * Math.PI * 2,
                flapSpeed: 12 + Math.random() * 6,
                swayPhase: Math.random() * Math.PI * 2,
                isPetal: i % 3 === 0,
                color: i % 2 === 0 ? '#ffd700' : '#ffffff',
                life: 1.0,
                decay: 0.16 + Math.random() * 0.12
            });
        }
    },

    // Pulso Defensivo [E]: Convierte los ataques cercanos en una bandada de mariposas libres
    triggerAstralResonancePulse() {
        if (typeof AudioManager !== 'undefined') {
            AudioManager.astralResonancePulseSound();
            AudioManager.liturgicalChime();
        }
        if (typeof ScreenUtils !== 'undefined') ScreenUtils.triggerShake();
        if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(BossState.shipX, BossState.shipY, 1.5);
        BossState.triggerAnimeImpactFrame();

        this.resonanceWaves.push({
            x: BossState.shipX,
            y: BossState.shipY,
            radius: 12,
            maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.65,
            alpha: 1.0
        });

        let converted = 0;
        for (let i = BossAttacks.bullets.length - 1; i >= 0; i--) {
            const b = BossAttacks.bullets[i];
            if (Math.hypot(b.x - BossState.shipX, b.y - BossState.shipY) < 420) {
                this.spawnFreeButterflyBurst(b.x, b.y, 2);
                BossAttacks.bullets.splice(i, 1);
                converted++;
            }
        }
        for (let i = BossAttacks.lightSwords.length - 1; i >= 0; i--) {
            const ls = BossAttacks.lightSwords[i];
            if (Math.hypot(ls.x - BossState.shipX, ls.y - BossState.shipY) < 460) {
                this.spawnFreeButterflyBurst(ls.x, ls.y, 4);
                BossAttacks.lightSwords.splice(i, 1);
                converted++;
            }
        }

        if (converted < 6) {
            this.spawnFreeButterflyBurst(BossState.shipX, BossState.shipY, 14);
        }

        // Calmar cajas de memoria cercanas liberando mariposas
        BossAttacks.uiBoxes.forEach(box => {
            if (!box.purified && Math.hypot(box.x - BossState.shipX, box.y - BossState.shipY) < 380) {
                box.healProgress = box.maxHeal;
                box.purified = true;
                box.lifeTimer = 0.9;
                this.markSlotPurified(box.slotIndex);
                this.spawnFreeButterflyBurst(box.x, box.y, 8);
            }
        });
    },

    spawnKindredWolfAndLambHunt() {
        const fromLeft = Math.random() < 0.5;
        this.kindredWolf = {
            x: fromLeft ? -60 : window.innerWidth + 60,
            y: BossState.shipY + (Math.random() - 0.5) * 140,
            vx: 0,
            vy: 0,
            speed: window.innerWidth <= 920 ? 410 : 540,
            dashesLeft: 3,
            dashTimer: 0.65,
            state: 'stalk',
            lambX: window.innerWidth * (0.25 + Math.random() * 0.5),
            lambY: window.innerHeight * (0.45 + Math.random() * 0.3),
            lambRadius: window.innerWidth <= 920 ? 54 : 74,
            trail: []
        };
        if (typeof AudioManager !== 'undefined') {
            AudioManager.beep(190, 0.35, 'sawtooth', 0.05);
        }
    },

    spawnTerminalCommandBarrage() {
        const commands = [
            "> RM -RF /MEMORIA/SOLEDAD",
            "> SUDO KILL_PROCESS --MIEDO",
            "> CHMOD 000 /CORAZON/CORAZA",
            "> GIT REVERT --NO-COMMIT HERIDA",
            "> ECHO 'NO ME DEJES CAER'"
        ];
        const count = window.innerWidth <= 920 ? 3 : 4;
        for (let i = 0; i < count; i++) {
            const fromLeft = i % 2 === 0;
            const yPos = 120 + ((window.innerHeight - 220) / count) * i + Math.random() * 35;
            this.terminalLances.push({
                x: fromLeft ? -180 : window.innerWidth + 180,
                y: yPos,
                dir: fromLeft ? 1 : -1,
                speed: window.innerWidth <= 920 ? 11.5 : 15.5,
                warnTimer: 0.68,
                text: commands[i % commands.length]
            });
        }
        if (typeof AudioManager !== 'undefined') AudioManager.laserChargeSound();
    },

    spawnTarotJudgmentCards() {
        const cards = [
            { title: "COR SANCTUM", tier: "gold", color: "#ffd700" },
            { title: "ALPHA ET OMEGA", tier: "crimson", color: "#d9381e" },
            { title: "LUMEN SACRUM", tier: "silver", color: "#dad4bb" }
        ];
        this.tarotCards = cards.map((c, idx) => ({
            ...c,
            x: window.innerWidth * (0.24 + idx * 0.26),
            y: window.innerHeight * 0.28,
            flipTimer: 0.95 + idx * 0.35,
            lifeTimer: 2.6,
            triggered: false
        }));
        if (typeof AudioManager !== 'undefined') AudioManager.cardSlideSound();
    },

    corruptParentBrowserUI(songTime) {
        const now = performance.now();
        if (now - this.lastFourthWallTick < 1400) return;
        this.lastFourthWallTick = now;
        try {
            if (window.parent && window.parent.document) {
                const pDoc = window.parent.document;
                const msg = this.FOURTH_WALL_THOUGHTS[Math.floor(songTime / 4) % this.FOURTH_WALL_THOUGHTS.length];
                pDoc.title = msg;
                const clockEl = pDoc.getElementById('utc-clock');
                if (clockEl) {
                    clockEl.textContent = `LATIDO COMPARTIDO // T+${songTime.toFixed(1)}s`;
                }
            }
        } catch (e) {}
    },

    detachSlotAsEntity() {
        if (!this.slotElements.length) return;
        const unpurifiedIndices = this.slotElements
            .map((el, i) => (!el.classList.contains('detached') && !el.classList.contains('purified-slot') ? i : -1))
            .filter(i => i !== -1);

        const availableIndices = unpurifiedIndices.length > 0
            ? unpurifiedIndices
            : this.slotElements.map((el, i) => (!el.classList.contains('detached') ? i : -1)).filter(i => i !== -1);

        const idx = availableIndices.length > 0
            ? availableIndices[Math.floor(Math.random() * availableIndices.length)]
            : Math.floor(Math.random() * this.SLOTS_DATA.length);

        const slotEl = this.slotElements[idx];
        const data = this.SLOTS_DATA[idx];
        let startX = window.innerWidth / 2;
        let startY = window.innerHeight * 0.35;

        if (slotEl) {
            const r = slotEl.getBoundingClientRect();
            if (r.width > 0) {
                startX = r.left + r.width / 2;
                startY = r.top + r.height / 2;
            }
            slotEl.classList.add('detached');
        }

        const boxW = window.innerWidth <= 680 ? 175 : 225;
        const boxH = 44;
        const angle = Math.random() * Math.PI * 2;

        BossAttacks.uiBoxes.push({
            slotIndex: idx,
            id: data.id,
            x: startX,
            y: startY,
            vx: Math.cos(angle) * 2.0,
            vy: Math.sin(angle) * 1.7 + 0.55,
            w: boxW,
            h: boxH,
            title: data.title,
            sub: "MEMORIA EN PÁNICO",
            tag: data.tag,
            healProgress: 0,
            maxHeal: 100,
            purified: false,
            lifeTimer: 9.0,
            fireTimer: 1.25
        });
    },

    markSlotPurified(slotIndex) {
        const slotEl = this.slotElements[slotIndex];
        const data = this.SLOTS_DATA[slotIndex];
        if (slotEl) {
            slotEl.classList.remove('detached');
            slotEl.classList.add('purified-slot');
            const tag = slotEl.querySelector('.ps-slot-tag');
            if (tag) tag.textContent = '[LIBERADO ✦]';
        }
        if (data) {
            this.purifiedSlotIds.add(data.id);
            if (this.purifiedSlotIds.size >= this.SLOTS_DATA.length) {
                BossState.unlockCombatAchievementOnce('stage_critic', 'CRÍTICA DE LA PROPIA MEMORIA');
            }
        }
    },

    spawnHeartSacrificeComet(heartElement, targetX, targetY, labelText = null) {
        let startX = 80;
        let startY = 80;
        if (heartElement) {
            const r = heartElement.getBoundingClientRect();
            if (r.width > 0) {
                startX = r.left + r.width / 2;
                startY = r.top + r.height / 2;
            }
            heartElement.classList.add('sacrificed');
        }

        const tabIdx = this.sacrificeComets.length % 5;
        document.getElementById(`ps-tab-${tabIdx}`)?.classList.add('sacrificed-tab');

        // Los corazones sacrificados también liberan mariposas hacia el cielo
        this.spawnFreeButterflyBurst(startX, startY, 6);

        this.sacrificeComets.push({
            x: startX,
            y: startY,
            targetX,
            targetY,
            progress: 0,
            speed: 1.45,
            label: labelText,
            trail: []
        });

        if (typeof AudioManager !== 'undefined') {
            AudioManager.waterDropSound();
        }
    },

    spawnMemoryWordProjectile() {
        const text = this.MELANCHOLIC_WORDS[Math.floor(Math.random() * this.MELANCHOLIC_WORDS.length)];
        const margin = 90;
        const x = margin + Math.random() * (window.innerWidth - margin * 2);
        this.memoryRainWords.push({
            x,
            y: -30,
            vy: 3.4 + Math.random() * 1.8,
            text,
            alpha: 0.92
        });
    },

    updateAndRenderStageFX(dt, ctx) {
        const corePos = BossState.getBossCoreCenter();

        // A. Ondas Defensivas de Resonancia Astral [E]
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = this.resonanceWaves.length - 1; i >= 0; i--) {
            const rw = this.resonanceWaves[i];
            rw.radius += dt * 920;
            rw.alpha = Math.max(0, 1 - rw.radius / rw.maxRadius);
            if (rw.alpha <= 0) {
                this.resonanceWaves.splice(i, 1);
                continue;
            }
            ctx.strokeStyle = `rgba(255, 230, 150, ${rw.alpha * 0.85})`;
            ctx.lineWidth = 4 * rw.alpha + 1.2;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(rw.x, rw.y, rw.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // B. Mariposas y Pétalos que vuelan en libertad hacia el cielo y los bordes
        for (let i = this.freeButterflies.length - 1; i >= 0; i--) {
            const bf = this.freeButterflies[i];
            bf.flapPhase += dt * bf.flapSpeed;
            bf.swayPhase += dt * 3.2;
            bf.x += (bf.vx + Math.sin(bf.swayPhase) * 0.85) * (dt * 60);
            bf.y += (bf.vy - 0.35) * (dt * 60);
            bf.life -= bf.decay * dt;

            if (bf.life <= 0 || bf.y < -60 || bf.x < -60 || bf.x > window.innerWidth + 60) {
                this.freeButterflies.splice(i, 1);
                continue;
            }

            const heading = Math.atan2(bf.vy - 0.35, bf.vx) + Math.PI / 2;
            const wingFold = 0.25 + Math.abs(Math.sin(bf.flapPhase)) * 0.75;

            ctx.save();
            ctx.translate(bf.x, bf.y);
            ctx.rotate(heading);
            ctx.globalAlpha = Math.max(0, bf.life);
            ctx.fillStyle = bf.color;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 12;

            if (bf.isPetal) {
                ctx.beginPath();
                ctx.ellipse(0, 0, bf.size * 0.45, bf.size * 0.9, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Dibujo de las 4 alas de la mariposa luminosa aleteando en libertad
                [-1, 1].forEach(dir => {
                    ctx.save();
                    ctx.scale(dir * wingFold, 1);
                    ctx.beginPath();
                    ctx.moveTo(0, -2);
                    ctx.bezierCurveTo(bf.size * 1.4, -bf.size * 1.2, bf.size * 1.5, bf.size * 0.3, 0, bf.size * 0.2);
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(0, bf.size * 0.1);
                    ctx.bezierCurveTo(bf.size * 1.0, bf.size * 0.4, bf.size * 0.9, bf.size * 1.2, 0, bf.size * 0.8);
                    ctx.fill();
                    ctx.restore();
                });
            }
            ctx.restore();
        }
        ctx.restore();

        // C. Caza de Cordero y Lobo (Kindred Meta-Attack)
        if (this.kindredWolf) {
            const kw = this.kindredWolf;
            ctx.save();
            ctx.translate(kw.lambX, kw.lambY);
            ctx.strokeStyle = 'rgba(255, 235, 175, 0.75)';
            ctx.fillStyle = 'rgba(255, 235, 175, 0.08)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, 0, kw.lambRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.font = '9px "Share Tech Mono", monospace';
            ctx.fillStyle = '#e5c158';
            ctx.textAlign = 'center';
            ctx.fillText('❖ REFUGIO DEL CORDERO', 0, -kw.lambRadius - 6);
            ctx.restore();

            const insideLamb = Math.hypot(BossState.shipX - kw.lambX, BossState.shipY - kw.lambY) <= kw.lambRadius;
            if (insideLamb) {
                BossState.shieldCooldown = Math.max(0, BossState.shieldCooldown - dt * 1.5);
            }

            kw.dashTimer -= dt;
            if (kw.state === 'stalk') {
                const ang = Math.atan2(BossState.shipY - kw.y, BossState.shipX - kw.x);
                kw.vx = Math.cos(ang) * kw.speed * 1.35;
                kw.vy = Math.sin(ang) * kw.speed * 1.35;

                ctx.save();
                ctx.strokeStyle = 'rgba(217, 56, 30, 0.7)';
                ctx.setLineDash([8, 6]);
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(kw.x, kw.y);
                ctx.lineTo(BossState.shipX, BossState.shipY);
                ctx.stroke();
                ctx.restore();

                if (kw.dashTimer <= 0) {
                    kw.state = 'lunge';
                    kw.dashTimer = 0.55;
                    if (typeof AudioManager !== 'undefined') AudioManager.swordImpactSound();
                }
            } else if (kw.state === 'lunge') {
                kw.x += kw.vx * dt;
                kw.y += kw.vy * dt;
                kw.trail.push({ x: kw.x, y: kw.y });
                if (kw.trail.length > 12) kw.trail.shift();

                if (Math.hypot(kw.x - BossState.shipX, kw.y - BossState.shipY) < 28 && !insideLamb) {
                    BossState.tryHitPlayer(kw.x, kw.y);
                }

                if (kw.dashTimer <= 0) {
                    kw.dashesLeft--;
                    if (kw.dashesLeft <= 0) {
                        this.kindredWolf = null;
                    } else {
                        kw.state = 'stalk';
                        kw.dashTimer = 0.52;
                    }
                }
            }

            if (this.kindredWolf) {
                ctx.save();
                for (let t = 0; t < kw.trail.length; t++) {
                    const pt = kw.trail[t];
                    ctx.fillStyle = `rgba(184, 40, 24, ${(t / kw.trail.length) * 0.55})`;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 13 * (t / kw.trail.length), 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.translate(kw.x, kw.y);
                ctx.rotate(Math.atan2(kw.vy, kw.vx));
                ctx.scale(0.75, 0.75);
                ctx.fillStyle = '#140608';
                ctx.strokeStyle = '#d9381e';
                ctx.lineWidth = 2.5;
                ctx.shadowColor = '#d9381e';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.moveTo(26, 0);
                ctx.lineTo(-18, -16);
                ctx.lineTo(-10, 0);
                ctx.lineTo(-18, 16);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // D. Lanzas de Comandos de Terminal ([MANDATOS])
        for (let i = this.terminalLances.length - 1; i >= 0; i--) {
            const tl = this.terminalLances[i];
            if (tl.warnTimer > 0) {
                tl.warnTimer -= dt;
                ctx.save();
                ctx.fillStyle = 'rgba(217, 56, 30, 0.14)';
                ctx.fillRect(0, tl.y - 11, window.innerWidth, 22);
                ctx.font = 'bold 10px "Share Tech Mono", monospace';
                ctx.fillStyle = '#ff9e80';
                ctx.fillText(tl.text, 40, tl.y + 4);
                ctx.restore();
            } else {
                tl.x += tl.dir * tl.speed * (dt * 60);
                ctx.save();
                ctx.fillStyle = '#09090b';
                ctx.strokeStyle = '#e5c158';
                ctx.lineWidth = 1.6;
                ctx.fillRect(tl.x - 105, tl.y - 11, 210, 22);
                ctx.strokeRect(tl.x - 105, tl.y - 11, 210, 22);
                ctx.font = 'bold 10px "Share Tech Mono", monospace';
                ctx.fillStyle = '#f7f5ed';
                ctx.textAlign = 'center';
                ctx.fillText(tl.text, tl.x, tl.y + 4);
                ctx.restore();

                if (Math.abs(BossState.shipX - tl.x) < 100 && Math.abs(BossState.shipY - tl.y) < 15) {
                    BossState.tryHitPlayer(BossState.shipX, BossState.shipY);
                }
                if (tl.x < -300 || tl.x > window.innerWidth + 300) {
                    this.terminalLances.splice(i, 1);
                }
            }
        }

        // E. Cartas de Tarot 3D ([SALMOS])
        for (let i = this.tarotCards.length - 1; i >= 0; i--) {
            const tc = this.tarotCards[i];
            tc.flipTimer -= dt;
            tc.lifeTimer -= dt;
            const scaleX = Math.cos(Math.max(0, tc.flipTimer) * Math.PI) * 0.78;

            ctx.save();
            ctx.translate(tc.x, tc.y);
            ctx.scale(scaleX, 0.78);
            ctx.fillStyle = 'rgba(10, 10, 14, 0.92)';
            ctx.strokeStyle = tc.color;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = tc.color;
            ctx.shadowBlur = 18;
            ctx.fillRect(-48, -72, 96, 144);
            ctx.strokeRect(-48, -72, 96, 144);
            ctx.fillStyle = tc.color;
            ctx.font = 'bold 10px "Cinzel", serif';
            ctx.textAlign = 'center';
            ctx.fillText(tc.title, 0, 4);
            ctx.restore();

            if (tc.flipTimer <= 0 && !tc.triggered) {
                tc.triggered = true;
                if (typeof AudioManager !== 'undefined') AudioManager.playCardJingle(tc.tier);
                if (tc.tier === 'crimson') {
                    BossAttacks.spawnDanmakuRing(tc.x, tc.y, 12, 4.6, 'aimed');
                } else if (tc.tier === 'gold') {
                    BossAttacks.spawnArenaCrossingSwordVolley(3, 14.5);
                } else {
                    BossAttacks.spawnFaithOrb();
                }
            }

            if (tc.lifeTimer <= 0) {
                this.spawnFreeButterflyBurst(tc.x, tc.y, 6);
                this.tarotCards.splice(i, 1);
            }
        }

        // F. Cometas de Corazones Dorados sacrificados (Efecto visual de entrega en el Clímax)
        for (let i = this.sacrificeComets.length - 1; i >= 0; i--) {
            const c = this.sacrificeComets[i];
            c.progress = Math.min(1, c.progress + dt * c.speed);
            const ease = 1 - Math.pow(1 - c.progress, 3);

            const arcOffset = Math.sin(c.progress * Math.PI) * -90;
            const curX = c.x + (corePos.x - c.x) * ease;
            const curY = c.y + (corePos.y - c.y) * ease + arcOffset;

            c.trail.push({ x: curX, y: curY });
            if (c.trail.length > 14) c.trail.shift();

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let t = 0; t < c.trail.length; t++) {
                const pt = c.trail[t];
                ctx.fillStyle = `rgba(255, 215, 0, ${(t / c.trail.length) * 0.65})`;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, (t / c.trail.length) * 6, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.translate(curX, curY);
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
            ctx.font = 'bold 15px "Rajdhani", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('❤', 0, 5);

            if (c.label && c.progress < 0.78) {
                ctx.font = 'bold 10px "Share Tech Mono", monospace';
                ctx.fillStyle = '#ffd700';
                ctx.fillText(c.label, 0, -12);
            }
            ctx.restore();

            if (c.progress >= 1) {
                this.spawnFreeButterflyBurst(corePos.x, corePos.y, 8);
                if (typeof BalatroEngine !== 'undefined') BalatroEngine.triggerHit(corePos.x, corePos.y, 0.9);
                this.sacrificeComets.splice(i, 1);
            }
        }

        // G. Palabras de memoria en el Clímax
        for (let i = this.memoryRainWords.length - 1; i >= 0; i--) {
            const mw = this.memoryRainWords[i];
            mw.y += mw.vy * (dt * 60);

            if (mw.y > window.innerHeight + 50) {
                this.memoryRainWords.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.translate(mw.x, mw.y);
            ctx.font = 'bold 11px "Cinzel", serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(247, 245, 237, 0.9)';
            ctx.shadowColor = '#e5c158';
            ctx.shadowBlur = 10;
            ctx.fillText(mw.text, 0, 0);
            ctx.restore();

            if (Math.hypot(mw.x - BossState.shipX, mw.y - BossState.shipY) < 42) {
                this.spawnFreeButterflyBurst(mw.x, mw.y, 5);
                this.memoryRainWords.splice(i, 1);
            }
        }
    },

    updateSyncText(pct, companionActive) {
        const statusEl = document.getElementById('ps-ui-sync-status');
        if (!statusEl) return;
        if (companionActive) {
            statusEl.innerHTML = `<span style="color:#ffd700;">DOS ALMAS EN EL ESCENARIO // AUTOPURIFICACIÓN: ${pct}%</span>`;
        } else {
            statusEl.textContent = `RESISTE LA TORMENTA // AUTOPURIFICACIÓN DE SAPHYNIEL: ${pct}%`;
        }
    },

    cleanup() {
        this.sacrificeComets = [];
        this.memoryRainWords = [];
        this.freeButterflies = [];
        this.resonanceWaves = [];
        this.terminalLances = [];
        this.tarotCards = [];
        this.kindredWolf = null;
        if (this.blackoutEl) this.blackoutEl.classList.remove('active');
        try {
            if (window.parent && window.parent.document && this.parentOriginalTitle) {
                window.parent.document.title = this.parentOriginalTitle;
            }
        } catch (e) {}
        document.body.classList.remove(
            'phase-s-active',
            'phase-s-shattered',
            'phase-s-golden-union',
            'phase-s-union-freeze',
            'phase-s-spotlights',
            'phase-s-emotional-buildup',
            'phase-s-climax',
            'phase-s-purified-high',
            'phase-s-hud-hijack-left',
            'phase-s-hud-hijack-right',
            'phase-s-refusal-submerged'
        );
    }
};
window.PhaseSUIArena = PhaseSUIArena;