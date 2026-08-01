"use client";

import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
// Static, unlike the JS below: stylesheets don't touch `window`, and Next
// only bundles CSS imported statically — a dynamic import() of a .css file
// silently does nothing, which shows up as a map of jumbled, unpositioned
// tiles rather than as an error.
import "leaflet/dist/leaflet.css";
import { hasUsableCoordinates, type SchoolRef } from "@/app/lib/schoolRef";

// The schools, on a map.
//
// WHY A DEPENDENCY. HANDOFF rule 8 says don't add one "for something small",
// and this is the exception rather than a breach of it: a pannable, zoomable
// tile map is not small. Doing it by hand means implementing tile arithmetic,
// pointer-driven pan, wheel zoom, and marker projection — which is to say,
// reimplementing Leaflet, badly. Leaflet is ~42 kB gzipped, needs no API key
// and no account, and OpenStreetMap's tiles are free with attribution.
//
// Google Maps and Mapbox were the alternatives; both want a billing account
// and a key, which this project deliberately doesn't have.
//
// THREE LEAFLET-IN-NEXT GOTCHAS, all handled below:
//
//   1. Leaflet reads `window` at import time, so a plain top-level import
//      crashes the server render. It's imported inside an effect instead.
//   2. Its default marker icons are resolved as relative image paths that
//      bundlers rewrite and break — the classic "markers are invisible" bug.
//      We use divIcon (pure HTML/CSS) and never touch the image icons.
//   3. Its CSS must be loaded or the map renders as a pile of unpositioned
//      tiles. Imported here rather than globally so it's only paid for on the
//      screen that shows a map.

interface Props {
  schools: SchoolRef[];
  selectedIds: string[];
  /** Highlighted but not chosen — the row the pointer is over. */
  focusedId?: string | null;
  onToggle: (school: SchoolRef) => void;
  /** Where the student is, if we resolved it. Drawn as a distinct marker. */
  origin?: { latitude?: number; longitude?: number };
}

