import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoJSON } from 'react-leaflet';
import { FeatureCollection } from 'geojson';

// Chart.js (react wrapper)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

type PointData = {
  id: number;
  lat: number;
  lon: number;
  label?: string;
  values: number[];
};

type OpenStreetMapChartProps = {
  points?: PointData[];
  chartOptions?: ChartOptions<'line'>;
};

export const OpenStreetMapChart = ({
  points = [
    { id: 1, lat: -23.55, lon: -46.63, label: 'A', values: [5, 7, 3, 6] },
    { id: 2, lat: -23.56, lon: -46.64, label: 'B', values: [2, 4, 5, 8] },
  ],
}: OpenStreetMapChartProps) => {

  const [rioGeoJson, setRioGeoJson] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch('/data/jeojs-BRRJ-mun.json')
      .then((response) => response.json())
      .then((data) => setRioGeoJson(data));
  }, []);

  return (
    <div className='w-fll h-[480px] rounded-lg overflow-hidden shadow-lg'>
      <MapContainer className='w-full h-full'>
        {rioGeoJson && (
          <GeoJSON
            data={rioGeoJson}
          />
        )}

        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lon]}>
            <Popup>{p.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};
