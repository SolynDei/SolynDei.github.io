import os, sys, shutil, subprocess, io
try:
    from PIL import Image, ImageOps
    HAS_PIL = True
except Exception:
    HAS_PIL = False
SKIP_DIRS = {".git", "_backup_codex", "node_modules", "__pycache__", ".venv", "venv"}
def strip_jpeg(data):
    if len(data) < 4 or data[:2] != b"\xff\xd8": return data
    if HAS_PIL:
        try:
            im = Image.open(io.BytesIO(data))
            exif = im.getexif()
            if exif and exif.get(274, 1) != 1:
                im = ImageOps.exif_transpose(im)
                buf = io.BytesIO()
                im.save(buf, format="JPEG", quality=95, subsampling=0)
                return buf.getvalue()
        except Exception: pass
    out = bytearray(b"\xff\xd8"); i = 2; n = len(data)
    while i < n:
        if data[i] != 0xFF: return data
        while i < n and data[i] == 0xFF: i += 1
        if i >= n: break
        m = data[i]; i += 1
        if m == 0xDA:
            out.extend(b"\xff\xda"); out.extend(data[i:]); return bytes(out)
        if m == 0xD9:
            out.extend(b"\xff\xd9"); return bytes(out)
        if (0xD0 <= m <= 0xD7) or m == 0x01:
            out.extend(bytes([0xFF, m])); continue
        if i + 2 > n: return data
        ln = (data[i] << 8) | data[i+1]
        if ln < 2 or i + ln > n: return data
        if not ((0xE1 <= m <= 0xEF) or m == 0xFE):
            out.extend(bytes([0xFF, m])); out.extend(data[i:i+ln])
        i += ln
    return bytes(out)
def strip_png(data):
    sig = b"\x89PNG\r\n\x1a\n"
    if len(data) < 20 or not data.startswith(sig): return data
    drop = {b"tEXt", b"zTXt", b"iTXt", b"eXIf", b"tIME"}
    out = bytearray(sig); i = 8; n = len(data); iend = False
    while i + 12 <= n:
        ln = int.from_bytes(data[i:i+4], "big"); ct = data[i+4:i+8]; end = i + 12 + ln
        if end > n: return data
        if ct not in drop: out.extend(data[i:end])
        i = end
        if ct == b"IEND": iend = True; break
    return bytes(out) if iend else data
def strip_gif(data):
    if len(data) < 14 or data[:6] not in (b"GIF87a", b"GIF89a"): return data
    p = 13
    if data[10] & 0x80: p += 3 * (1 << ((data[10] & 7) + 1))
    if p > len(data): return data
    out = bytearray(data[:p]); n = len(data)
    while p < n:
        b = data[p]
        if b == 0x3B: out.append(0x3B); return bytes(out)
        elif b == 0x2C:
            s = p; p += 10
            if p > n: return data
            if data[s+9] & 0x80: p += 3 * (1 << ((data[s+9] & 7) + 1))
            p += 1
            while p < n and data[p] != 0: p += 1 + data[p]
            p += 1
            if p > n: return data
            out.extend(data[s:p])
        elif b == 0x21:
            if p + 2 >= n: return data
            s = p; lbl = data[p+1]; p += 2; app = b""
            if lbl == 0xFF and p < n: al = data[p]; app = data[p+1:p+1+al]
            while p < n and data[p] != 0: p += 1 + data[p]
            p += 1
            if p > n: return data
            if lbl == 0xFE: continue
            if lbl == 0xFF and not (app.startswith(b"NETSCAPE2.0") or app.startswith(b"ANIMEXTS1.0")): continue
            out.extend(data[s:p])
        else: return data
    return data
def strip_webp(data):
    if len(data) < 20 or data[:4] != b"RIFF" or data[8:12] != b"WEBP": return data
    body = bytearray(); p = 12; n = len(data)
    while p + 8 <= n:
        cid = data[p:p+4]; sz = int.from_bytes(data[p+4:p+8], "little"); end = p + 8 + sz + (sz & 1)
        if end > n: return data
        if cid in (b"EXIF", b"XMP "): p = end; continue
        chunk = bytearray(data[p:end])
        if cid == b"VP8X" and sz >= 10: chunk[8] &= ~0x0C
        body.extend(chunk); p = end
    return b"RIFF" + (len(body) + 4).to_bytes(4, "little") + b"WEBP" + bytes(body)
def clean_file(fp):
    ext = os.path.splitext(fp)[1].lower()
    if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
        with open(fp, "rb") as f: raw = f.read()
        new = strip_jpeg(raw) if ext in (".jpg",".jpeg") else (strip_png(raw) if ext==".png" else (strip_gif(raw) if ext==".gif" else strip_webp(raw)))
        if new != raw:
            with open(fp, "wb") as f: f.write(new)
            return True
        return False
    if ext in (".mp4", ".mov", ".webm", ".mkv"):
        ff = shutil.which("ffmpeg")
        if not ff: return False
        tmp = fp + ".clean_tmp" + ext
        r = subprocess.run([ff, "-y", "-i", fp, "-map_metadata", "-1", "-map_chapters", "-1", "-c", "copy", tmp], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if r.returncode == 0 and os.path.exists(tmp) and os.path.getsize(tmp) > 0:
            os.replace(tmp, fp); return True
        if os.path.exists(tmp): os.remove(tmp)
    return False
def main():
    root = sys.argv[1] if len(sys.argv) > 1 else "."
    scanned = 0; cleaned = 0
    for dp, dns, fns in os.walk(root):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            ext = os.path.splitext(fn)[1].lower()
            if ext in (".jpg",".jpeg",".png",".gif",".webp",".mp4",".mov",".webm",".mkv"):
                scanned += 1
                if clean_file(os.path.join(dp, fn)): cleaned += 1
    print(f"[META-CLEAN] Escaneados: {scanned} | Limpiados: {cleaned}")
if __name__ == "__main__": main()