/* =====================================================================
   Record Forge — LP record art generator
   Pure browser app. Renders a circular PNG you can drop into HueForge.
   ===================================================================== */

'use strict';

/* ---------- Defaults / state -------------------------------------- */

const PRESETS = {
  crate:    { vinylColor: '#2c2622', labelColor: '#cf9d5a', borderColor: '#e7d3a6', grooveColor: '#f3e4c4', textColor: '#3a2c1d', codeColor: '#2c2622', codeBackColor: '#f1e3c4' },
  sage:     { vinylColor: '#2a2c25', labelColor: '#8a9a6f', borderColor: '#d9d3b4', grooveColor: '#e9ecd6', textColor: '#2c3322', codeColor: '#2a2c25', codeBackColor: '#eef0dd' },
  rose:     { vinylColor: '#2b2422', labelColor: '#c97f73', borderColor: '#e8cdbf', grooveColor: '#f4ddd2', textColor: '#3a2420', codeColor: '#2b2422', codeBackColor: '#f2ddd3' },
  mustard:  { vinylColor: '#211d1a', labelColor: '#d39a2e', borderColor: '#e8d29a', grooveColor: '#f5e2b0', textColor: '#2a2114', codeColor: '#211d1a', codeBackColor: '#f3e2b4' },
  midnight: { vinylColor: '#1c1a19', labelColor: '#9a3b34', borderColor: '#cbb98f', grooveColor: '#d8d2c0', textColor: '#f0e3c8', codeColor: '#1c1a19', codeBackColor: '#efe6cf' },
};

/* Brand glyphs — exact simple-icons paths, 24x24 viewBox, filled with nonzero rule. */
const BRAND_PATHS = {
  spotify: 'M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z',
  youtube: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  tidal: 'M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zM16.042 7.996l3.979-3.979L24 7.996l-3.979 3.979z',
};
const _brandCache = {};
function brandPath(name) {
  if (!_brandCache[name]) _brandCache[name] = new Path2D(BRAND_PATHS[name]);
  return _brandCache[name];
}

/* Canvas text fonts — system stacks plus the one loaded web font (display). */
const FONTS = {
  serif:     "Georgia, 'Times New Roman', serif",
  display:   "'DM Serif Display', Georgia, serif",
  sans:      "'Helvetica Neue', Arial, sans-serif",
  condensed: "'Arial Narrow', 'Helvetica Neue', Arial, sans-serif",
  mono:      "'Courier New', Courier, monospace",
  script:    "'Brush Script MT', 'Segoe Script', 'Snell Roundhand', cursive",
};

const DEFAULTS = {
  projectName: 'My LP',
  scale: 1, rotate: 0, brightness: 1, contrast: 1, saturate: 1, sepia: 0,
  flipH: false, flipV: false, artX: 0, artY: 0,
  artArea: 'whole', innerRadius: 0.62,
  palette: 'crate',
  vinylColor: '#2c2622', grooves: true, grooveColor: '#f3e4c4', grooveOpacity: 0.12,
  borderToggle: true, borderColor: '#e7d3a6', borderWidth: 0.022,
  labelToggle: true, labelColor: '#cf9d5a', labelSize: 0.17, labelRings: true,
  spindle: false, spindleSize: 0.012,
  artist: 'Artist Name', artistFont: 'serif', artistSize: 0.045,
  artistColor: '#3a2c1d', artistAlign: 'center', artistX: 0, artistY: -0.03,
  album: 'Album Title', albumFont: 'serif', albumSize: 0.03,
  albumColor: '#3a2c1d', albumAlign: 'center', albumX: 0, albumY: 0.035,
  link: '', codeStyle: 'qr', codeColor: '#2c2622',
  codeBacking: true, codeBackColor: '#f1e3c4', codeSize: 0.2, codeX: 0, codeY: 0.3,
  badgeSpotify: false, badgeYouTube: false, badgeTidal: false,
  badgeCustomToggle: false, badgeCustomText: '', badgeColor: '#f1e3c4',
  badgeSize: 0.055, badgeX: 0, badgeY: 0.17,
  exportSize: 2048,
};

