const API_BASE = 'http://localhost:4000';

export async function fetchLibraryState() {
  const res = await fetch(`${API_BASE}/api/library-state`);
  if (!res.ok) {
    throw new Error(`Failed to fetch library state: ${res.status}`);
  }
  return res.json();
}

export async function saveLibraryState(state) {
  const res = await fetch(`${API_BASE}/api/library-state`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state }),
  });

  if (!res.ok) {
    throw new Error(`Failed to save library state: ${res.status}`);
  }

  return res.json();
}