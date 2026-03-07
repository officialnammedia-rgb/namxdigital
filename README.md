# NamxDigital

**Power. Prestige. Performance.**

Award-style 3D luxury digital agency website built with pure HTML, CSS, and vanilla JavaScript — no build step, no dependencies.

---

## 🌐 Live Site

Once this repository's **GitHub Pages** is enabled, the site is available at:

```
https://officialnammedia-rgb.github.io/namxdigital/
```

> **To enable GitHub Pages (one-time setup):**
> 1. Go to your repository on GitHub → **Settings** → **Pages**
> 2. Under *Source*, select **GitHub Actions**
> 3. Save — the site deploys automatically on every push

---

## 💻 View Locally (instant, no install needed)

**Option A — Double-click (simplest)**
```
Open  index.html  directly in any modern browser.
```
Note: Some browsers restrict local file access. If 3D effects don't appear, use Option B.

**Option B — Python (recommended)**
```bash
# Python 3
python3 -m http.server 8080

# Then open:  http://localhost:8080
```

**Option C — Node.js**
```bash
npx serve .
# Then open the URL shown in your terminal
```

**Option D — VS Code**
Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension, right-click `index.html` → *Open with Live Server*.

---

## 📁 File Structure

```
namxdigital/
├── index.html          ← Main page (all 9 sections)
├── css/
│   └── style.css       ← Luxury design system (gold + black)
└── js/
    └── main.js         ← 3D canvas engine + all interactions
```

No build tools, no `npm install`, no configuration — open and go.

---

## ✨ Features

| Feature | Technology |
|---|---|
| 3D rotating hero (icosahedra, rings, particles) | Canvas 2D with custom projection math |
| Scroll-driven animations | `IntersectionObserver` + `requestAnimationFrame` |
| Mouse parallax | Smoothed lerp on `mousemove` |
| Magnetic buttons | CSS `transform` + spring-back easing |
| 3D card tilt | CSS `perspective` + `rotateX/Y` |
| Count-up numbers | Cubic ease-out RAF loop |
| Animated contact grid | Canvas 2D wave mesh |
| Custom gold cursor | CSS + JS (fine-pointer devices only) |
| Infinite ticker | CSS animation + JS clone |
| Mobile responsive | CSS Grid + media queries |

---

## 🚀 Deployment Options

| Platform | How |
|---|---|
| **GitHub Pages** | Enable in Settings → Pages → GitHub Actions (workflow already included) |
| **Netlify** | Drag the project folder onto [netlify.com/drop](https://app.netlify.com/drop) |
| **Vercel** | `npx vercel` in the project folder |
| **Any static host** | Upload `index.html`, `css/`, and `js/` — done |
