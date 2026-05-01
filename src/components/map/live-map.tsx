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

    m.on("load", () => {
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
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-dasharray": [2, 1],
          },
        });
      }

      // Fit bounds to route
      const bounds = new maplibregl.LngLatBounds();
      coords.forEach(c => bounds.extend(c as [number, number]));
      m.fitBounds(bounds, { padding: 50 });
    });
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
          el.innerHTML = `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`;
          
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
    <div className="relative w-full rounded-xl overflow-hidden border bg-muted" style={{ height }}>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-md p-2 rounded-md border text-[10px] font-medium uppercase tracking-wider">
        Live AIS Feed: Tracking {mmsis.length} Vessels
      </div>
    </div>
  );
}
