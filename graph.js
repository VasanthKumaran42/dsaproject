/**
 * graph.js — Vellore District Graph Data
 * Nodes = towns, Edges = roads, Weights = distance in km
 */

const GRAPH_DATA = {
  nodes: {
    "Tirupattur":      { x: 192, y: 648 },
    "Sundarampatti":   { x: 148, y: 718 },
    "Vishamangalam":   { x: 218, y: 738 },
    "Jolarpet":        { x: 188, y: 575 },
    "Nadamur":         { x: 318, y: 538 },
    "Vaniyambadi":     { x: 228, y: 490 },
    "Ambur":           { x: 296, y: 408 },
    "Melarasampattu":  { x: 438, y: 488 },
    "Odungattur":      { x: 418, y: 418 },
    "Peranampattu":    { x: 338, y: 272 },
    "Gudiyatham":      { x: 448, y: 268 },
    "Pallikondai":     { x: 538, y: 308 },
    "Vellore":         { x: 648, y: 318 },
    "Katpadi":         { x: 672, y: 228 },
    "VIT":             { x: 718, y: 258 },
    "CMC":             { x: 718, y: 328 },
    "Bagayam":         { x: 648, y: 378 },
    "Kaniyambadi":     { x: 718, y: 398 },
    "Arcot":           { x: 848, y: 328 },
    "Ranipet":         { x: 908, y: 298 },
    "Walajapet":       { x: 958, y: 298 },
    "Kaveripakkam":    { x: 1048, y: 298 },
    "Ammoor":          { x: 928, y: 248 },
    "Arakonam":        { x: 1078, y: 168 },
    "Kilpadi":         { x: 888, y: 398 },
    "Kalavai":         { x: 968, y: 428 },
    "Mambakkam":       { x: 1018, y: 498 },
  },

  edges: [
    { from: "Tirupattur",    to: "Sundarampatti",  weight: 12 },
    { from: "Tirupattur",    to: "Vishamangalam",  weight: 10 },
    { from: "Tirupattur",    to: "Jolarpet",       weight: 8  },
    { from: "Tirupattur",    to: "Nadamur",        weight: 14 },
    { from: "Vaniyambadi",   to: "Jolarpet",       weight: 10 },
    { from: "Vaniyambadi",   to: "Nadamur",        weight: 12 },
    { from: "Vaniyambadi",   to: "Ambur",          weight: 15 },
    { from: "Nadamur",       to: "Melarasampattu", weight: 10 },
    { from: "Odungattur",    to: "Melarasampattu", weight: 8  },
    { from: "Peranampattu",  to: "Ambur",          weight: 18 },
    { from: "Gudiyatham",    to: "Ambur",          weight: 30 },
    { from: "Gudiyatham",    to: "Peranampattu",   weight: 12 },
    { from: "Gudiyatham",    to: "Pallikondai",    weight: 22 },
    { from: "Pallikondai",   to: "Ambur",          weight: 25 },
    { from: "Pallikondai",   to: "Odungattur",     weight: 10 },
    { from: "Vellore",       to: "Pallikondai",    weight: 15 },
    { from: "Vellore",       to: "Katpadi",        weight: 7  },
    { from: "Vellore",       to: "VIT",            weight: 5  },
    { from: "Vellore",       to: "Bagayam",        weight: 8  },
    { from: "Vellore",       to: "CMC",            weight: 4  },
    { from: "Bagayam",       to: "Kaniyambadi",    weight: 10 },
    { from: "Katpadi",       to: "VIT",            weight: 3  },
    { from: "VIT",           to: "CMC",            weight: 6  },
    { from: "VIT",           to: "Ammoor",         weight: 30 },
    { from: "CMC",           to: "Arcot",          weight: 23 },
    { from: "Arcot",         to: "Ranipet",        weight: 10 },
    { from: "Arcot",         to: "Kilpadi",        weight: 20 },
    { from: "Kilpadi",       to: "Kalavai",        weight: 15 },
    { from: "Kalavai",       to: "Mambakkam",      weight: 18 },
    { from: "Ranipet",       to: "Walajapet",      weight: 5  },
    { from: "Ranipet",       to: "Ammoor",         weight: 12 },
    { from: "Walajapet",     to: "Kaveripakkam",   weight: 18 },
    { from: "Ammoor",        to: "Arakonam",       weight: 25 },
    { from: "Arakonam",      to: "Kaveripakkam",   weight: 15 },
    { from: "Gudiyatham",    to: "VIT",            weight: 28 },
  ]
};

// Build adjacency list from edge list (undirected)
function buildAdjacencyList(data) {
  const adj = {};
  for (const name of Object.keys(data.nodes)) {
    adj[name] = [];
  }
  for (const { from, to, weight } of data.edges) {
    adj[from].push({ node: to, weight });
    adj[to].push({ node: from, weight });
  }
  return adj;
}

if (typeof module !== 'undefined') {
  module.exports = { GRAPH_DATA, buildAdjacencyList };
}
