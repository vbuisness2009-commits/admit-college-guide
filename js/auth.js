/**
 * Authentication & Account Management for Admit
 * Provides secure client-side user accounts, registration, credential validation,
 * and persistent session state.
 */

function escapeHTML(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.escapeHTML = escapeHTML;

const Auth = {
  USERS_KEY: "admit_registered_users_v2",
  SESSION_KEY: "admit_active_session_v2",

  getUsers() {
    try {
      const data = localStorage.getItem(this.USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load user database", e);
      return [];
    }
  },

  getCurrentUser() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      if (!session) return null;
      const sessionUser = JSON.parse(session);
      const users = this.getUsers();
      const freshUser = users.find(u => u.id === sessionUser.id);
      return freshUser || null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  signup(name, email, password) {
    const cleanName = (name || "").trim();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanName) {
      return { success: false, error: "Please enter your full name." };
    }

    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return { success: false, error: "Please enter a valid email address." };
    }

    if (!cleanPass || cleanPass.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: "An account with this email is already registered." };
    }

    const newUser = {
      id: "usr_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      name: cleanName,
      email: cleanEmail,
      password: cleanPass, // client-side demo storage
      created_at: new Date().toISOString(),
      onboarding_completed: false,
      profile: ProfileManager.getBlankProfile()
    };

    users.push(newUser);
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (e) {
      return { success: false, error: "Local storage limit reached. Please clear browser cache." };
    }

    this.setSession(newUser);
    return { success: true, user: newUser };
  },

  login(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: "Please enter both email and password." };
    }

    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: "No account found with this email. Please check your spelling or create an account." };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    this.setSession(user);
    return { success: true, user: user };
  },

  setSession(user) {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name
      }));
    } catch (e) {
      this.sessionStorageFailed = true;
    }
    window.dispatchEvent(new CustomEvent("admit:auth-changed", { detail: user }));
  },

  updateCurrentUserProfile(newProfile, markOnboardingComplete = false) {
    const user = this.getCurrentUser();
    if (!user) return;

    user.profile = { ...user.profile, ...newProfile };
    if (markOnboardingComplete) {
      user.onboarding_completed = true;
    }

    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx > -1) {
      users[idx] = user;
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    this.setSession(user);
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.dispatchEvent(new CustomEvent("admit:auth-changed", { detail: null }));
  }
};
