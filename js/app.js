/**
 * Main Application Orchestrator for Admit
 * Coordinates landing page authentication, first-time student onboarding,
 * dashboard tab routing, and reactive profile state updates.
 */

const App = {
  activeTab: "status",
  collegesData: [],

  async init() {
    await StatusEngine.init();
    await CollegesEngine.init();
    await CreditsEngine.init();

    this.collegesData = CollegesEngine.getAll();
    this.setupEventListeners();
    this.updateAppView();
  },

  setupEventListeners() {
    window.addEventListener("admit:profile-updated", () => {
      this.updateHeaderUI();
      this.renderActiveTab();
    });

    window.addEventListener("admit:auth-changed", () => {
      this.updateAppView();
    });

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

  updateAppView() {
    const user = Auth.getCurrentUser();
    const authView = document.getElementById("view-auth");
    const onboardingView = document.getElementById("view-onboarding");
    const appView = document.getElementById("view-app");

    const setViews = (auth, ob, app) => {
      if (authView) authView.style.display = auth;
      if (onboardingView) onboardingView.style.display = ob;
      if (appView) appView.style.display = app;
    };

    if (!user) {
      setViews("block", "none", "none");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (!user.onboarding_completed) {
      setViews("none", "block", "none");
      Onboarding.start();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setViews("none", "none", "block");
      this.updateHeaderUI();
      this.renderActiveTab();
    }
  },

  switchLandingAuthTab(mode) {
    const tabSignIn = document.getElementById("landing-tab-signin");
    const tabSignUp = document.getElementById("landing-tab-signup");
    const formSignIn = document.getElementById("landing-form-signin");
    const formSignUp = document.getElementById("landing-form-signup");
    const errBox = document.getElementById("landing-auth-error");

    if (errBox) errBox.style.display = "none";

    if (mode === "signin") {
      if (tabSignIn) tabSignIn.classList.add("active");
      if (tabSignUp) tabSignUp.classList.remove("active");
      if (formSignIn) formSignIn.style.display = "block";
      if (formSignUp) formSignUp.style.display = "none";
    } else {
      if (tabSignUp) tabSignUp.classList.add("active");
      if (tabSignIn) tabSignIn.classList.remove("active");
      if (formSignUp) formSignUp.style.display = "block";
      if (formSignIn) formSignIn.style.display = "none";
    }
  },

  handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("auth-login-email").value;
    const pass = document.getElementById("auth-login-password").value;
    const errBox = document.getElementById("landing-auth-error");

    const res = Auth.login(email, pass);
    if (res.success) {
      if (errBox) errBox.style.display = "none";
      this.showToast(`Welcome back, ${res.user.name.split(" ")[0]}!`, "success");
      this.updateAppView();
    } else {
      if (errBox) {
        errBox.innerText = res.error;
        errBox.style.display = "block";
      }
    }
  },

  handleSignupSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("auth-signup-name").value;
    const email = document.getElementById("auth-signup-email").value;
    const pass = document.getElementById("auth-signup-password").value;
    const confirmPass = document.getElementById("auth-signup-confirm").value;
    const errBox = document.getElementById("landing-auth-error");

    if (pass !== confirmPass) {
      if (errBox) {
        errBox.innerText = "Passwords do not match. Please re-enter.";
        errBox.style.display = "block";
      }
      return;
    }

    const res = Auth.signup(name, email, pass);
    if (res.success) {
      if (errBox) errBox.style.display = "none";
      this.showToast(`Account created! Let's set up your profile.`, "success");
      this.updateAppView();
    } else {
      if (errBox) {
        errBox.innerText = res.error;
        errBox.style.display = "block";
      }
    }
  },

  handleLogout() {
    Auth.logout();
    this.closeAllModals();
    this.showToast("Signed out successfully.", "info");
    this.updateAppView();
  },

  // Tab Navigation in App Dashboard
  switchTab(tabId) {
    this.activeTab = tabId;
    
    document.querySelectorAll(".tab-btn").forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

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
      case "ai":
        AdmitAI.render("ai-tab-content", profile, this.collegesData, StatusEngine.rulesData, CreditsEngine.apData);
        break;
    }
  },

  switchToCreditsTabForCollege(collegeId) {
    CreditsEngine.selectedCollegeId = collegeId;
    this.switchTab("credits");
  },

  updateHeaderUI() {
    const user = Auth.getCurrentUser();
    const profile = ProfileManager.get();
    
    const rankText = profile.class_percentile ? `Top ${profile.class_percentile}%` : (profile.class_rank ? `Rank ${profile.class_rank}` : 'Unranked');
    const satText = profile.sat_total ? `SAT ${profile.sat_total}` : (profile.act_composite ? `ACT ${profile.act_composite}` : 'No Test Score');
    
    const pill = document.getElementById("header-profile-pill");
    if (pill) {
      pill.innerHTML = `
        <span class="dot"></span>
        <span>Grade ${profile.grade_level || 11} · ${profile.residency || 'TX'} · ${rankText} · ${satText}</span>
        <span style="font-size: 0.72rem; color: var(--text-dim); margin-left: 2px;">Edit</span>
      `;
    }

    const userContainer = document.getElementById("header-user-widget");
    if (userContainer && user) {
      const initials = user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "ST";
      const safeName = escapeHTML(user.name);
      const safeEmail = escapeHTML(user.email);
      const firstName = escapeHTML(user.name.split(" ")[0]);
      userContainer.innerHTML = `
        <div class="user-avatar-btn" onclick="App.toggleUserDropdown()" title="${safeName} (${safeEmail})">
          <div class="avatar-circle">${initials}</div>
          <span style="font-weight: 600;">${firstName}</span>
          <span style="font-size: 0.7rem; color: var(--text-dim);">▾</span>
        </div>

        <div id="user-dropdown-menu" style="display: none; position: absolute; right: 0; top: 2.75rem; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem; box-shadow: var(--shadow-lg); min-width: 220px; z-index: 60;">
          <div style="padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.4rem;">
            <strong style="color: #FFFFFF; font-size: 0.86rem; display: block;">${safeName}</strong>
            <span style="font-size: 0.72rem; color: var(--text-dim); word-break: break-all;">${safeEmail}</span>
          </div>
          <button class="btn-secondary" style="width: 100%; justify-content: flex-start; border: none; margin-bottom: 0.25rem;" onclick="App.openProfileModal(); App.toggleUserDropdown();">
            Edit Academic Stats
          </button>
          <button class="btn-secondary" style="width: 100%; justify-content: flex-start; border: none; margin-bottom: 0.25rem;" onclick="Onboarding.open(); App.toggleUserDropdown();">
            Re-run Setup Wizard
          </button>
          <button class="btn-secondary" style="width: 100%; justify-content: flex-start; border: none; color: #F87171;" onclick="App.handleLogout()">
            Sign Out
          </button>
        </div>
      `;
    }
  },

  toggleUserDropdown() {
    const menu = document.getElementById("user-dropdown-menu");
    if (menu) {
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    }
  },

  openProfileModal() {
    const profile = ProfileManager.get();
    const modal = document.getElementById("profile-modal");
    if (!modal) return;

    document.getElementById("input-grade").value = profile.grade_level || 11;
    document.getElementById("input-residency").value = profile.residency || "TX";
    document.getElementById("input-gpa-unweighted").value = profile.gpa_unweighted || "";
    document.getElementById("input-gpa-weighted").value = profile.gpa_weighted || "";
    document.getElementById("input-class-rank").value = profile.class_rank || "";
    document.getElementById("input-class-size").value = profile.class_size || "";
    document.getElementById("input-sat-rw").value = profile.sat_rw || "";
    document.getElementById("input-sat-m").value = profile.sat_m || "";
    document.getElementById("input-act").value = profile.act_composite || "";
    
    document.getElementById("check-math-algebra2").checked = !!profile.math_years_algebra2;
    document.getElementById("input-science-years").value = profile.science_years || 4;
    document.getElementById("check-endorsement").checked = !!profile.has_endorsement;
    document.getElementById("check-fl-prep").checked = !!profile.fl_prep_complete;

    this.renderModalApList();
    modal.classList.add("open");
  },

  renderModalApList() {
    const profile = ProfileManager.get();
    const container = document.getElementById("modal-ap-list");
    if (!container) return;

    const availableExams = CreditsEngine.AVAILABLE_EXAMS;
    const currentExams = profile.ap_exams || [];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
        ${currentExams.length === 0 ? `
          <div style="font-size: 0.8rem; color: var(--text-dim); padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 6px;">
            No AP exams added. Select an exam below and click '+ Add Exam'.
          </div>
        ` : currentExams.map((exam, idx) => `
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
    
    if (profile.ap_exams.some(e => e.id === id)) {
      this.showToast("This exam is already added.", "warning");
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
    const rankVal = document.getElementById("input-class-rank").value;
    const sizeVal = document.getElementById("input-class-size").value;
    const rwVal = document.getElementById("input-sat-rw").value;
    const mVal = document.getElementById("input-sat-m").value;
    const actVal = document.getElementById("input-act").value;

    const updated = {
      grade_level: parseInt(document.getElementById("input-grade").value, 10) || 11,
      residency: document.getElementById("input-residency").value || "TX",
      gpa_unweighted: parseFloat(document.getElementById("input-gpa-unweighted").value) || null,
      gpa_weighted: parseFloat(document.getElementById("input-gpa-weighted").value) || null,
      class_rank: rankVal ? parseInt(rankVal, 10) : null,
      class_size: sizeVal ? parseInt(sizeVal, 10) : null,
      sat_rw: rwVal ? parseInt(rwVal, 10) : null,
      sat_m: mVal ? parseInt(mVal, 10) : null,
      act_composite: actVal ? parseInt(actVal, 10) : null,
      math_years_algebra2: document.getElementById("check-math-algebra2").checked,
      science_years: parseInt(document.getElementById("input-science-years").value, 10) || 4,
      has_endorsement: document.getElementById("check-endorsement").checked,
      fl_prep_complete: document.getElementById("check-fl-prep").checked
    };

    ProfileManager.save(updated);
    this.closeModal("profile-modal");
    this.showToast("Profile updated successfully!", "success");
  },

  openDisclosureModal() {
    const modal = document.getElementById("disclosure-modal");
    if (modal) modal.classList.add("open");
  },

  openExportModal() {
    if (typeof DossierExporter !== "undefined") {
      DossierExporter.open();
    }
  },

  openJudgesModal() {
    const modal = document.getElementById("judges-modal");
    if (modal) modal.classList.add("open");
  },

  closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove("open");
  },

  closeAllModals() {
    document.querySelectorAll(".modal-overlay").forEach(m => {
      m.classList.remove("open");
    });
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-tag">${type.toUpperCase()}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      toast.style.transition = "all 0.25s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  animateNumber(element, start, end, duration = 400, prefix = "", suffix = "") {
    if (!element) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = prefix + (typeof end === "number" ? end.toLocaleString() : end) + suffix;
      return;
    }
    const startTime = performance.now();
    const isFloat = String(end).includes(".");
    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = start + (end - start) * ease;
      element.textContent = prefix + (isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()) + suffix;
      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    }
    requestAnimationFrame(frame);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
