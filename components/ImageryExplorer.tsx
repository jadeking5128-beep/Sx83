"use client";

import { useMemo, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const sites = [
  { name: "Barakah Nuclear Energy Plant", region: "United Arab Emirates", position: [23.96, 52.27] as [number, number], note: "Public civilian nuclear energy site" },
  { name: "Hinkley Point C", region: "United Kingdom", position: [51.21, -3.13] as [number, number], note: "Publicly documented reactor construction project" },
  { name: "Akkuyu Nuclear Power Plant", region: "Türkiye", position: [36.14, 33.54] as [number, number], note: "Publicly documented civilian energy project" },
  { name: "Rooppur Nuclear Power Plant", region: "Bangladesh", position: [24.07, 89.05] as [number, number], note: "Publicly documented civilian energy project" },
];

function recentDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 2);
  return date.toISOString().slice(0, 10);
}

export default function ImageryExplorer() {
  const [date, setDate] = useState(recentDate);
  const tileUrl = useMemo(() => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${date}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, [date]);

  return <section className="sx-imagery-explorer">
    <div className="sx-imagery-toolbar">
      <div><span className="sx-kicker">NASA GIBS / MODIS TERRA</span><strong>Global true-colour imagery</strong><small>Public satellite browse layer · acquisition date is selected below</small></div>
      <label>IMAGERY DATE<input type="date" value={date} max={recentDate()} min="2000-02-24" onChange={event => setDate(event.target.value)}/></label>
    </div>
    <div className="sx-imagery-map">
      <MapContainer center={[27, 8]} zoom={2} minZoom={1} maxZoom={9} scrollWheelZoom zoomControl={false} worldCopyJump>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19}/>
        <TileLayer attribution='Imagery: NASA GIBS / MODIS Terra' url={tileUrl} opacity={0.88} minZoom={1} maxZoom={9} />
        <ZoomControl position="topright"/>
        {sites.map(site => <CircleMarker key={site.name} center={site.position} radius={5} pathOptions={{ color:"#e0d0a7",weight:1.5,fillColor:"#c7a66a",fillOpacity:.95 }}>
          <Tooltip direction="top"><strong>{site.name}</strong><br/>{site.region}<br/>{site.note}</Tooltip>
        </CircleMarker>)}
      </MapContainer>
    </div>
    <div className="sx-imagery-legend"><span><i/> Public civilian energy reference locations</span><span>NASA GIBS imagery · {date}</span></div>
    <p className="sx-imagery-disclaimer">This is a global MODIS browse layer, not high-resolution construction monitoring. It cannot verify activity at an individual facility. Sentinel-2 site-level comparisons require an authenticated Copernicus data workflow and are not represented as active here.</p>
  </section>;
}
