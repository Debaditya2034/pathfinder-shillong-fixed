// src/components/OnboardingFlow.jsx
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { driverProfileSchema, validateData } from "@/lib/validation";
import { doc, setDoc, serverTimestamp, ref, uploadBytes, getDownloadURL } from "firebase/firestore";
import { db, storage } from "@/firebase";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";

/**
 * Onboarding flow for drivers
 * Handles KYC/document upload and verification
 */
const OnboardingFlow = ({ onComplete }) => {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    licenseExpiry: "",
    vehicleMake: "",
    vehicleModel: "",
    vehiclePlate: "",
    vehicleCapacity: "",
    aadharNumber: "",
    panNumber: "",
  });
  const [documents, setDocuments] = useState({
    license: null,
    aadhar: null,
    pan: null,
    vehicleRC: null,
    photo: null,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload JPEG, PNG, or PDF.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB.");
      return;
    }

    setLoading(true);
    try {
      if (storage && user) {
        const fileRef = ref(storage, `drivers/${user.uid}/${field}/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        setDocuments((prev) => ({ ...prev, [field]: downloadURL }));
        toast.success(`${field} uploaded successfully`);
      } else {
        // Demo mode: store file reference
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocuments((prev) => ({ ...prev, [field]: reader.result }));
          toast.success(`${field} uploaded successfully (Demo Mode)`);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(`Failed to upload ${field}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const validation = validateData(driverProfileSchema, {
      ...formData,
      vehicleCapacity: parseInt(formData.vehicleCapacity),
    });

    if (!validation.success) {
      toast.error(validation.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      if (db && user) {
        const driverProfile = {
          uid: user.uid,
          email: user.email,
          ...formData,
          vehicleCapacity: parseInt(formData.vehicleCapacity),
          documents,
          verified: false,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(doc(db, "driverProfiles", user.uid), driverProfile);
        toast.success("Profile submitted successfully! Waiting for admin verification.");
        if (onComplete) onComplete();
      } else {
        // Demo mode
        const profiles = JSON.parse(localStorage.getItem("pathfinder_drivers") || "[]");
        profiles.push({
          uid: user?.uid || `demo_${Date.now()}`,
          ...formData,
          documents,
          verified: false,
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem("pathfinder_drivers", JSON.stringify(profiles));
        toast.success("Profile submitted successfully (Demo Mode)!");
        if (onComplete) onComplete();
      }
    } catch (error) {
      console.error("Profile submission error:", error);
      toast.error("Failed to submit profile");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Personal Information",
      fields: [
        { key: "name", label: "Full Name", type: "text", required: true },
        { key: "phone", label: "Phone Number", type: "tel", required: true },
      ],
    },
    {
      title: "License Details",
      fields: [
        { key: "licenseNumber", label: "License Number", type: "text", required: true },
        { key: "licenseExpiry", label: "License Expiry Date", type: "date", required: true },
      ],
      documents: [{ key: "license", label: "Upload License Copy" }],
    },
    {
      title: "Vehicle Information",
      fields: [
        { key: "vehicleMake", label: "Vehicle Make", type: "text", required: true },
        { key: "vehicleModel", label: "Vehicle Model", type: "text", required: true },
        { key: "vehiclePlate", label: "Vehicle Plate Number", type: "text", required: true },
        { key: "vehicleCapacity", label: "Vehicle Capacity", type: "number", required: true },
      ],
      documents: [{ key: "vehicleRC", label: "Upload Vehicle RC" }],
    },
    {
      title: "KYC Documents",
      fields: [
        { key: "aadharNumber", label: "Aadhar Number (Optional)", type: "text", required: false },
        { key: "panNumber", label: "PAN Number (Optional)", type: "text", required: false },
      ],
      documents: [
        { key: "aadhar", label: "Upload Aadhar Copy (Optional)" },
        { key: "pan", label: "Upload PAN Copy (Optional)" },
        { key: "photo", label: "Upload Photo" },
      ],
    },
  ];

  const currentStepData = steps[step - 1];

  return (
    <Card className="bg-[#14221c] border border-[#1d3a2f] max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-[#e3f5ec]">{currentStepData.title}</CardTitle>
          <span className="text-sm text-[#d9efe6]">
            Step {step} of {steps.length}
          </span>
        </div>
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded ${
                index + 1 <= step ? "bg-pf-green" : "bg-[#1d3a2f]"
              }`}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStepData.fields.map((field) => (
          <div key={field.key}>
            <Label htmlFor={field.key} className="text-[#e3f5ec]">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.key}
              type={field.type}
              value={formData[field.key]}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              required={field.required}
              className="mt-2 bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
            />
          </div>
        ))}

        {currentStepData.documents?.map((doc) => (
          <div key={doc.key}>
            <Label className="text-[#e3f5ec] mb-2 block">{doc.label}</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(doc.key, e.target.files[0])}
                className="bg-[#0f1412] border-[#1d3a2f] text-[#e8f6ef]"
                disabled={loading}
              />
              {documents[doc.key] && (
                <CheckCircle className="h-5 w-5 text-pf-green" />
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1 || loading}
            className="border-[#1d3a2f] text-[#e3f5ec] hover:bg-[#0f1412]"
          >
            Back
          </Button>
          {step < steps.length ? (
            <Button
              onClick={() => setStep((s) => Math.min(steps.length, s + 1))}
              disabled={loading}
              className="bg-pf-green text-black hover:bg-[#12c77c]"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-pf-green text-black hover:bg-[#12c77c]"
            >
              {loading ? "Submitting..." : "Submit Profile"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingFlow;
