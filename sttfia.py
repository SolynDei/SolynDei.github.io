import os

OUTPUT_SNAPSHOT = "project_snapshot.txt"

IGNORED_DIRS = {
    ".git",
    ".venv",
    "venv",
    "env",
    "__pycache__",
    "node_modules",
    ".idea",
    ".vscode",
    "dist",
    "build",
    "local_cache"
}

IGNORED_FILES = {
    "sttfia.py",
    "upttc.py",
    "project_snapshot.txt",
    "update.txt",
    ".DS_Store"
}

BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff",
    ".mp3", ".wav", ".ogg", ".flac", ".m4a",
    ".mp4", ".mkv", ".webm", ".avi", ".mov",
    ".exe", ".dll", ".so", ".dylib", ".bin", ".dat",
    ".zip", ".tar", ".gz", ".rar", ".7z",
    ".pdf", ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".srt"  # Opcional: ignorar volcado de texto crudo de subtítulos si ya usas subtitles.js
}

def is_binary_by_content(file_path, block_size=1024):
    try:
        with open(file_path, "rb") as f:
            chunk = f.read(block_size)
            if b"\x00" in chunk:
                return True
        return False
    except Exception:
        return True

def scan_project(root_dir="."):
    binary_files = []
    text_files = []

    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]

        for file in files:
            # Exclusión estricta de archivos de actualización y snapshot
            if file in IGNORED_FILES:
                continue
            if file.startswith("project_snapshot") or file.startswith("update"):
                continue

            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, root_dir).replace("\\", "/")

            _, ext = os.path.splitext(file)
            if ext.lower() in BINARY_EXTENSIONS or is_binary_by_content(full_path):
                binary_files.append(rel_path)
            else:
                text_files.append((rel_path, full_path))

    with open(OUTPUT_SNAPSHOT, "w", encoding="utf-8") as out:
        out.write("====================================================\n")
        out.write("      STTFIA - SCANNER TO TEXT FOR IA SNAPSHOT      \n")
        out.write("====================================================\n\n")

        out.write("=== [RECURSOS BINARIOS Y MULTIMEDIA DETECTADOS] ===\n")
        for b_file in sorted(binary_files):
            out.write(f"- {b_file}\n")
        out.write("=== [FIN DE RECURSOS BINARIOS] ===\n\n")

        out.write("=== [CONTENIDO DE CODIGO FUENTE Y ARCHIVOS DE TEXTO] ===\n\n")
        for rel_path, full_path in sorted(text_files, key=lambda x: x[0]):
            try:
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()
                out.write(f"=== FILE: {rel_path} ===\n")
                out.write(content)
                if not content.endswith("\n"):
                    out.write("\n")
                out.write("=== END FILE ===\n\n")
            except Exception as e:
                out.write(f"=== FILE: {rel_path} ===\n")
                out.write(f"[ERROR AL LEER ARCHIVO: {e}]\n")
                out.write("=== END FILE ===\n\n")

    print(f"[STTFIA] Snapshot generado exitosamente: {OUTPUT_SNAPSHOT}")
    print(f"         Archivos de texto volcados: {len(text_files)}")
    print(f"         Archivos binarios listados: {len(binary_files)}")

if __name__ == "__main__":
    scan_project()