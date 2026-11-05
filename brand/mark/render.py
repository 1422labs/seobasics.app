"""Headless-Chrome rendering for the brand generators (Python 3 standard library only).

Chrome on macOS will not paint windows smaller than about 200 px, so small
renders are drawn at their exact size in the corner of a larger window and
cropped back out of the PNG.
"""
import os, shutil, struct, subprocess, sys, tempfile, zlib

MIN_WINDOW = 400

def chrome():
    for c in (os.environ.get("CHROME"), shutil.which("google-chrome"), shutil.which("chromium"),
              "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"):
        if c and os.path.exists(c):
            return c
    sys.exit("Google Chrome not found; set CHROME to its binary")

def _shot(url, png, w, h):
    subprocess.run([chrome(), "--headless=new", "--hide-scrollbars", "--disable-gpu",
                    "--force-device-scale-factor=1", "--default-background-color=00000000",
                    f"--window-size={w},{h}", f"--screenshot={png}", url],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def render(src, png, w, h=None):
    """Renders the SVG or HTML file `src` to a w x h PNG at device scale 1."""
    h = h or w
    if w >= MIN_WINDOW and h >= MIN_WINDOW:
        _shot("file://" + os.path.abspath(src), png, w, h)
    else:
        W, H = max(w, MIN_WINDOW), max(h, MIN_WINDOW)
        with tempfile.TemporaryDirectory() as tmp:
            page = os.path.join(tmp, "frame.html")
            with open(page, "w") as fh:
                fh.write(f'<!doctype html><body style="margin:0"><img src="file://{os.path.abspath(src)}" '
                         f'width="{w}" height="{h}" style="display:block"></body>')
            _shot("file://" + page, os.path.join(tmp, "big.png"), W, H)
            crop_png(os.path.join(tmp, "big.png"), png, w, h)
    with open(png, "rb") as fh:
        assert struct.unpack(">II", fh.read(24)[16:24]) == (w, h), f"{png}: wrong size"

def _chunks(data):
    i = 8
    while i < len(data):
        n, = struct.unpack(">I", data[i:i + 4])
        yield data[i + 4:i + 8], data[i + 8:i + 8 + n]
        i += 12 + n

def crop_png(src, dst, w, h):
    """Top-left w x h crop of an 8-bit RGB/RGBA non-interlaced PNG."""
    with open(src, "rb") as fh:
        data = fh.read()
    idat, ihdr = b"", None
    for kind, body in _chunks(data):
        if kind == b"IHDR": ihdr = body
        elif kind == b"IDAT": idat += body
    W, H, depth, ctype, _, _, interlace = struct.unpack(">IIBBBBB", ihdr)
    assert depth == 8 and ctype in (2, 6) and not interlace, "unsupported PNG"
    bpp = 4 if ctype == 6 else 3
    raw = zlib.decompress(idat)
    stride = W * bpp
    prev = bytearray(stride)
    rows = []
    for y in range(h):
        f = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        if f == 1:
            for x in range(bpp, stride): line[x] = (line[x] + line[x - bpp]) & 255
        elif f == 2:
            for x in range(stride): line[x] = (line[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                left = line[x - bpp] if x >= bpp else 0
                line[x] = (line[x] + ((left + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                b = prev[x]; c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c; pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[x] = (line[x] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        rows.append(bytes(line[:w * bpp]))
        prev = line

    def chunk(kind, body):
        return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body) & 0xFFFFFFFF)
    out = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, ctype, 0, 0, 0))
    out += chunk(b"IDAT", zlib.compress(b"".join(b"\x00" + r for r in rows), 9)) + chunk(b"IEND", b"")
    with open(dst, "wb") as fh:
        fh.write(out)
