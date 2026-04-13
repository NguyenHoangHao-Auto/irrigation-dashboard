import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { auth, db } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

export default function PrivateRoute({ children, adminOnly = false }) {
  const [status, setStatus] = useState("loading")
  const [role, setRole] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus("no-auth")
        return
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid))
        console.log("Project:", db.app.options.projectId)
        console.log("UID:", user.uid)
        console.log("Snap exists:", snap.exists())
        console.log("Snap data:", snap.data())
        if (snap.exists()) {
          const data = snap.data()
          console.log("Role found:", data.role)
          setRole(data.role)
          setStatus("ok")
        } else {
          console.log("No user doc found for UID:", user.uid)
          setStatus("ok") // vào được nhưng không có role
        }
      } catch (e) {
        console.error("Firestore error:", e)
        setStatus("ok") // nếu lỗi vẫn cho vào, không treo
      }
    })
    return () => unsub()
  }, [])

  if (status === "loading") return (
    <div style={{
      display: "flex", justifyContent: "center",
      alignItems: "center", height: "100vh",
      fontSize: 14, color: "#888"
    }}>
      Đang tải...
    </div>
  )

  if (status === "no-auth") return <Navigate to="/login" />
  if (adminOnly && role !== "admin") return <Navigate to="/" />
  return children
}