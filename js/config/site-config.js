// ============================================================================
// CONFIGURACIÓN CENTRAL DE SOLYNDEI.GITHUB.IO
// Edita aquí tu perfil, música, stickers/GIFs, juegos y conexión a Supabase.
// ============================================================================
window.SITE_CONFIG = {
    profile: {
        name: "SAPHYNIEL",
        pronouns: "she / her // perote",
        mood: "construyendo cosas entre código y ruido",
        avatar: "img/portraits/saphyniel_normal.png",
        bio: "Archivo personal, blog y laboratorio de experimentos web, mods, juegos y música. Entra sin prisa.",
        siteUrl: "https://solyndei.github.io/",
        discordId: "409107659153735680", // Auto-detectado para Lanyard API
        discordHandle: "tachydeuwi",
        blurbs: [
            {
                heading: "ABOUT ME // SOBRE MÍ",
                text: "Bienvenidx a mi rincón en la red. Aquí mezclo mi bio, un blog para subir fotos, clips e historias, mi música y los proyectos interactivos o videojuegos que voy programando."
            },
            {
                heading: "STATUS // QUÉ HAY AQUÍ",
                text: "Esta página está diseñada en arquitectura modular: puedes activar el modo LITE arriba si estás en una PC sin aceleración de hardware, o explorar el modo FULL con efectos interactivos."
            }
        ],
        interests: [
            { label: "GENERAL", value: "Programación, modding de videojuegos, diseño de interfaces raras, dibujo, Linux ricing y experimentos web." },
            { label: "VIDEOJUEGOS", value: "Project Zomboid, Helldivers 2, Genshin Impact, Zenless Zone Zero, Crimson Desert, League of Legends, NieR:Automata, Persona 5, Elden Ring." },
            { label: "MÚSICA", value: "Porter Robinson, Mili, inabakumori, Siinamota, Cafuné, Linkin Park, shoegaze, indie y soundtracks de videojuegos." },
            { label: "DISGUSTOS", value: "Interfaces lentas llenas de anuncios, reggaetón y código imposible de mantener." }
        ],
        socials: [
            { label: "DISCORD", tag: "COPY", action: "copy", value: "tachydeuwi" },
            { label: "STEAM", tag: "↗", url: "https://steamcommunity.com/id/tachydeuwi/" },
            { label: "SPOTIFY", tag: "↗", url: "https://open.spotify.com/user/8yev45n3zz6g3e3vt7xitm0k7?si=f02dbbfd08954943" },
            { label: "TIKTOK", tag: "↗", url: "https://www.tiktok.com/@sonieqwq" },
            { label: "YOUTUBE", tag: "↗", url: "https://www.youtube.com/watch?v=7x0aPZ8tQvA" },
            { label: "OP.GG", tag: "↗", url: "https://www.op.gg/summoners/lan/Tachy-YorHa" }
        ],
        champions: [
            { name: "KINDRED", role: "MAIN // JUNGLA", pts: "Maestría 38 • 385k pts", img: "img/champions/kindred.jpg" },
            { name: "SHYVANA", role: "BRUISER // AP", pts: "Maestría 22 • 216k pts", img: "img/champions/shyvana.jpg" },
            { name: "KAYLE", role: "SCALING // TOP", pts: "Maestría 15 • 138k pts", img: "img/champions/kayle.jpg" }
        ],
        // Puedes agregar etiquetas de texto o URLs de GIFs/stamps 88x31 aquí
        stamps: [
            { type: "chip", text: "NO SUBSCRIPTIONS" },
            { type: "chip", text: "HAND-CRAFTED CODE" },
            { type: "chip", text: "GITHUB PAGES" },
            { type: "chip", text: "PC & MOBILE READY" },
            { type: "chip", text: "YORHA ARCHIVE" },
            { type: "chip", text: "SOLYNDEI.GITHUB.IO" }
            // Ejemplo de stamp GIF: { type: "img", src: "https://tu-gif-aqui.gif", alt: "stamp" }
        ]
    },

    // GIFS / STICKERS FLOTANTES EN EL FONDO (SOLO PC EN MODO FULL)
    // Agrega aquí cualquier GIF local o URL externa que quieras ver flotando en los bordes
    floatingStickers: [
        // Ejemplo listo para descomentar cuando subas tus GIFs:
        // { src: "img/boss/boos_fase3.gif", top: "16%", left: "2%", width: "68px", duration: "7s" },
        // { src: "img/icons/eye.png", bottom: "14%", right: "2%", width: "54px", duration: "5.5s" }
    ],

    // PLAYLIST DEL REPRODUCTOR (USA TUS AUDIOS ACTUALES; PUEDES AGREGAR MÁS MP3)
    playlist: [
        { title: "Ending // Sanctuary", artist: "Saphyniel Archive", src: "audio/bgm/ending.mp3" },
        { title: "Encounter — Phase I", artist: "Saphyniel OST", src: "audio/bgm/boss-music-fase1.mp3" },
        { title: "Phase [S] — Alternative", artist: "Saphyniel OST", src: "audio/bgm/boss-music-fase-alternativa.mp3" }
    ],

    // ========================================================================
    // CONEXIÓN OPCIÓN 1: SUPABASE (SOLO LECTURA + LIKES/COMENTARIOS PÚBLICOS)
    // Cuando hagamos la app local en Python, solo pegas aquí tu URL y anonKey.
    // ========================================================================
    supabase: {
        url: "",
        anonKey: ""
    },

    // POSTS LOCALES DE PRUEBA (SE MUESTRAN MIENTRAS NO CONECTES SUPABASE)
    samplePosts: [
        {
            id: "local-001",
            title: "REWORK DEL ARCHIVO // BIENVENIDXS AL NUEVO PERFIL",
            category: "post",
            published_at: "2026-11-22T17:00:00",
            content: "Rediseño completo de la página: ahora funciona como perfil + blog modular con modo de bajo rendimiento (LITE) para equipos sin aceleración de hardware y una interfaz limpia para teléfonos.\n\nPróximo paso: conectar la app local de escritorio para publicar fotos, videos e historias en vivo sin tocar código.",
            media_url: "",
            tags: ["update", "codex", "blog"],
            likes_count: 1
        },
        {
            id: "local-002",
            title: "BOSSFIGHT DISPONIBLE EN LA ZONA ARCADE",
            category: "photo",
            published_at: "2026-11-20T22:30:00",
            content: "El encuentro contra Saphyniel ahora vive en la pestaña ARCADE y carga bajo demanda para mantener la página principal súper ligera.",
            media_url: "img/champions/kindred.jpg",
            tags: ["bossfight", "arcade", "showcase"],
            likes_count: 3
        }
    ],

    // ========================================================================
    // REGISTRO ESCALABLE DE VIDEOJUEGOS, PUZZLES Y MINIJUEGOS
    // Para añadir un juego nuevo en el futuro, solo agrega un objeto aquí.
    // ========================================================================
    arcade: [
        {
            id: "saphyniel-bossfight",
            title: "SAPHYNIEL // ENCOUNTER",
            status: "PLAYABLE",
            type: "iframe",
            src: "boss.html",
            sendStartMessage: true,
            thumb: "img/boss/core.png",
            description: "Bossfight bullet-heaven de 3 fases + ruta pacifista secreta Fase [S] con cinemáticas y música sincronizada.",
            tags: ["BOSSFIGHT", "BULLET-HEAVEN", "PC / MÓVIL"]
        },
        {
            id: "slot-puzzle-01",
            title: "SLOT_02 // PUZZLE MODULE",
            status: "COMING SOON",
            type: "placeholder",
            thumb: "img/icons/eye.png",
            description: "Espacio reservado para futuros puzzles, ARG o acertijos interactivos conectados al archivo.",
            tags: ["PUZZLE", "ESCALABLE"]
        },
        {
            id: "slot-minigame-02",
            title: "SLOT_03 // MINIGAME ENGINE",
            status: "COMING SOON",
            type: "placeholder",
            thumb: "img/icons/icon.png",
            description: "Espacio reservado para nuevos minijuegos o prototipos HTML5 independientes.",
            tags: ["MINIJUEGO", "HTML5"]
        }
    ]
};