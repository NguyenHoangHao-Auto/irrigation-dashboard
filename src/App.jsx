import { useEffect, useState, useRef } from "react"
import mqtt from "mqtt"

const ZONES = [1, 2, 3]

const initialZones = () =>
  Object.fromEntries(
    ZONES.map((z) => [z, { moisture: null, flow: 0, valve: false }])
  )

export default function App() {
  const [zones, setZones] = useState(initialZones)
  const [connected, setConnected] = useState(false)
  const clientRef = useRef(null)

  useEffect(() => {
    const client = mqtt.connect(
      `wss://${import.meta.env.VITE_HIVEMQ_HOST}:8884/mqtt`,
      {
        username: import.meta.env.VITE_HIVEMQ_USER,
        password: import.meta.env.VITE_HIVEMQ_PASS,
        clientId: `react-dashboard-${Math.random().toString(16).slice(2)}`,
      }
    )

    client.on("connect", () => {
      setConnected(true)
      ZONES.forEach((z) => {
        client.subscribe(`irrigation/zone${z}/sensor`)
        client.subscribe(`irrigation/zone${z}/valve/status`)
      })
    })

    client.on("message", (topic, message) => {
      const data = JSON.parse(message.toString())
      const zoneMatch = topic.match(/zone(\d+)/)
      if (!zoneMatch) return
      const zoneId = parseInt(zoneMatch[1])

      setZones((prev) => ({
        ...prev,
        [zoneId]: {
          ...prev[zoneId],
          ...(topic.includes("sensor") && {
            moisture: data.moisture,
            flow: data.flow,
            valve: data.valve,
          }),
          ...(topic.includes("valve/status") && {
            valve: data.valve,
            flow: data.flow,
          }),
        },
      }))
    })

    client.on("disconnect", () => setConnected(false))
    clientRef.current = client

    return () => client.end()
  }, [])

  const toggleValve = (zoneId, currentState) => {
    clientRef.current?.publish(
      `irrigation/zone${zoneId}/valve/set`,
      currentState ? "OFF" : "ON",
      { qos: 1 }
    )
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "40px auto", padding: "0 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Hệ thống tưới tiêu</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>Sầu riêng tự động</p>
        </div>
        <span style={{
          fontSize: 12, padding: "6px 14px", borderRadius: 99, fontWeight: 500,
          background: connected ? "#EAF3DE" : "#FCEBEB",
          color: connected ? "#3B6D11" : "#A32D2D"
        }}>
          {connected ? "● Đã kết nối" : "● Mất kết nối"}
        </span>
      </div>

      {/* Zone cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {ZONES.map((zoneId) => {
          const z = zones[zoneId]
          const moistureColor =
            z.moisture === null ? "#888" :
            z.moisture < 40 ? "#E24B4A" :
            z.moisture < 60 ? "#EF9F27" : "#1D9E75"

          return (
            <div key={zoneId} style={{
              border: `1.5px solid ${z.valve ? "#1D9E75" : "#e8e8e8"}`,
              borderRadius: 16, padding: "20px 18px",
              background: z.valve ? "#F0FDF8" : "#fff",
              transition: "all 0.3s"
            }}>
              {/* Zone title */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#555" }}>Zone {zoneId}</span>
                <span style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 99,
                  background: z.valve ? "#D8F3E8" : "#f0f0f0",
                  color: z.valve ? "#0F6E56" : "#888"
                }}>
                  {z.valve ? "Đang tưới" : "Chờ"}
                </span>
              </div>

              {/* Độ ẩm */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 38, fontWeight: 600, color: moistureColor, lineHeight: 1 }}>
                  {z.moisture !== null ? `${z.moisture}%` : "—"}
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Độ ẩm đất</div>
              </div>

              {/* Moisture bar */}
              <div style={{ background: "#f0f0f0", borderRadius: 99, height: 6, marginBottom: 16 }}>
                <div style={{
                  height: 6, borderRadius: 99,
                  width: `${z.moisture ?? 0}%`,
                  background: moistureColor,
                  transition: "width 0.5s, background 0.3s"
                }}/>
              </div>

              {/* Flow */}
              <div style={{ fontSize: 13, color: "#666", marginBottom: 18 }}>
                Lưu lượng: <strong style={{ color: z.flow > 0 ? "#1D9E75" : "#aaa" }}>{z.flow} L/ph</strong>
              </div>

              {/* Nút van */}
              <button
                onClick={() => toggleValve(zoneId, z.valve)}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 10,
                  border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
                  background: z.valve ? "#D85A30" : "#1D9E75",
                  color: "#fff", transition: "background 0.2s",
                }}
              >
                {z.valve ? "Tắt van" : "Bật van"}
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <p style={{ textAlign: "center", fontSize: 12, color: "#ccc" }}>
        Cập nhật mỗi 3 giây · HiveMQ Cloud
      </p>
    </div>
  )
}