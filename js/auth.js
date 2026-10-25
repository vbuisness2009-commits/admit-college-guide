/**
 * Authentication & Account Management for Admit
 * Provides secure client-side user accounts, registration, credential validation,
 * and persistent session state.
 */

function escapeHTML(str) {
  if (str == null) return "";
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
  GOOGLE_CLIENT_ID_KEY: "admit_google_client_id_v3",
  DEFAULT_GOOGLE_CLIENT_ID: "566176172856-bch2p9i6rj5jq5ovfm23b6dp8e3lnd3j.apps.googleusercontent.com",

  getGoogleClientId() {
    try {
      const stored = localStorage.getItem(this.GOOGLE_CLIENT_ID_KEY);
      if (stored && stored.trim()) return stored.trim();
    } catch (e) {
      console.warn("Could not read stored Google client ID:", e);
    }
    return this.DEFAULT_GOOGLE_CLIENT_ID;
  },

  setGoogleClientId(clientId) {
    try {
      const trimmed = (clientId || "").trim();
      if (!trimmed) {
        localStorage.removeItem(this.GOOGLE_CLIENT_ID_KEY);
      } else {
        localStorage.setItem(this.GOOGLE_CLIENT_ID_KEY, trimmed);
      }
      return true;
    } catch (e) {
      console.error("Failed to persist Google Client ID", e);
      return false;
    }
  },

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
      provider: "email",
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

  continueAsGuest(mode = "senior") {
    const isHs = mode === "hs";
    const demoProfile = isHs ? {
      grade_level: 10,
      residency: "TX",
      high_school: "Westlake High School",
      gpa_unweighted: 3.85,
      gpa_weighted: 4.18,
      class_rank: 35,
      class_size: 520,
      class_percentile: 6.7,
      sat_rw: 670,
      sat_m: 700,
      sat_total: 1370,
      act_composite: 30,
      math_years_algebra2: true,
      science_years: 3,
      has_endorsement: true,
      fl_prep_complete: false,
      saved_colleges: ["ut-austin", "tamu", "uc-berkeley", "uf"],
      ap_exams: [
        { id: "ushist", name: "AP United States History", score: 5, status: "completed" },
        { id: "calc_bc", name: "AP Calculus BC", score: 5, status: "planned" },
        { id: "csa", name: "AP Computer Science A", score: 5, status: "planned" },
        { id: "chem", name: "AP Chemistry", score: 4, status: "planned" }
      ],
      application_tracker: {}
    } : {
      grade_level: 12,
      residency: "TX",
      high_school: "Westlake High School",
      gpa_unweighted: 3.94,
      gpa_weighted: 4.42,
      class_rank: 26,
      class_size: 520,
      class_percentile: 5.0,
      sat_rw: 720,
      sat_m: 760,
      sat_total: 1480,
      act_composite: 33,
      math_years_algebra2: true,
      science_years: 4,
      has_endorsement: true,
      fl_prep_complete: true,
      saved_colleges: ["ut-austin", "tamu", "umich", "uf"],
      ap_exams: [
        { id: "calc_bc", name: "AP Calculus BC", score: 5, status: "completed" },
        { id: "csa", name: "AP Computer Science A", score: 5, status: "completed" },
        { id: "chem", name: "AP Chemistry", score: 4, status: "completed" },
        { id: "ushist", name: "AP United States History", score: 5, status: "completed" },
        { id: "eng_lang", name: "AP English Language & Composition", score: 5, status: "completed" }
      ],
      application_tracker: {}
    };

    const users = this.getUsers();
    let guestUser = users.find(u => u.email === "guest@admitai.org");
    if (!guestUser) {
      guestUser = {
        id: "usr_guest_" + Date.now(),
        name: isHs ? "Guest Student (10th Grade)" : "Guest Student (Senior)",
        email: "guest@admitai.org",
        password: "guest_session_token",
        provider: "guest",
        created_at: new Date().toISOString(),
        onboarding_completed: true,
        profile: demoProfile
      };
      users.push(guestUser);
    } else {
      guestUser.name = isHs ? "Guest Student (10th Grade)" : "Guest Student (Senior)";
      guestUser.profile = demoProfile;
      guestUser.onboarding_completed = true;
    }

    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn("Failed to persist guest user to local storage", e);
    }

    this.setSession(guestUser);
    return { success: true, user: guestUser };
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

    if (user.provider === "google" && !user.password) {
      return { success: false, error: "This email is registered with Google. Please click 'Sign in with Google' above." };
    }

    if (user.password !== cleanPass) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    this.setSession(user);
    return { success: true, user: user };
  },

  loginWithGoogle(googleProfile) {
    const cleanEmail = (googleProfile.email || "").trim().toLowerCase();
    const cleanName = (googleProfile.name || "").trim() || (cleanEmail.split("@")[0]);
    const photoURL = googleProfile.picture || null;

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return { success: false, error: "Invalid Google account email address." };
    }

    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);
    let isNew = false;

    if (user) {
      user.provider = "google";
      if (photoURL) user.photoURL = photoURL;
      if (!user.name) user.name = cleanName;
      const idx = users.findIndex(u => u.id === user.id);
      users[idx] = user;
      try {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      } catch (err) {
        console.warn("Failed to persist updated Google user profile:", err);
      }
    } else {
      isNew = true;
      user = {
        id: "usr_g_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        name: cleanName,
        email: cleanEmail,
        provider: "google",
        photoURL: photoURL,
        created_at: new Date().toISOString(),
        onboarding_completed: false,
        profile: ProfileManager.getBlankProfile()
      };
      users.push(user);
      try {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
      } catch (e) {
        return { success: false, error: "Local storage limit reached. Please clear browser cache." };
      }
    }

    this.setSession(user);
    return { success: true, user: user, isNewUser: isNew };
  },

  setSession(user) {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider || "email",
        photoURL: user.photoURL || null
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
