import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore"
import { createUserWithEmailAndPassword } from "firebase/auth"

export default function Admin() {
  const [users, setUsers] = useState([])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")
  const navigate = useNavigate()

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, "users"))
    setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { loadUsers() }, [])

  const addUser = async () => {
    setLoading(true)
    setMsg("")
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await setDoc(doc(db, "users", cred.user.uid), {
        email, role, createdAt: new Date()
      })
      setMsg("Tạo tài khoản thành công!")
      setEmail("")
      setPassword("")
      loadUsers()
    } catch (e) {
      setMsg("Lỗi: " + e.message)
    }
    setLoading(false)
  }

  const deleteUser = async (uid) => {
    if (!confirm("Xoá user này?")) return
    await deleteDoc(doc(db, "users", uid))
    loadUsers()
  }

  const updateRole = async (uid, newRole) => {
    await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true })
    loadUsers()
  }

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "40px auto", padding: "0 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Quản lý người dùng</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#888" }}>Thêm, xoá, phân quyền tài khoản</p>
        </div>
        <button onClick={() => navigate("/")} style={{
          padding: "8px 16px", borderRadius: 8, border: "1px solid #e0e0e0",
          background: "#fff", cursor: "pointer", fontSize: 13
        }}>
          Về Dashboard
        </button>
      </div>

      {/* Form thêm user */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 500 }}>Thêm tài khoản mới</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com" type="email"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Mật khẩu</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" type="password"
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box" }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Quyền</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, width: 200 }}
          >
            <option value="user">User — xem + điều khiển van</option>
            <option value="admin">Admin — toàn quyền</option>
          </select>
        </div>

        {msg && (
          <div style={{
            padding: "10px 12px", borderRadius: 8, marginBottom: 12, fontSize: 13,
            background: msg.includes("Lỗi") ? "#FCEBEB" : "#EAF3DE",
            color: msg.includes("Lỗi") ? "#A32D2D" : "#3B6D11"
          }}>
            {msg}
          </div>
        )}

        <button onClick={addUser} disabled={loading} style={{
          padding: "10px 24px", borderRadius: 8, border: "none",
          background: "#1D9E75", color: "#fff", fontSize: 14,
          fontWeight: 500, cursor: "pointer"
        }}>
          {loading ? "Đang tạo..." : "Thêm tài khoản"}
        </button>
      </div>

      {/* Danh sách user */}
      <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 16, padding: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 500 }}>
          Danh sách tài khoản ({users.length})
        </h3>
        {users.length === 0 ? (
          <p style={{ color: "#aaa", fontSize: 13 }}>Chưa có tài khoản nào</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                <th style={{ textAlign: "left", padding: "8px 0", color: "#888", fontWeight: 500 }}>Email</th>
                <th style={{ textAlign: "left", padding: "8px 0", color: "#888", fontWeight: 500 }}>Quyền</th>
                <th style={{ textAlign: "right", padding: "8px 0", color: "#888", fontWeight: 500 }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #fafafa" }}>
                  <td style={{ padding: "12px 0", color: "#333" }}>{u.email}</td>
                  <td style={{ padding: "12px 0" }}>
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      style={{
                        padding: "4px 8px", borderRadius: 6,
                        border: "1px solid #e0e0e0", fontSize: 12
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px 0", textAlign: "right" }}>
                    <button onClick={() => deleteUser(u.id)} style={{
                      padding: "4px 12px", borderRadius: 6,
                      border: "1px solid #f09595", background: "#FCEBEB",
                      color: "#A32D2D", fontSize: 12, cursor: "pointer"
                    }}>
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}