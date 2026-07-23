import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import api from '../../lib/axios'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const P_COLORS = { emergency:'#ef4444', high:'#f97316', medium:'#eab308', low:'#22c55e' }

const makeIcon = (color, size = 12) => L.divIcon({
  html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
  className: '', iconSize: [size, size], iconAnchor: [size/2, size/2],
})

const emergencyIcon = L.divIcon({
  html: `<div style="position:relative;width:18px;height:18px"><div style="width:18px;height:18px;background:#ef4444;border:3px solid #fff;border-radius:50%;box-shadow:0 0 12px rgba(239,68,68,.7)"></div></div>`,
  className: '', iconSize: [18, 18], iconAnchor: [9, 9],
})

export default function ComplaintMap({ selectedComplaint, height = '100%' }) {
  const [complaints, setComplaints] = useState([])

  useEffect(() => {
    api.get('/analytics/map').then((r) => setComplaints(r.data.complaints || [])).catch(() => {})
  }, [])

  const GWALIOR = [26.2124, 78.1772]

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer center={GWALIOR} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />

        {complaints.map((c) => {
          const [lng, lat] = c.location?.coordinates || [78.1772, 26.2124]
          const icon = c.isEmergency && c.status !== 'resolved' ? emergencyIcon : makeIcon(P_COLORS[c.priority] || '#708993')
          return (
            <Marker key={c._id} position={[lat, lng]} icon={icon}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-bold text-sm">{c.title || c.category}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.category} · {c.area}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs font-semibold ${c.priority === 'emergency' ? 'text-red-600' : 'text-amber-600'}`}>{c.priority?.toUpperCase()}</span>
                    <span className="text-xs text-gray-400">· {c.status}</span>
                  </div>
                  {c.complaintNumber && <p className="text-xs text-gray-400 mt-0.5 font-mono">{c.complaintNumber}</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {selectedComplaint?.location?.coordinates && (
          <Circle
            center={[selectedComplaint.location.coordinates[1], selectedComplaint.location.coordinates[0]]}
            radius={250}
            pathOptions={{ color: '#4A628A', fillColor: '#7AB2D3', fillOpacity: 0.25 }}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl p-2.5 shadow-glass text-xs z-[999]">
        {Object.entries(P_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 mb-0.5">
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: v, flexShrink: 0 }} />
            <span className="text-gray-600 capitalize">{k}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
