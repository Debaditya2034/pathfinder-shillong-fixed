// src/lib/validation.js
import { z } from "zod";

// Email validation schema
export const emailSchema = z.string().email("Invalid email address").min(1, "Email is required");

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Phone number validation (Indian format)
export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number (must be 10 digits starting with 6-9)")
  .or(z.string().regex(/^\+91[6-9]\d{9}$/, "Invalid phone number format"));

// User signup schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  role: z.enum(["tourist", "driver", "admin"], {
    errorMap: () => ({ message: "Role must be tourist, driver, or admin" })
  }),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

// User signin schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

// Location/stop schema
export const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  lat: z.number().min(-90).max(90, "Invalid latitude"),
  lng: z.number().min(-180).max(180, "Invalid longitude"),
  address: z.string().optional(),
  description: z.string().optional(),
});

// Booking schema
export const bookingSchema = z.object({
  stops: z.array(locationSchema).min(2, "At least 2 stops are required"),
  vehicleType: z.enum(["sedan", "suv", "tempo"], {
    errorMap: () => ({ message: "Vehicle type must be sedan, suv, or tempo" })
  }),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  notes: z.string().optional(),
  touristId: z.string().optional(),
});

// Driver profile schema
export const driverProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: phoneSchema,
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.string().min(1, "License expiry date is required"),
  vehicleMake: z.string().min(1, "Vehicle make is required"),
  vehicleModel: z.string().min(1, "Vehicle model is required"),
  vehiclePlate: z.string().min(1, "Vehicle plate number is required"),
  vehicleCapacity: z.number().min(1, "Vehicle capacity must be at least 1"),
  aadharNumber: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits").optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format").optional(),
});

// Payment schema
export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("INR"),
  paymentMethod: z.enum(["card", "upi", "netbanking", "wallet"]),
  bookingId: z.string().min(1, "Booking ID is required"),
});

// Review/rating schema
export const reviewSchema = z.object({
  rating: z.number().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(500, "Comment must be less than 500 characters").optional(),
  bookingId: z.string().min(1, "Booking ID is required"),
});

// Helper function to validate data
export function validateData(schema, data) {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ path: "unknown", message: "Validation failed" }],
    };
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

// Rate limiting helper (client-side check)
const rateLimitStore = new Map();

export function checkRateLimit(key, maxRequests = 5, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}