/* Fields driven by a single binding loop. disp = how the range value reads. */
const FIELDS = [
  { id: 'projectName',       key: 'projectName',       t: 'str'  },
  { id: 'scale',             key: 'scale',             t: 'num', disp: 'pct' },
  { id: 'rotate',            key: 'rotate',            t: 'num', disp: 'deg' },
  { id: 'brightness',        key: 'brightness',        t: 'num', disp: 'pct' },
  { id: 'contrast',          key: 'contrast',          t: 'num', disp: 'pct' },
  { id: 'saturate',          key: 'saturate',          t: 'num', disp: 'pct' },
  { id: 'sepia',             key: 'sepia',             t: 'num', disp: 'pct' },
  { id: 'artArea',           key: 'artArea',           t: 'str'  },
  { id: 'innerRadius',       key: 'innerRadius',       t: 'num', disp: 'pct' },
  { id: 'palette',           key: 'palette',           t: 'str'  },
  { id: 'vinylColor',        key: 'vinylColor',        t: 'str'  },
  { id: 'grooves',           key: 'grooves',           t: 'bool' },
  { id: 'grooveColor',       key: 'grooveColor',       t: 'str'  },
  { id: 'grooveOpacity',     key: 'grooveOpacity',     t: 'num', disp: 'pct' },
  { id: 'borderToggle',      key: 'borderToggle',      t: 'bool' },
  { id: 'borderColor',       key: 'borderColor',       t: 'str'  },
  { id: 'borderWidth',       key: 'borderWidth',       t: 'num', disp: 'pct' },
  { id: 'labelToggle',       key: 'labelToggle',       t: 'bool' },
  { id: 'labelColor',        key: 'labelColor',        t: 'str'  },
  { id: 'labelSize',         key: 'labelSize',         t: 'num', disp: 'pct' },
  { id: 'labelRings',        key: 'labelRings',        t: 'bool' },
  { id: 'spindle',           key: 'spindle',           t: 'bool' },
  { id: 'spindleSize',       key: 'spindleSize',       t: 'num', disp: 'pct' },
  { id: 'artist',            key: 'artist',            t: 'str'  },
  { id: 'artistFont',        key: 'artistFont',        t: 'str'  },
  { id: 'artistAlign',       key: 'artistAlign',       t: 'str'  },
  { id: 'artistSize',        key: 'artistSize',        t: 'num', disp: 'pct' },
  { id: 'artistColor',       key: 'artistColor',       t: 'str'  },
  { id: 'album',             key: 'album',             t: 'str'  },
  { id: 'albumFont',         key: 'albumFont',         t: 'str'  },
  { id: 'albumAlign',        key: 'albumAlign',        t: 'str'  },
  { id: 'albumSize',         key: 'albumSize',         t: 'num', disp: 'pct' },
  { id: 'albumColor',        key: 'albumColor',        t: 'str'  },
  { id: 'link',              key: 'link',              t: 'str'  },
  { id: 'codeStyle',         key: 'codeStyle',         t: 'str'  },
  { id: 'codeColor',         key: 'codeColor',         t: 'str'  },
  { id: 'codeBacking',       key: 'codeBacking',       t: 'bool' },
  { id: 'codeBackColor',     key: 'codeBackColor',     t: 'str'  },
  { id: 'codeSize',          key: 'codeSize',          t: 'num', disp: 'pct' },
  { id: 'badgeSpotify',      key: 'badgeSpotify',      t: 'bool' },
  { id: 'badgeYouTube',      key: 'badgeYouTube',      t: 'bool' },
  { id: 'badgeTidal',        key: 'badgeTidal',        t: 'bool' },
  { id: 'badgeCustomToggle', key: 'badgeCustomToggle', t: 'bool' },
  { id: 'badgeCustomText',   key: 'badgeCustomText',   t: 'str'  },
  { id: 'badgeColor',        key: 'badgeColor',        t: 'str'  },
  { id: 'badgeSize',         key: 'badgeSize',         t: 'num', disp: 'pct' },
  { id: 'exportSize',        key: 'exportSize',        t: 'num' },
];

const COLOR_KEYS = ['vinylColor', 'labelColor', 'borderColor', 'grooveColor', 'artistColor', 'albumColor', 'codeColor', 'codeBackColor'];
const CODE_KEYS  = ['link', 'codeStyle', 'codeColor', 'codeBacking', 'codeBackColor'];

let state = freshState();
function freshState() {
  return Object.assign({}, structuredClone(DEFAULTS), {
    image: null, imageBlob: null, imageName: null, code: null,
    _active: null, _hover: null,
  });
}

const PREVIEW_S = 1600;
const canvas = document.getElementById('canvas');
const pctx = canvas.getContext('2d');

let hitboxes = [];      // draggable element boxes, in preview coordinates
let recordHits = true;  // only collect hitboxes for the on-screen preview
function pushHit(el, cx, cy, hw, hh) {
  if (recordHits) hitboxes.push({ el, cx, cy, hw, hh });
}

