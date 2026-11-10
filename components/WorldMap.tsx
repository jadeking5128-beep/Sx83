"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const places = [
  { name: "Moscow", region: "Russian Federation", position: [55.7558, 37.6173] as [number, number], category: "Capital city" },
  { name: "Washington, D.C.", region: "United States", position: [38.9072, -77.0369] as [number, number], category: "Capital city" },
  { name: "Vienna", region: "Austria", position: [48.2082, 16.3738] as [number, number], category: "International institutions" },
  { name: "Geneva", region: "Switzerland", position: [46.2044, 6.1432] as [number, number], category: "International institutions" },
  { name: "Stockholm", region: "Sweden", position: [59.3293, 18.0686] as [number, number], category: "Research reference" },
];

export default function WorldMap({ compact = false }: { compact?: boolean }) {
  return <div className={`world-map-wrap ${compact ? "compact" : ""}`}>
    <MapContainer center={[27, 8]} zoom={compact ? 1.6 : 2.1} minZoom={1.5} maxZoom={8} scrollWheelZoom={!compact} zoomControl={false} worldCopyJump maxBounds={[[-85, -180], [85, 180]]} maxBoundsViscosity={0.75}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={20}
      />
      {!compact && <ZoomControl position="topright"/>}
      {places.map((place) => <CircleMarker key={place.name} center={place.position} radius={compact ? 5 : 6} pathOptions={{ color: "#e2a0a5", weight: 1.5, fillColor: "#a74350", fillOpacity: 0.9 }}>
        <Tooltip direction="top" offset={[0, -7]}><strong>{place.name}</strong><br/>{place.region}<br/><span>{place.category}</span></Tooltip>
      </CircleMarker>)}
    </MapContainer>
  </div>;
}
