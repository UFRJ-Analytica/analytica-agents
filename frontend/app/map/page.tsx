"use client"

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../src/components/providers/AuthProvider'

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as typeof import('react-leaflet').MapContainer
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as typeof import('react-leaflet').TileLayer
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false }) as typeof import('react-leaflet').Marker
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false }) as typeof import('react-leaflet').Popup

export default function MapPage() {
  const { session, loading } = useAuth()
  const router = useRouter()
  const [points, setPoints] = useState<any[]>([])
  const apiBase = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/?auth=signin')
    }
  }, [loading, session, router])

  useEffect(() => {
    if (!session) {
      setPoints([])
      return
    }

    import('leaflet/dist/leaflet.css')
    const controller = new AbortController()
    const url = `${apiBase}/geo/units?ano=2024`

    fetch(url, { signal: controller.signal })
      .then((response) => response.json())
      .then((data) => {
        const rows = Array.isArray(data?.data) ? data.data : []
        setPoints(rows.filter((row: any) => typeof row.latitude === 'number' && typeof row.longitude === 'number'))
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPoints([])
        }
      })

    return () => controller.abort()
  }, [apiBase, session])

  const center = useMemo<[number, number]>(() => [-22.9, -43.2], [])

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Verificando credenciais...
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Redirecionando para a landing...
      </div>
    )
  }

  return (
    <main style={{ height: '100vh', width: '100vw' }}>
      <MapContainer center={center} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {points.map((point, idx) => (
          <Marker key={idx} position={[point.latitude, point.longitude] as [number, number]}>
            <Popup>
              <div>
                <div><strong>CNES:</strong> {point.unidade_id_cnes}</div>
                <div><strong>Nome:</strong> {point.unidade_nome}</div>
                {point.bairro && <div><strong>Bairro:</strong> {point.bairro}</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </main>
  )
}
