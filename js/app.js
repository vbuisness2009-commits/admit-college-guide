/**
 * Main Application Orchestrator for Admit
 * Coordinates tabs, modals, profile syncing, and UI lifecycle.
 */

const App = {
  activeTab: "status",
  collegesData: [],

  async init() {
    // 1. Initialize Profile Manager
    ProfileManager.init();

    // 2. Initialize Engines
    await StatusEngine.init();
    await CollegesEngine.init();
    await CreditsEngine.init();

    this.collegesData = CollegesEngine.getAll();

    // 3. Setup Listeners
    this.setupEventListeners();

    // 4. Update Header Profile Pill
    this.updateHeaderPill();

    // 5. Render Active Tab
    this.renderActiveTab();
  },

  setupEventListeners() {
    // Global profile change event
    window.addEventListener("admit:profile-updated", (e) => {
      this.updateHeaderPill();
      this.renderActiveTab();
    });

    // Close modals on escape key or background click
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          this.closeAllModals();
        }
      });
    });
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    
    // Update tab button classes
    document.querySelectorAll(".tab-btn").forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    // Update tab content displays
    document.querySelectorAll(".tab-content").forEach(content => {
      if (content.id === `${tabId}-tab-content`) {
        content.classList.add("active");
      } else {
        content.classList.remove("active");
      }
    });

    this.renderActiveTab();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  renderActiveTab() {
    const profile = ProfileManager.get();

    switch (this.activeTab) {
      case "status":
        StatusEngine.render("status-tab-content", profile, this.collegesData);
        break;
      case "colleges":
        CollegesEngine.render("colleges-tab-content", profile);
        break;
      case "credits":
        CreditsEngine.render("credits-tab-content", profile);
        break;
      case "roadmap":
        RoadmapEngine.render("roadmap-tab-content", profile, this.collegesData);
        break;
    }
  },

  switchToCreditsTabForCollege(collegeId) {
    CreditsEngine.selectedCollegeId = collegeId;
    this.switchTab("credits");
  },

  updateHeaderPill() {
    const profile = ProfileManager.get();
    const rankText = profile.class_percentile ? `Top ${profile.class_percentile}%` : (profile.class_rank ? `Rank ${profile.class_rank}` : 'Unranked');
    const satText = profile.sat_total ? `SAT ${profile.sat_total}` : (profile.act_composite ? `ACT ${profile.act_composite}` : 'No Test');
    
    const pill = document.getElementById("header-profile-pill");
    if (pill) {
      pill.innerHTML = `
        <span class="dot"></span>
        <span>Grade ${profile.grade_level || 11} · ${profile.residency || 'TX'} · ${rankText} · ${satText}</span>
        <span style="font-size: 0.72rem; color: var(--text-dim); margin-left: 2px;">✏ Edit</span>
      `;
    }
  },

  // Modal Handlers
  openProfileModal() {
    const profile = ProfileManager.get();
    const modal = document.getElementById("profile-modal");
    if (!modal) return;

    // Fill form fields
    document.getElementById("input-grade").value = profile.grade_level || 11;
    document.getElementById("input-residency").value = profile.residency || "TX";
    document.getElementById("input-gpa-unweighted").value = profile.gpa_unweighted || 3.8;
    document.getElementById("input-gpa-weighted").value = profile.gpa_weighted || 4.5;
    document.getElementById("input-class-rank").value = profile.class_rank || 25;
    document.getElementById("input-class-size").value = profile.class_size || 500;
    document.getElementById("input-sat-rw").value = profile.sat_rw || 680;
    document.getElementById("input-sat-m").value = profile.sat_m || 720;
    document.getElementById("input-act").value = profile.act_composite || 31;
    
    document.getElementById("check-math-algebra2").checked = !!profile.math_years_algebra2;
    document.getElementById("input-science-years").value = profile.science_years || 4;
    document.getElementById("check-endorsement").checked = !!profile.has_endorsement;
    document.getElementById("check-fl-prep").checked = !!profile.fl_prep_complete;

    // Render AP Exam list in modal
    this.renderModalApList();

    modal.classList.add("open");
  },

  renderModalApList() {
    const profile = ProfileManager.get();
    const container = document.getElementById("modal-ap-list");
    if (!container) return;

    const availableExams = [
      { id: "calc_ab", name: "AP Calculus AB" },
      { id: "calc_bc", name: "AP Calculus BC" },
      { id: "eng_lang", name: "AP English Language & Composition" },
      { id: "eng_lit", name: "AP English Literature & Composition" },
      { id: "chem", name: "AP Chemistry" },
      { id: "bio", name: "AP Biology" },
      { id: "phys_c_mech", name: "AP Physics C: Mechanics" },
      { id: "ushist", name: "AP United States History" },
      { id: "psych", name: "AP Psychology" },
      { id: "csa", name: "AP Computer Science A" },
      { id: "stats", name: "AP Statistics" }
    ];

    const currentExams = profile.ap_exams || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
        ${currentExams.map((exam, idx) => `
          <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 0.4rem 0.6rem; border-radius: 6px; font-size: 0.82rem;">
            <span><strong>${exam.name}</strong> (${exam.status === 'completed' ? `Score: ${exam.score}` : 'Planned'})</span>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <select class="select-control" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; width: auto;" onchange="App.updateModalExamScore(${idx}, this.value)">
                <option value="5" ${exam.score === 5 ? 'selected' : ''}>Score: 5</option>
                <option value="4" ${exam.score === 4 ? 'selected' : ''}>Score: 4</option>
                <option value="3" ${exam.score === 3 ? 'selected' : ''}>Score: 3</option>
                <option value="0" ${exam.status === 'planned' ? 'selected' : ''}>Planned (Future)</option>
              </select>
              <button class="btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; color: #F87171;" onclick="App.removeModalExam(${idx})">✕</button>
            </div>
          </div>
        `).join('')}

        <!-- Add new exam dropdown -->
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <select id="new-exam-select" class="select-control" style="font-size: 0.8rem;">
            ${availableExams.map(ae => `<option value="${ae.id}|${ae.name}">${ae.name}</option>`).join('')}
          </select>
          <button class="btn-secondary" style="font-size: 0.8rem; white-space: nowrap;" onclick="App.addModalExam()">+ Add Exam</button>
        </div>
      </div>
    `;
  },

  updateModalExamScore(index, val) {
    const profile = ProfileManager.get();
    const scoreNum = parseInt(val, 10);
    if (scoreNum === 0) {
      profile.ap_exams[index].status = "planned";
      profile.ap_exams[index].score = 0;
    } else {
      profile.ap_exams[index].status = "completed";
      profile.ap_exams[index].score = scoreNum;
    }
    ProfileManager.save(profile);
    this.renderModalApList();
  },

  removeModalExam(index) {
    const profile = ProfileManager.get();
    profile.ap_exams.splice(index, 1);
    ProfileManager.save(profile);
    this.renderModalApList();
  },

  addModalExam() {
    const select = document.getElementById("new-exam-select");
    if (!select) return;
    const [id, name] = select.value.split("|");
    const profile = ProfileManager.get();
    
    // Check if already present
    if (profile.ap_exams.some(e => e.id === id)) {
      this.showToast("This exam is already in your profile.", "warning");
      return;
    }

    profile.ap_exams.push({
      id: id,
      name: name,
      score: 4,
      status: "completed"
    });

    ProfileManager.save(profile);
    this.renderModalApList();
    this.showToast(`Added ${name}`, "success");
  },

  saveProfileFromModal() {
    const updated = {
      grade_level: parseInt(document.getElementById("input-grade").value, 10) || 11,
      residency: document.getElementById("input-residency").value || "TX",
      gpa_unweighted: parseFloat(document.getElementById("input-gpa-unweighted").value) || 3.8,
      gpa_weighted: parseFloat(document.getElementById("input-gpa-weighted").value) || 4.5,
      class_rank: parseInt(document.getElementById("input-class-rank").value, 10) || null,
      class_size: parseInt(document.getElementById("input-class-size").value, 10) || null,
      sat_rw: parseInt(document.getElementById("input-sat-rw").value, 10) || 0,
      sat_m: parseInt(document.getElementById("input-sat-m").value, 10) || 0,
      act_composite: parseInt(document.getElementById("input-act").value, 10) || null,
      math_years_algebra2: document.getElementById("check-math-algebra2").checked,
      science_years: parseInt(document.getElementById("input-science-years").value, 10) || 4,
      has_endorsement: document.getElementById("check-endorsement").checked,
      fl_prep_complete: document.getElementById("check-fl-prep").checked
    };

    ProfileManager.save(updated);
    this.closeAllModals();
    this.showToast("Profile updated successfully!", "success");
  },

  loadPresetProfile(key) {
    ProfileManager.loadPreset(key);
    this.openProfileModal();
    this.showToast(`Loaded ${key.replace('_', ' ')} profile`, "success");
  },

  openDisclosureModal() {
    const modal = document.getElementById("disclosure-modal");
    if (modal) modal.classList.add("open");
  },

  closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => m.classList.remove("open"));
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.25s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
};

// Start application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
