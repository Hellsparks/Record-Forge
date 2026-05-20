# Record Forge

A browser-based editor for designing **printable LP record art**. Place album
art inside a vinyl-record template, add a scannable QR or Spotify Code, and
export a **circular PNG** ready to drop into [HueForge](https://hueforge.com)
for multi-colour 3D printing.

Everything runs in your browser — no server, no upload, no build step.

## Run it locally

Just open `index.html` in a browser (double-click it).

For the best experience (so drag-and-drop and `fetch` behave like they will
once hosted), serve it from a tiny local web server:

```powershell
# from the Record-Forge folder
python -m http.server 8000
# then open http://localhost:8000
```

## Host on GitHub Pages

1. Push these files to a GitHub repository.
2. Repo **Settings → Pages → Build from branch → `main` / root**.
3. Your editor is live at `https://<user>.github.io/<repo>/`.

## Features

- **Album art** — upload or drag-drop an image; scale, rotate, flip, brightness,
  contrast, saturation and a vintage/sepia tint. Drag the art on the canvas to
  position it; zoom + drag is your crop, since the circular frame trims the rest.
- **Record template** — vinyl colour, faint concentric grooves, border ring,
  and 5 soft "record shop" palette presets (or full custom colours).
- **Centre** — toggle a solid colour label on/off (off = black centre, more room
  for art), plus an optional real spindle-hole cutout.
- **Text** — separate artist and album fields with independent font, size, colour
  and alignment. Three layout modes per field:
  - *Straight* — single line, drag freely on the canvas.
  - *Wrap* — long text breaks into multiple lines at an adjustable width.
  - *Curve along record* — letters follow a circular arc at any radius; choose
    top or bottom arc side.
- **Scannable code** — paste any link; the type is auto-detected. Choose a
  **QR code** (always works, offline) or a real **Spotify Code** (needs a
  Spotify link + internet; falls back to QR automatically).
- **Badges** — Spotify / YouTube / Tidal / custom icon badges, draggable with
  a custom badge colour.
- **Free layout** — drag the album art, artist text, album text, code and
  badges anywhere on the canvas, or snap them to a 9-point quick-place grid.
- **Snap to align** — toggle smart snapping on/off. While dragging, elements
  snap to the canvas centre and to the X/Y of every other element; a blue guide
  line shows the active alignment axis. The true drag position is tracked
  underneath so you can drag straight past a snap without getting stuck.
- **Undo** — `Ctrl+Z` / `Cmd+Z` undoes the last drag move (up to 20 steps).
- **Export** — a transparent-cornered circular PNG at 1024 / 2048 / 3000 px, or
  a `.zip` project bundle (settings JSON + your original image + a rendered PNG)
  that you can re-load later with *Load project*.

## HueForge print size

A standard 12″ LP vinyl record is **305 mm** in diameter. When printing in
HueForge, set the print diameter to **305 mm** for a true 1:1 scale.

## Notes

- An internet connection is needed only for: the QR/ZIP libraries (jsDelivr
  CDN), the heading font, and live Spotify Codes. The editor itself works
  offline; QR codes and ZIP export need those two CDN scripts loaded once.
- Spotify Codes are fetched from Spotify's public `scannables.scdn.co` service.
  If it is unreachable, Record Forge silently uses a QR code instead.