/* ---------- Small helpers ----------------------------------------- */

const $ = (id) => document.getElementById(id);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function fmt(disp, v) {
  if (disp === 'pct') return Math.round(v * 100) + '%';
  if (disp === 'deg') return Math.round(v) + '°';
  return String(v);
}

function setStatus(msg) { $('status').innerHTML = msg; }

function rgb(hex) {
  let h = (hex || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function luminance(hex) {
  const [r, g, b] = rgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function mix(hex1, hex2, t) {
  const a = rgb(hex1), b = rgb(hex2);
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

function circle(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); }
function roundRect(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImg(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('image load failed'));
    i.src = src;
  });
}

/* ---------- Link detection ---------------------------------------- */

function detectLink(value) {
  const s = (value || '').trim().toLowerCase();
  if (!s) return { type: 'none', label: '—' };
  if (s.includes('music.youtube')) return { type: 'youtube', label: 'YouTube Music' };
  if (s.includes('spotify')) return { type: 'spotify', label: 'Spotify' };
  if (s.includes('youtube.com') || s.includes('youtu.be')) return { type: 'youtube', label: 'YouTube' };
  if (s.includes('tidal.com')) return { type: 'tidal', label: 'Tidal' };
  if (s.includes('music.apple.com') || s.includes('itunes.apple')) return { type: 'apple', label: 'Apple Music' };
  if (s.includes('deezer.com')) return { type: 'deezer', label: 'Deezer' };
  if (s.includes('bandcamp.com')) return { type: 'bandcamp', label: 'Bandcamp' };
  if (s.includes('soundcloud.com')) return { type: 'soundcloud', label: 'SoundCloud' };
  if (/^https?:\/\//.test(s) || /^[\w.-]+\.[a-z]{2,}/.test(s)) return { type: 'url', label: 'Web link' };
  return { type: 'text', label: 'Plain text' };
}

function spotifyUri(link) {
  let m = link.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|artist|episode|show)\/([A-Za-z0-9]+)/i);
  if (m) return `spotify:${m[1].toLowerCase()}:${m[2]}`;
  m = link.match(/^spotify:(track|album|playlist|artist|episode|show):([A-Za-z0-9]+)/i);
  if (m) return `spotify:${m[1].toLowerCase()}:${m[2]}`;
  return null;
}

/* ---------- Code generation (QR / Spotify Code) ------------------- */

let codeTimer = 0;
let codeToken = 0;

function makeQR(text) {
  return new Promise((res, rej) => {
    if (!window.QRCode) { rej(new Error('QR library not loaded')); return; }
    const c = document.createElement('canvas');
    QRCode.toCanvas(c, text, {
      margin: 1,
      width: 700,
      errorCorrectionLevel: 'M',
      color: { dark: state.codeColor, light: state.codeBacking ? state.codeBackColor : '#ffffff00' },
    }, (err) => (err ? rej(err) : res(c)));
  });
}

