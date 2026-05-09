# Gensokyo Archive – Documentation

## Overview
**Gensokyo Archive** is a Progressive Web App (PWA) that serves as an interactive Touhou Project character encyclopedia. Users can browse character profiles, view images, and listen to audio narrations. It works offline and can be installed on any device.

---

## Features
- Dynamic sidebar menu built from `data.json`
- Audio narration via the Web Speech API (no audio files required)
- Keyboard navigation (← → arrows, Space to play/stop)
- Installable via the browser's built-in install prompt
- Offline support via a service worker and cache API

---

## File Structure
```
touhou-pwa/
├── index.html        ← Main app
├── style.css         ← All styles
├── app.js            ← App logic
├── sw.js             ← Service worker (offline support)
├── manifest.json     ← PWA manifest
├── data.json         ← Content data (edit this!)
├── promo.html        ← Promotional/landing page
├── icons/
│   ├── icon-192.png  ← App icon (192×192)
│   └── icon-512.png  ← App icon (512×512)
└── images/           ← Character images
```

---

## Installation Process
1. Host all files on a web server (GitHub Pages, Netlify, etc.)
2. Open the URL in Chrome or Edge
3. Click the **Install** banner or use the browser's install option
4. On iOS Safari: Share → Add to Home Screen

---

## Programmer Guide: Editing `data.json`

The entire app is powered by `data.json`. You can add, remove, or edit characters by modifying this file.

### Top-level fields
| Field | Type | Description |
|---|---|---|
| `appName` | string | Name of the app (cosmetic only) |
| `description` | string | Short app description |
| `user.name` | string | Display name shown in the sidebar |
| `user.preferences.volume` | number | Audio volume (0.0–1.0) |
| `topics` | array | Array of character objects |

### Topic object fields
| Field | Type | Description |
|---|---|---|
| `id` | string | Unique ID (e.g. `"topic6"`) |
| `title` | string | Character name |
| `category` | string | Species/type label shown in the UI |
| `text` | string | Main description paragraph |
| `image` | string | Path to image file (e.g. `"images/char.png"`) |
| `audioText` | string | Text that gets read aloud (can differ from `text`) |

### Adding a new character
1. Open `data.json` in any text editor.
2. Copy an existing topic object and paste it inside the `"topics"` array.
3. Update all fields: give it a unique `id`, update `title`, `category`, `text`, `image`, and `audioText`.
4. Add the character's image to the `images/` folder.
5. Save and reload the app.

### Example new entry
```json
{
  "id": "topic6",
  "title": "Reimu Hakurei",
  "category": "Shrine Maiden",
  "text": "Reimu is the main protagonist of the Touhou series. She is the shrine maiden of the Hakurei Shrine and has the innate power to float through barriers.",
  "image": "images/reimu.png",
  "audioText": "Reimu Hakurei is the legendary shrine maiden who resolves incidents across Gensokyo."
}
```

---

## Updating the App Icon
Replace `icons/icon-192.png` and `icons/icon-512.png` with your own images.
Recommended: square PNG images with a transparent or solid background.

---

## Deployment Tips
- The app **must be served over HTTPS** for PWA install to work.
- GitHub Pages and Netlify both support HTTPS by default.
- After deploying, test offline mode in Chrome DevTools → Application → Service Workers.
