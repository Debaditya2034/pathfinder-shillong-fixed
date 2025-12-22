// src/components/BookingCodeDialog.jsx
import React, { useState } from "react";
import { db } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function BookingCodeDialog({ onFound }) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  async function checkCode() {
    setStatus("Searching...");
    try {
      const col = collection(db, "bookings");
      const q = query(col, where("bookingCode", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) {
        setStatus("No booking found with that code.");
        return;
      }
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStatus("Found " + docs.length + " booking(s).");
      if (onFound) onFound(docs);
    } catch (err) {
      console.error("Booking code check failed", err);
      setStatus("Error: " + (err.message || err));
    }
  }

  return (
    <div style={{ border: "1px solid #ccc", padding: 12, maxWidth: 420 }}>
      <h4>Enter booking code</h4>
      <input value={code} onChange={e => setCode(e.target.value)} placeholder="6-digit code" />
      <div style={{ marginTop: 8 }}>
        <button onClick={checkCode}>Check</button>
      </div>
      <div style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