async function fetchSpotifyCode(uri) {
  const bg = state.codeBacking ? state.codeBackColor : '#ffffff';
  const bar = luminance(bg) < 0.5 ? 'white' : 'black';
  const url = `https://scannables.scdn.co/uri/plain/png/${bg.replace('#', '')}/${bar}/640/${uri}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('spotify scannable request failed');
  const objUrl = URL.createObjectURL(await res.blob());
  return loadImg(objUrl); // blob URL is same-origin: drawing it never taints the canvas
}

function scheduleCodeRegen() {
  clearTimeout(codeTimer);
  codeTimer = setTimeout(regenerateCode, 240);
}

async function regenerateCode() {
  clearTimeout(codeTimer);
  const token = ++codeToken;
  const link = state.link.trim();
  if (!link) { state.code = null; requestRender(); return; }

  let style = state.codeStyle;
  if (style === 'spotify') {
    const uri = spotifyUri(link);
    if (!uri) {
      setStatus('Spotify Code needs a Spotify link — generated a QR code instead.');
      style = 'qr';
    } else {
      try {
        const img = await fetchSpotifyCode(uri);
        if (token !== codeToken) return;
        state.code = { kind: 'spotify', img, aspect: img.naturalWidth / img.naturalHeight };
        setStatus('Spotify Code ready.');
        requestRender();
        return;
      } catch (e) {
        setStatus('Could not reach Spotify (offline or blocked) — used a QR code instead.');
        style = 'qr';
      }
    }
  }
  try {
    const c = await makeQR(link);
    if (token !== codeToken) return;
    state.code = { kind: 'qr', img: c, aspect: 1 };
  } catch (e) {
    if (token !== codeToken) return;
    state.code = null;
    setStatus('Could not generate a code: ' + e.message);
  }
  requestRender();
}

/* ---------- Geometry ---------------------------------------------- */

function geom(S) {
  const cx = S / 2, cy = S / 2;
  const recordR = S * 0.487;
  const borderW = state.borderToggle ? state.borderWidth * S : 0;
  const innerR = Math.min(recordR - borderW - 2, state.innerRadius * recordR);
  const labelR = state.labelSize * S;
  const spindleR = Math.max(2, state.spindleSize * S);
  return { cx, cy, recordR, borderW, innerR, labelR, spindleR };
}

/* ---------- Scene rendering --------------------------------------- */

function renderScene(ctx, S, opts) {
  const g = 1;
  const G = geom(S);
  recordHits = !opts.isExport;
  if (recordHits) hitboxes.length = 0;
  ctx.clearRect(0, 0, S, S);

  // 1. Vinyl disc (the "black part")
  ctx.save();
  ctx.fillStyle = state.vinylColor;
  circle(ctx, G.cx, G.cy, G.recordR);
  ctx.fill();
  ctx.restore();

  // 2. Album art, clipped to the record (or inner circle)
  drawArt(ctx, S, G);

  // 3. Faint concentric grooves
  if (state.grooves) drawGrooves(ctx, S, G, g);

  // 4. Centre label
  if (state.labelToggle) drawLabel(ctx, S, G, g);

  // 5. Text — artist and album are independent, draggable elements
  if (state.artist) drawTextLine(ctx, S, G, g, 'artist');
  if (state.album) drawTextLine(ctx, S, G, g, 'album');

  // 6. Scannable code
  if (state.code && state.code.img) drawCode(ctx, S, G, g);

  // 7. Badges
  drawBadges(ctx, S, G, g);

  // 8. Border ring
  if (state.borderToggle) drawBorder(ctx, S, G, g);

  // 9. Spindle hole — punches a real transparent cutout, so it goes last
  if (state.spindle) drawSpindle(ctx, S, G);

  // 10. Placement cue & selection outline (preview only)
  if (!state.image && !opts.isExport) drawPlaceholder(ctx, S, G);
  if (!opts.isExport) drawHighlight(ctx, S, G);
}

function drawArt(ctx, S, G) {
  if (!state.image) return;
  const img = state.image;
  const clipR = state.artArea === 'inner' ? G.innerR : G.recordR - G.borderW;
  ctx.save();
  circle(ctx, G.cx, G.cy, clipR);
  ctx.clip();
  const ax = G.cx + state.artX * S;
  const ay = G.cy + state.artY * S;
  const cover = (clipR * 2) / Math.min(img.width, img.height);
  const sc = cover * state.scale;
  ctx.filter = `brightness(${state.brightness}) contrast(${state.contrast}) saturate(${state.saturate}) sepia(${state.sepia})`;
  ctx.translate(ax, ay);
  ctx.rotate((state.rotate * Math.PI) / 180);
  ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);
  ctx.drawImage(img, -img.width * sc / 2, -img.height * sc / 2, img.width * sc, img.height * sc);
  ctx.restore();

  if (state.artArea === 'inner') {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = Math.max(1, S * 0.0022);
    circle(ctx, G.cx, G.cy, G.innerR);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGrooves(ctx, S, G, g) {
  const outer = G.recordR * 0.985;
  const inner = (state.labelToggle ? G.labelR : S * 0.05) * 1.08;
  const gap = S * 0.011;
  ctx.save();
  ctx.globalAlpha = g * state.grooveOpacity;
  ctx.strokeStyle = state.grooveColor;
  ctx.lineWidth = Math.max(1, S * 0.0016);
  for (let r = outer; r > inner; r -= gap) {
    circle(ctx, G.cx, G.cy, r);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLabel(ctx, S, G, g) {
  ctx.save();
  ctx.globalAlpha = g;
  ctx.fillStyle = state.labelColor;
  circle(ctx, G.cx, G.cy, G.labelR);
  ctx.fill();
  if (state.labelRings) {
    ctx.globalAlpha = g * 0.55;
    ctx.strokeStyle = mix(state.labelColor, '#000000', 0.22);
    ctx.lineWidth = Math.max(1, S * 0.0018);
    for (let r = G.labelR * 0.85; r > G.labelR * 0.28; r -= S * 0.017) {
      circle(ctx, G.cx, G.cy, r);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = g * 0.4;
  ctx.strokeStyle = 'rgba(0,0,0,.4)';
  ctx.lineWidth = Math.max(1, S * 0.0022);
  circle(ctx, G.cx, G.cy, G.labelR);
  ctx.stroke();
  ctx.restore();
}

function drawTextLine(ctx, S, G, g, prefix) {
  const txt = state[prefix];
  const fs = state[prefix + 'Size'] * S;
  const fam = FONTS[state[prefix + 'Font']] || FONTS.serif;
  const cx = G.cx + state[prefix + 'X'] * S;
  const cy = G.cy + state[prefix + 'Y'] * S;
  const weight = prefix === 'artist' ? 600 : 500;

  ctx.save();
  ctx.font = `${weight} ${fs}px ${fam}`;
  const w = ctx.measureText(txt).width;
  const align = state[prefix + 'Align'];
  let ax;
  if (align === 'left')       { ax = cx - w / 2; ctx.textAlign = 'left'; }
  else if (align === 'right') { ax = cx + w / 2; ctx.textAlign = 'right'; }
  else                        { ax = cx; ctx.textAlign = 'center'; }
  ctx.globalAlpha = g;
  ctx.fillStyle = state[prefix + 'Color'];
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, ax, cy);
  ctx.restore();

  pushHit(prefix, cx, cy, Math.max(w / 2, fs * 0.5) + S * 0.012, fs * 0.64 + S * 0.012);
}

function drawCode(ctx, S, G, g) {
  const { img, kind, aspect } = state.code;
  const w = state.codeSize * S;
  const h = kind === 'qr' ? w : w / (aspect || 4);
  const cx = G.cx + state.codeX * S;
  const cy = G.cy + state.codeY * S;
  let hw = w / 2, hh = h / 2;
  ctx.save();
  ctx.globalAlpha = g;
  if (state.codeBacking) {
    const padX = w * 0.09;
    const padY = kind === 'qr' ? padX : h * 0.28;
    roundRect(ctx, cx - w / 2 - padX, cy - h / 2 - padY, w + padX * 2, h + padY * 2, Math.min(w, h) * 0.16);
    ctx.fillStyle = state.codeBackColor;
    ctx.fill();
    hw += padX;
    hh += padY;
  }
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
  pushHit('code', cx, cy, hw, hh);
}

function drawBorder(ctx, S, G, g) {
  ctx.save();
  ctx.globalAlpha = g;
  ctx.strokeStyle = state.borderColor;
  ctx.lineWidth = G.borderW;
  circle(ctx, G.cx, G.cy, G.recordR - G.borderW / 2);
  ctx.stroke();
  ctx.restore();
}

function drawSpindle(ctx, S, G) {
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  circle(ctx, G.cx, G.cy, G.spindleR);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,.5)';
  ctx.lineWidth = Math.max(1, S * 0.002);
  circle(ctx, G.cx, G.cy, G.spindleR);
  ctx.stroke();
  ctx.restore();
}

function drawPlaceholder(ctx, S, G) {
  ctx.save();
  ctx.setLineDash([S * 0.02, S * 0.02]);
  ctx.strokeStyle = 'rgba(243,231,203,.5)';
  ctx.lineWidth = Math.max(2, S * 0.003);
  circle(ctx, G.cx, G.cy, G.recordR * 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawHighlight(ctx, S, G) {
  const el = state._active || state._hover;
  if (!el) return;
  if (el === 'art' && state._active !== 'art') return; // art highlights only while dragging
  ctx.save();
  ctx.setLineDash([S * 0.013, S * 0.013]);
  ctx.lineWidth = Math.max(2, S * 0.0024);
  ctx.strokeStyle = state._active === el ? 'rgba(182,96,74,.95)' : 'rgba(182,96,74,.5)';
  if (el === 'art') {
    circle(ctx, G.cx, G.cy, state.artArea === 'inner' ? G.innerR : G.recordR - G.borderW);
    ctx.stroke();
  } else {
    const b = hitboxes.find((h) => h.el === el);
    if (b) { roundRect(ctx, b.cx - b.hw, b.cy - b.hh, b.hw * 2, b.hh * 2, S * 0.02); ctx.stroke(); }
  }
  ctx.restore();
}

/* ---------- Badges ------------------------------------------------ */

function drawBadges(ctx, S, G, g) {
  const list = [];
  if (state.badgeSpotify) list.push('spotify');
  if (state.badgeYouTube) list.push('youtube');
  if (state.badgeTidal) list.push('tidal');
  if (state.badgeCustomToggle) list.push('custom');
  if (!list.length) return;

  const d = state.badgeSize * S;
  const gap = d * 0.34;
  const total = list.length * d + (list.length - 1) * gap;
  const cx = G.cx + state.badgeX * S;
  const cy = G.cy + state.badgeY * S;
  let x = cx - total / 2 + d / 2;
  ctx.save();
  ctx.globalAlpha = g;
  for (const type of list) {
    drawBadge(ctx, type, x, cy, d);
    x += d + gap;
  }
  ctx.restore();
  pushHit('badges', cx, cy, total / 2 + S * 0.008, d / 2 + S * 0.008);
}

function drawBadge(ctx, type, x, y, d) {
  const r = d / 2;
  // disc
  ctx.save();
  ctx.shadowColor = 'rgba(40,25,12,.4)';
  ctx.shadowBlur = d * 0.14;
  ctx.shadowOffsetY = d * 0.05;
  ctx.fillStyle = state.badgeColor;
  circle(ctx, x, y, r);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,.2)';
  ctx.lineWidth = Math.max(1, d * 0.02);
  circle(ctx, x, y, r);
  ctx.stroke();
  ctx.restore();

  // glyph — real brand logo path, or text for the custom badge
  const ink = luminance(state.badgeColor) < 0.55 ? '#f4ecd8' : '#2a241f';
  ctx.save();
  if (type === 'custom') {
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${r * 0.8}px Georgia, serif`;
    ctx.fillText((state.badgeCustomText || '?').toUpperCase().slice(0, 3), x, y + r * 0.04);
  } else {
    const gsz = d * 0.58;
    ctx.translate(x - gsz / 2, y - gsz / 2);
    ctx.scale(gsz / 24, gsz / 24);
    ctx.fillStyle = ink;
    ctx.fill(brandPath(type));
  }
  ctx.restore();
}

