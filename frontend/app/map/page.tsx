"use client"
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

export default function MapPage() {
  const [points, setPoints] = useState<any[]>([])
  const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    import('leaflet/dist/leaflet.css')
    const url = `${apiBase}/geo/units?ano=2024`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const rows = Array.isArray(data?.data) ? data.data : []
        setPoints(rows.filter((r: any) => typeof r.latitude === 'number' && typeof r.longitude === 'number'))
      })
      .catch(() => {})
  }, [apiBase])

  const center = useMemo<[number, number]>(() => [-22.90, -43.20], [])

  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {points.map((p, idx) => (
          <Marker key={idx} position={[p.latitude, p.longitude] as [number, number]}>
            <Popup>
              <div>
                <div><strong>CNES:</strong> {p.unidade_id_cnes}</div>
                <div><strong>Nome:</strong> {p.unidade_nome}</div>
                {p.bairro && <div><strong>Bairro:</strong> {p.bairro}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </main>
  )
}

