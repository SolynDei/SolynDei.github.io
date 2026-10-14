// =========================================================
// MOTOR WEBGL YORHA / BALATRO CON REACTVIDAD DE AUDIO E IMPACTO
// =========================================================
const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_hitPos;
uniform float u_hitIntensity;
uniform float u_bossHpRatio;
uniform float u_audioPulse;
uniform float u_mode; // 0.0: Hub Normal, 1.0: Fallen/Phase2, 2.0: Phase3 Divine

void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);

    // Onda expansiva en coordenadas de impacto
    vec2 hitUV = (u_hitPos * 2.0 - 1.0) * vec2(u_resolution.x / min(u_resolution.x, u_resolution.y), u_resolution.y / min(u_resolution.x, u_resolution.y));
    float distToHit = length(uv - hitUV);
    float shockwave = sin(distToHit * 28.0 - u_time * 14.0) * exp(-distToHit * 4.5) * u_hitIntensity;
    uv += normalize(uv - hitUV + 0.0001) * shockwave * 0.12;

    // Distorsión fluida tipo NieR Black Box / Balatro
    float speed = 0.45 + u_audioPulse * 0.55 + (1.0 - u_bossHpRatio) * 0.35;
    float t = u_time * speed;
    vec2 p = uv * 1.6;
    for (float i = 1.0; i < 4.0; i++) {
        p.x += 0.28 / i * sin(i * 3.2 * p.y + t + 0.3 * i);
        p.y += 0.28 / i * cos(i * 3.2 * p.x + t + 0.5 * i);
    }

    // Retícula geométrica YoRHa
    vec2 gridUV = fract(uv * 6.0);
    float gridLine = step(0.96, gridUV.x) + step(0.96, gridUV.y);
    float ring = abs( length(uv) - (0.65 + u_audioPulse * 0.12) );
    float halo = smoothstep(0.02, 0.0, ring);

    // Paleta cromática según estado
    vec3 colObsidian = vec3(0.015, 0.015, 0.02);
    vec3 colYoRHa = vec3(0.855, 0.831, 0.733); // #dad4bb
    vec3 colCrimson = vec3(0.65, 0.08, 0.12);
    vec3 colDivine = vec3(0.97, 0.96, 0.93);

    vec3 accent = colYoRHa;
    if (u_mode > 0.5 && u_mode < 1.5) {
        accent = mix(colCrimson, vec3(1.0, 0.2, 0.2), u_audioPulse);
    } else if (u_mode >= 1.5) {
        accent = mix(colYoRHa, colDivine, 0.6 + u_audioPulse * 0.4);
    }

    float pattern = sin(p.x * 2.5 + p.y * 2.5) * 0.5 + 0.5;
    float swirl = smoothstep(0.35, 0.85, pattern);

    vec3 finalCol = mix(colObsidian, accent, swirl * (0.14 + u_audioPulse * 0.16));
    finalCol += accent * gridLine * 0.05;
    finalCol += accent * halo * (0.25 + u_hitIntensity * 0.5);

    // Aberración cromática por daño o impacto
    float glitch = (1.0 - u_bossHpRatio) * 0.035 + u_hitIntensity * 0.04;
    finalCol.r += sin(uv.y * 50.0 + u_time * 30.0) * glitch;
    finalCol.b -= cos(uv.x * 50.0 - u_time * 30.0) * glitch;

    // Viñeta diegética
    float vignette = smoothstep(1.45, 0.35, length(uv));
    finalCol *= vignette;

    gl_FragColor = vec4(finalCol, 0.95);
}
`;

const BalatroEngine = {
    canvas: null,
    gl: null,
    program: null,
    animId: null,
    startTime: 0,
    hitPos: [0.5, 0.5],
    hitIntensity: 0.0,
    audioPulse: 0.0,
    bossHpRatio: 1.0,
    mode: 0.0,
    uniforms: {},

    init(canvasId = 'balatro-canvas') {
        this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
        if (!this.canvas) return;

        this.gl = this.canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'default' });
        if (!this.gl) return;

        const vs = this.compileShader(this.gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
        const fs = this.compileShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
        if (!vs || !fs) return;

        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vs);
        this.gl.attachShader(this.program, fs);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) return;
        this.gl.useProgram(this.program);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
            this.gl.STATIC_DRAW
        );

        const posLoc = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(posLoc);
        this.gl.vertexAttribPointer(posLoc, 2, this.gl.FLOAT, false, 0, 0);

        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            hitPos: this.gl.getUniformLocation(this.program, 'u_hitPos'),
            hitIntensity: this.gl.getUniformLocation(this.program, 'u_hitIntensity'),
            bossHpRatio: this.gl.getUniformLocation(this.program, 'u_bossHpRatio'),
            audioPulse: this.gl.getUniformLocation(this.program, 'u_audioPulse'),
            mode: this.gl.getUniformLocation(this.program, 'u_mode')
        };

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.startTime = performance.now();
        this.render();
    },

    compileShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    },

    resize() {
        if (!this.canvas || !this.gl) return;
        const scale = window.innerWidth <= 680 ? 0.5 : 0.75; // Escalado inteligente de DPI
        this.canvas.width = Math.floor(window.innerWidth * scale);
        this.canvas.height = Math.floor(window.innerHeight * scale);
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    },

    triggerHit(x, y, intensity = 1.0) {
        this.hitPos = [x / window.innerWidth, 1.0 - (y / window.innerHeight)];
        this.hitIntensity = Math.min(1.8, intensity);
    },

    setAudioPulse(val) {
        this.audioPulse = val;
    },

    setBossHpRatio(ratio) {
        this.bossHpRatio = Math.max(0, Math.min(1, ratio));
    },

    setMode(modeVal) {
        this.mode = modeVal;
    },

    pause() {
        if (this.animId) {
            cancelAnimationFrame(this.animId);
            this.animId = null;
        }
    },

    render() {
        if (!this.gl || !this.program) return;

        const elapsed = (performance.now() - this.startTime) * 0.001;
        this.hitIntensity *= 0.91;

        if (typeof AudioManager !== 'undefined' && typeof AudioManager.getAudioPulse === 'function') {
            this.audioPulse = AudioManager.getAudioPulse();
        }

        if (document.body.classList.contains('phase-3-active') || document.body.classList.contains('transcended-world')) {
            this.mode = 2.0;
        } else if (document.body.classList.contains('phase-2-active') || document.body.classList.contains('fallen-mode')) {
            this.mode = 1.0;
        } else {
            this.mode = 0.0;
        }

        this.gl.useProgram(this.program);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.time, elapsed);
        this.gl.uniform2f(this.uniforms.hitPos, this.hitPos[0], this.hitPos[1]);
        this.gl.uniform1f(this.uniforms.hitIntensity, this.hitIntensity);
        this.gl.uniform1f(this.uniforms.bossHpRatio, this.bossHpRatio);
        this.gl.uniform1f(this.uniforms.audioPulse, this.audioPulse);
        this.gl.uniform1f(this.uniforms.mode, this.mode);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        this.animId = requestAnimationFrame(() => this.render());
    }
};

window.BalatroEngine = BalatroEngine;