export function SchoolMap({ schools, selectedIds, focusedId, onToggle, origin }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const leafletRef = useRef<typeof LeafletNS | null>(null);
  const markersRef = useRef<Map<string, LeafletNS.Marker>>(new Map());
  const originMarkerRef = useRef<LeafletNS.Marker | null>(null);

  // Leaflet is imported dynamically, so the map does not exist on the render
  // where the schools arrive. Without this flag the marker effect ran once,
  // found `leafletRef.current` still null, returned early — and never re-ran,
  // because its dependency (the school list) had already settled. The result
  // was a working, tiled, attributed map with no pins on it.
  const [ready, setReady] = useState(false);

  // Handlers change every render; markers are bound once. Reading through a
  // ref keeps the click handler current without rebuilding every pin.
  const onToggleRef = useRef(onToggle);
  onToggleRef.current = onToggle;

  const placed = schools.filter(hasUsableCoordinates);

  // --- Create the map once -------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Dynamic import: Leaflet touches `window` on evaluation, so this can
      // only happen in the browser.
      const leaflet = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      leafletRef.current = leaflet;
      const map = leaflet.map(containerRef.current, {
        // Trackpad/scroll zoom is off by default: the map sits inside a
        // scrolling page, and hijacking the wheel means someone scrolling past
        // it gets zoomed instead. Ctrl+wheel and the +/- buttons still work.
        scrollWheelZoom: false,
        attributionControl: true,
      });

      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          // OSM's tile policy requires visible attribution. Not optional.
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        })
        .addTo(map);

      // Somewhere to be before the first fitBounds runs.
      map.setView([39.5, -98.35], 4);
      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
      originMarkerRef.current = null;
      setReady(false);
    };
  }, []);

  // --- Sync markers to the school list -------------------------------------

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map) return;

    const wanted = new Set(placed.map((s) => s.id));

    // Remove pins for schools that are no longer in the list.
    for (const [id, marker] of markersRef.current) {
      if (!wanted.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }

    for (const school of placed) {
      if (markersRef.current.has(school.id)) continue;

      const marker = leaflet
        .marker([school.latitude, school.longitude], {
          icon: buildIcon(leaflet, school, false, false),
          title: school.name,
          keyboard: true,
          alt: school.name,
        })
        .addTo(map);

      marker.bindPopup(popupHtml(school));
      marker.on("click", () => onToggleRef.current(school));
      markersRef.current.set(school.id, marker);
    }
  }, [ready, placed.map((s) => `${s.id}:${s.latitude},${s.longitude}`).join("|")]);

  // --- Restyle pins when selection or focus changes ------------------------

  useEffect(() => {
    const leaflet = leafletRef.current;
    if (!leaflet) return;

    const selected = new Set(selectedIds);
    for (const school of placed) {
      const marker = markersRef.current.get(school.id);
      if (!marker) continue;
      marker.setIcon(
        buildIcon(leaflet, school, selected.has(school.id), focusedId === school.id)
      );
      // Bring the one being pointed at to the front so it isn't hidden under a
      // neighbouring campus in a dense city.
      if (focusedId === school.id || selected.has(school.id)) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    }
  }, [ready, selectedIds.join("|"), focusedId, placed.length]);

  // --- The student's own location ------------------------------------------

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map) return;

    originMarkerRef.current?.remove();
    originMarkerRef.current = null;

    if (typeof origin?.latitude !== "number" || typeof origin?.longitude !== "number") {
      return;
    }

    originMarkerRef.current = leaflet
      .marker([origin.latitude, origin.longitude], {
        icon: leaflet.divIcon({
          className: "",
          html: `<span class="block h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-md"></span>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
        title: "You",
        alt: "Your location",
      })
      .addTo(map)
      .bindPopup("<strong>You</strong>");
  }, [ready, origin?.latitude, origin?.longitude]);

  // --- Keep everything in frame --------------------------------------------

  useEffect(() => {
    const leaflet = leafletRef.current;
    const map = mapRef.current;
    if (!leaflet || !map || !placed.length) return;

    const points: [number, number][] = placed.map((s) => [s.latitude, s.longitude]);
    if (typeof origin?.latitude === "number" && typeof origin?.longitude === "number") {
      points.push([origin.latitude, origin.longitude]);
    }

    // Fitted to the schools rather than pinned to one country. A US student
    // gets a map of the US because that's where their schools are; a student
    // in Edinburgh gets Scotland, without the map needing to know which.
    map.fitBounds(leaflet.latLngBounds(points).pad(0.15), { animate: false });

    // A single school would otherwise fit to street level, which tells you
    // nothing about where it is relative to anything.
    if (points.length === 1 && map.getZoom() > 11) map.setZoom(11);
  }, [ready, placed.map((s) => s.id).join("|"), origin?.latitude, origin?.longitude]);

  // --- Pan to whichever school the list is pointing at ----------------------

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusedId) return;
    const school = placed.find((s) => s.id === focusedId);
    if (!school) return;
    map.panTo([school.latitude, school.longitude], { animate: true, duration: 0.4 });
  }, [focusedId]);

  const unplaceable = schools.length - placed.length;

  return (
    <div>
      <div
        ref={containerRef}
        role="application"
        aria-label="Map of schools near you"
        className="h-[320px] w-full rounded-3xl bg-sand-deep lg:h-[560px]"
      />
      <p className="mt-2 text-xs text-ink-faint">
        Scroll the page normally — hold <kbd className="rounded bg-sand-deep px-1">Ctrl</kbd>{" "}
        to zoom, or drag to pan.
        {unplaceable > 0 &&
          ` ${unplaceable} school${unplaceable === 1 ? "" : "s"} couldn't be placed on the map, but ${unplaceable === 1 ? "it's" : "they're"} still listed.`}
      </p>
    </div>
  );
}

/**
 * Pins are divIcons — plain HTML — not Leaflet's default image markers.
 *
 * The default icons are PNGs referenced by a relative path that every bundler
 * rewrites and breaks; the well-known symptom is a map with working popups and
 * no visible markers. HTML sidesteps it entirely and lets the pin carry the
 * school's own state in Tailwind classes.
 */
function buildIcon(
  leaflet: typeof LeafletNS,
  school: SchoolRef,
  selected: boolean,
  focused: boolean
): LeafletNS.DivIcon {
  // Catalog schools are the ones whose programs are real rather than
  // estimated, so they read differently on the map too.
  // Catalog schools are the ones whose programs are real rather than
  // estimated, so they read differently on the map too.
  const base = school.source === "catalog" ? "bg-ink" : "bg-pop-orange";
  const ring = selected
    ? "ring-4 ring-ink/25"
    : focused
      ? "ring-4 ring-ink/15"
      : "ring-2 ring-white";
  const size = selected || focused ? 18 : 14;

  return leaflet.divIcon({
    className: "",
    html: `<span class="block rounded-full ${base} ${ring} shadow-md" style="width:${size}px;height:${size}px"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Escaped: school names and notes are model output going into innerHTML. */
function popupHtml(school: SchoolRef): string {
  const esc = (value: string) =>
    value.replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
    );

  const where = [school.city, school.subdivision].filter(Boolean).join(", ");
  const miles =
    typeof school.distanceMiles === "number"
      ? ` · ${Math.round(school.distanceMiles)} mi`
      : "";

  return `<strong>${esc(school.name)}</strong><br><span style="color:#6b7280">${esc(where)}${miles}</span>`;
}