/* ---------- Render loop ------------------------------------------- */

let rafId = 0;
function requestRender() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    renderScene(pctx, PREVIEW_S, { isExport: false });
  });
}

/* ---------- Export ------------------------------------------------ */

async function ensureCode() {
  clearTimeout(codeTimer);
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (e) { /* font loading is best-effort */ }
  }
  await regenerateCode();
}

function projName() {
  return (state.projectName || 'record-forge').trim().replace(/[^\w.-]+/g, '-') || 'record-forge';
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function renderToBlob(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  renderScene(c.getContext('2d'), size, { isExport: true });
  return new Promise((res) => c.toBlob(res, 'image/png'));
}

async function exportPNG() {
  setStatus('Rendering PNG…');
  await ensureCode();
  const blob = await renderToBlob(Number(state.exportSize));
  downloadBlob(blob, projName() + '.png');
  setStatus('Saved ' + projName() + '.png — a circular PNG ready for HueForge.');
}

async function exportZip() {
  if (!window.JSZip) { setStatus('ZIP library not loaded — check your internet connection.'); return; }
  setStatus('Building project ZIP…');
  await ensureCode();
  const zip = new JSZip();
  zip.file('project.json', JSON.stringify(serialize(), null, 2));
  if (state.imageBlob) zip.file(state.imageName || 'album-art.png', state.imageBlob);
  zip.file('record.png', await renderToBlob(Number(state.exportSize)));
  zip.file('README.txt',
    'Record Forge project.\n' +
    'Re-open Record Forge and use "Load project" to restore these settings.\n');
  const out = await zip.generateAsync({ type: 'blob' });
  downloadBlob(out, projName() + '.zip');
  setStatus('Saved ' + projName() + '.zip — settings, original art and a rendered PNG.');
}

/* ---------- Project save / load ----------------------------------- */

function serialize() {
  const o = { _app: 'Record Forge', _version: 1, savedAt: new Date().toISOString() };
  for (const f of FIELDS) o[f.key] = state[f.key];
  o.artX = state.artX;
  o.artY = state.artY;
  o.flipH = state.flipH;
  o.flipV = state.flipV;
  o.artistX = state.artistX;
  o.artistY = state.artistY;
  o.albumX = state.albumX;
  o.albumY = state.albumY;
  o.codeX = state.codeX;
  o.codeY = state.codeY;
  o.badgeX = state.badgeX;
  o.badgeY = state.badgeY;
  o.imageName = state.imageName || null;
  return o;
}

function applyProject(data) {
  for (const f of FIELDS) if (data[f.key] !== undefined) state[f.key] = data[f.key];
  for (const k of ['artX', 'artY', 'flipH', 'flipV', 'artistX', 'artistY', 'albumX', 'albumY', 'codeX', 'codeY', 'badgeX', 'badgeY'])
    if (data[k] !== undefined) state[k] = data[k];
  if (data.imageName) state.imageName = data.imageName;
  syncInputs();
  updateLinkType();
  updateConditional();
  regenerateCode();
  requestRender();
}

async function setImageFromBlob(blob, name) {
  try {
    const img = await loadImg(URL.createObjectURL(blob));
    state.image = img;
    state.imageBlob = blob;
    state.imageName = name || 'album-art.png';
    state.artX = 0;
    state.artY = 0;
    syncInputs();
    requestRender();
    setStatus('Album art loaded. Drag it on the canvas to position it.');
  } catch (e) {
    setStatus('Could not load that image file.');
  }
}

async function loadProjectFile(file) {
  try {
    if (/\.zip$/i.test(file.name)) {
      if (!window.JSZip) { setStatus('ZIP library not loaded — check your connection.'); return; }
      const zip = await JSZip.loadAsync(file);
      const pj = zip.file(/project\.json$/i)[0];
      if (!pj) { setStatus('No project.json found inside that ZIP.'); return; }
      applyProject(JSON.parse(await pj.async('string')));
      const imgEntry = Object.keys(zip.files).find(
        (n) => /\.(png|jpe?g|webp|gif)$/i.test(n) && !/record\.png$/i.test(n));
      if (imgEntry) await setImageFromBlob(await zip.file(imgEntry).async('blob'), imgEntry);
      setStatus('Project restored from ZIP.');
    } else {
      const data = JSON.parse(await file.text());
      applyProject(data);
      if (data.imageData) await setImageFromBlob(await (await fetch(data.imageData)).blob(), data.imageName);
      setStatus('Project settings restored from JSON.');
    }
  } catch (e) {
    setStatus('Could not load that project file: ' + e.message);
  }
}

/* ---------- Palette ----------------------------------------------- */

function applyPalette(name) {
  const p = PRESETS[name];
  if (!p) return;
  Object.assign(state, p);
  if (p.textColor) { state.artistColor = p.textColor; state.albumColor = p.textColor; }
  syncInputs();
}

/* ---------- Input wiring ------------------------------------------ */

function updateRV(f) {
  if (!f.disp) return;
  const out = $(f.id + '-rv');
  if (out) out.textContent = fmt(f.disp, state[f.key]);
}

function syncInputs() {
  for (const f of FIELDS) {
    const el = $(f.id);
    if (!el) continue;
    if (f.t === 'bool') el.checked = !!state[f.key];
    else el.value = state[f.key];
    updateRV(f);
  }
  $('flipH').classList.toggle('is-on', state.flipH);
  $('flipV').classList.toggle('is-on', state.flipV);
}

function updateLinkType() {
  $('linkType').textContent = detectLink(state.link).label;
}

function updateConditional() {
  document.querySelectorAll('[data-when]').forEach((el) => {
    const cond = el.dataset.when;
    let show;
    if (cond.includes('=')) {
      const [k, v] = cond.split('=');
      show = String(state[k]) === v;
    } else {
      show = !!state[cond];
    }
    el.classList.toggle('hidden', !show);
  });
}

function onFieldChange(f, el) {
  if (f.t === 'bool') state[f.key] = el.checked;
  else if (f.t === 'num') state[f.key] = Number(el.value);
  else state[f.key] = el.value;
  updateRV(f);

  if (f.key === 'palette' && state.palette !== 'custom') applyPalette(state.palette);
  if (COLOR_KEYS.includes(f.key) && state.palette !== 'custom') {
    state.palette = 'custom';
    $('palette').value = 'custom';
  }
  if (f.key === 'link') updateLinkType();
  if (CODE_KEYS.includes(f.key)) scheduleCodeRegen();

  updateConditional();
  requestRender();
}

function bindControls() {
  for (const f of FIELDS) {
    const el = $(f.id);
    if (!el) continue;
    const evt = (f.t === 'bool' || el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(evt, () => onFieldChange(f, el));
  }

  $('flipH').addEventListener('click', () => {
    state.flipH = !state.flipH;
    $('flipH').classList.toggle('is-on', state.flipH);
    requestRender();
  });
  $('flipV').addEventListener('click', () => {
    state.flipV = !state.flipV;
    $('flipV').classList.toggle('is-on', state.flipV);
    requestRender();
  });
  $('centerArt').addEventListener('click', () => {
    state.artX = 0;
    state.artY = 0;
    requestRender();
  });

  $('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) setImageFromBlob(file, file.name);
  });
  $('projectInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadProjectFile(file);
  });
  $('resetBtn').addEventListener('click', () => {
    state = freshState();
    syncInputs();
    updateLinkType();
    updateConditional();
    regenerateCode();
    requestRender();
    setStatus('Reset to defaults.');
  });

  $('downloadPng').addEventListener('click', () => exportPNG().catch((e) => setStatus('Export failed: ' + e.message)));
  $('downloadZip').addEventListener('click', () => exportZip().catch((e) => setStatus('Export failed: ' + e.message)));

  // ----- Drag art / text / code / badges directly on the canvas -----
  let drag = null;
  const OFFSETS = {
    art: ['artX', 'artY'], artist: ['artistX', 'artistY'], album: ['albumX', 'albumY'],
    code: ['codeX', 'codeY'], badges: ['badgeX', 'badgeY'],
  };
  const elementAt = (sx, sy) => {
    for (let i = hitboxes.length - 1; i >= 0; i--) {
      const b = hitboxes[i];
      if (Math.abs(sx - b.cx) <= b.hw && Math.abs(sy - b.cy) <= b.hh) return b.el;
    }
    if (state.image) {
      const G = geom(PREVIEW_S);
      const rr = state.artArea === 'inner' ? G.innerR : G.recordR - G.borderW;
      if (Math.hypot(sx - G.cx, sy - G.cy) <= rr) return 'art';
    }
    return null;
  };

  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const el = elementAt((e.clientX - r.left) / r.width * PREVIEW_S, (e.clientY - r.top) / r.height * PREVIEW_S);
    if (!el) return;
    drag = { el, x: e.clientX, y: e.clientY };
    state._active = el;
    canvas.setPointerCapture(e.pointerId);
    requestRender();
  });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    if (drag) {
      const [kx, ky] = OFFSETS[drag.el];
      state[kx] = clamp(state[kx] + (e.clientX - drag.x) / r.width, -0.72, 0.72);
      state[ky] = clamp(state[ky] + (e.clientY - drag.y) / r.height, -0.72, 0.72);
      drag.x = e.clientX;
      drag.y = e.clientY;
      requestRender();
      return;
    }
    const el = elementAt((e.clientX - r.left) / r.width * PREVIEW_S, (e.clientY - r.top) / r.height * PREVIEW_S);
    canvas.style.cursor = el ? 'grab' : 'default';
    if (el !== state._hover) { state._hover = el; requestRender(); }
  });
  const endDrag = () => { if (drag) { drag = null; state._active = null; requestRender(); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => {
    if (state._hover) { state._hover = null; requestRender(); }
    canvas.style.cursor = 'default';
  });

  // Drag & drop an image file onto the canvas
  const drop = $('stageDrop');
  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('dragover')));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = [...e.dataTransfer.files].find((f) => /^image\//.test(f.type));
    if (file) setImageFromBlob(file, file.name);
  });
}

