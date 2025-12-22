// src/pages/DriverSignup.jsx
import React, { useState } from "react";
import { auth, db, storage } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function DriverSignup() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aadharFile, setAadharFile] = useState(null);
  const [panFile, setPanFile] = useState(null);
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [plate, setPlate] = useState("");
  const [status, setStatus] = useState("");

  async function onSignup(e) {
    e.preventDefault();
    setStatus("Creating account...");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pw);
      const user = userCred.user;
      await updateProfile(user, { displayName: name });

      // upload docs if present
      const docs = {};
      if (aadharFile) {
        const refA = ref(storage, `driver_docs/${user.uid}/aadhar_${Date.now()}_${aadharFile.name}`);
        await uploadBytes(refA, aadharFile);
        docs.aadharUrl = await getDownloadURL(refA);
      }
      if (panFile) {
        const refP = ref(storage, `driver_docs/${user.uid}/pan_${Date.now()}_${panFile.name}`);
        await uploadBytes(refP, panFile);
        docs.panUrl = await getDownloadURL(refP);
      }

      const profile = {
        driverId: user.uid,
        uid: user.uid,
        name,
        email,
        phone,
        verified: false,
        rating: 0,
        vehicle: { make: vehicleMake, model: vehicleModel, plate },
        documents: docs,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "driverProfiles", user.uid), profile);
      await setDoc(doc(db, "users", user.uid), { uid: user.uid, email, phone, role: "driver", createdAt: new Date().toISOString() }, { merge: true });

      setStatus("Driver account created. Please sign in.");
    } catch (err) {
      console.error("Driver signup error", err);
      setStatus("Error: " + (err.message || err));
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Driver Sign Up</h2>
      <form onSubmit={onSignup} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
        <input placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} required />
        <div>
          <label>Aadhar (image/PDF)</label>
          <input type="file" onChange={e => setAadharFile(e.target.files[0])} />
        </div>
        <div>
          <label>PAN (image/PDF)</label>
          <input type="file" onChange={e => setPanFile(e.target.files[0])} />
        </div>
        <h4>Vehicle details</h4>
        <input placeholder="Make" value={vehicleMake} onChange={e => setVehicleMake(e.target.value)} />
        <input placeholder="Model" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} />
        <input placeholder="Number plate" value={plate} onChange={e => setPlate(e.target.value)} />
        <button type="submit">Create Driver Account</button>
      </form>
      <div style={{ marginTop: 12 }}>{status}</div>
    </div>
  );
}
