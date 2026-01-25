// src/lib/i18n.jsx
import { useState, useEffect, createContext, useContext } from "react";

/**
 * Internationalization (i18n) support
 * Simple implementation with localStorage persistence
 */

const translations = {
  en: {
    // Common
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      back: "Back",
      next: "Next",
      submit: "Submit",
    },
    // Navigation
    nav: {
      home: "Home",
      about: "About",
      itinerary: "Plan Trip",
      driver: "Driver Dashboard",
      admin: "Admin Dashboard",
      login: "Login",
      logout: "Logout",
      signup: "Sign Up",
    },
    // Auth
    auth: {
      login: "Login",
      signup: "Sign Up",
      email: "Email",
      password: "Password",
      phone: "Phone",
      name: "Name",
      role: "I am a",
      tourist: "Tourist",
      driver: "Driver/Guide",
      admin: "Admin",
      welcomeBack: "Welcome back!",
      createAccount: "Create your account",
      loginSuccess: "Logged in successfully!",
      signupSuccess: "Account created successfully!",
      loginFailed: "Authentication failed",
      passwordReset: "Reset Password",
      forgotPassword: "Forgot Password?",
    },
    // Booking
    booking: {
      planTrip: "Plan Your Itinerary",
      popularLocations: "Popular Locations",
      yourRoute: "Your Route",
      stops: "stops",
      selectLocations: "Select locations to build your itinerary",
      tripDetails: "Trip Details",
      vehicleType: "Vehicle Type",
      scheduledDate: "Scheduled Date",
      totalDistance: "Total Distance",
      estimatedCost: "Estimated Cost",
      confirmBooking: "Confirm Booking",
      bookingConfirmed: "Booking Confirmed!",
      bookingCode: "Booking Code",
      presentCode: "Present this code to your driver at pickup",
      waitingAcceptance: "Your booking is pending driver acceptance",
      smsNotification: "You will receive an SMS notification once a driver accepts your booking",
    },
    // Driver
    driver: {
      dashboard: "Driver Dashboard",
      profile: "Driver Profile",
      verified: "Verified",
      notVerified: "Not Verified",
      license: "License",
      vehicles: "Vehicles",
      noVehicles: "No vehicles registered",
      statistics: "Statistics",
      totalTrips: "Total visible trips",
      accepted: "Accepted",
      completed: "Completed",
      earnings: "Earnings (est)",
      bookings: "Bookings",
      noBookings: "No bookings available",
      accept: "Accept",
      markCompleted: "Mark Completed",
      open: "Open",
    },
    // Admin
    admin: {
      dashboard: "Admin Dashboard",
      totalBookings: "Total Bookings",
      totalDrivers: "Total Drivers",
      totalTourists: "Total Tourists",
      pendingVerification: "Pending Verification",
      totalEarnings: "Total Earnings",
      pendingDrivers: "Pending Driver Verifications",
      noPending: "No pending verifications",
      allBookings: "All Bookings",
      noBookings: "No bookings yet",
      approve: "Approve",
      reject: "Reject",
      driverVerified: "Driver verified successfully",
      driverRejected: "Driver rejected",
    },
  },
  hi: {
    // Hindi translations (partial - you can expand this)
    common: {
      loading: "लोड हो रहा है...",
      error: "त्रुटि",
      success: "सफल",
      cancel: "रद्द करें",
      confirm: "पुष्टि करें",
      save: "सहेजें",
      delete: "हटाएं",
      edit: "संपादित करें",
      back: "वापस",
      next: "अगला",
      submit: "जमा करें",
    },
    nav: {
      home: "होम",
      about: "के बारे में",
      itinerary: "यात्रा योजना",
      driver: "ड्राइवर डैशबोर्ड",
      admin: "एडमिन डैशबोर्ड",
      login: "लॉगिन",
      logout: "लॉगआउट",
      signup: "साइन अप",
    },
    auth: {
      login: "लॉगिन",
      signup: "साइन अप",
      email: "ईमेल",
      password: "पासवर्ड",
      phone: "फोन",
      name: "नाम",
      role: "मैं हूं",
      tourist: "पर्यटक",
      driver: "ड्राइवर/गाइड",
      admin: "एडमिन",
      welcomeBack: "वापसी पर स्वागत है!",
      createAccount: "अपना खाता बनाएं",
      loginSuccess: "सफलतापूर्वक लॉगिन किया!",
      signupSuccess: "खाता सफलतापूर्वक बनाया गया!",
      loginFailed: "प्रमाणीकरण विफल",
      passwordReset: "पासवर्ड रीसेट करें",
      forgotPassword: "पासवर्ड भूल गए?",
    },
    booking: {
      planTrip: "अपनी यात्रा योजना बनाएं",
      popularLocations: "लोकप्रिय स्थान",
      yourRoute: "आपका मार्ग",
      stops: "स्टॉप",
      selectLocations: "अपनी यात्रा योजना बनाने के लिए स्थान चुनें",
      tripDetails: "यात्रा विवरण",
      vehicleType: "वाहन प्रकार",
      scheduledDate: "निर्धारित तारीख",
      totalDistance: "कुल दूरी",
      estimatedCost: "अनुमानित लागत",
      confirmBooking: "बुकिंग की पुष्टि करें",
      bookingConfirmed: "बुकिंग पुष्टि हो गई!",
      bookingCode: "बुकिंग कोड",
      presentCode: "पिकअप पर अपने ड्राइवर को यह कोड दिखाएं",
      waitingAcceptance: "आपकी बुकिंग ड्राइवर की स्वीकृति की प्रतीक्षा कर रही है",
      smsNotification: "एक बार ड्राइवर आपकी बुकिंग स्वीकार कर लेगा तो आपको SMS सूचना मिलेगी",
    },
  },
  // Add more languages as needed (Khasi, Garo, etc.)
};

const LanguageContext = createContext({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("pathfinder_language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("pathfinder_language", language);
  }, [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
  };

  const t = (key, params = {}) => {
    const keys = key.split(".");
    let value = translations[language] || translations.en;

    for (const k of keys) {
      value = value?.[k];
      if (!value) {
        // Fallback to English
        value = translations.en;
        for (const k2 of keys) {
          value = value?.[k2];
        }
        break;
      }
    }

    if (typeof value !== "string") {
      return key; // Return key if translation not found
    }

    // Replace parameters in translation
    return Object.keys(params).reduce((str, param) => {
      return str.replace(`{{${param}}}`, params[param]);
    }, value);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return context;
}

export default translations;
