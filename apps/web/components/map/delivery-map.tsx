"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search } from "lucide-react";

// Fix Leaflet default icon issue in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface DeliveryMapProps {
  onLocationChange: (lat: number, lng: number, address: string) => void;
  onRadiusChange: (km: number) => void;
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
}

function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      onDragEnd(e.latlng.lat, e.latlng.lng);
    },
  });

  return (
    <Marker
      ref={markerRef}
      position={position}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: () => {
          const m = markerRef.current;
          if (m) {
            const pos = m.getLatLng();
            onDragEnd(pos.lat, pos.lng);
          }
        },
      }}
    />
  );
}

export default function DeliveryMap({
  onLocationChange,
  onRadiusChange,
  initialLat = 19.0414,
  initialLng = -98.2063,
  initialRadius = 5,
}: DeliveryMapProps) {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);
  const [radius, setRadius] = useState(initialRadius);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDrag = useCallback(
    (lat: number, lng: number) => {
      setPosition([lat, lng]);
      // Reverse geocode
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      )
        .then((r) => r.json())
        .then((data) => {
          const addr = data.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          onLocationChange(lat, lng, addr);
        })
        .catch(() => {
          onLocationChange(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        });
    },
    [onLocationChange]
  );

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=mx&limit=5`
      )
        .then((r) => r.json())
        .then((data) => setSuggestions(data))
        .catch(() => setSuggestions([]));
    }, 1000);
  }

  function selectSuggestion(s: { display_name: string; lat: string; lon: string }) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    setPosition([lat, lng]);
    setSearchQuery(s.display_name.split(",")[0] ?? s.display_name);
    setSuggestions([]);
    onLocationChange(lat, lng, s.display_name);
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-white dark:bg-neutral-900 px-3 py-2.5">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Busca tu zona de entrega..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
        </div>
        {suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border bg-white dark:bg-neutral-900 shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 border-b border-border/20 last:border-0"
              >
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-border/50" style={{ height: 250 }}>
        <MapContainer
          center={position}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={position} onDragEnd={handleDrag} />
          <Circle
            center={position}
            radius={radius * 1000}
            pathOptions={{ color: "#EDE0D4", fillColor: "#EDE0D4", fillOpacity: 0.15, weight: 2 }}
          />
        </MapContainer>
      </div>

      {/* Radius slider */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-muted-foreground shrink-0">Radio:</label>
        <input
          type="range"
          min={1}
          max={50}
          value={radius}
          onChange={(e) => {
            const r = Number(e.target.value);
            setRadius(r);
            onRadiusChange(r);
          }}
          className="flex-1 accent-bone"
        />
        <span className="text-sm font-medium w-12 text-right">{radius} km</span>
      </div>
    </div>
  );
}
