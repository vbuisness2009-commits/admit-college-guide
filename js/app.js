/**
 * Main Application Orchestrator for Admit
 * Coordinates landing page authentication, first-time student onboarding,
 * dashboard tab routing, and reactive profile state updates.
 */

const App = {
  activeTab: "status",
  collegesData: [],

  async init() {
    this.playSplash();
    await StatusEngine.init();
    await CollegesEngine.init();
    await CreditsEngine.init();

    this.collegesData = CollegesEngine.getAll();
    this.setupEventListeners();
    this.updateAppView();
    this.initGoogleIdentityServices();
    this.initParticleCanvas();
    this.setupCardTilt();
  },

  playSplash() {
    if (typeof document === "undefined") return;
    const splash = document.getElementById("splash-screen");
    if (!splash) return;
    const pc = document.getElementById("splash-particles");
    if (pc) {
      for (let i = 0; i < 25; i++) {
        const p = document.createElement("div");
        p.className = "splash-particle";
        p.style.left = Math.random() * 100 + "%";
        p.style.top = 40 + Math.random() * 50 + "%";
        p.style.animationDelay = Math.random() * 2 + "s";
        p.style.animationDuration = 2 + Math.random() * 2 + "s";
        p.style.width = p.style.height = (2 + Math.random() * 3) + "px";
        pc.appendChild(p);
      }
    }
    const dismiss = () => {
      splash.classList.add("splash-exit");
      setTimeout(() => { splash.classList.add("hidden"); }, 600);
    };
    splash.onclick = dismiss;
    setTimeout(dismiss, 1600);
  },

  continueAsGuest() {
    const res = Auth.continueAsGuest();
    if (res.success) {
      this.updateAppView();
      this.showToast("Welcome! Exploring as guest student with verified stats.", "success");
    }
  },

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("collapsed");
  },

  toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.toggle("mobile-open");
  },

  handleGlobalSearch(query) {
    const dropdown = document.getElementById("search-results");
    if (!dropdown) return;
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      dropdown.classList.add("hidden");
      dropdown.innerHTML = "";
      return;
    }
    const all = CollegesEngine.getAll();
    const matches = all.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.short_name.toLowerCase().includes(q) || 
      c.state.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length === 0) {
      dropdown.innerHTML = `<div style="padding: 10px; font-size: 0.8rem; color: #94A3B8;">No colleges found matching "${escapeHTML(query)}"</div>`;
    } else {
      dropdown.innerHTML = matches.map(c => `
        <div class="search-result-item" onclick="App.selectCollegeFromSearch('${c.id}')">
          <div class="result-title">${escapeHTML(c.name)}</div>
          <div class="result-meta">${escapeHTML(c.city)}, ${escapeHTML(c.state)} · Middle-50%: ${c.sat_25th || 'N/A'}-${c.sat_75th || 'N/A'} SAT</div>
        </div>
      `).join("");
    }
    dropdown.classList.remove("hidden");
  },

  selectCollegeFromSearch(collegeId) {
    const dropdown = document.getElementById("search-results");
    if (dropdown) dropdown.classList.add("hidden");
    const input = document.getElementById("global-search");
    if (input) input.value = "";
    this.switchTab("colleges");
    setTimeout(() => {
      const card = document.getElementById(`college-card-${collegeId}`);
      if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.style.borderColor = "var(--accent)";
      }
    }, 200);
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

    this.animateSlideVisuals(this.introCurrentSlide);
  },

  particleAnimFrame: null,

  initParticleCanvas() {
    if (typeof window === "undefined" || !document.getElementById) return;
    const canvas = document.getElementById("intro-particles-canvas");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth || window.innerWidth || 800);
    let height = (canvas.height = canvas.offsetHeight || 500);

    const onResize = () => {
      width = canvas.width = canvas.offsetWidth || window.innerWidth || 800;
      height = canvas.height = canvas.offsetHeight || 500;
    };
    window.addEventListener("resize", onResize);

    const particleCount = Math.min(42, Math.floor(width / 26));
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.8 + 0.8,
        color: i % 3 === 0 ? "rgba(96, 165, 250, " : (i % 3 === 1 ? "rgba(168, 85, 247, " : "rgba(52, 211, 153, ")
      });
    }

    let mouseX = -9999;
    let mouseY = -9999;
    if (canvas.parentElement) {
      canvas.parentElement.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
      });
      canvas.parentElement.addEventListener("mouseleave", () => {
        mouseX = -9999;
        mouseY = -9999;
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + "0.65)";
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }

        const dmx = p.x - mouseX;
        const dmy = p.y - mouseY;
        const mouseDist = Math.sqrt(dmx * dmx + dmy * dmy);
        if (mouseDist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseX, mouseY);
          ctx.strokeStyle = `rgba(96, 165, 250, ${0.35 * (1 - mouseDist / 120)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      this.particleAnimFrame = requestAnimationFrame(render);
    };

    if (this.particleAnimFrame) cancelAnimationFrame(this.particleAnimFrame);
    render();
  },

  animateSlideVisuals(slideIndex) {
    if (typeof document === "undefined") return;

    if (slideIndex === 0) {
      const el = document.getElementById("intro-scramble-chance");
      if (el) {
        let iterations = 0;
        const target = 74.3;
        const interval = setInterval(() => {
          iterations++;
          const randomVal = (Math.random() * 85 + 10).toFixed(1);
          el.textContent = randomVal + "%";
          if (iterations >= 8) {
            clearInterval(interval);
            el.textContent = target.toFixed(1) + "%";
          }
        }, 55);
      }
    } else if (slideIndex === 3) {
      const el = document.getElementById("tuition-count-display");
      if (el) {
        const end = 7275;
        const duration = 1000;
        const startTime = typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();
        const step = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(easeOut * end);
          el.textContent = "$" + current.toLocaleString() + " Saved";
          if (progress < 1 && typeof requestAnimationFrame !== "undefined") {
            requestAnimationFrame(step);
          }
        };
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(step);
        } else {
          el.textContent = "$7,275 Saved";
        }
      }
    }
  },

  setupCardTilt() {
    if (typeof document === "undefined" || !document.querySelectorAll) return;
    const cards = document.querySelectorAll(".intro-visual-card");
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
      });
    });
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

  initGoogleIdentityServices() {
    if (typeof window === "undefined") return;
    const clientId = Auth.getGoogleClientId();

    if (window.google && window.google.accounts && window.google.accounts.id) {
      if (clientId) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (res) => this.handleGoogleCredentialResponse(res),
            auto_select: false,
            cancel_on_tap_outside: true
          });

          const container = document.getElementById("g_id_signin_container");
          if (container) {
            container.innerHTML = "";
            window.google.accounts.id.renderButton(container, {
              type: "standard",
              shape: "rectangular",
              theme: "outline",
              text: "continue_with",
              size: "large",
              logo_alignment: "left",
              width: 320
            });
          }

          try {
            window.google.accounts.id.prompt();
          } catch (promptErr) {
            console.debug("Google One Tap prompt skipped:", promptErr);
          }
        } catch (err) {
          console.warn("Google Identity Services initialization:", err);
        }
      }
    } else {
      if (document.readyState !== "complete") {
        window.addEventListener("load", () => {
          this.initGoogleIdentityServices();
        }, { once: true });
      }
    }
  },

  handleGoogleButtonClick() {
    this.openGoogleAuthModal();
  },

  openGoogleAuthModal() {
    const modal = document.getElementById("google-auth-modal");
    const input = document.getElementById("google-client-id-input");
    if (input) input.value = Auth.getGoogleClientId();
    if (modal) modal.classList.add("open");
    const emailField = document.getElementById("google-direct-email");
    if (emailField) emailField.focus();
  },

  closeGoogleAuthModal() {
    const modal = document.getElementById("google-auth-modal");
    if (modal) modal.classList.remove("open");
  },

  openGoogleConfigModal() {
    this.openGoogleAuthModal();
    this.toggleGoogleDevConfig(true);
  },

  closeGoogleConfigModal() {
    this.closeGoogleAuthModal();
  },

  toggleGoogleDevConfig(forceOpen = null) {
    const devBox = document.getElementById("google-dev-config");
    if (!devBox) return;
    if (typeof forceOpen === "boolean") {
      devBox.style.display = forceOpen ? "block" : "none";
    } else {
      devBox.style.display = devBox.style.display === "none" ? "block" : "none";
    }
  },

  saveGoogleClientId(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById("google-client-id-input");
    const val = input ? input.value.trim() : "";
    Auth.setGoogleClientId(val);
    this.showToast("Google OAuth Client ID updated.", "success");
    this.initGoogleIdentityServices();
  },

  resetGoogleClientId() {
    Auth.setGoogleClientId("");
    const input = document.getElementById("google-client-id-input");
    if (input) input.value = Auth.getGoogleClientId();
    this.showToast("Reset to default Google Client ID.", "info");
    this.initGoogleIdentityServices();
  },

  clearGoogleClientId() {
    this.resetGoogleClientId();
  },

  launchGoogleOAuthPopup() {
    const clientId = Auth.getGoogleClientId();
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                this.showToast("Google token verified. Syncing profile...", "info");
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const profile = await res.json();
                if (profile && profile.email) {
                  const authRes = Auth.loginWithGoogle({
                    name: profile.name || profile.given_name || profile.email.split("@")[0],
                    email: profile.email,
                    picture: profile.picture || null
                  });
                  if (authRes.success) {
                    this.closeGoogleAuthModal();
                    const firstName = (authRes.user.name || "Student").split(" ")[0];
                    this.showToast(`Verified Google Sign-In: Welcome, ${firstName}!`, "success");
                    this.updateAppView();
                    return;
                  }
                }
              } catch (fetchErr) {
                console.warn("Could not fetch userinfo from Google:", fetchErr);
                this.showToast("Google token received, but profile fetch was blocked. Enter email below.", "warning");
              }
            } else if (tokenResponse && tokenResponse.error) {
              this.showToast(`Google OAuth Notice: ${tokenResponse.error}. You can enter your email directly below.`, "warning");
            }
          },
          error_callback: (err) => {
            console.warn("Google OAuth error callback:", err);
            this.showToast("Google popup closed. You can connect your Google email directly below.", "info");
          }
        });

        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.warn("OAuth TokenClient failed:", err);
        this.showToast("Browser blocked Google popup. Please enter your Google email directly below.", "info");
      }
    } else {
      this.showToast("Google Identity Services loading. Enter your Google email directly below.", "info");
    }
  },

  handleGoogleDirectConnect(e) {
    if (e && e.preventDefault) e.preventDefault();
    const emailInput = document.getElementById("google-direct-email");
    const nameInput = document.getElementById("google-direct-name");

    const email = emailInput ? emailInput.value.trim() : "";
    const name = nameInput ? nameInput.value.trim() : "";

    if (!email || !email.includes("@") || !email.includes(".")) {
      this.showToast("Please enter a valid Google Account email address.", "error");
      return;
    }

    const res = Auth.loginWithGoogle({
      email: email,
      name: name || email.split("@")[0]
    });

    if (res.success) {
      this.closeGoogleAuthModal();
      const firstName = (res.user.name || "Student").split(" ")[0];
      if (res.isNewUser) {
        this.showToast(`Google account connected! Welcome, ${firstName}.`, "success");
      } else {
        this.showToast(`Signed in with Google as ${firstName}!`, "success");
      }
      this.updateAppView();
    } else {
      this.showToast(res.error || "Google authentication failed.", "error");
    }
  },

  parseJwt(token) {
    try {
      if (!token || typeof token !== "string") return null;
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Failed to parse Google JWT credential:", e);
      return null;
    }
  },

  handleGoogleCredentialResponse(response) {
    if (!response || !response.credential) {
      this.showToast("Google authentication did not return a credential.", "error");
      return;
    }

    const payload = this.parseJwt(response.credential);
    if (!payload || !payload.email) {
      this.showToast("Could not extract student profile from Google credential.", "error");
      return;
    }

    const googleProfile = {
      email: payload.email,
      name: payload.name || payload.given_name || payload.email.split("@")[0],
      picture: payload.picture || null
    };

    const res = Auth.loginWithGoogle(googleProfile);
    if (res.success) {
      const firstName = (res.user.name || "Student").split(" ")[0];
      if (res.isNewUser) {
        this.showToast(`Verified Google Sign-In: Welcome, ${firstName}!`, "success");
      } else {
        this.showToast(`Welcome back, ${firstName}!`, "success");
      }
      this.updateAppView();
    } else {
      const errBox = document.getElementById("landing-auth-error");
      if (errBox) {
        errBox.innerText = res.error || "Google authentication failed. Please try again.";
        errBox.style.display = "block";
      }
      this.showToast(res.error || "Google sign-in error", "error");
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
    
    document.querySelectorAll(".tab-btn, .nav-link").forEach(btn => {
      if (btn.dataset.tab === tabId || btn.dataset.view === tabId) {
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

    const sidebar = document.getElementById("sidebar");
    if (sidebar) sidebar.classList.remove("mobile-open");

    this.renderActiveTab();
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  renderActiveTab() {
    const profile = ProfileManager.get();

    switch (this.activeTab) {
      case "overview":
        // Overview view is statically rendered in index.html and reactive to stats
        break;
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

    const lawsStat = document.getElementById("sidebar-stat-laws");
    if (lawsStat && typeof StatusEngine !== "undefined" && StatusEngine.rulesData) {
      const summary = StatusEngine.evaluateAll(profile);
      const qualifiedCount = summary.filter(s => s.status === "qualified").length;
      lawsStat.textContent = `${qualifiedCount} Law${qualifiedCount === 1 ? '' : 's'} Guaranteed`;
    }

    const tuitionStat = document.getElementById("sidebar-stat-tuition");
    if (tuitionStat && typeof CreditsEngine !== "undefined") {
      const savedColleges = (profile.saved_colleges || []).map(id => CollegesEngine.getById(id)).filter(Boolean);
      const { maxTuition } = CreditsEngine.calculateMaxSavings(savedColleges, profile.ap_exams || [], profile.residency);
      tuitionStat.textContent = maxTuition ? `$${maxTuition.toLocaleString()} Saved` : "$7,275 Saved";
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
