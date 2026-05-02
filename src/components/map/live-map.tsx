"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [0, 20],
      zoom: 2,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      map.current?.remove();
    };
  }, []);

  // Handle waypoints (Route Polyline)
  useEffect(() => {
    if (!map.current || waypoints.length === 0) return;

    const m = map.current;
    const coords = waypoints.map(w => [w.longitude, w.latitude]);

    const addRoute = () => {
      if (m.getSource("route")) {
        (m.getSource("route") as maplibregl.GeoJSONSource).setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coords as any,
          },
        });
      } else {
        m.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coords as any,
            },
          },
        });

        m.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#38BDF8",
            "line-width": 3,
            "line-dasharray": [2, 1],
          },
        });
      }

      // Fit bounds to route
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach(c => bounds.extend(c as [number, number]));
      m.fitBounds(bounds, { padding: 50 });
    };

    if (m.loaded()) {
      addRoute();
    } else {
      m.once("load", addRoute);
    }
  }, [waypoints]);

  // Handle live positions via SSE
  useEffect(() => {
    if (mmsis.length === 0) return;

    const eventSource = new EventSource(`/api/sse/vessel-positions?mmsis=${mmsis.join(",")}`);

    eventSource.onmessage = (event) => {
      const positions: Position[] = JSON.parse(event.data);

      positions.forEach((pos) => {
        if (markers.current.has(pos.mmsi)) {
          markers.current.get(pos.mmsi)?.setLngLat([pos.longitude, pos.latitude]);
        } else {
          const el = document.createElement("div");
          el.className = "vessel-marker";
          el.style.cssText = "position: relative; width: 14px; height: 14px;";
          el.innerHTML = `
            <div style="
              position: absolute; inset: 0;
              background: #38BDF8;
              border-radius: 50%;
              border: 2px solid rgba(56, 189, 248, 0.3);
              box-shadow: 0 0 12px rgba(56, 189, 248, 0.4), 0 0 4px rgba(56, 189, 248, 0.6);
            "></div>
          `;

          const marker = new maplibregl.Marker(el)
            .setLngLat([pos.longitude, pos.latitude])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`<h3>MMSI: ${pos.mmsi}</h3><p>Speed: ${pos.speed} kn</p>`))
            .addTo(map.current!);

          markers.current.set(pos.mmsi, marker);
        }
      });
    };

    return () => eventSource.close();
  }, [mmsis]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-border/50 bg-card"
      style={{ height }}
    >
      <div ref={mapContainer} className="absolute inset-0" />
      {/* Live indicator */}
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
