/**
 * dijkstra.js — Dijkstra's Shortest Path Algorithm
 *
 * Given an adjacency list, a source, and a destination,
 * returns: { path, distance, steps }
 *
 * Steps is an array of snapshots for step-by-step visualization:
 *   each step = { visited: Set, current: string, distances: {}, previous: {} }
 */

function dijkstra(adjacencyList, source, destination) {
  const nodes = Object.keys(adjacencyList);

  // --- Step 1: Initialise distances to Infinity, source = 0 ---
  const dist = {};
  const prev = {};
  const visited = new Set();
  const steps = [];   // for animation/visualization

  for (const n of nodes) {
    dist[n] = Infinity;
    prev[n] = null;
  }
  dist[source] = 0;

  // Simple min-priority queue using an array (adequate for ~30 nodes)
  // For larger graphs a proper heap would be used.
  const queue = new Set(nodes);

  while (queue.size > 0) {
    // --- Step 2: Pick the unvisited node with smallest tentative distance ---
    let current = null;
    for (const n of queue) {
      if (current === null || dist[n] < dist[current]) {
        current = n;
      }
    }

    // If smallest distance is Infinity, remaining nodes are unreachable
    if (dist[current] === Infinity) break;

    // Record a snapshot for the step-by-step panel
    steps.push({
      current,
      visited: new Set(visited),
      distances: { ...dist },
      previous:  { ...prev },
    });

    // Early exit once we reach destination
    if (current === destination) break;

    queue.delete(current);
    visited.add(current);

    // --- Step 3: Relax neighbours ---
    for (const { node: neighbour, weight } of adjacencyList[current]) {
      if (visited.has(neighbour)) continue;

      const tentative = dist[current] + weight;
      if (tentative < dist[neighbour]) {
        // Found a shorter path to neighbour
        dist[neighbour] = tentative;
        prev[neighbour] = current;
      }
    }
  }

  // --- Step 4: Reconstruct path by backtracking through `prev` ---
  const path = [];
  let cursor = destination;

  if (prev[cursor] === null && cursor !== source) {
    // No path exists
    return { path: [], distance: Infinity, steps };
  }

  while (cursor !== null) {
    path.unshift(cursor);
    cursor = prev[cursor];
  }

  return {
    path,
    distance: dist[destination],
    steps,
  };
}

if (typeof module !== 'undefined') {
  module.exports = { dijkstra };
}
