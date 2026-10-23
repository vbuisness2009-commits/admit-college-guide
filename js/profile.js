/**
 * Profile State Management for Admit
 * Handles user profile data, persistence via localStorage, and preset profiles.
 */

const ProfileManager = {
  STORAGE_KEY: "admit_student_profile_v1",

  // Default initial profile
  defaultProfile: {
    grade_level: 11,
    residency: "TX",
    gpa_unweighted: 3.88,
    gpa_weighted: 4.62,
    class_rank: 24,
    class_size: 600,
    class_percentile: 4.0, // Top 4%
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
      { id: "chem", name: "AP Chemistry", score: 0, status: "planned" },
      { id: "calc_bc", name: "AP Calculus BC", score: 0, status: "planned" }
    ]
  },

  presets: {
    texas_junior: {
      grade_level: 11,
      residency: "TX",
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
    },
    california_senior: {
      grade_level: 12,
      residency: "CA",
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
    },
    florida_senior: {
      grade_level: 12,
      residency: "FL",
      gpa_unweighted: 3.75,
      gpa_weighted: 4.30,
      class_rank: 45,
      class_size: 320,
      class_percentile: 14.0,
      sat_rw: 650,
      sat_m: 680,
      sat_total: 1330,
      act_composite: 29,
      math_years_algebra2: true,
      science_years: 3,
      has_endorsement: true,
      fl_prep_complete: true,
      saved_colleges: ["uf", "gatech", "unc", "purdue"],
      ap_exams: [
        { id: "calc_ab", name: "AP Calculus AB", score: 3, status: "completed" },
        { id: "eng_lang", name: "AP English Language & Composition", score: 3, status: "completed" },
        { id: "ushist", name: "AP United States History", score: 3, status: "completed" },
        { id: "stats", name: "AP Statistics", score: 4, status: "completed" }
      ]
    },
    blank_slate: {
      grade_level: 10,
      residency: "TX",
      gpa_unweighted: 3.5,
      gpa_weighted: 3.8,
      class_rank: 50,
      class_size: 400,
      class_percentile: 12.5,
      sat_rw: 600,
      sat_m: 620,
      sat_total: 1220,
      act_composite: 26,
      math_years_algebra2: false,
      science_years: 2,
      has_endorsement: false,
      fl_prep_complete: false,
      saved_colleges: ["ut-austin", "uh"],
      ap_exams: []
    }
  },

  currentProfile: null,

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.currentProfile = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved profile, resetting to default", e);
        this.currentProfile = { ...this.defaultProfile };
      }
    } else {
      this.currentProfile = { ...this.defaultProfile };
      this.save();
    }
  },

  get() {
    if (!this.currentProfile) this.init();
    return this.currentProfile;
  },

  save(updatedProfile) {
    if (updatedProfile) {
      this.currentProfile = { ...this.currentProfile, ...updatedProfile };
    }
    // Auto-calculate sat_total if components provided
    if (this.currentProfile.sat_rw && this.currentProfile.sat_m) {
      this.currentProfile.sat_total = parseInt(this.currentProfile.sat_rw, 10) + parseInt(this.currentProfile.sat_m, 10);
    }
    // Auto-calculate class_percentile if rank & size provided
    if (this.currentProfile.class_rank && this.currentProfile.class_size && this.currentProfile.class_size > 0) {
      this.currentProfile.class_percentile = parseFloat(((this.currentProfile.class_rank / this.currentProfile.class_size) * 100).toFixed(1));
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentProfile));
    window.dispatchEvent(new CustomEvent("admit:profile-updated", { detail: this.currentProfile }));
  },

  loadPreset(key) {
    if (this.presets[key]) {
      this.currentProfile = JSON.parse(JSON.stringify(this.presets[key]));
      this.save();
      return true;
    }
    return false;
  },

  toggleSavedCollege(collegeId) {
    const list = this.currentProfile.saved_colleges || [];
    const index = list.indexOf(collegeId);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(collegeId);
    }
    this.currentProfile.saved_colleges = list;
    this.save();
    return index === -1; // returns true if now saved
  },

  isCollegeSaved(collegeId) {
    return (this.currentProfile.saved_colleges || []).includes(collegeId);
  }
};
