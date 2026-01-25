// src/lib/audit.js
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/firebase";

/**
 * Audit logging system for tracking important actions
 */

/**
 * Log an audit event
 */
export async function logAuditEvent(action, userId, details = {}, metadata = {}) {
  if (!db) {
    console.warn("Firestore not available, audit log not saved");
    return;
  }

  try {
    await addDoc(collection(db, "auditLogs"), {
      action,
      userId,
      details,
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      },
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log audit event:", error);
  }
}

/**
 * Get audit logs for a user
 */
export async function getAuditLogs(userId, limitCount = 50) {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, "auditLogs"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return [];
  }
}

/**
 * Get audit logs for an action type
 */
export async function getAuditLogsByAction(action, limitCount = 50) {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, "auditLogs"),
      where("action", "==", action),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Failed to get audit logs by action:", error);
    return [];
  }
}

/**
 * Common audit actions
 */
export const AuditActions = {
  USER_SIGNUP: "user_signup",
  USER_LOGIN: "user_login",
  USER_LOGOUT: "user_logout",
  BOOKING_CREATED: "booking_created",
  BOOKING_ACCEPTED: "booking_accepted",
  BOOKING_COMPLETED: "booking_completed",
  BOOKING_CANCELLED: "booking_cancelled",
  PAYMENT_PROCESSED: "payment_processed",
  PAYMENT_REFUNDED: "payment_refunded",
  DRIVER_VERIFIED: "driver_verified",
  DRIVER_REJECTED: "driver_rejected",
  PROFILE_UPDATED: "profile_updated",
  PASSWORD_CHANGED: "password_changed",
  ADMIN_ACTION: "admin_action",
};
