import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    setError("")
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/")
    } catch (e) {
      setError("Email hoặc mật khẩu không đúng")
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f5f5f5"
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "40px 36px",
        width: 360, border: "1px solid #eee"
      }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 600 }}>Đăng nhập</h2>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#888" }}>Hệ thống tưới sầu riêng tự động</p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>Email</label>
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid #e0e0e0", fontSize: 14, boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, color: "#555", display: "block", marginBottom: 6 }}>Mật khẩu</label>
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid #e0e0e0", fontSize: 14, boxSizing: "border-box"
            }}
          />
        </div>

        {error && (
          <div style={{
            background: "#FCEBEB", color: "#A32D2D", fontSize: 13,
            padding: "10px 12px", borderRadius: 8, marginBottom: 16
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleLogin} disabled={loading}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 8,
            border: "none", background: "#1D9E75", color: "#fff",
            fontSize: 15, fontWeight: 500, cursor: "pointer"
          }}
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </div>
    </div>
  )
}