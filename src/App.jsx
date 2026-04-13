import { useEffect, useState, useRef } from "react"
import mqtt from "mqtt"
import { db } from "./firebase"
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
console.log("App đang chạy")
console.log("Firebase DB:", db)
const ZONES = [1, 2, 3]
const ZONE_COLORS = { 1: "#1D9E75", 2: "#378ADD", 3: "#D85A30" }

const initialZones = () =>
  Object.fromEntries(ZONES.map((z) => [z, { moisture: null, flow: 0, valve: false }]))

export default function App() {
  const [zones, setZones] = useState(initialZones)
  const [connected, setConnected] = useState(false)
  const [chartData, setChartData] = useState([])
  const [valveHistory, setValveHistory] = useState([])
  const [activeZone, setActiveZone] = useState(1)
  const clientRef = useRef(null)

  // Load lịch sử 7 ngày từ Firestore
  useEffect(() => {
    loadChartData(activeZone)
    loadValveHistory(activeZone)
  }, [activeZone])

  const loadChartData = async (zoneId) => {
    const sevenDaysAgo = Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    const q = query(
      collection(db, "moisture_history"),
      where("zone", "==", zoneId),
      where("timestamp", ">=", sevenDaysAgo),
      orderBy("timestamp", "asc"),
      limit(500)
    )
    const snap = await getDocs(q)
    const data = snap.docs.map((doc) => {
      const d = doc.data()
      return {
        time: d.timestamp?.toDate().toLocaleString("vi-VN", {
          month: "numeric", day: "numeric",
          hour: "2-digit", minute: "2-digit"
        }),
        moisture: d.moisture,
      }
    })
    setChartData(data)
  }

  const loadValveHistory = async (zoneId) => {
    const sevenDaysAgo = Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )
    const q = query(
      collection(db, "valve_history"),
      where("zone", "==", zoneId),
      where("timestamp", ">=", sevenDaysAgo),
      orderBy("timestamp", "desc"),
      limit(50)
    )
    const snap = await getDocs(q)
    setValveHistory(snap.docs.map((doc) => {
      const d = doc.data()
      return {
        time: d.timestamp?.toDate().toLocaleString("vi-VN"),
        state: d.state,
      }
    }))
  }

  // MQTT
  useEffect(() => {
    const client = mqtt.connect(
      `wss://${import.meta.env.VITE_HIVEMQ_HOST}:8884/mqtt`,
      {
        username: import.meta.env.VITE_HIVEMQ_USER,
        password: import.meta.env.VITE_HIVEMQ_PASS,
        clientId: `react-${Math.random().toString(16).slice(2)}`,
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
    <div style={{ fontFamily: "sans-serif", maxWidth: 900, margin: "40px auto", padding: "0 24px" }}>

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
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
              <div style={{ fontSize: 38, fontWeight: 600, color: moistureColor, lineHeight: 1 }}>
                {z.moisture !== null ? `${z.moisture}%` : "—"}
              </div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, marginBottom: 12 }}>Độ ẩm đất</div>
              <div style={{ background: "#f0f0f0", borderRadius: 99, height: 6, marginBottom: 16 }}>
                <div style={{
                  height: 6, borderRadius: 99,
                  width: `${z.moisture ?? 0}%`,
                  background: moistureColor,
                  transition: "width 0.5s"
                }}/>
              </div>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 18 }}>
                Lưu lượng: <strong style={{ color: z.flow > 0 ? "#1D9E75" : "#aaa" }}>{z.flow} L/ph</strong>
              </div>
              <button
                onClick={() => toggleValve(zoneId, z.valve)}
                style={{
                  width: "100%", padding: "10px 0", borderRadius: 10,
                  border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500,
                  background: z.valve ? "#D85A30" : "#1D9E75",
                  color: "#fff", transition: "background 0.2s"
                }}
              >
                {z.valve ? "Tắt van" : "Bật van"}
              </button>
            </div>
          )
        })}
      </div>

      {/* Zone selector cho chart */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {ZONES.map((z) => (
          <button key={z} onClick={() => setActiveZone(z)} style={{
            padding: "6px 18px", borderRadius: 99, border: "none",
            cursor: "pointer", fontSize: 13, fontWeight: 500,
            background: activeZone === z ? ZONE_COLORS[z] : "#f0f0f0",
            color: activeZone === z ? "#fff" : "#666",
            transition: "all 0.2s"
          }}>
            Zone {z}
          </button>
        ))}
        <button onClick={() => { loadChartData(activeZone); loadValveHistory(activeZone) }} style={{
          padding: "6px 18px", borderRadius: 99, border: "1px solid #e0e0e0",
          cursor: "pointer", fontSize: 13, background: "#fff", color: "#666", marginLeft: "auto"
        }}>
          Làm mới
        </button>
      </div>

      {/* Chart độ ẩm */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 500 }}>
          Độ ẩm 7 ngày — Zone {activeZone}
        </h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5"/>
              <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd"/>
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%"/>
              <Tooltip formatter={(v) => [`${v}%`, "Độ ẩm"]}/>
              <Line
                type="monotone" dataKey="moisture"
                stroke={ZONE_COLORS[activeZone]}
                strokeWidth={2} dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", color: "#aaa", padding: "60px 0" }}>
            Chưa có dữ liệu — chạy Python simulator để bắt đầu ghi
          </div>
        )}
      </div>

      {/* Lịch sử van */}
      <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 500 }}>
          Lịch sử van 7 ngày — Zone {activeZone}
        </h3>
        {valveHistory.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <th style={{ textAlign: "left", padding: "8px 0", color: "#888", fontWeight: 500 }}>Thời gian</th>
                <th style={{ textAlign: "left", padding: "8px 0", color: "#888", fontWeight: 500 }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {valveHistory.map((v, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #fafafa" }}>
                  <td style={{ padding: "10px 0", color: "#555" }}>{v.time}</td>
                  <td style={{ padding: "10px 0" }}>
                    <span style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 99, fontWeight: 500,
                      background: v.state === "ON" ? "#EAF3DE" : "#FCEBEB",
                      color: v.state === "ON" ? "#3B6D11" : "#A32D2D"
                    }}>
                      {v.state === "ON" ? "Bật van" : "Tắt van"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", color: "#aaa", padding: "40px 0" }}>
            Chưa có lịch sử
          </div>
        )}
      </div>

    </div>
  )
}