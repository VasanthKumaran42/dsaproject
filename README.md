# Vellore District — Shortest Path Finder
## Dijkstra's Algorithm · Tamil Nadu

---

## Quick Start (Standalone — no install needed)

Open `index_standalone.html` directly in any modern browser.
No server, no dependencies, fully self-contained.

---

## Full-Stack Setup (Node.js + Express backend)

### Prerequisites
- Node.js ≥ 18

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy the map image to public/
cp your_map.jpg public/map.jpg

# 3. Start the server
npm start
# or for development with auto-reload:
npm run dev

# 4. Open in browser
# http://localhost:3000
```

---

## File Structure

```
vellore-pathfinder/
├── graph.js          ← Graph data (nodes + edges) — shared by frontend & backend
├── dijkstra.js       ← Dijkstra's algorithm — shared by frontend & backend
├── server.js         ← Express backend (POST /api/shortest-path, GET /api/graph)
├── package.json
└── public/
    ├── index.html    ← Main HTML
    ├── style.css     ← All styles (CSS variables, responsive design)
    ├── script.js     ← UI controller (SVG rendering, animation, zoom/pan)
    ├── graph.js      ← (copy of root graph.js for browser)
    ├── dijkstra.js   ← (copy of root dijkstra.js for browser)
    └── map.jpg       ← Vellore district map image
```

---

## API

### POST /api/shortest-path
**Request:**
```json
{ "source": "Tirupattur", "destination": "Arakonam" }
```
**Response:**
```json
{
  "path": ["Tirupattur", "Jolarpet", "Vaniyambadi", "Nadamur", "..."],
  "distance": 123,
  "steps": [
    { "current": "Tirupattur", "visited": [], "distances": {...}, "previous": {...} },
    ...
  ]
}
```

### GET /api/graph
Returns all nodes with coordinates and all weighted edges.

---

## Features
- ✅ Dijkstra's Algorithm (frontend + backend)
- ✅ 27 real Vellore district nodes
- ✅ 35 weighted edges (exact data as specified)
- ✅ Animated step-by-step traversal
- ✅ Live distance badges on nodes during animation
- ✅ Click nodes on map to select source/destination
- ✅ Zoom and pan (mouse wheel + drag + toolbar)
- ✅ Path highlighted with golden glow animation
- ✅ Responsive design (mobile-friendly)
- ✅ Error handling (no path, invalid input, API fallback)
