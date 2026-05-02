"use client";

import { useEffect, useRef } from "react";

interface Position {
  mmsi: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
}

interface LiveMapProps {
  mmsis?: string[];
  height?: string;
  waypoints?: { latitude: number; longitude: number }[];
}

export function LiveMap({ mmsis = [], height = "600px", waypoints = [] }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const initRef = useRef(false);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !containerRef.current) return;
    initRef.current = true;

    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;

      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [30, 20],
        zoom: 2,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      mapRef.current = map;

      map.on("load", () => {
        map.resize();

        // Add route polyline if waypoints provided
        if (waypoints.length > 0) {
          const coords = waypoints.map((w) => [w.longitude, w.latitude]);
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: coords },
            },
          });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#38BDF8",
              "line-width": 3,
              "line-dasharray": [2, 1],
            },
          });

          const bounds = new maplibregl.LngLatBounds();
          coords.forEach((c) => bounds.extend(c as [number, number]));
          map.fitBounds(bounds, { padding: 50 });
        }
      });

      // SSE for live vessel positions
      if (mmsis.length > 0) {
        const es = new EventSource(`/api/sse/vessel-positions?mmsis=${mmsis.join(",")}`);

        es.onmessage = (event) => {
          const positions: Position[] = JSON.parse(event.data);

          for (const pos of positions) {
            if (markersRef.current.has(pos.mmsi)) {
              markersRef.current.get(pos.mmsi)!.setLngLat([pos.longitude, pos.latitude]);
              continue;
            }

            // Vessel marker dot
            const el = document.createElement("div");
            el.style.cssText = "width:14px;height:14px;position:relative;cursor:pointer;";
            el.innerHTML = `<div style="
              position:absolute;inset:0;
              background:#38BDF8;border-radius:50%;
              border:2px solid rgba(56,189,248,0.3);
              box-shadow:0 0 12px rgba(56,189,248,0.4),0 0 4px rgba(56,189,248,0.6);
            "></div>`;

            // Dark-themed popup
            const popup = new maplibregl.Popup({
              offset: 25,
              className: "dark-popup",
            }).setHTML(
              `<div style="background:#1e1e2e;color:#e0e0e0;padding:8px 12px;border-radius:8px;font-family:monospace;font-size:12px;min-width:140px;">
                <div style="font-weight:600;color:#38BDF8;margin-bottom:4px;">MMSI ${pos.mmsi}</div>
                <div style="color:#a0a0b0;">Speed: ${pos.speed} kn</div>
              </div>`
            );

            const marker = new maplibregl.Marker(el)
              .setLngLat([pos.longitude, pos.latitude])
              .setPopup(popup)
              .addTo(map);

            markersRef.current.set(pos.mmsi, marker);
          }

          // Auto-fit bounds to all vessels on first data load
          if (!fittedRef.current && positions.length > 0) {
            fittedRef.current = true;
            const bounds = new maplibregl.LngLatBounds();
            positions.forEach((p) => bounds.extend([p.longitude, p.latitude]));
            map.fitBounds(bounds, { padding: 80, maxZoom: 5 });
          }
        };

        (map as any).__es = es;
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current as any).__es?.close();
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current.clear();
      initRef.current = false;
      fittedRef.current = false;
    };
  }, [mmsis, waypoints]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border/50"
      style={{ height, background: "#1a1a2e" }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-border/50 bg-background/80 px-2 py-1 backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse-status" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          LIVE
        </span>
        {mmsis.length > 0 && (
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {mmsis.length} vessel{mmsis.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
