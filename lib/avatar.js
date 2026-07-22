// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
export function renderAvatar({ monogram, color, size = 56 }) {
  const safeColor = color || "#444";
  const radius = size / 2;
  const fontSize = Math.round(size * 0.42);
  return `
    <svg class="avatar" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${monogram}">
      <circle cx="${radius}" cy="${radius}" r="${radius}" fill="${safeColor}"/>
      <text x="50%" y="50%" dy="0.36em" text-anchor="middle" fill="white" font-family="-apple-system, system-ui, sans-serif" font-weight="700" font-size="${fontSize}">${escapeHtml(monogram)}</text>
    </svg>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}
