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

  introCurrentSlide: 0,
  introTotalSlides: 4,
  introTimer: null,
  introLabels: [
    "Next: State Laws →",
    "Next: Scorecard Data →",
    "Next: Tuition ROI →",
    "Create Free Account →"
  ],

  startIntroAnimation() {
    this.setIntroSlide(0);
    if (this.introTimer) clearInterval(this.introTimer);

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    this.introTimer = setInterval(() => {
      if (this.introCurrentSlide < this.introTotalSlides - 1) {
        this.setIntroSlide(this.introCurrentSlide + 1);
      } else {
        clearInterval(this.introTimer);
      }
    }, 6500);
  },

  setIntroSlide(index) {
    this.introCurrentSlide = Math.max(0, Math.min(index, this.introTotalSlides - 1));

    for (let i = 0; i < this.introTotalSlides; i++) {
      const slide = document.getElementById(`intro-slide-${i}`);
      const segBtn = document.getElementById(`intro-seg-${i}`);
      const segFill = document.getElementById(`seg-fill-${i}`);

      if (slide) {
        if (i === this.introCurrentSlide) {
          slide.classList.add("active");
        } else {
          slide.classList.remove("active");
        }
      }

      if (segBtn && segFill) {
        if (i < this.introCurrentSlide) {
          segBtn.classList.remove("active");
          segBtn.classList.add("completed");
          segFill.style.width = "100%";
        } else if (i === this.introCurrentSlide) {
          segBtn.classList.add("active");
          segBtn.classList.remove("completed");
          segFill.style.width = "100%";
        } else {
          segBtn.classList.remove("active");
          segBtn.classList.remove("completed");
          segFill.style.width = "0%";
        }
      }
    }

    const prevBtn = document.getElementById("btn-intro-prev");
    const nextBtn = document.getElementById("btn-intro-next");

    if (prevBtn) {
      prevBtn.style.visibility = this.introCurrentSlide === 0 ? "hidden" : "visible";
    }

    if (nextBtn) {
      nextBtn.textContent = this.introLabels[this.introCurrentSlide] || "Next →";
      if (this.introCurrentSlide === this.introTotalSlides - 1) {
        nextBtn.style.background = "var(--success)";
        nextBtn.style.borderColor = "var(--success)";
      } else {
        nextBtn.style.background = "";
        nextBtn.style.borderColor = "";
      }
    }
  },

  nextIntroSlide() {
    if (this.introCurrentSlide < this.introTotalSlides - 1) {
      this.setIntroSlide(this.introCurrentSlide + 1);
    } else {
      this.showAuthStage("signup");
    }
  },

  prevIntroSlide() {
    if (this.introCurrentSlide > 0) {
      this.setIntroSlide(this.introCurrentSlide - 1);
    }
  },

  showAuthStage(mode = "signup") {
    if (this.introTimer) clearInterval(this.introTimer);

    const introStage = document.getElementById("intro-stage");
    const authStage = document.getElementById("auth-stage");
    const navBtnTour = document.getElementById("nav-btn-tour");
    const navBtnAuth = document.getElementById("nav-btn-auth");

    if (navBtnTour) navBtnTour.style.display = "inline-flex";
    if (navBtnAuth) {
      navBtnAuth.textContent = mode === "signin" ? "Create Account" : "Sign In";
      navBtnAuth.onclick = () => {
        this.showAuthStage(mode === "signin" ? "signup" : "signin");
      };
    }

    if (introStage && authStage) {
      introStage.style.opacity = "0";
      introStage.style.transform = "translateY(-12px)";
      introStage.style.transition = "all 0.25s ease";
      setTimeout(() => {
        introStage.style.display = "none";
        authStage.style.display = "block";
        authStage.style.opacity = "0";
        authStage.style.transform = "translateY(12px)";
        setTimeout(() => {
          authStage.style.opacity = "1";
          authStage.style.transform = "translateY(0)";
          authStage.style.transition = "all 0.25s ease";
          this.switchLandingAuthTab(mode);
          const cardAnchor = document.getElementById("landing-auth-card-anchor");
          if (cardAnchor) cardAnchor.scrollIntoView({ behavior: "smooth" });
        }, 20);
      }, 250);
    } else {
      this.switchLandingAuthTab(mode);
    }
  },

  showIntroStage() {
    const introStage = document.getElementById("intro-stage");
    const authStage = document.getElementById("auth-stage");
    const navBtnTour = document.getElementById("nav-btn-tour");
    const navBtnAuth = document.getElementById("nav-btn-auth");

    if (navBtnTour) navBtnTour.style.display = "none";
    if (navBtnAuth) {
      navBtnAuth.textContent = "Create Account";
      navBtnAuth.onclick = () => this.showAuthStage("signup");
    }

    if (introStage && authStage) {
      authStage.style.opacity = "0";
      authStage.style.transform = "translateY(12px)";
      authStage.style.transition = "all 0.25s ease";
      setTimeout(() => {
        authStage.style.display = "none";
        introStage.style.display = "block";
        introStage.style.opacity = "0";
        introStage.style.transform = "translateY(-12px)";
        setTimeout(() => {
          introStage.style.opacity = "1";
          introStage.style.transform = "translateY(0)";
          introStage.style.transition = "all 0.25s ease";
          this.startIntroAnimation();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }, 20);
      }, 250);
    }
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
      this.startIntroAnimation();
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
    const googleBtnLabel = document.getElementById("google-btn-label");
    const errBox = document.getElementById("landing-auth-error");

    if (errBox) errBox.style.display = "none";

    if (mode === "signin") {
      if (tabSignIn) tabSignIn.classList.add("active");
      if (tabSignUp) tabSignUp.classList.remove("active");
      if (formSignIn) formSignIn.style.display = "block";
      if (formSignUp) formSignUp.style.display = "none";
      if (googleBtnLabel) googleBtnLabel.textContent = "Sign in with Google";
    } else {
      if (tabSignUp) tabSignUp.classList.add("active");
      if (tabSignIn) tabSignIn.classList.remove("active");
      if (formSignUp) formSignUp.style.display = "block";
      if (formSignIn) formSignIn.style.display = "none";
      if (googleBtnLabel) googleBtnLabel.textContent = "Create account with Google";
    }
  },

  openGoogleAuthModal() {
    const modal = document.getElementById("google-auth-modal");
    const loading = document.getElementById("google-auth-loading");
    const picker = document.getElementById("google-auth-picker");
    const customForm = document.getElementById("google-custom-account-form");

    if (loading) loading.style.display = "none";
    if (picker) picker.style.display = "block";
    if (customForm) customForm.style.display = "none";
    if (modal) modal.classList.add("open");
  },

  closeGoogleAuthModal() {
    const modal = document.getElementById("google-auth-modal");
    if (modal) modal.classList.remove("open");
  },

  toggleCustomGoogleInput() {
    const customForm = document.getElementById("google-custom-account-form");
    if (!customForm) return;
    const isHidden = customForm.style.display === "none";
    customForm.style.display = isHidden ? "block" : "none";
    if (isHidden) {
      const nameInput = document.getElementById("google-custom-name");
      if (nameInput) nameInput.focus();
    }
  },

  handleCustomGoogleSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("google-custom-name").value;
    const email = document.getElementById("google-custom-email").value;
    this.executeGoogleAuth(name, email);
  },

  executeGoogleAuth(name, email, picture = null) {
    const loading = document.getElementById("google-auth-loading");
    const picker = document.getElementById("google-auth-picker");

    if (picker) picker.style.display = "none";
    if (loading) loading.style.display = "block";

    setTimeout(() => {
      const res = Auth.loginWithGoogle({ name, email, picture });
      this.closeGoogleAuthModal();

      if (res.success) {
        const firstName = (res.user.name || "Student").split(" ")[0];
        if (res.isNewUser) {
          this.showToast(`Google account linked! Welcome, ${firstName}.`, "success");
        } else {
          this.showToast(`Signed in with Google as ${firstName}!`, "success");
        }
        this.updateAppView();
      } else {
        const errBox = document.getElementById("landing-auth-error");
        if (errBox) {
          errBox.innerText = res.error || "Google authentication failed. Please try again.";
          errBox.style.display = "block";
        }
      }
    }, 450);
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
        errBox.innerHTML = `
          <div>${escapeHTML(res.error)}</div>
          ${res.error.includes("create an account") || res.error.includes("No account found") ? `
            <button type="button" class="footer-link-btn" style="color: #60A5FA; margin-top: 0.35rem; font-size: 0.8rem;" onclick="App.switchLandingAuthTab('signup')">
              Create an Account Now →
            </button>
          ` : ''}
        `;
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
        errBox.innerHTML = `
          <div>${escapeHTML(res.error)}</div>
          ${res.error.includes("already registered") ? `
            <button type="button" class="footer-link-btn" style="color: #60A5FA; margin-top: 0.35rem; font-size: 0.8rem;" onclick="App.switchLandingAuthTab('signin')">
              Switch to Sign In →
            </button>
          ` : ''}
        `;
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
      const isGoogle = user.provider === "google";
      const providerBadge = isGoogle 
        ? `<span class="google-badge"><svg width="10" height="10" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg> Google</span>` 
        : `<span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase;">Email Account</span>`;

      userContainer.innerHTML = `
        <div class="user-avatar-btn" onclick="App.toggleUserDropdown()" title="${safeName} (${safeEmail})">
          <div class="avatar-circle" style="${isGoogle ? 'background: #1a73e8;' : ''}">${initials}</div>
          <span style="font-weight: 600;">${firstName}</span>
          <span style="font-size: 0.7rem; color: var(--text-dim);">▾</span>
        </div>

        <div id="user-dropdown-menu" style="display: none; position: absolute; right: 0; top: 2.75rem; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.5rem; box-shadow: var(--shadow-lg); min-width: 230px; z-index: 60;">
          <div style="padding: 0.5rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); margin-bottom: 0.4rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
              <strong style="color: #FFFFFF; font-size: 0.86rem; display: block;">${safeName}</strong>
              ${providerBadge}
            </div>
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
    document.getElementById("input-science-years").value = profile.science_years ?? 4;
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
              <button type="button" class="btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; color: #F87171;" onclick="App.removeModalExam(${idx})">✕</button>
            </div>
          </div>
        `).join('')}

        <!-- Add new exam dropdown -->
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
          <select id="new-exam-select" class="select-control" style="font-size: 0.8rem;">
            ${availableExams.map(ae => `<option value="${ae.id}|${ae.name}">${ae.name}</option>`).join('')}
          </select>
          <button type="button" class="btn-secondary" style="font-size: 0.8rem; white-space: nowrap;" onclick="App.addModalExam()">+ Add Exam</button>
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

    const sciParsed = parseInt(document.getElementById("input-science-years").value, 10);

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
      science_years: Number.isNaN(sciParsed) ? 4 : sciParsed,
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
