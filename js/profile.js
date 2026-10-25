/**
 * Profile State Management for Admit
 * Syncs seamlessly with the active student account.
 */

const ProfileManager = {
  getBlankProfile() {
    return {
      grade_level: 12,
      residency: "TX",
      high_school: "",
      intended_major: "STEM & Engineering",
      extracurricular_tier: "strong",
      extracurricular_details: "",
      primary_goal: "scholarships",
      priority_goal_details: "",
      gpa_unweighted: 3.85,
      gpa_weighted: 4.25,
      class_rank: null,
      class_size: null,
      class_percentile: null,
      sat_rw: null,
      sat_m: null,
      sat_total: null,
      act_composite: null,
      math_years_algebra2: true,
      science_years: 4,
      has_endorsement: true,
      fl_prep_complete: false,
      saved_colleges: ["ut-austin", "tamu", "uf"],
      ap_exams: [],
      application_tracker: {}
    };
  },

  get() {
    const user = Auth.getCurrentUser();
    if (user && user.profile) {
      return user.profile;
    }
    return this.getBlankProfile();
  },

  save(updatedProfile) {
    const current = this.get();
    const merged = { ...current, ...updatedProfile };

    if (merged.sat_rw !== null && merged.sat_m !== null && merged.sat_rw !== "" && merged.sat_m !== "") {
      merged.sat_total = parseInt(merged.sat_rw, 10) + parseInt(merged.sat_m, 10);
    } else {
      merged.sat_total = null;
    }

    if (merged.class_rank && merged.class_size && merged.class_size > 0) {
      merged.class_percentile = parseFloat(((merged.class_rank / merged.class_size) * 100).toFixed(1));
    } else {
      merged.class_percentile = null;
    }

    if (Auth.isLoggedIn()) {
      Auth.updateCurrentUserProfile(merged);
    }

    window.dispatchEvent(new CustomEvent("admit:profile-updated", { detail: merged }));
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
