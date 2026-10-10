"""Draws the LEVEL UP launcher icons and the Play Store graphics (no external assets). Run: python3 mobile/make-icons.py"""
import os
from PIL import Image, ImageDraw, ImageFont

BG = (6, 9, 20, 255)
NEON = (34, 230, 255, 255)
LIME = (163, 255, 79, 255)
ROOT = os.path.dirname(os.path.abspath(__file__))
RES = os.path.join(ROOT, "..", "android", "app", "src", "main", "res")


def mark(size, scale=1.0, bg=True, round_=False):
    s = 4  # supersample
    W = size * s
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if bg:
        if round_:
            d.ellipse([0, 0, W - 1, W - 1], fill=BG)
        else:
            d.rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * 0.22), fill=BG)
    c = W / 2
    h = W * 0.56 * scale

    def tri(k, dy=0.0):
        return [(c, c - h * 0.52 * k + dy), (c + h * 0.56 * k, c + h * 0.48 * k + dy), (c - h * 0.56 * k, c + h * 0.48 * k + dy)]

    layer = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.polygon(tri(1.0), fill=NEON)
    ld.polygon(tri(0.74, h * 0.035), fill=(0, 0, 0, 0))  # ImageDraw writes pixels directly: this cuts the hole
    ih = h * 0.36
    base = c + h * 0.48 * 0.74 + h * 0.035
    ld.polygon([(c, base - ih), (c + ih * 0.62, base), (c - ih * 0.62, base)], fill=LIME)
    img.alpha_composite(layer)
    return img.resize((size, size), Image.LANCZOS)


def main():
    legacy = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    fg = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}
    for dens, px in legacy.items():
        folder = os.path.join(RES, f"mipmap-{dens}")
        if not os.path.isdir(folder):
            continue
        mark(px).save(os.path.join(folder, "ic_launcher.png"))
        mark(px, round_=True).save(os.path.join(folder, "ic_launcher_round.png"))
        # adaptive icon foreground: transparent, artwork inside the 66/108 safe zone
        mark(fg[dens], scale=0.62, bg=False).save(os.path.join(folder, "ic_launcher_foreground.png"))
    store = os.path.join(ROOT, "store")
    os.makedirs(store, exist_ok=True)
    full = mark(512)
    flat = Image.new("RGBA", (512, 512), BG)
    flat.alpha_composite(full)
    flat.save(os.path.join(store, "play-icon-512.png"))
    # feature graphic 1024x500
    fgimg = Image.new("RGBA", (1024, 500), BG)
    d = ImageDraw.Draw(fgimg)
    for i in range(500):
        t = i / 500
        d.line([(0, i), (1024, i)], fill=(int(6 + 30 * t), int(9 + 10 * t), int(20 + 60 * t), 255))
    fgimg.alpha_composite(mark(300, bg=False), (90, 100))
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 96)
        small = ImageFont.truetype("DejaVuSans.ttf", 40)
    except OSError:
        font = small = ImageFont.load_default()
    d.text((440, 160), "LEVEL UP", font=font, fill=(232, 236, 255, 255))
    d.text((446, 285), "Learn by playing in 3D", font=small, fill=NEON)
    fgimg.convert("RGB").save(os.path.join(store, "feature-graphic-1024x500.png"))


if __name__ == "__main__":
    main()
