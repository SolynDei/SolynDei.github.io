import os
import re
import sys

DEFAULT_INPUT = "update.txt"

def apply_update(patch_file=DEFAULT_INPUT):
    if not os.path.exists(patch_file):
        print(f"[UpTTC ERROR] No se encontró el archivo de actualización: {patch_file}")
        sys.exit(1)

    with open(patch_file, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    pattern = re.compile(
        r"^===\s*FILE:\s*(.+?)\s*===\n([\s\S]*?)\n=== END FILE ===",
        re.MULTILINE
    )

    matches = list(pattern.finditer(content))

    if not matches:
        print("[UpTTC AVISO] No se detectaron bloques con el formato '=== FILE: ... ===' en el archivo.")
        sys.exit(0)

    success_count = 0

    for match in matches:
        rel_path = match.group(1).strip().replace("\\", "/")
        file_content = match.group(2)

        dirname = os.path.dirname(rel_path)
        if dirname:
            os.makedirs(dirname, exist_ok=True)

        with open(rel_path, "w", encoding="utf-8", newline="\n") as out:
            out.write(file_content)

        print(f"[UpTTC] Archivo escrito: {rel_path}")
        success_count += 1

    print(f"\n[UpTTC] Proceso finalizado. Se sincronizaron {success_count} archivo(s) correctamente.")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT
    apply_update(target)