/**
 * server.js — Express backend for Vellore Shortest Path Finder
 * Run: node server.js  (serves on http://localhost:3000)
 */

const express  = require('express');
const path     = require('path');
const { GRAPH_DATA, buildAdjacencyList } = require('./graph');
const { dijkstra } = require('./dijkstra');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));   // serves index.html / CSS / client JS

// Pre-build adjacency list once at startup
const adjacencyList = buildAdjacencyList(GRAPH_DATA);

/**
 * GET /api/graph
 * Returns all nodes and edges so the frontend can draw the map.
 */
app.get('/api/graph', (req, res) => {
  res.json(GRAPH_DATA);
});

/**
 * POST /api/shortest-path
 * Body: { source: string, destination: string }
 * Returns: { path, distance, steps }
 */
app.post('/api/shortest-path', (req, res) => {
  const { source, destination } = req.body;

  // --- Input validation ---
  if (!source || !destination) {
    return res.status(400).json({ error: 'source and destination are required.' });
  }
  if (!GRAPH_DATA.nodes[source]) {
    return res.status(400).json({ error: `Unknown source node: "${source}"` });
  }
  if (!GRAPH_DATA.nodes[destination]) {
    return res.status(400).json({ error: `Unknown destination node: "${destination}"` });
  }
  if (source === destination) {
    return res.status(400).json({ error: 'Source and destination must be different.' });
  }

  // Run Dijkstra
  const result = dijkstra(adjacencyList, source, destination);

  if (result.path.length === 0) {
    return res.status(200).json({
      path: [],
      distance: null,
      steps: result.steps,
      message: `No path found between ${source} and ${destination}.`,
    });
  }

  // Steps contain Sets which aren't JSON-serialisable — convert to arrays
  const serialisableSteps = result.steps.map(s => ({
    current:   s.current,
    visited:   Array.from(s.visited),
    distances: s.distances,
    previous:  s.previous,
  }));

  res.json({
    path:     result.path,
    distance: result.distance,
    steps:    serialisableSteps,
  });
});

// Catch-all: serve index.html for any unknown route (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🗺  Vellore Shortest Path Finder running at http://localhost:${PORT}\n`);
});
