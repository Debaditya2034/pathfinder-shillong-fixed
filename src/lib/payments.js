// src/lib/payments.js
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { paymentSchema, validateData } from "@/lib/validation";
import { toast } from "sonner";

/**
 * Stripe payment integration
 * Note: In production, you should use Stripe Elements and handle payments server-side
 * This is a client-side integration example
 */

// Initialize Stripe (you'll need to add Stripe script to index.html or use @stripe/stripe-js)
let stripe = null;
let stripePromise = null;

if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
  // Dynamic import of Stripe.js
  stripePromise = import("@stripe/stripe-js").then(({ loadStripe }) =>
    loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  );
}

/**
 * Create a payment intent for a booking
 */
export async function createPaymentIntent(bookingId, amount, currency = "INR") {
  const validation = validateData(
    paymentSchema.pick({ amount: true, currency: true }),
    { amount, currency }
  );

  if (!validation.success) {
    throw new Error(validation.errors[0].message);
  }

  try {
    // In production, this should call your backend API
    // For demo, we'll simulate the payment intent creation
    if (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && stripePromise) {
      stripe = await stripePromise;
      
      // Call your backend endpoint to create payment intent
      const response = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          amount: Math.round(amount * 100), // Convert to paise/cents
          currency: currency.toLowerCase(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret } = await response.json();
      return { clientSecret, stripe };
    } else {
      // Demo mode: return mock payment intent
      return {
        clientSecret: "demo_client_secret_" + Date.now(),
        stripe: null,
        demo: true,
      };
    }
  } catch (error) {
    console.error("Payment intent creation error:", error);
    throw error;
  }
}

/**
 * Process payment for a booking
 */
export async function processPayment(bookingId, paymentMethod, amount, currency = "INR") {
  const validation = validateData(paymentSchema, {
    amount,
    currency,
    paymentMethod,
    bookingId,
  });

  if (!validation.success) {
    throw new Error(validation.errors[0].message);
  }

  try {
    // In production, use Stripe.js to confirm payment
    if (stripe && !paymentMethod.demo) {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentMethod.clientSecret,
        {
          payment_method: {
            card: paymentMethod.card,
            billing_details: {
              name: paymentMethod.name,
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      // Update booking with payment status
      await updateDoc(doc(db, "bookings", bookingId), {
        paymentStatus: "paid",
        paymentId: paymentIntent.id,
        paidAt: serverTimestamp(),
      });

      return { success: true, paymentIntent };
    } else {
      // Demo mode: simulate successful payment
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      if (db) {
        try {
          await updateDoc(doc(db, "bookings", bookingId), {
            paymentStatus: "paid",
            demoPayment: { status: "completed", method: paymentMethod },
            paidAt: serverTimestamp(),
          });
        } catch (err) {
          console.warn("Failed to update Firestore, using localStorage fallback", err);
          // Fallback to localStorage
          const bookings = JSON.parse(localStorage.getItem("pf_demo_bookings") || "[]");
          const bookingIndex = bookings.findIndex((b) => b.id === bookingId);
          if (bookingIndex !== -1) {
            bookings[bookingIndex].paymentStatus = "paid";
            bookings[bookingIndex].demoPayment = { status: "completed", method: paymentMethod };
            localStorage.setItem("pf_demo_bookings", JSON.stringify(bookings));
          }
        }
      }

      toast.success("Payment processed successfully (Demo Mode)");
      return { success: true, demo: true };
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    toast.error(error.message || "Payment failed");
    throw error;
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(bookingId, amount) {
  try {
    // In production, call your backend API to process refund via Stripe
    const response = await fetch("/api/refund-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId, amount }),
    });

    if (!response.ok) {
      throw new Error("Refund failed");
    }

    const result = await response.json();

    // Update booking status
    if (db) {
      await updateDoc(doc(db, "bookings", bookingId), {
        paymentStatus: "refunded",
        refundedAt: serverTimestamp(),
      });
    }

    return result;
  } catch (error) {
    console.error("Refund error:", error);
    throw error;
  }
}

/**
 * Get payment status for a booking
 */
export async function getPaymentStatus(bookingId) {
  try {
    if (db) {
      const bookingDoc = await import("firebase/firestore").then((m) =>
        m.getDoc(m.doc(db, "bookings", bookingId))
      );
      if (bookingDoc.exists()) {
        const data = bookingDoc.data();
        return {
          status: data.paymentStatus || "pending",
          amount: data.amount || 0,
          paidAt: data.paidAt || null,
        };
      }
    }

    // Fallback to localStorage
    const bookings = JSON.parse(localStorage.getItem("pf_demo_bookings") || "[]");
    const booking = bookings.find((b) => b.id === bookingId);
    return booking
      ? {
          status: booking.paymentStatus || "pending",
          amount: booking.amount || 0,
          paidAt: booking.paidAt || null,
        }
      : null;
  } catch (error) {
    console.error("Get payment status error:", error);
    return null;
  }
}
