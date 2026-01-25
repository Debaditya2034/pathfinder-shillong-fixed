// src/components/ProtectedRoute.jsx
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { toast } from "sonner";

/**
 * ProtectedRoute component for role-based access control
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles that can access this route
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 * @param {string} props.redirectTo - Path to redirect unauthorized users (default: "/auth")
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  redirectTo = "/auth" 
}) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!requireAuth) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        if (!user) {
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // If no specific roles required, any authenticated user can access
        if (allowedRoles.length === 0) {
          setAuthorized(true);
          setLoading(false);
          return;
        }

        // Check user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists()) {
            setAuthorized(false);
            setLoading(false);
            return;
          }

          const userData = userDoc.data();
          const userRole = userData.role || "tourist";

          if (allowedRoles.includes(userRole)) {
            setAuthorized(true);
          } else {
            toast.error(`Access denied. Required role: ${allowedRoles.join(" or ")}`);
            setAuthorized(false);
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          // Fallback to localStorage check
          const localUser = localStorage.getItem("pathfinder_user");
          if (localUser) {
            try {
              const parsed = JSON.parse(localUser);
              if (allowedRoles.includes(parsed.role)) {
                setAuthorized(true);
              } else {
                setAuthorized(false);
              }
            } catch {
              setAuthorized(false);
            }
          } else {
            setAuthorized(false);
          }
        }
      } catch (error) {
        console.error("Auth state check error:", error);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [allowedRoles, requireAuth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f0c]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pf-green mx-auto mb-4"></div>
          <p className="text-[#e3f5ec]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
