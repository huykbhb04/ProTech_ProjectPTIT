
import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Internal component to handle clicks
const MapEvents = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng);
        },
    });
    return null;
};

// Component to recenter map when coordinates change
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const LocationPicker = ({ position, onLocationChange, readOnly = false, height = "300px" }) => {
    // Default to Ho Chi Minh City if no position
    const defaultPosition = [10.762622, 106.660172];
    const center = position ? [position.lat, position.lng] : defaultPosition;

    return (
        <div className="rounded-xl overflow-hidden border border-gray-200 z-0 relative" style={{ height }}>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={!readOnly}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {!readOnly && <MapEvents onLocationSelect={onLocationChange} />}

                <MapUpdater center={position ? [position.lat, position.lng] : null} />

                {position && (
                    <Marker position={[position.lat, position.lng]} />
                )}
            </MapContainer>

            {!readOnly && (
                <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] shadow z-[1000] pointer-events-none">
                    Click bản đồ để chọn vị trí
                </div>
            )}
        </div>
    );
};

export default LocationPicker;
