// @ts-nocheck
"use client";

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { cn } from "@/lib/utils";

// User provided Mapbox API key
mapboxgl.accessToken = "pk.eyJ1Ijoicm9hZHN0ZXIyNzA4IiwiYSI6ImNtZjZ1cTUxcDBrbHkyaXB4dHBkMjNkdXcifQ.PvB9LzOy7gQHpmn5cdr0AQ";


export interface ShipmentMapData {
    id: string;
    origin: [number, number];
    destination: [number, number];
    label: string;
    color: string;
}

const MAP_STYLES = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    standard: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12'
};

interface ShipmentsMapProps {
    shipments?: ShipmentMapData[];
}

export function ShipmentsMap({ shipments = [] }: ShipmentsMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const [activeStyle, setActiveStyle] = React.useState<keyof typeof MAP_STYLES>('dark');
    const markersRef = useRef<mapboxgl.Marker[]>([]);

    const addShipmentData = (map: mapboxgl.Map) => {
        // Clear existing markers if any
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        shipments.forEach(shipment => {
            // Add Marker for Origin
            const m1 = new mapboxgl.Marker({ color: shipment.color })
                .setLngLat(shipment.origin)
                .setPopup(new mapboxgl.Popup().setHTML(`<b>Origin:</b> ${shipment.label}`))
                .addTo(map);

            // Add Marker for Destination
            const m2 = new mapboxgl.Marker({ color: shipment.color })
                .setLngLat(shipment.destination)
                .setPopup(new mapboxgl.Popup().setHTML(`<b>Destination:</b> ${shipment.label}`))
                .addTo(map);

            markersRef.current.push(m1, m2);

            // Add Route Line
            const routeId = `route-${shipment.id}`;
            // Check if source already exists (setStyle might clear it but better safe)
            if (!map.getSource(routeId)) {
                map.addSource(routeId, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: [shipment.origin, shipment.destination]
                        }
                    }
                });

                map.addLayer({
                    id: routeId,
                    type: 'line',
                    source: routeId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': shipment.color,
                        'line-width': 2,
                        'line-opacity': 0.6,
                        'line-dasharray': [2, 2]
                    }
                });
            }
        });
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: MAP_STYLES[activeStyle],
            center: [-98.5795, 39.8283], // Center of USA
            zoom: 3,
            pitch: 45,
            antialias: true
        });

        mapRef.current = map as any;

        map.on('load', () => {
            addShipmentData(map);
        });

        // Re-inject data when style changes (Mapbox setStyle clears layers/sources)
        map.on('styledata', () => {
            if (map.isStyleLoaded()) {
                addShipmentData(map);
            }
        });

        return () => {
            map.remove();
        };
    }, []);

    // Effect to update style when activeStyle state changes
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.setStyle(MAP_STYLES[activeStyle]);
        }
    }, [activeStyle]);

    return (
        <div className="relative h-full w-full rounded-none border border-neutral-800 bg-black overflow-hidden">
            <div ref={mapContainerRef} className="h-full w-full" />

            {/* Style Switcher UI */}
            <div className="absolute top-3 right-3 z-10 flex gap-1 bg-neutral-900/90 backdrop-blur-md p-1 border border-neutral-700/50 rounded shadow-xl">
                {(Object.keys(MAP_STYLES) as Array<keyof typeof MAP_STYLES>).map((style) => (
                    <button
                        key={style}
                        onClick={() => setActiveStyle(style)}
                        className={cn(
                            "px-2 py-0.5 text-[9px] font-mono uppercase transition-all rounded-[2px]",
                            activeStyle === style
                                ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                        )}
                    >
                        {style}
                    </button>
                ))}
            </div>

            {/* Overlay UI */}
            <div className="absolute bottom-3 left-3 z-10">
                <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-700/50 p-2.5 rounded shadow-2xl text-[10px] text-neutral-300 font-mono">
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-white border-b border-neutral-700 pb-1 mb-2">
                        GLOBAL OPERATIONS COMMAND
                    </div>
                    {shipments.map(s => (
                        <div key={s.id} className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]" style={{ backgroundColor: s.color }} />
                            <span className="opacity-80">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                <div className="bg-neutral-900/40 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-mono text-neutral-500 uppercase tracking-tighter">
                    Mapbox Intelligence Core v4.2
                </div>
            </div>
        </div>
    );
}
