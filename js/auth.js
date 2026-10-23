/**
 * Authentication & Session Management for Admit
 * Provides local authentication, user registration, session persistence, and instant demo logins for judges.
 */

const Auth = {
  USERS_KEY: "admit_users_db_v1",
  SESSION_KEY: "admit_auth_session_v1",

  // Initial seed demo accounts for competition judges
  seedUsers: [
    {
      id: "user_tx_junior",
      name: "Alex Rivera",
      email: "alex.texas@demo.com",
      password: "password123",
      created_at: "2026-10-20T12:00:00Z",
      onboarding_completed: true,
      profile: {
        grade_level: 11,
        residency: "TX",
        high_school: "Katy High School",
        gpa_unweighted: 3.88,
        gpa_weighted: 4.62,
        class_rank: 24,
        class_size: 600,
        class_percentile: 4.0,
        sat_rw: 690,
        sat_m: 730,
        sat_total: 1420,
        act_composite: 31,
        math_years_algebra2: true,
        science_years: 4,
        has_endorsement: true,
        fl_prep_complete: true,
        saved_colleges: ["ut-austin", "tamu", "rice", "purdue"],
        ap_exams: [
          { id: "calc_ab", name: "AP Calculus AB", score: 4, status: "completed" },
          { id: "eng_lang", name: "AP English Language & Composition", score: 4, status: "completed" },
          { id: "ushist", name: "AP United States History", score: 4, status: "completed" },
          { id: "csa", name: "AP Computer Science A", score: 5, status: "completed" },
          { id: "chem", name: "AP Chemistry", score: 0, status: "planned" }
        ]
      }
    },
    {
      id: "user_ca_senior",
      name: "Maya Lin",
      email: "maya.california@demo.com",
      password: "password123",
      created_at: "2026-10-21T10:00:00Z",
      onboarding_completed: true,
      profile: {
        grade_level: 12,
        residency: "CA",
        high_school: "Monta Vista High School",
        gpa_unweighted: 3.92,
        gpa_weighted: 4.45,
        class_rank: 35,
        class_size: 450,
        class_percentile: 7.7,
        sat_rw: 710,
        sat_m: 740,
        sat_total: 1450,
        act_composite: 32,
        math_years_algebra2: true,
        science_years: 4,
        has_endorsement: true,
        fl_prep_complete: true,
        saved_colleges: ["uc-berkeley", "ucla", "uw", "umich"],
        ap_exams: [
          { id: "calc_bc", name: "AP Calculus BC", score: 5, status: "completed" },
          { id: "eng_lang", name: "AP English Language & Composition", score: 4, status: "completed" },
          { id: "bio", name: "AP Biology", score: 4, status: "completed" },
          { id: "psych", name: "AP Psychology", score: 5, status: "completed" },
          { id: "phys_c_mech", name: "AP Physics C: Mechanics", score: 0, status: "planned" }
        ]
      }
    }
  ],

  init() {
    // Check if user db initialized
    const existing = localStorage.getItem(this.USERS_KEY);
    if (!existing) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(this.seedUsers));
    }
  },

  getUsers() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || this.seedUsers;
    } catch (e) {
      return this.seedUsers;
    }
  },

  getCurrentUser() {
    const session = localStorage.getItem(this.SESSION_KEY);
    if (!session) return null;
    try {
      const user = JSON.parse(session);
      // Fetch latest profile from user database in case it was updated
      const users = this.getUsers();
      const freshUser = users.find(u => u.id === user.id);
      return freshUser || user;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  signup(name, email, password) {
    this.init();
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();

    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: "An account with this email already exists." };
    }

    const newUser = {
      id: "user_" + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password,
      created_at: new Date().toISOString(),
      onboarding_completed: false,
      profile: {
        grade_level: 11,
        residency: "TX",
        high_school: "",
        gpa_unweighted: 3.8,
        gpa_weighted: 4.2,
        class_rank: 50,
        class_size: 500,
        class_percentile: 10.0,
        sat_rw: 650,
        sat_m: 680,
        sat_total: 1330,
        act_composite: 29,
        math_years_algebra2: true,
        science_years: 4,
        has_endorsement: true,
        fl_prep_complete: true,
        saved_colleges: ["ut-austin", "tamu"],
        ap_exams: []
      }
    };

    users.push(newUser);
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    this.setSession(newUser);
    return { success: true, user: newUser };
  },

  login(email, password) {
    this.init();
    const users = this.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: "No account found with this email." };
    }

    if (user.password !== password) {
      return { success: false, error: "Incorrect password." };
    }

    this.setSession(user);
    return { success: true, user: user };
  },

  demoLogin(presetKey = "texas_junior") {
    this.init();
    const users = this.getUsers();
    let targetUser = users[0]; // default to first demo user

    if (presetKey === "california_senior") {
      targetUser = users.find(u => u.id === "user_ca_senior") || users[1] || users[0];
    } else {
      targetUser = users.find(u => u.id === "user_tx_junior") || users[0];
    }

    this.setSession(targetUser);
    return targetUser;
  },

  setSession(user) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent("admit:auth-changed", { detail: user }));
  },

  updateCurrentUserProfile(newProfile, markOnboardingComplete = false) {
    const user = this.getCurrentUser();
    if (!user) return;

    user.profile = { ...user.profile, ...newProfile };
    if (markOnboardingComplete) {
      user.onboarding_completed = true;
    }

    // Update in database
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
