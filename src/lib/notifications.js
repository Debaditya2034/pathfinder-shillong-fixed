// src/lib/notifications.js
import { doc, updateDoc, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { db, functions } from "@/firebase";
import { phoneSchema, emailSchema, validateData } from "@/lib/validation";
import { toast } from "sonner";

/**
 * SMS notification service
 * Supports Twilio, AWS SNS, or custom SMS gateway
 */

/**
 * Send SMS notification
 */
export async function sendSMS(phoneNumber, message, bookingId = null) {
  const validation = validateData(phoneSchema, phoneNumber);
  if (!validation.success) {
    throw new Error(validation.errors[0].message);
  }

  try {
    // Format phone number (ensure +91 prefix for India)
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+91${formattedPhone}`;
    }

    // In production, call your backend API or Firebase Cloud Function
    if (functions && import.meta.env.VITE_ENABLE_SMS === "true") {
      const sendSMSFunction = functions.httpsCallable("sendSMS");
      const result = await sendSMSFunction({
        phoneNumber: formattedPhone,
        message,
        bookingId,
      });
      return result.data;
    } else {
      // Demo mode: simulate SMS sending
      console.log(`[DEMO SMS] To: ${formattedPhone}`);
      console.log(`[DEMO SMS] Message: ${message}`);

      // Store notification in Firestore for tracking
      if (db) {
        try {
          await addDoc(collection(db, "notifications"), {
            type: "sms",
            recipient: formattedPhone,
            message,
            bookingId,
            status: "sent",
            sentAt: serverTimestamp(),
            demo: true,
          });
        } catch (err) {
          console.warn("Failed to log SMS notification to Firestore", err);
        }
      }

      toast.success("SMS notification sent (Demo Mode)");
      return { success: true, demo: true, messageId: `demo_${Date.now()}` };
    }
  } catch (error) {
    console.error("SMS sending error:", error);
    toast.error("Failed to send SMS notification");
    throw error;
  }
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(phoneNumber) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const message = `Your PathFinder Shillong OTP is ${otp}. Valid for 10 minutes.`;

  await sendSMS(phoneNumber, message);

  // Store OTP in localStorage or Firestore for verification
  const otpData = {
    phoneNumber,
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  if (db) {
    try {
      await addDoc(collection(db, "otps"), {
        ...otpData,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn("Failed to store OTP in Firestore, using localStorage", err);
      localStorage.setItem(`otp_${phoneNumber}`, JSON.stringify(otpData));
    }
  } else {
    localStorage.setItem(`otp_${phoneNumber}`, JSON.stringify(otpData));
  }

  return { otp, expiresAt: otpData.expiresAt };
}

/**
 * Verify OTP
 */
export async function verifyOTP(phoneNumber, otp) {
  try {
    let otpData = null;

    if (db) {
      const { collection, query, where, getDocs, deleteDoc, doc } = await import("firebase/firestore");
      const otpsRef = collection(db, "otps");
      const q = query(
        otpsRef,
        where("phoneNumber", "==", phoneNumber),
        where("otp", "==", otp)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const otpDoc = snapshot.docs[0];
        otpData = otpDoc.data();
        const expiresAt = otpData.expiresAt?.toMillis?.() || otpData.expiresAt;

        if (Date.now() > expiresAt) {
          await deleteDoc(otpDoc.ref);
          throw new Error("OTP has expired");
        }

        await deleteDoc(otpDoc.ref);
        return { valid: true };
      }
    } else {
      const stored = localStorage.getItem(`otp_${phoneNumber}`);
      if (stored) {
        otpData = JSON.parse(stored);
        if (Date.now() > otpData.expiresAt) {
          localStorage.removeItem(`otp_${phoneNumber}`);
          throw new Error("OTP has expired");
        }
        if (otpData.otp === otp) {
          localStorage.removeItem(`otp_${phoneNumber}`);
          return { valid: true };
        }
      }
    }

    return { valid: false };
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
}

/**
 * Email notification service
 * Supports SendGrid, AWS SES, or custom email service
 */

/**
 * Send email notification
 */
export async function sendEmail(to, subject, htmlBody, textBody = null, bookingId = null) {
  const validation = validateData(emailSchema, to);
  if (!validation.success) {
    throw new Error(validation.errors[0].message);
  }

  try {
    // In production, call your backend API or Firebase Cloud Function
    if (functions && import.meta.env.VITE_ENABLE_EMAIL === "true") {
      const sendEmailFunction = functions.httpsCallable("sendEmail");
      const result = await sendEmailFunction({
        to,
        subject,
        htmlBody,
        textBody: textBody || htmlBody.replace(/<[^>]*>/g, ""), // Strip HTML tags
        bookingId,
      });
      return result.data;
    } else {
      // Demo mode: simulate email sending
      console.log(`[DEMO EMAIL] To: ${to}`);
      console.log(`[DEMO EMAIL] Subject: ${subject}`);

      // Store notification in Firestore for tracking
      if (db) {
        try {
          await addDoc(collection(db, "notifications"), {
            type: "email",
            recipient: to,
            subject,
            message: textBody || htmlBody,
            bookingId,
            status: "sent",
            sentAt: serverTimestamp(),
            demo: true,
          });
        } catch (err) {
          console.warn("Failed to log email notification to Firestore", err);
        }
      }

      toast.success("Email notification sent (Demo Mode)");
      return { success: true, demo: true, messageId: `demo_${Date.now()}` };
    }
  } catch (error) {
    console.error("Email sending error:", error);
    toast.error("Failed to send email notification");
    throw error;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(userEmail, bookingDetails) {
  const subject = "Booking Confirmed - PathFinder Shillong";
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d7a5f;">Booking Confirmed!</h2>
      <p>Dear ${bookingDetails.touristName || "Customer"},</p>
      <p>Your booking has been confirmed. Here are the details:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Booking Code:</strong> ${bookingDetails.bookingCode}</p>
        <p><strong>Date:</strong> ${new Date(bookingDetails.scheduledDate).toLocaleDateString()}</p>
        <p><strong>Route:</strong> ${bookingDetails.stops?.map(s => s.name).join(" → ") || "N/A"}</p>
        <p><strong>Vehicle:</strong> ${bookingDetails.vehicleType || "N/A"}</p>
        <p><strong>Total Cost:</strong> ₹${bookingDetails.estimatedCost?.toLocaleString() || "0"}</p>
      </div>
      <p>You will receive an SMS notification once a driver accepts your booking.</p>
      <p>Thank you for choosing PathFinder Shillong!</p>
    </div>
  `;

  return await sendEmail(userEmail, subject, htmlBody, null, bookingDetails.bookingId);
}

/**
 * Send driver assignment notification
 */
export async function sendDriverAssignmentNotification(phoneNumber, email, driverDetails, bookingDetails) {
  const smsMessage = `Your PathFinder booking ${bookingDetails.bookingCode} has been assigned to driver ${driverDetails.name}. Driver contact: ${driverDetails.phone}`;
  
  const emailSubject = `Driver Assigned - Booking ${bookingDetails.bookingCode}`;
  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d7a5f;">Driver Assigned!</h2>
      <p>Your booking has been assigned to a driver.</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Driver Name:</strong> ${driverDetails.name}</p>
        <p><strong>Driver Phone:</strong> ${driverDetails.phone}</p>
        <p><strong>Vehicle:</strong> ${driverDetails.vehicle || "N/A"}</p>
        <p><strong>Booking Code:</strong> ${bookingDetails.bookingCode}</p>
      </div>
      <p>Please be ready at the scheduled pickup time.</p>
    </div>
  `;

  const promises = [];
  if (phoneNumber) promises.push(sendSMS(phoneNumber, smsMessage, bookingDetails.bookingId));
  if (email) promises.push(sendEmail(email, emailSubject, emailBody, null, bookingDetails.bookingId));

  return Promise.allSettled(promises);
}

/**
 * Send push notification (for future PWA implementation)
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // This would integrate with Firebase Cloud Messaging (FCM)
    if (functions && import.meta.env.VITE_ENABLE_PUSH === "true") {
      const sendPushFunction = functions.httpsCallable("sendPushNotification");
      return await sendPushFunction({ userId, title, body, data });
    } else {
      console.log(`[DEMO PUSH] To: ${userId}, Title: ${title}, Body: ${body}`);
      return { success: true, demo: true };
    }
  } catch (error) {
    console.error("Push notification error:", error);
    throw error;
  }
}
