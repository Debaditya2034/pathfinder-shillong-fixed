// Shared authentication wrapper for consistent sign-in across all roles

/**
 * Sign in with email and password (demo mode)
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{user: object, role: string}>}
 */
export async function signIn(email, password) {
  // Demo mode - simulate authentication
  return new Promise((resolve) => {
    setTimeout(() => {
      // In demo mode, check if user exists in localStorage
      const existingUsers = JSON.parse(localStorage.getItem("pathfinder_users") || "[]");
      const existingUser = existingUsers.find(u => u.email === email);
      
      if (existingUser) {
        // User exists, return their data
        localStorage.setItem("pathfinder_user", JSON.stringify(existingUser));
        resolve({
          user: existingUser,
          role: existingUser.role || "tourist"
        });
      } else {
        // New user - create demo user with tourist role by default
        const demoUser = {
          uid: "demo-" + Date.now(),
          email,
          phone: "",
          role: "tourist",
          displayName: email.split("@")[0],
        };
        
        // Save to users list
        existingUsers.push(demoUser);
        localStorage.setItem("pathfinder_users", JSON.stringify(existingUsers));
        localStorage.setItem("pathfinder_user", JSON.stringify(demoUser));
        
        resolve({
          user: demoUser,
          role: demoUser.role
        });
      }
    }, 500);
  });
}

/**
 * Sign in with phone number (demo mode)
 * @param {string} phone 
 * @returns {Promise<{user: object, role: string}>}
 */
export async function signInWithPhone(phone) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existingUsers = JSON.parse(localStorage.getItem("pathfinder_users") || "[]");
      const existingUser = existingUsers.find(u => u.phone === phone);
      
      if (existingUser) {
        localStorage.setItem("pathfinder_user", JSON.stringify(existingUser));
        resolve({
          user: existingUser,
          role: existingUser.role || "tourist"
        });
      } else {
        const demoUser = {
          uid: "demo-" + Date.now(),
          email: "",
          phone,
          role: "tourist",
          displayName: `User-${phone.slice(-4)}`,
        };
        
        existingUsers.push(demoUser);
        localStorage.setItem("pathfinder_users", JSON.stringify(existingUsers));
        localStorage.setItem("pathfinder_user", JSON.stringify(demoUser));
        
        resolve({
          user: demoUser,
          role: demoUser.role
        });
      }
    }, 500);
  });
}

/**
 * Sign up new user
 * @param {object} userData - {email, phone, password, role}
 * @returns {Promise<{user: object, role: string}>}
 */
export async function signUp(userData) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const existingUsers = JSON.parse(localStorage.getItem("pathfinder_users") || "[]");
      
      const newUser = {
        uid: "demo-" + Date.now(),
        email: userData.email || "",
        phone: userData.phone || "",
        role: userData.role || "tourist",
        displayName: userData.email ? userData.email.split("@")[0] : `User-${Date.now()}`,
      };
      
      existingUsers.push(newUser);
      localStorage.setItem("pathfinder_users", JSON.stringify(existingUsers));
      localStorage.setItem("pathfinder_user", JSON.stringify(newUser));
      
      resolve({
        user: newUser,
        role: newUser.role
      });
    }, 500);
  });
}