/* ---------- Quick-place anchor pads ------------------------------- */

const ANCHORS = {
  tl: [-0.6, -0.6], tc: [0, -0.66], tr: [0.6, -0.6],
  ml: [-0.66, 0],   mc: [0, 0],     mr: [0.66, 0],
  bl: [-0.6, 0.6],  bc: [0, 0.66],  br: [0.6, 0.6],
};
const RECORD_FRAC = 0.487; // recordR / S — keeps anchored elements inside the disc

function buildPads() {
  document.querySelectorAll('[data-pad]').forEach((pad) => {
    const target = pad.dataset.pad; // 'text' | 'code' | 'badge'
    for (const key of Object.keys(ANCHORS)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pad-btn';
      btn.title = 'Place ' + target;
      btn.addEventListener('click', () => {
        const [ax, ay] = ANCHORS[key];
        state[target + 'X'] = ax * RECORD_FRAC;
        state[target + 'Y'] = ay * RECORD_FRAC;
        requestRender();
      });
      pad.appendChild(btn);
    }
  });
}

/* ---------- Init -------------------------------------------------- */

function init() {
  buildPads();
  bindControls();
  syncInputs();
  updateLinkType();
  updateConditional();
  requestRender();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(requestRender);
}

document.addEventListener('DOMContentLoaded', init);
