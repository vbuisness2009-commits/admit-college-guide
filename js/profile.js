/**
 * Profile State Management for Admit
 * Syncs seamlessly with the current authenticated user session.
 */

const ProfileManager = {
  defaultProfile: {
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
    saved_colleges: ["ut-austin", "tamu", "rice", "umich"],
    ap_exams: [
      { id: "calc_ab", name: "AP Calculus AB", score: 4, status: "completed" },
      { id: "eng_lang", name: "AP English Language & Composition", score: 4, status: "completed" },
      { id: "ushist", name: "AP United States History", score: 4, status: "completed" },
      { id: "csa", name: "AP Computer Science A", score: 5, status: "completed" },
      { id: "chem", name: "AP Chemistry", score: 0, status: "planned" }
    ]
  },

  init() {
    // Ensured via Auth
  },

  get() {
    const user = Auth.getCurrentUser();
    if (user && user.profile) {
      return user.profile;
    }
    return this.defaultProfile;
  },

  save(updatedProfile) {
    const current = this.get();
    const merged = { ...current, ...updatedProfile };

    // Auto-calculate sat_total
    if (merged.sat_rw && merged.sat_m) {
      merged.sat_total = parseInt(merged.sat_rw, 10) + parseInt(merged.sat_m, 10);
    }

    // Auto-calculate class_percentile
    if (merged.class_rank && merged.class_size && merged.class_size > 0) {
      merged.class_percentile = parseFloat(((merged.class_rank / merged.class_size) * 100).toFixed(1));
    }

    if (Auth.isLoggedIn()) {
      Auth.updateCurrentUserProfile(merged);
    }

    window.dispatchEvent(new CustomEvent("admit:profile-updated", { detail: merged }));
  },

  loadPreset(key) {
    if (key === "texas_junior") {
      Auth.demoLogin("texas_junior");
    } else if (key === "california_senior") {
      Auth.demoLogin("california_senior");
    } else {
      Auth.demoLogin("texas_junior");
    }
    this.save(this.get());
    return true;
  },

  toggleSavedCollege(collegeId) {
    const profile = this.get();
    const list = profile.saved_colleges || [];
    const index = list.indexOf(collegeId);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(collegeId);
    }
    profile.saved_colleges = list;
    this.save(profile);
    return index === -1;
  },

  isCollegeSaved(collegeId) {
    return (this.get().saved_colleges || []).includes(collegeId);
  }
};
