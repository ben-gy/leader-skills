const KEY = "leaderSkills.builder.v1";

export function loadBuilder() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveBuilder(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function clearBuilder() {
  localStorage.removeItem(KEY);
}

export function emptyBuilder() {
  return {
    name: "",
    archetype: "",
    tagline: "",
    practices: {
      mind: [],
      body: [],
      routine: [],
      team: [],
      vision: [],
      communication: [],
      culture: []
    },
    createdAt: new Date().toISOString()
  };
}
