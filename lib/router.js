// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
export function parseRoute(hash) {
  const h = (hash || "").replace(/^#/, "").replace(/^\/+/, "");
  if (!h) return { name: "home" };
  const parts = h.split("/").filter(Boolean);
  if (parts[0] === "leader" && parts[1]) return { name: "leader", id: decodeURIComponent(parts[1]) };
  if (parts[0] === "builder" && parts[1] === "print") return { name: "builder-print" };
  if (parts[0] === "builder") return { name: "builder" };
  if (parts[0] === "about") return { name: "about" };
  return { name: "home" };
}

export function go(route) {
  location.hash = route.startsWith("#") ? route : "#" + route;
}

export function onRouteChange(handler) {
  window.addEventListener("hashchange", () => handler(parseRoute(location.hash)));
  window.addEventListener("DOMContentLoaded", () => handler(parseRoute(location.hash)));
}
