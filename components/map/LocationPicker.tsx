'use client';
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number, address: string) => void;
}

function LocationMarker({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function LocationPicker({ latitude = 40.7128, longitude = -74.0060, onLocationChange }: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<[number, number]>([latitude, longitude]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setCurrentPosition([latitude, longitude]);
  }, [latitude, longitude]);

  const handleLocationChange = async (lat: number, lng: number) => {
    setCurrentPosition([lat, lng]);
    
    // Reverse geocoding to get address
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      onLocationChange(lat, lng, address);
    } catch (error) {
      console.error('Error getting address:', error);
      onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
  };

  if (!mounted) {
    return <div className="h-64 bg-gray-200 rounded-md flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="h-64 w-full rounded-md overflow-hidden border border-gray-300">
      <MapContainer
        center={currentPosition}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {latitude && longitude && (
          <Marker position={currentPosition}></Marker>
        )}
        <LocationMarker onLocationChange={handleLocationChange} />
      </MapContainer>
    </div>
  );
}