/**
 * Interactive Onboarding Wizard for ShipMates
 * Guides new students through a 5-step stats input experience.
 */

const Onboarding = {
  currentStep: 1,
  totalSteps: 5,
  wizardData: {},

  init() {
    this.currentStep = 1;
    const user = Auth.getCurrentUser();
    const defaultGrade = (typeof App !== "undefined" && App.selectedTrack === "hs") ? 10 : 12;
    if (user && user.profile) {
      this.wizardData = JSON.parse(JSON.stringify(user.profile));
      if (!this.wizardData.name && user.name) this.wizardData.name = user.name;
      if (!this.wizardData.intended_major) this.wizardData.intended_major = "STEM & Engineering";
      if (!["national", "strong", "developing", "starter"].includes(this.wizardData.extracurricular_tier)) {
        this.wizardData.extracurricular_tier = "strong";
      }
      if (!["scholarships", "flagship", "roadmap", "credits"].includes(this.wizardData.primary_goal)) {
        this.wizardData.primary_goal = defaultGrade >= 12 ? "scholarships" : "roadmap";
      }
      if (typeof this.wizardData.extracurricular_details !== "string") this.wizardData.extracurricular_details = "";
      if (typeof this.wizardData.priority_goal_details !== "string") this.wizardData.priority_goal_details = "";
      if (typeof this.wizardData.awards_details !== "string") this.wizardData.awards_details = "";
      if (!Array.isArray(this.wizardData.selected_awards)) {
        this.wizardData.selected_awards = ["AP Scholar / Honor Roll", "TSA / Robotics / STEM Competition"];
      }
      if (typeof this.wizardData.community_service_hours !== "number") this.wizardData.community_service_hours = 100;
      if (!this.wizardData.college_statuses || typeof this.wizardData.college_statuses !== "object") {
        this.wizardData.college_statuses = {};
      }
      (this.wizardData.saved_colleges || []).forEach(cid => {
        if (!this.wizardData.college_statuses[cid]) this.wizardData.college_statuses[cid] = "working";
      });
    } else {
      this.wizardData = {
        name: user ? user.name : "",
        grade_level: defaultGrade,
        residency: "TX",
        high_school: "",
        intended_major: "STEM & Engineering",
        extracurricular_tier: "strong",
        extracurricular_details: "",
        selected_awards: ["AP Scholar / Honor Roll", "TSA / Robotics / STEM Competition"],
        awards_details: "",
        community_service_hours: 100,
        primary_goal: defaultGrade >= 12 ? "scholarships" : "roadmap",
        priority_goal_details: "",
        gpa_unweighted: 3.85,
        gpa_weighted: 4.3,
        class_rank: 28,
        class_size: 520,
        class_percentile: 5.4,
        sat_rw: 690,
        sat_m: 730,
        sat_total: 1420,
        act_composite: 31,
        psat_score: 1420,
        psat_index: 214,
        national_merit_status: "commended",
        math_years_algebra2: true,
        science_years: 4,
        has_endorsement: true,
        fl_prep_complete: true,
        saved_colleges: ["ut-austin", "tamu", "uf", "gatech", "purdue"],
        college_statuses: {
          "ut-austin": "working",
          "tamu": "working",
          "uf": "working",
          "gatech": "working",
          "purdue": "working"
        },
        ap_exams: [
          { id: "calc_ab", name: "AP Calculus AB", score: 5, status: "completed" },
          { id: "eng_lang", name: "AP English Language & Composition", score: 4, status: "completed" },
          { id: "ushist", name: "AP United States History", score: 4, status: "completed" }
        ]
      };
    }
  },

  start() {
    this.init();
    this.renderStep(1);
    const authView = document.getElementById("view-auth");
    const appView = document.getElementById("view-app");
    const obContainer = document.getElementById("view-onboarding");
    if (authView) authView.style.display = "none";
    if (appView) appView.style.display = "none";
    if (obContainer) obContainer.style.display = "block";
  },

  open() {
    this.start();
  },

  close() {
    const obContainer = document.getElementById("view-onboarding");
    if (obContainer) obContainer.style.display = "none";
    const modal = document.getElementById("onboarding-modal");
    if (modal) modal.classList.remove("open");
  },

  goToStep(step) {
    this.harvestCurrentStepData();
    this.currentStep = Math.max(1, Math.min(this.totalSteps, step));
    this.renderStep(this.currentStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  },

  nextStep() {
    if (this.currentStep >= this.totalSteps) {
      this.finish();
      return;
    }
    this.goToStep(this.currentStep + 1);
  },

  prevStep() {
    this.goToStep(this.currentStep - 1);
  },

  harvestCurrentStepData() {
    switch (this.currentStep) {
      case 1: {
        const nameInput = document.getElementById("ob-name");
        const hsInput = document.getElementById("ob-hs");
        const gradeInput = document.getElementById("ob-grade");
        const resInput = document.getElementById("ob-residency");
        const majorInput = document.getElementById("ob-major");
        if (nameInput && nameInput.value.trim()) this.wizardData.name = nameInput.value.trim();
        if (hsInput) this.wizardData.high_school = hsInput.value.trim();
        if (gradeInput && gradeInput.value) this.wizardData.grade_level = parseInt(gradeInput.value, 10) || 11;
        if (resInput && resInput.value) this.wizardData.residency = resInput.value;
        if (majorInput && majorInput.value) this.wizardData.intended_major = majorInput.value;
        break;
      }
      case 2: {
        const gpaUw = document.getElementById("ob-gpa-uw");
        const gpaW = document.getElementById("ob-gpa-w");
        const rank = document.getElementById("ob-rank");
        const size = document.getElementById("ob-size");
        if (gpaUw) this.wizardData.gpa_unweighted = parseFloat(gpaUw.value) || 3.8;
        if (gpaW) this.wizardData.gpa_weighted = parseFloat(gpaW.value) || 4.2;
        if (rank) this.wizardData.class_rank = parseInt(rank.value, 10) || null;
        if (size) this.wizardData.class_size = parseInt(size.value, 10) || null;
        if (this.wizardData.class_rank && this.wizardData.class_size && this.wizardData.class_size > 0) {
          this.wizardData.class_percentile = parseFloat(((this.wizardData.class_rank / this.wizardData.class_size) * 100).toFixed(1));
        } else {
          this.wizardData.class_percentile = null;
        }
        break;
      }
      case 3: {
        const noTest = document.getElementById("ob-no-test");
        this.wizardData.no_test_checked = !!(noTest && noTest.checked);
        if (this.wizardData.no_test_checked) {
          this.wizardData.sat_rw = null;
          this.wizardData.sat_m = null;
          this.wizardData.sat_total = null;
          this.wizardData.act_composite = null;
        } else {
          const rw = document.getElementById("ob-sat-rw");
          const m = document.getElementById("ob-sat-m");
          const act = document.getElementById("ob-act");
          const rwVal = rw && rw.value ? parseInt(rw.value, 10) : null;
          const mVal = m && m.value ? parseInt(m.value, 10) : null;
          this.wizardData.sat_rw = rwVal;
          this.wizardData.sat_m = mVal;
          this.wizardData.sat_total = (rwVal && mVal) ? (rwVal + mVal) : null;
          this.wizardData.act_composite = (act && act.value) ? parseInt(act.value, 10) : null;
        }
        const psatEl = document.getElementById("ob-psat");
        const psatIdxEl = document.getElementById("ob-psat-index");
        if (psatEl && psatEl.value !== "") {
          this.wizardData.psat_score = parseInt(psatEl.value, 10) || null;
        }
        if (psatIdxEl && psatIdxEl.value !== "") {
          this.wizardData.psat_index = parseInt(psatIdxEl.value, 10) || null;
        } else if (this.wizardData.psat_score) {
          this.wizardData.psat_index = Math.min(228, Math.round(this.wizardData.psat_score * 0.15));
        }
        break;
      }
      case 4: {
        const alg2 = document.getElementById("ob-alg2");
        const sci = document.getElementById("ob-sci");
        const end = document.getElementById("ob-end");
        const fl = document.getElementById("ob-fl");
        const ec = document.getElementById("ob-ec");
        const goal = document.getElementById("ob-goal");
        const ecDetails = document.getElementById("ob-ec-details");
        const goalDetails = document.getElementById("ob-goal-details");
        const awardsDetails = document.getElementById("ob-awards-details");
        const serviceHours = document.getElementById("ob-service-hours");
        if (alg2) this.wizardData.math_years_algebra2 = alg2.checked;
        if (sci) {
          const parsedSci = parseInt(sci.value, 10);
          this.wizardData.science_years = Number.isNaN(parsedSci) ? 4 : parsedSci;
        }
        if (end) this.wizardData.has_endorsement = end.checked;
        if (fl) this.wizardData.fl_prep_complete = fl.checked;
        if (ec && ec.value) this.wizardData.extracurricular_tier = ec.value;
        if (goal && goal.value) this.wizardData.primary_goal = goal.value;
        if (ecDetails && ecDetails.value !== undefined && ecDetails.value.trim() !== "") {
          this.wizardData.extracurricular_details = ecDetails.value.trim();
        }
        if (goalDetails && goalDetails.value !== undefined && goalDetails.value.trim() !== "") {
          this.wizardData.priority_goal_details = goalDetails.value.trim();
        }
        if (awardsDetails && awardsDetails.value !== undefined && awardsDetails.value.trim() !== "") {
          this.wizardData.awards_details = awardsDetails.value.trim();
        }
        if (serviceHours && serviceHours.value !== "") {
          this.wizardData.community_service_hours = parseInt(serviceHours.value, 10) || 0;
        }
        break;
      }
    }
  },

  collegeSearchQuery: "",

  renderStep(step) {
    const container = document.getElementById("onboarding-step-container");
    const progressFill = document.getElementById("onboarding-progress-fill");
    const stepLabel = document.getElementById("onboarding-step-label");
    const prevBtn = document.getElementById("ob-prev-btn");
    const nextBtn = document.getElementById("ob-next-btn");

    if (!container) return;

    const percent = ((step - 1) / (this.totalSteps - 1)) * 100;
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (stepLabel) stepLabel.innerText = `Question Set ${step} of ${this.totalSteps} · Click any step tab below to jump directly`;

    if (prevBtn) prevBtn.style.visibility = step === 1 ? "hidden" : "visible";
    if (nextBtn) {
      if (step === this.totalSteps) {
        nextBtn.innerText = "✨ Analyze My Stats & Generate AI Breakdown →";
        nextBtn.className = "btn-primary";
        nextBtn.onclick = () => Onboarding.finish();
      } else {
        nextBtn.innerText = "Next Question Set →";
        nextBtn.className = "btn-primary";
        nextBtn.onclick = () => Onboarding.nextStep();
      }
    }

    const stepTitles = [
      { num: 1, title: "Track & Major", sub: "Grade & State" },
      { num: 2, title: "GPA & Rank", sub: "1-Click Presets" },
      { num: 3, title: "SAT, ACT & PSAT", sub: "Merit & NMSQT" },
      { num: 4, title: "ECs & Awards", sub: "Scholarship Boost" },
      { num: 5, title: "APs & Colleges", sub: "Status Tracker" }
    ];

    const stepNavHtml = `
      <div class="ob-step-nav" role="tablist">
        ${stepTitles.map(st => `
          <button type="button" class="ob-step-pill ${st.num === step ? 'active' : (st.num < step ? 'completed' : '')}" onclick="Onboarding.goToStep(${st.num})">
            <div class="tf-step-icon ${st.num === step ? 'tf-step-icon-active' : (st.num < step ? 'tf-step-icon-completed' : 'tf-step-icon-inactive')}">
              ${st.num < step ? '✓' : st.num}
            </div>
            <div>
              <div class="tf-card-title" style="font-size: 0.82rem;">${st.title}</div>
              <div class="tf-card-desc" style="font-size: 0.7rem; margin-top: 0.1rem;">${st.sub}</div>
            </div>
          </button>
        `).join('')}
      </div>
    `;

    let html = "";

    switch (step) {
      case 1: {
        const currentGrade = this.wizardData.grade_level || 12;
        const currentMajor = this.wizardData.intended_major || "STEM & Engineering";
        const currentRes = this.wizardData.residency || "TX";
        const majorsList = [
          { val: "STEM & Engineering", icon: "⚙️", title: "STEM & Engineering", sub: "Mechanical, Aerospace, Electrical, Civil" },
          { val: "Computer Science & Data", icon: "💻", title: "Computer Science & AI", sub: "Software, AI/ML, Data Science, Cyber" },
          { val: "Business, Finance & Economics", icon: "📈", title: "Business & Finance", sub: "Finance, Accounting, Marketing, Econ" },
          { val: "Pre-Med, Biology & Health", icon: "🧬", title: "Pre-Med & Health", sub: "Biology, Nursing, Pre-Health, Chemistry" },
          { val: "Humanities, Law & Social Sciences", icon: "⚖️", title: "Humanities & Pre-Law", sub: "Government, Psychology, English, History" },
          { val: "Undecided / Exploring", icon: "🧭", title: "Undecided / Exploring", sub: "Compare multiple majors & core waivers" }
        ];
        const quickStates = [
          { code: "TX", label: "TX · Texas" },
          { code: "CA", label: "CA · California" },
          { code: "FL", label: "FL · Florida" },
          { code: "GA", label: "GA · Georgia" },
          { code: "WA", label: "WA · Washington" },
          { code: "NY", label: "NY · New York" },
          { code: "IL", label: "IL · Illinois" },
          { code: "MI", label: "MI · Michigan" }
        ];

        html = `
          <div class="onboarding-step-body">
            ${stepNavHtml}
            <div class="tf-step-header">
              <h3>1. Your Grade Level, Location & Intended Major</h3>
              <p>Click any card below to set your grade track, intended major, and state in seconds.</p>
            </div>

            <!-- 1-Click Grade Level Cards -->
            <div style="margin-bottom: 1.5rem;">
              <label class="tf-section-label">
                Select Your Current Grade Level (1-Click):
              </label>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                ${[
                  { g: 12, badge: "🎓 Senior / Grad", title: "12th Grade / Grad", desc: "Unlock scholarships, auto-admit & AP cash now" },
                  { g: 11, badge: "🚀 Junior", title: "11th Grade (Junior)", desc: "SAT/ACT peak window & junior year roadmap" },
                  { g: 10, badge: "🗺️ Sophomore", title: "10th Grade (Sophomore)", desc: "PSAT prep, AP ramp-up & 3-year blueprint" },
                  { g: 9, badge: "🌱 Freshman", title: "9th Grade (Freshman)", desc: "4-year high school course & activity guide" }
                ].map(item => `
                  <button type="button" class="ob-choice-card ${currentGrade === item.g ? 'selected' : ''}" onclick="Onboarding.selectGradeTrack(${item.g})">
                    <div>
                      <div class="tf-card-eyebrow">
                        <span class="tf-card-tag">${item.badge}</span>
                        ${currentGrade === item.g ? '<span class="tf-card-check">✓ Selected</span>' : ''}
                      </div>
                      <div class="tf-card-title">${item.title}</div>
                      <div class="tf-card-desc">${item.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
              <select id="ob-grade" class="select-control" style="display: none;">
                <option value="9" ${currentGrade === 9 ? 'selected' : ''}>9th Grade</option>
                <option value="10" ${currentGrade === 10 ? 'selected' : ''}>10th Grade</option>
                <option value="11" ${currentGrade === 11 ? 'selected' : ''}>11th Grade</option>
                <option value="12" ${currentGrade === 12 ? 'selected' : ''}>12th Grade</option>
              </select>
            </div>

            <!-- 1-Click Intended Major Cards -->
            <div style="margin-bottom: 1.5rem;">
              <label class="tf-section-label">
                Select Your Intended Major / Career Interest (1-Click):
              </label>
              <div class="ob-choice-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
                ${majorsList.map(m => `
                  <button type="button" class="ob-choice-card ${currentMajor === m.val ? 'selected' : ''}" onclick="Onboarding.selectMajor('${m.val}')">
                    <div>
                      <div class="tf-card-eyebrow">
                        <span style="font-size: 1.35rem;">${m.icon}</span>
                        ${currentMajor === m.val ? '<span class="tf-card-check">✓ Active</span>' : ''}
                      </div>
                      <div class="tf-card-title" style="margin-top: 0.35rem;">${m.title}</div>
                      <div class="tf-card-desc">${m.sub}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
              <select id="ob-major" class="select-control" style="display: none;">
                ${majorsList.map(m => `<option value="${m.val}" ${currentMajor === m.val ? 'selected' : ''}>${m.val}</option>`).join('')}
              </select>
            </div>

            <!-- Name, High School & State Residency -->
            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
              <div class="form-group">
                <label for="ob-name">Your Name</label>
                <input type="text" id="ob-name" class="input-control" value="${this.wizardData.name || ''}" placeholder="e.g. Jordan Taylor" required>
              </div>

              <div class="form-group">
                <label for="ob-hs">High School Name <span class="hint">(optional)</span></label>
                <input type="text" id="ob-hs" class="input-control" value="${this.wizardData.high_school || ''}" placeholder="e.g. Westlake High School">
              </div>

              <div class="form-group">
                <label for="ob-residency">State Residency</label>
                <select id="ob-residency" class="select-control" onchange="Onboarding.selectResidency(this.value)">
                  <option value="AL" ${currentRes === 'AL' ? 'selected' : ''}>Alabama (AL)</option>
                  <option value="AK" ${currentRes === 'AK' ? 'selected' : ''}>Alaska (AK)</option>
                  <option value="AZ" ${currentRes === 'AZ' ? 'selected' : ''}>Arizona (AZ)</option>
                  <option value="AR" ${currentRes === 'AR' ? 'selected' : ''}>Arkansas (AR)</option>
                  <option value="CA" ${currentRes === 'CA' ? 'selected' : ''}>California (CA)</option>
                  <option value="CO" ${currentRes === 'CO' ? 'selected' : ''}>Colorado (CO)</option>
                  <option value="CT" ${currentRes === 'CT' ? 'selected' : ''}>Connecticut (CT)</option>
                  <option value="DE" ${currentRes === 'DE' ? 'selected' : ''}>Delaware (DE)</option>
                  <option value="DC" ${currentRes === 'DC' ? 'selected' : ''}>District of Columbia (DC)</option>
                  <option value="FL" ${currentRes === 'FL' ? 'selected' : ''}>Florida (FL)</option>
                  <option value="GA" ${currentRes === 'GA' ? 'selected' : ''}>Georgia (GA)</option>
                  <option value="HI" ${currentRes === 'HI' ? 'selected' : ''}>Hawaii (HI)</option>
                  <option value="ID" ${currentRes === 'ID' ? 'selected' : ''}>Idaho (ID)</option>
                  <option value="IL" ${currentRes === 'IL' ? 'selected' : ''}>Illinois (IL)</option>
                  <option value="IN" ${currentRes === 'IN' ? 'selected' : ''}>Indiana (IN)</option>
                  <option value="IA" ${currentRes === 'IA' ? 'selected' : ''}>Iowa (IA)</option>
                  <option value="KS" ${currentRes === 'KS' ? 'selected' : ''}>Kansas (KS)</option>
                  <option value="KY" ${currentRes === 'KY' ? 'selected' : ''}>Kentucky (KY)</option>
                  <option value="LA" ${currentRes === 'LA' ? 'selected' : ''}>Louisiana (LA)</option>
                  <option value="ME" ${currentRes === 'ME' ? 'selected' : ''}>Maine (ME)</option>
                  <option value="MD" ${currentRes === 'MD' ? 'selected' : ''}>Maryland (MD)</option>
                  <option value="MA" ${currentRes === 'MA' ? 'selected' : ''}>Massachusetts (MA)</option>
                  <option value="MI" ${currentRes === 'MI' ? 'selected' : ''}>Michigan (MI)</option>
                  <option value="MN" ${currentRes === 'MN' ? 'selected' : ''}>Minnesota (MN)</option>
                  <option value="MS" ${currentRes === 'MS' ? 'selected' : ''}>Mississippi (MS)</option>
                  <option value="MO" ${currentRes === 'MO' ? 'selected' : ''}>Missouri (MO)</option>
                  <option value="MT" ${currentRes === 'MT' ? 'selected' : ''}>Montana (MT)</option>
                  <option value="NE" ${currentRes === 'NE' ? 'selected' : ''}>Nebraska (NE)</option>
                  <option value="NV" ${currentRes === 'NV' ? 'selected' : ''}>Nevada (NV)</option>
                  <option value="NH" ${currentRes === 'NH' ? 'selected' : ''}>New Hampshire (NH)</option>
                  <option value="NJ" ${currentRes === 'NJ' ? 'selected' : ''}>New Jersey (NJ)</option>
                  <option value="NM" ${currentRes === 'NM' ? 'selected' : ''}>New Mexico (NM)</option>
                  <option value="NY" ${currentRes === 'NY' ? 'selected' : ''}>New York (NY)</option>
                  <option value="NC" ${currentRes === 'NC' ? 'selected' : ''}>North Carolina (NC)</option>
                  <option value="ND" ${currentRes === 'ND' ? 'selected' : ''}>North Dakota (ND)</option>
                  <option value="OH" ${currentRes === 'OH' ? 'selected' : ''}>Ohio (OH)</option>
                  <option value="OK" ${currentRes === 'OK' ? 'selected' : ''}>Oklahoma (OK)</option>
                  <option value="OR" ${currentRes === 'OR' ? 'selected' : ''}>Oregon (OR)</option>
                  <option value="PA" ${currentRes === 'PA' ? 'selected' : ''}>Pennsylvania (PA)</option>
                  <option value="RI" ${currentRes === 'RI' ? 'selected' : ''}>Rhode Island (RI)</option>
                  <option value="SC" ${currentRes === 'SC' ? 'selected' : ''}>South Carolina (SC)</option>
                  <option value="SD" ${currentRes === 'SD' ? 'selected' : ''}>South Dakota (SD)</option>
                  <option value="TN" ${currentRes === 'TN' ? 'selected' : ''}>Tennessee (TN)</option>
                  <option value="TX" ${currentRes === 'TX' ? 'selected' : ''}>Texas (TX)</option>
                  <option value="UT" ${currentRes === 'UT' ? 'selected' : ''}>Utah (UT)</option>
                  <option value="VT" ${currentRes === 'VT' ? 'selected' : ''}>Vermont (VT)</option>
                  <option value="VA" ${currentRes === 'VA' ? 'selected' : ''}>Virginia (VA)</option>
                  <option value="WA" ${currentRes === 'WA' ? 'selected' : ''}>Washington (WA)</option>
                  <option value="WV" ${currentRes === 'WV' ? 'selected' : ''}>West Virginia (WV)</option>
                  <option value="WI" ${currentRes === 'WI' ? 'selected' : ''}>Wisconsin (WI)</option>
                  <option value="WY" ${currentRes === 'WY' ? 'selected' : ''}>Wyoming (WY)</option>
                  <option value="OTHER" ${currentRes === 'OTHER' ? 'selected' : ''}>U.S. Territory / International</option>
                </select>
              </div>
            </div>

            <!-- 1-Click Popular State Buttons -->
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.85rem;">
              <span class="tf-quick-add-tag">Quick State Tap:</span>
              ${quickStates.map(st => `
                <button type="button" class="ob-score-pill ${currentRes === st.code ? 'active' : ''}" onclick="Onboarding.selectResidency('${st.code}')">
                  ${st.label}
                </button>
              `).join('')}
            </div>
          </div>
        `;
        break;
      }

      case 2: {
        const pct = (this.wizardData.class_rank && this.wizardData.class_size) ? ((this.wizardData.class_rank / this.wizardData.class_size) * 100).toFixed(1) : null;
        const curUw = parseFloat(this.wizardData.gpa_unweighted) || 3.85;
        html = `
          <div class="onboarding-step-body">
            ${stepNavHtml}
            <div class="tf-step-header">
              <h3>2. Your GPA & Class Rank Standing</h3>
              <p>Click a 1-click GPA preset card below, or fine-tune your exact GPA and class rank.</p>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="tf-section-label">
                Quick GPA & Class Rank Presets (1-Click):
              </label>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); gap: 0.8rem;">
                ${[
                  { uw: 3.95, w: 4.45, r: 18, s: 500, badge: "🌟 Top 4% Rank", title: "Straight A's (3.95 UW)", desc: "4.45 Weighted · Unlocks top merit & UT/TAMU auto-admit" },
                  { uw: 3.75, w: 4.15, r: 42, s: 500, badge: "🏅 Top 9% Rank", title: "A / B+ Honor Roll (3.75 UW)", desc: "4.15 Weighted · Qualifies for Top 10% & flagship merit" },
                  { uw: 3.45, w: 3.80, r: 95, s: 500, badge: "📘 Top 19% Rank", title: "Solid B+ Average (3.45 UW)", desc: "3.80 Weighted · Strong state university & merit match" },
                  { uw: 3.15, w: 3.35, r: 160, s: 500, badge: "📗 Top 32% Rank", title: "B Average (3.15 UW)", desc: "3.35 Weighted · Qualifies for direct state admissions" }
                ].map(p => `
                  <button type="button" class="ob-choice-card ${Math.abs(curUw - p.uw) < 0.03 ? 'selected' : ''}" onclick="Onboarding.setGpaPreset(${p.uw}, ${p.w}, ${p.r}, ${p.s})">
                    <div>
                      <div class="tf-card-eyebrow">
                        <span class="tf-card-tag">${p.badge}</span>
                        ${Math.abs(curUw - p.uw) < 0.03 ? '<span class="tf-card-check">✓ Active</span>' : ''}
                      </div>
                      <div class="tf-card-title">${p.title}</div>
                      <div class="tf-card-desc">${p.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem;">
              <div class="form-group">
                <label for="ob-gpa-uw">Unweighted GPA <span class="hint">(0.00 – 4.00)</span></label>
                <input type="number" step="0.01" min="0" max="4.0" id="ob-gpa-uw" class="input-control" value="${this.wizardData.gpa_unweighted || ''}" placeholder="3.85">
              </div>

              <div class="form-group">
                <label for="ob-gpa-w">Weighted GPA <span class="hint">(e.g. 4.35)</span></label>
                <input type="number" step="0.01" min="0" max="6.0" id="ob-gpa-w" class="input-control" value="${this.wizardData.gpa_weighted || ''}" placeholder="4.35">
              </div>

              <div class="form-group">
                <label for="ob-rank">Class Rank <span class="hint">(Optional)</span></label>
                <input type="number" min="1" id="ob-rank" class="input-control" value="${this.wizardData.class_rank || ''}" placeholder="e.g. 24" oninput="Onboarding.updatePercentileLive()">
              </div>

              <div class="form-group">
                <label for="ob-size">Graduating Class Size <span class="hint">(Optional)</span></label>
                <input type="number" min="1" id="ob-size" class="input-control" value="${this.wizardData.class_size || ''}" placeholder="e.g. 500" oninput="Onboarding.updatePercentileLive()">
              </div>
            </div>

            <div class="tf-metric-box">
              <span class="tf-metric-label">Calculated Class Standing Percentile:</span>
              <strong class="tf-metric-val" id="ob-percentile-live">${pct ? `Top ${pct}%` : 'Enter rank & size above'}</strong>
            </div>
          </div>
        `;
        break;
      }

      case 3: {
        const hasScores = !this.wizardData.no_test_checked && this.wizardData.sat_rw && this.wizardData.sat_m;
        const totalSat = hasScores ? (this.wizardData.sat_rw + this.wizardData.sat_m) : "Test-Optional / Not Entered";
        const curPsat = this.wizardData.psat_score || "";
        const curPsatIdx = this.wizardData.psat_index || (curPsat ? Math.min(228, Math.round(curPsat * 0.15)) : "");
        const nmStatus = this.wizardData.national_merit_status || (curPsat >= 1470 ? "semifinalist" : (curPsat >= 1400 ? "commended" : "none"));
        const psatBannerMsg = curPsat >= 1470
          ? `🏆 ${curPsat} PSAT (${curPsatIdx} Selection Index): National Merit Semifinalist/Finalist Track — Unlocks $10,000/yr to Full-Ride ($112,000–$140,000+) packages at Alabama, Texas A&M, UF, UT Dallas, Purdue & Oklahoma!`
          : curPsat >= 1400
            ? `⭐ ${curPsat} PSAT (${curPsatIdx} Selection Index): National Merit Commended / Recognition Track — Unlocks +$2,000–$6,000/yr Honors & National Recognition scholarships!`
            : curPsat >= 1200
              ? `📈 ${curPsat} PSAT (${curPsatIdx} Selection Index): Strong Honors Baseline — Projects to a ${Math.min(1600, curPsat + 90)}+ SAT with targeted prep!`
              : `Tap a PSAT preset below or enter your PSAT / NMSQT score to calculate National Merit & Recognition scholarships.`;
        html = `
          <div class="onboarding-step-body">
            ${stepNavHtml}
            <div class="tf-step-header">
              <h3>3. Standardized Testing: SAT, ACT & PSAT / National Merit</h3>
              <p>Click any 1-click SAT/ACT preset and PSAT/NMSQT preset below to calculate automatic merit and National Merit scholarships.</p>
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label class="tf-section-label">
                Quick Score Presets (1-Click):
              </label>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.75rem;">
                ${[
                  { rw: 740, m: 770, act: 34, badge: "🔥 99th Percentile", title: "1510 SAT / 34 ACT", desc: "740 RW + 770 Math · Unlocks max $28k/yr merit" },
                  { rw: 690, m: 720, act: 31, badge: "⭐ 95th Percentile", title: "1410 SAT / 31 ACT", desc: "690 RW + 720 Math · Flagship & Bright Futures 100%" },
                  { rw: 640, m: 660, act: 28, badge: "✅ 87th Percentile", title: "1300 SAT / 28 ACT", desc: "640 RW + 660 Math · Strong merit & state match" },
                  { rw: 580, m: 600, act: 24, badge: "📈 College Ready", title: "1180 SAT / 24 ACT", desc: "580 RW + 600 Math · Clears readiness benchmarks" }
                ].map(p => `
                  <button type="button" class="ob-choice-card ${(!this.wizardData.no_test_checked && (this.wizardData.sat_rw + this.wizardData.sat_m) === (p.rw + p.m)) ? 'selected' : ''}" onclick="Onboarding.setScorePreset(${p.rw}, ${p.m}, ${p.act})">
                    <div>
                      <div class="tf-card-eyebrow">
                        <span class="tf-card-tag">${p.badge}</span>
                      </div>
                      <div class="tf-card-title">${p.title}</div>
                      <div class="tf-card-desc">${p.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
            </div>

            <label class="checkbox-group" style="margin-bottom: 1.25rem; padding: 1rem 1.15rem; border-radius: var(--radius-md); cursor: pointer;">
              <input type="checkbox" id="ob-no-test" style="width: 20px; height: 20px;" onchange="Onboarding.toggleTestInputs(this.checked)" ${this.wizardData.no_test_checked ? 'checked' : ''}>
              <div class="checkbox-label">
                <strong style="font-size: 0.98rem;">I haven't taken the SAT or ACT yet (Test-Optional / Future Tester)</strong>
                <span class="checkbox-sub" style="font-size: 0.84rem;">Our AI will build a test prep timeline and show test-optional university pathways.</span>
              </div>
            </label>

            <div id="ob-test-fields" style="opacity: ${this.wizardData.no_test_checked ? '0.4' : '1'};">
              <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
                <div class="form-group">
                  <label for="ob-sat-rw">SAT Reading & Writing <span class="hint">(200–800)</span></label>
                  <input type="number" min="200" max="800" step="10" id="ob-sat-rw" class="input-control" value="${this.wizardData.sat_rw || ''}" placeholder="690" oninput="Onboarding.updateSatTotalLive()">
                </div>

                <div class="form-group">
                  <label for="ob-sat-m">SAT Math <span class="hint">(200–800)</span></label>
                  <input type="number" min="200" max="800" step="10" id="ob-sat-m" class="input-control" value="${this.wizardData.sat_m || ''}" placeholder="720" oninput="Onboarding.updateSatTotalLive()">
                </div>

                <div class="form-group">
                  <label for="ob-act">ACT Composite <span class="hint">(1–36)</span></label>
                  <input type="number" min="1" max="36" id="ob-act" class="input-control" value="${this.wizardData.act_composite || ''}" placeholder="31">
                </div>
              </div>

              <div class="tf-metric-box">
                <span class="tf-metric-label">Combined Total SAT Score:</span>
                <strong class="tf-metric-val" style="color: #34D399;" id="ob-sat-total-live">${totalSat}</strong>
              </div>
            </div>

            <!-- Interactive PSAT / NMSQT & National Merit Scholarship Section -->
            <div class="tf-bento-card" style="margin-top: 1.65rem; padding: 1.35rem 1.45rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
                <div>
                  <h4 style="font-size: 1.05rem; font-weight: 800; color: #FFFFFF; margin: 0;">
                    🎓 PSAT / NMSQT Score & National Merit Scholarship Calculator (1-Click)
                  </h4>
                  <span style="font-size: 0.8rem; color: var(--muted-foreground);">
                    Did you take the PSAT/NMSQT or PSAT 10? National Merit & College Board Recognition unlock $2,500/yr to Full-Ride university packages!
                  </span>
                </div>
                <span class="tf-badge tf-badge-amber">
                  💰 Up to $140,000+ National Merit Value
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(205px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                ${[
                  { psat: 1490, idx: 224, status: "semifinalist", badge: "🏆 Semifinalist / Finalist", title: "1480–1520 PSAT (222+ Index)", desc: "Unlocks Full-Tuition / $28k/yr National Merit packages" },
                  { psat: 1430, idx: 215, status: "commended", badge: "⭐ Commended / Recognition", title: "1400–1470 PSAT (212–221)", desc: "Unlocks +$2,500–$6,000/yr Honors & Recognition awards" },
                  { psat: 1320, idx: 198, status: "rising", badge: "📈 Rising Merit Track", title: "1250–1390 PSAT (188–211)", desc: "Strong baseline for 1420+ SAT & university merit tiers" },
                  { psat: 0, idx: 0, status: "none", badge: "🌱 No PSAT / Skip", title: "Haven't Taken PSAT Yet", desc: "Evaluate using my GPA, SAT/ACT & ECs only" }
                ].map(p => `
                  <button type="button" class="ob-choice-card ${(curPsat === p.psat || (p.psat === 0 && !curPsat)) ? 'selected' : ''}" style="padding: 0.85rem 1rem;" onclick="Onboarding.setPsatPreset(${p.psat}, ${p.idx}, '${p.status}')">
                    <div>
                      <div class="tf-card-eyebrow">
                        <span class="tf-card-tag">${p.badge}</span>
                      </div>
                      <div class="tf-card-title" style="font-size: 0.95rem;">${p.title}</div>
                      <div class="tf-card-desc">${p.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>

              <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 0.85rem;">
                <div class="form-group">
                  <label for="ob-psat">Your PSAT / NMSQT Total Score <span class="hint">(320–1520)</span></label>
                  <input type="number" min="320" max="1520" step="10" id="ob-psat" class="input-control" value="${curPsat}" placeholder="e.g. 1440" oninput="Onboarding.updatePsatLive(this.value)">
                </div>
                <div class="form-group">
                  <label for="ob-psat-index">NMSC Selection Index <span class="hint">(48–228)</span></label>
                  <input type="number" min="48" max="228" id="ob-psat-index" class="input-control" value="${curPsatIdx}" placeholder="e.g. 216" oninput="Onboarding.wizardData.psat_index = parseInt(this.value, 10) || null">
                </div>
                <div class="form-group">
                  <label>National Merit / College Board Recognition</label>
                  <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; padding-top: 0.25rem;">
                    ${[
                      { k: "semifinalist", lbl: "🏆 NMSF / Finalist" },
                      { k: "commended", lbl: "⭐ Commended / CBRP" },
                      { k: "none", lbl: "Standard" }
                    ].map(st => `
                      <button type="button" class="ob-score-pill ${nmStatus === st.k ? 'active' : ''}" onclick="Onboarding.setNationalMeritStatus('${st.k}')">${st.lbl}</button>
                    `).join('')}
                  </div>
                </div>
              </div>

              <div id="ob-psat-live-banner" class="tf-badge-blue" style="border-radius: var(--radius-md); padding: 0.8rem 1.1rem; font-size: 0.84rem; font-weight: 600; line-height: 1.45; display: block; border: 1px solid rgba(96, 165, 250, 0.35);">
                ${psatBannerMsg}
              </div>
            </div>
          </div>
        `;
        break;
      }

      case 4: {
        const ecTier = this.wizardData.extracurricular_tier || "strong";
        const primaryGoal = this.wizardData.primary_goal || "scholarships";
        const ecDetails = this.wizardData.extracurricular_details || "";
        const goalDetails = this.wizardData.priority_goal_details || "";
        const awardsDetails = this.wizardData.awards_details || "";
        const selectedAwards = Array.isArray(this.wizardData.selected_awards) ? this.wizardData.selected_awards : [];
        const serviceHours = this.wizardData.community_service_hours ?? 100;
        const sciYears = this.wizardData.science_years ?? 4;

        const awardOptions = [
          { id: "National Merit Semifinalist / Commended", badge: "🎓 +$2,500–$28k/yr", title: "National Merit / CBRP Scholar", desc: "NMSF, Finalist, Commended, or College Board National Recognition" },
          { id: "TSA / Robotics / STEM Competition", badge: "🏆 +$2,500–$6k/yr", title: "TSA / DECA / FBLA / HOSA / Robotics", desc: "State or national qualifier/winner in CTSO or engineering events" },
          { id: "AP Scholar / Honor Roll", badge: "📘 +$1,500–$4k/yr", title: "AP Scholar with Distinction / NHS", desc: "AP Scholar, National Honor Society, or Principal's Honor Roll" },
          { id: "Club President / Founder", badge: "👑 +$2,000–$5k/yr", title: "Club President / Founder / Captain", desc: "Elected student org president, nonprofit founder, or varsity captain" },
          { id: "Science Fair / USACO / Research", badge: "🔬 +$3,000–$8k/yr", title: "Olympiad / Science Fair / Research", desc: "ISEF, USACO, AIME, Science Olympiad medalist, or university lab research" },
          { id: "Eagle Scout / Gold Award / Service", badge: "🤝 +$1,500–$4k/yr", title: "100+ Hrs Service / Eagle / Gold Award", desc: "Presidential Volunteer Service Award, Boy/Girl Scout capstone, civic impact" }
        ];

        const ecPrompts = {
          national: {
            label: "✍️ Tell us your State/National Extracurriculars & Exactly What You Did:",
            placeholder: "Example: TSA Webmaster State Finalist (built full-stack web app), USACO Gold Division, Science Olympiad 2nd Place State, or 150+ hrs independent research..."
          },
          strong: {
            label: "✍️ Tell us your Leadership Roles, Clubs & Exactly What You Did:",
            placeholder: "Example: President of Computer Science Club (taught 45 members Python), Varsity Tennis Captain, Robotics Lead Programmer, Eagle Scout project..."
          },
          developing: {
            label: "✍️ Tell us your Clubs, Volunteering & Exactly What You Did:",
            placeholder: "Example: Active member of DECA and Robotics Club, 80 hours tutoring math at local library, part-time barista (12 hrs/wk)..."
          },
          starter: {
            label: "✍️ Tell us your Interests or Activities You've Tried & What You Want to Do:",
            placeholder: "Example: Interested in coding web apps, robotics, business competitions, or pre-med volunteering — looking for top clubs & competitions to join..."
          }
        };

        const goalPrompts = {
          scholarships: {
            label: "🎯 Tell us your Scholarship Target & Exactly What You're Aiming For:",
            placeholder: "Example: Aiming for $15,000–$28,000/yr in automatic merit scholarships at flagship universities to graduate debt-free..."
          },
          flagship: {
            label: "🎯 Tell us which Flagship / Reach Universities & Programs You're Targeting:",
            placeholder: "Example: Targeting UT Austin Computer Science, Georgia Tech, and Texas A&M Engineering — want to maximize my acceptance chances..."
          },
          roadmap: {
            label: "🎯 Tell us what Milestones You Want in Your High School Roadmap:",
            placeholder: "Example: Want a step-by-step plan to reach a 1500+ SAT, win a state TSA/DECA award, and pick the best junior/senior AP classes..."
          },
          credits: {
            label: "🎯 Tell us your AP Credit & Early Graduation Goals:",
            placeholder: "Example: Want to skip freshman Calculus, Physics, and English weed-out classes and save $8,000+ in college tuition..."
          }
        };

        const curEcPrompt = ecPrompts[ecTier] || ecPrompts.strong;
        const curGoalPrompt = goalPrompts[primaryGoal] || goalPrompts.scholarships;

        html = `
          <div class="onboarding-step-body">
            ${stepNavHtml}
            <div class="tf-step-header">
              <h3>4. Activities, #1 Priority Goal & Course Rigor</h3>
              <p>Click your current extracurricular tier and #1 priority below, then type what you did in the text box that appears.</p>
            </div>

            <!-- 1-Click Extracurricular Tier Cards -->
            <div style="margin-bottom: 1.65rem;">
              <label class="tf-section-label">
                Your Extracurricular & Leadership Profile (1-Click):
              </label>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
                ${[
                  { val: "national", badge: "🏆 Tier 1 · National/State", title: "State / National Recognition", desc: "Olympiad, TSA/DECA/HOSA state finalist, published research, or founder" },
                  { val: "strong", badge: "⭐ Tier 2 · School Leader", title: "Club President / Captain", desc: "Student org officer, Varsity captain, Eagle Scout / Gold Award" },
                  { val: "developing", badge: "📈 Tier 3 · Active Member", title: "Club Member & Volunteering", desc: "Consistent club participation, community service, or part-time job" },
                  { val: "starter", badge: "🚀 Tier 4 · Building Now", title: "Need Activity Suggestions", desc: "Have our AI suggest high-impact competitions & projects to start now" }
                ].map(item => `
                  <button type="button" class="ob-choice-card ${ecTier === item.val ? 'selected' : ''}" onclick="Onboarding.selectEcTier('${item.val}')">
                    <div>
                      <div class="tf-card-eyebrow">
                        <span class="tf-card-tag">${item.badge}</span>
                        ${ecTier === item.val ? '<span class="tf-card-check">✓</span>' : ''}
                      </div>
                      <div class="tf-card-title">${item.title}</div>
                      <div class="tf-card-desc">${item.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
              <select id="ob-ec" class="select-control" style="display: none;">
                <option value="national" ${ecTier === 'national' ? 'selected' : ''}>Tier 1</option>
                <option value="strong" ${ecTier === 'strong' ? 'selected' : ''}>Tier 2</option>
                <option value="developing" ${ecTier === 'developing' ? 'selected' : ''}>Tier 3</option>
                <option value="starter" ${ecTier === 'starter' ? 'selected' : ''}>Tier 4</option>
              </select>

              <!-- Dynamic Text Box for Extracurricular Details -->
              <div id="ob-ec-details-box" class="tf-detail-box">
                <div class="tf-detail-box-header">
                  <label for="ob-ec-details" class="tf-detail-box-label">
                    ${curEcPrompt.label}
                  </label>
                  <span class="tf-detail-box-sub">Feeds into AI Acceptance Evaluation</span>
                </div>
                <div class="tf-quick-add-strip">
                  <span class="tf-quick-add-tag">Quick Add:</span>
                  ${[
                    "TSA / Robotics Competition",
                    "DECA / FBLA Officer",
                    "HOSA / Science Olympiad",
                    "Varsity Athletics Captain",
                    "NHS / Student Council",
                    "100+ Hrs Volunteering",
                    "Independent Coding / App Project",
                    "Part-Time Job / Internship"
                  ].map(tag => `
                    <button type="button" class="ob-score-pill" onclick="Onboarding.appendEcDetail('${tag}')">+ ${tag}</button>
                  `).join('')}
                </div>
                <textarea id="ob-ec-details" class="textarea-control tf-textarea" rows="3" style="width: 100%; min-height: 82px;" placeholder="${curEcPrompt.placeholder}" oninput="Onboarding.wizardData.extracurricular_details = this.value">${ecDetails}</textarea>
              </div>
            </div>

            <!-- Interactive Awards, Honors & Scholarship Boosters (Calculates College Dollar Value) -->
            <div class="tf-bento-card" style="margin-bottom: 1.65rem; padding: 1.35rem 1.45rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.85rem;">
                <div>
                  <label class="tf-section-label" style="color: #FDE68A; margin: 0;">
                    🏅 Your Awards, Honors & Competitions (Tap All That Apply — Boosts College Scholarship $)
                  </label>
                  <span style="font-size: 0.8rem; color: var(--muted-foreground);">
                    Universities award $1,500–$8,500+/yr in extra leadership, departmental, and honors scholarships based on your awards and service hours.
                  </span>
                </div>
                <span class="tf-badge tf-badge-emerald">
                  ${selectedAwards.length} Award Categories Selected
                </span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(235px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
                ${awardOptions.map(aw => {
                  const isAwSelected = selectedAwards.includes(aw.id);
                  return `
                    <button type="button" class="ob-choice-card ${isAwSelected ? 'selected' : ''}" style="padding: 0.85rem 1rem;" onclick="Onboarding.toggleAwardCard('${aw.id.replace(/'/g, "\\'")}')">
                      <div>
                        <div class="tf-card-eyebrow">
                          <span style="font-size: 0.72rem; font-weight: 800; color: #FCD34D;">${aw.badge}</span>
                          <span style="font-size: 0.78rem; font-weight: 800; color: ${isAwSelected ? '#34D399' : 'var(--muted-foreground)'};">${isAwSelected ? '✓ Added' : '+ Tap'}</span>
                        </div>
                        <div class="tf-card-title" style="font-size: 0.95rem;">${aw.title}</div>
                        <div class="tf-card-desc">${aw.desc}</div>
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>

              <div style="display: grid; grid-template-columns: 1.6fr 0.8fr; gap: 1rem; align-items: start;">
                <div>
                  <label for="ob-awards-details" class="tf-section-label" style="color: #FDE68A; margin-bottom: 0.4rem;">
                    🏆 List Your Specific Awards, Placements & Honors:
                  </label>
                  <div class="tf-quick-add-strip">
                    ${[
                      "TSA State Finalist",
                      "AP Scholar with Distinction",
                      "National Merit Commended",
                      "DECA / FBLA State Winner",
                      "Varsity Scholar-Athlete",
                      "Science Olympiad Medalist"
                    ].map(tag => `
                      <button type="button" class="ob-score-pill" onclick="Onboarding.appendAwardDetail('${tag}')">+ ${tag}</button>
                    `).join('')}
                  </div>
                  <textarea id="ob-awards-details" class="textarea-control tf-textarea" rows="2" style="width: 100%; min-height: 68px;" placeholder="e.g. 1st Place TSA Webmaster Regional, AP Scholar with Distinction, National Merit Commended, NHS Vice President..." oninput="Onboarding.wizardData.awards_details = this.value">${awardsDetails}</textarea>
                </div>

                <div style="background: rgba(9, 14, 26, 0.75); border: 1px solid rgba(148, 163, 184, 0.2); border-radius: var(--radius-md); padding: 0.95rem 1.1rem;">
                  <label for="ob-service-hours" class="tf-section-label" style="color: #93C5FD; margin-bottom: 0.35rem;">
                    🤝 Community Service Hours
                  </label>
                  <input type="number" min="0" max="2000" step="10" id="ob-service-hours" class="input-control tf-input" value="${serviceHours}" style="margin-bottom: 0.6rem;" oninput="Onboarding.wizardData.community_service_hours = parseInt(this.value, 10) || 0">
                  <div class="tf-quick-add-strip">
                    ${[50, 100, 150, 250].map(hrs => `
                      <button type="button" class="ob-score-pill ${serviceHours === hrs ? 'active' : ''}" onclick="Onboarding.setServiceHours(${hrs})">${hrs}+ hrs</button>
                    `).join('')}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--muted-foreground); margin-top: 0.45rem;">
                    100+ hrs unlocks Bright Futures & university service scholarships.
                  </div>
                </div>
              </div>
            </div>

            <!-- 1-Click Primary Goal Cards -->
            <div style="margin-bottom: 1.65rem;">
              <label class="tf-section-label">
                What is your #1 Priority right now? (1-Click):
              </label>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
                ${[
                  { val: "scholarships", icon: "💰", title: "Maximize Merit Scholarships", desc: "Find $5k–$28k/yr automatic GPA & SAT awards" },
                  { val: "flagship", icon: "🏛️", title: "Get Into Flagship & Reach Schools", desc: "Clear score cutoffs & statutory auto-admit" },
                  { val: "roadmap", icon: "🗺️", title: "Build My High School Roadmap", desc: "Step-by-step courses, clubs & test timeline" },
                  { val: "credits", icon: "🎓", title: "Save Tuition With AP Credits", desc: "Skip freshman weed-out classes & save cash" }
                ].map(item => `
                  <button type="button" class="ob-choice-card ${primaryGoal === item.val ? 'selected' : ''}" onclick="Onboarding.selectPrimaryGoal('${item.val}')">
                    <div>
                      <div class="tf-card-eyebrow">
                        <span style="font-size: 1.35rem;">${item.icon}</span>
                        ${primaryGoal === item.val ? '<span class="tf-card-check">✓ Selected</span>' : ''}
                      </div>
                      <div class="tf-card-title" style="margin-top: 0.35rem;">${item.title}</div>
                      <div class="tf-card-desc">${item.desc}</div>
                    </div>
                  </button>
                `).join('')}
              </div>
              <select id="ob-goal" class="select-control" style="display: none;">
                <option value="scholarships" ${primaryGoal === 'scholarships' ? 'selected' : ''}>Scholarships</option>
                <option value="flagship" ${primaryGoal === 'flagship' ? 'selected' : ''}>Flagship</option>
                <option value="roadmap" ${primaryGoal === 'roadmap' ? 'selected' : ''}>Roadmap</option>
                <option value="credits" ${primaryGoal === 'credits' ? 'selected' : ''}>Credits</option>
              </select>

              <!-- Dynamic Text Box for Priority Goal Details -->
              <div id="ob-goal-details-box" class="tf-detail-box" style="border-color: rgba(52, 211, 153, 0.42);">
                <div class="tf-detail-box-header">
                  <label for="ob-goal-details" class="tf-detail-box-label" style="color: #6EE7B7;">
                    ${curGoalPrompt.label}
                  </label>
                  <span class="tf-detail-box-sub" style="color: #93C5FD;">Tailors Your AI Strategy</span>
                </div>
                <div class="tf-quick-add-strip">
                  <span class="tf-quick-add-tag">Quick Add:</span>
                  ${[
                    "Win $15k–$28k/yr Merit Scholarship",
                    "Qualify for Top 5% / Top 10% Auto-Admit",
                    "Get Into Top CS / Engineering Program",
                    "Boost SAT Score by +80 Points",
                    "Waive Freshman Calculus & Lab Sciences"
                  ].map(tag => `
                    <button type="button" class="ob-score-pill" onclick="Onboarding.appendGoalDetail('${tag}')">+ ${tag}</button>
                  `).join('')}
                </div>
                <textarea id="ob-goal-details" class="textarea-control tf-textarea" rows="2" style="width: 100%; min-height: 74px;" placeholder="${curGoalPrompt.placeholder}" oninput="Onboarding.wizardData.priority_goal_details = this.value">${goalDetails}</textarea>
              </div>
            </div>

            <!-- High School Course Rigor Checklist -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.65rem; flex-wrap: wrap; gap: 0.5rem;">
              <label class="tf-section-label" style="margin: 0;">High School Core Coursework Check:</label>
              <button type="button" class="ob-score-pill" onclick="Onboarding.checkAllCoursework()">✓ Check All Core Prerequisites</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 0.75rem;">
              <label class="checkbox-group" style="padding: 0.95rem 1.1rem; border-radius: var(--radius-md); cursor: pointer;">
                <input type="checkbox" id="ob-alg2" style="width: 20px; height: 20px;" ${this.wizardData.math_years_algebra2 ? 'checked' : ''}>
                <div class="checkbox-label">
                  <strong style="font-size: 0.94rem;">Algebra II & 4 Years of Math</strong>
                  <span class="checkbox-sub">Required across all 50 states for auto-admit & STEM degrees.</span>
                </div>
              </label>

              <label class="checkbox-group" style="padding: 0.95rem 1.1rem; border-radius: var(--radius-md); cursor: pointer;">
                <input type="checkbox" id="ob-end" style="width: 20px; height: 20px;" ${this.wizardData.has_endorsement ? 'checked' : ''}>
                <div class="checkbox-label">
                  <strong style="font-size: 0.94rem;">Distinguished Endorsement & 2+ Yrs World Language</strong>
                  <span class="checkbox-sub">Unlocks Texas Top 10% / Top 5% & flagship eligibility.</span>
                </div>
              </label>

              <label class="checkbox-group" style="padding: 0.95rem 1.1rem; border-radius: var(--radius-md); cursor: pointer;">
                <input type="checkbox" id="ob-fl" style="width: 20px; height: 20px;" ${this.wizardData.fl_prep_complete ? 'checked' : ''}>
                <div class="checkbox-label">
                  <strong style="font-size: 0.94rem;">Honors / AP / IB College-Prep Track</strong>
                  <span class="checkbox-sub">Taking advanced, dual-enrollment, AP, or IB coursework.</span>
                </div>
              </label>

              <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.95rem 1.1rem; display: flex; flex-direction: column; justify-content: center; gap: 0.45rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <label for="ob-sci" style="font-size: 0.92rem; font-weight: 700; color: #FFFFFF; margin: 0;">Lab Science Years (Bio, Chem, Physics)</label>
                  <input type="number" min="0" max="6" id="ob-sci" class="input-control tf-input" style="width: 72px; min-height: 36px; padding: 0.3rem 0.5rem; text-align: center;" value="${sciYears}">
                </div>
                <div class="tf-quick-add-strip" style="margin: 0;">
                  ${[2, 3, 4, 5].map(yr => `
                    <button type="button" class="ob-score-pill ${sciYears === yr ? 'active' : ''}" onclick="Onboarding.setScienceYears(${yr})">${yr} Years</button>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
        break;
      }

      case 5: {
        const currentExams = this.wizardData.ap_exams || [];
        const savedColleges = this.wizardData.saved_colleges || [];
        const collegesList = CollegesEngine.getAll();
        const availableExamOptions = CreditsEngine.AVAILABLE_EXAMS;
        const searchQ = (this.collegeSearchQuery || "").toLowerCase().trim();
        const filteredColleges = searchQ
          ? collegesList.filter(c => c.name.toLowerCase().includes(searchQ) || c.short_name.toLowerCase().includes(searchQ) || c.state.toLowerCase().includes(searchQ))
          : collegesList;

        html = `
          <div class="onboarding-step-body">
            ${stepNavHtml}
            <div class="tf-step-header">
              <h3>5. Click Your AP Exams & Target Universities</h3>
              <p>Just tap any AP exam or university card below to toggle it on/off — or use our 1-click Smart Bundles!</p>
            </div>

            <!-- AP EXAMS 1-CLICK INTERACTIVE GRID -->
            <div class="tf-bento-card" style="padding: 1.35rem 1.45rem; margin-bottom: 1.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
                <div>
                  <h4 style="font-size: 1.12rem; font-weight: 800; color: #FFFFFF; margin: 0;">
                    🎓 Your AP Exams <span style="color: #60A5FA;">(${currentExams.length} selected)</span>
                  </h4>
                  <span style="font-size: 0.82rem; color: var(--muted-foreground);">Tap any exam card to add/remove it, and tap <strong>5 / 4 / 3 / Planned</strong> to set your score.</span>
                </div>
                <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
                  <button type="button" class="btn-primary" style="font-size: 0.78rem; padding: 0.45rem 0.85rem;" onclick="Onboarding.addMajorRecommendedAps()">
                    ✨ Auto-Add Best APs for ${this.wizardData.intended_major || 'My Major'}
                  </button>
                  <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.8rem;" onclick="Onboarding.addApBundle('core')">
                    + Core Starter Pack
                  </button>
                  <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.8rem;" onclick="Onboarding.addApBundle('stem')">
                    + STEM & CS Pack
                  </button>
                  ${currentExams.length > 0 ? `
                    <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.75rem; color: #FCA5A5;" onclick="Onboarding.clearAllExams()">
                      Clear APs
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- 1-Click AP Cards Grid -->
              <div id="ob-exam-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(265px, 1fr)); gap: 0.75rem;">
                ${availableExamOptions.map(ae => {
                  const existingIdx = currentExams.findIndex(e => e.id === ae.id);
                  const existing = existingIdx > -1 ? currentExams[existingIdx] : null;
                  const isSelected = !!existing;
                  const curScore = existing ? (existing.status === 'planned' ? 0 : existing.score) : 5;
                  return `
                    <div class="ob-choice-card ${isSelected ? 'selected' : ''}" style="padding: 0.9rem 1rem;" onclick="Onboarding.toggleExamCard('${ae.id}', '${ae.name.replace(/'/g, "\\'")}', event)">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                        <div>
                          <div class="tf-card-title" style="font-size: 0.95rem;">${ae.name}</div>
                          <div style="font-size: 0.75rem; color: ${isSelected ? '#34D399' : 'var(--muted-foreground)'}; margin-top: 0.15rem; font-weight: 600;">
                            ${isSelected ? (existing.status === 'planned' ? '✓ Added · Planned Exam' : `✓ Added · Score: ${existing.score}`) : 'Click card to add exam'}
                          </div>
                        </div>
                        <div style="width: 24px; height: 24px; border-radius: 6px; background: ${isSelected ? '#2563EB' : 'rgba(255,255,255,0.06)'}; border: 1px solid ${isSelected ? '#60A5FA' : 'var(--border-subtle)'}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; flex-shrink: 0;">
                          ${isSelected ? '✓' : '+'}
                        </div>
                      </div>
                      ${isSelected ? `
                        <div class="tf-quick-add-strip" style="margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.08); margin-bottom: 0;" onclick="event.stopPropagation();">
                          <span class="tf-quick-add-tag" style="color: #93C5FD;">Score:</span>
                          ${[5, 4, 3, 0].map(sc => `
                            <button type="button" class="ob-score-pill ${curScore === sc ? 'active' : ''}" style="padding: 0.22rem 0.55rem; font-size: 0.72rem;" onclick="Onboarding.setExamScoreInline('${ae.id}', ${sc})">
                              ${sc === 0 ? 'Planned' : sc}
                            </button>
                          `).join('')}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Hidden/Fallback Select Controls for Automated Compatibility -->
              <div style="display: none;">
                <select id="ob-exam-select">
                  ${availableExamOptions.map(ae => `<option value="${ae.id}|${ae.name}">${ae.name}</option>`).join('')}
                </select>
                <select id="ob-exam-score-select">
                  <option value="5">Score: 5</option>
                  <option value="4" selected>Score: 4</option>
                  <option value="3">Score: 3</option>
                  <option value="0">Planned</option>
                </select>
              </div>
            </div>

            <!-- TARGET UNIVERSITIES 1-CLICK INTERACTIVE GRID -->
            <div class="tf-bento-card" style="padding: 1.35rem 1.45rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
                <div>
                  <h4 style="font-size: 1.12rem; font-weight: 800; color: #FFFFFF; margin: 0;">
                    🏛️ Target Universities to Analyze <span style="color: #34D399;">(${savedColleges.length} selected)</span>
                  </h4>
                  <span style="font-size: 0.82rem; color: var(--muted-foreground);">Tap any university card below to add or remove it from your AI Breakdown.</span>
                </div>
                <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
                  <button type="button" class="btn-primary" style="font-size: 0.78rem; padding: 0.45rem 0.85rem;" onclick="Onboarding.addCollegeBundle('smart')">
                    ✨ Auto-Pick Best Matches for My Stats
                  </button>
                  <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.8rem;" onclick="Onboarding.addCollegeBundle('tx')">
                    + Texas Schools
                  </button>
                  <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.8rem;" onclick="Onboarding.addCollegeBundle('public')">
                    + Top Public Flagships
                  </button>
                  <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.8rem;" onclick="Onboarding.addCollegeBundle('stem')">
                    + Top CS & Engineering
                  </button>
                  ${savedColleges.length > 0 ? `
                    <button type="button" class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.75rem; color: #FCA5A5;" onclick="Onboarding.addCollegeBundle('clear')">
                      Clear
                    </button>
                  ` : ''}
                </div>
              </div>

              <!-- Quick Filter Input -->
              <div style="margin-bottom: 1rem;">
                <input type="text" id="ob-college-search" class="input-control tf-input" value="${this.collegeSearchQuery || ''}" placeholder="🔍 Quick filter universities by name or state (e.g. Texas, California, MIT, Florida)..." oninput="Onboarding.filterCollegesGrid(this.value)">
              </div>

              <!-- Spacious 3-Column Clickable College Cards -->
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; max-height: 440px; overflow-y: auto; padding: 0.25rem;">
                ${filteredColleges.map(c => {
                  const isChecked = savedColleges.includes(c.id);
                  const colStatus = (this.wizardData.college_statuses && this.wizardData.college_statuses[c.id]) || "working";
                  return `
                    <div class="ob-choice-card ${isChecked ? 'selected' : ''}" style="padding: 0.9rem 1rem;" onclick="Onboarding.toggleCollege('${c.id}')">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; width: 100%;">
                        <div>
                          <div class="tf-card-title" style="font-size: 0.96rem;">${c.short_name}</div>
                          <div class="tf-card-desc" style="font-size: 0.74rem; margin-top: 0.1rem;">${c.name}</div>
                        </div>
                        <span class="tf-badge ${isChecked ? 'tf-badge-blue' : ''}" style="flex-shrink: 0;">
                          ${isChecked ? '✓ Selected' : c.state}
                        </span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 0.74rem; color: #93C5FD; margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid rgba(255,255,255,0.06);">
                        <span>SAT: ${c.sat_total_25}–${c.sat_total_75}</span>
                        <span>Admit: ${(c.admit_rate * 100).toFixed(0)}%</span>
                      </div>
                      ${isChecked ? `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.35rem; margin-top: 0.55rem; padding-top: 0.55rem; border-top: 1px solid rgba(255,255,255,0.1); width: 100%;" onclick="event.stopPropagation();">
                          <span style="font-size: 0.7rem; color: #E2E8F0; font-weight: 700;">Status:</span>
                          <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                            <button type="button" class="ob-score-pill ${colStatus === 'working' ? 'active' : ''}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" onclick="Onboarding.setCollegeAppStatus('${c.id}', 'working', event)">
                              🛠️ Working On It
                            </button>
                            <button type="button" class="ob-score-pill ${colStatus === 'submitted' ? 'active' : ''}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem; ${colStatus === 'submitted' ? 'background:#059669;border-color:#34D399;' : ''}" onclick="Onboarding.setCollegeAppStatus('${c.id}', 'submitted', event)">
                              ✅ Submitted
                            </button>
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
        break;
      }
    }

    container.innerHTML = html;
  },

  selectGradeTrack(grade) {
    this.harvestCurrentStepData();
    this.wizardData.grade_level = grade;
    this.renderStep(1);
    const gradeEl = document.getElementById("ob-grade");
    if (gradeEl) gradeEl.value = String(grade);
  },

  selectMajor(major) {
    this.harvestCurrentStepData();
    this.wizardData.intended_major = major;
    this.renderStep(1);
    const majorEl = document.getElementById("ob-major");
    if (majorEl) majorEl.value = major;
  },

  selectResidency(stateCode) {
    this.harvestCurrentStepData();
    this.wizardData.residency = stateCode;
    this.renderStep(1);
    const resEl = document.getElementById("ob-residency");
    if (resEl) resEl.value = stateCode;
  },

  selectEcTier(tier) {
    this.harvestCurrentStepData();
    this.wizardData.extracurricular_tier = tier;
    this.renderStep(4);
    const ecEl = document.getElementById("ob-ec");
    if (ecEl) ecEl.value = tier;
    const ecBox = document.getElementById("ob-ec-details");
    if (ecBox && ecBox.focus) ecBox.focus();
  },

  appendEcDetail(tag) {
    this.harvestCurrentStepData();
    const cur = (this.wizardData.extracurricular_details || "").trim();
    if (!cur.toLowerCase().includes(tag.toLowerCase())) {
      this.wizardData.extracurricular_details = cur ? `${cur}, ${tag}` : tag;
    }
    this.renderStep(4);
    const ecBox = document.getElementById("ob-ec-details");
    if (ecBox) {
      ecBox.value = this.wizardData.extracurricular_details;
      if (ecBox.focus) ecBox.focus();
    }
  },

  selectPrimaryGoal(goal) {
    this.harvestCurrentStepData();
    this.wizardData.primary_goal = goal;
    this.renderStep(4);
    const goalEl = document.getElementById("ob-goal");
    if (goalEl) goalEl.value = goal;
    const goalBox = document.getElementById("ob-goal-details");
    if (goalBox) {
      goalBox.value = this.wizardData.priority_goal_details || "";
      if (goalBox.focus) goalBox.focus();
    }
  },

  appendGoalDetail(tag) {
    this.harvestCurrentStepData();
    const cur = (this.wizardData.priority_goal_details || "").trim();
    if (!cur.toLowerCase().includes(tag.toLowerCase())) {
      this.wizardData.priority_goal_details = cur ? `${cur}, ${tag}` : tag;
    }
    this.renderStep(4);
    const goalBox = document.getElementById("ob-goal-details");
    if (goalBox) {
      goalBox.value = this.wizardData.priority_goal_details;
      if (goalBox.focus) goalBox.focus();
    }
  },

  setScienceYears(yrs) {
    this.harvestCurrentStepData();
    this.wizardData.science_years = yrs;
    this.renderStep(4);
    const sciEl = document.getElementById("ob-sci");
    if (sciEl) sciEl.value = yrs;
  },

  setPsatPreset(psatScore, psatIdx, status) {
    this.harvestCurrentStepData();
    this.wizardData.psat_score = psatScore > 0 ? psatScore : null;
    this.wizardData.psat_index = psatIdx > 0 ? psatIdx : null;
    this.wizardData.national_merit_status = status || "none";
    if (status === "semifinalist" || status === "commended") {
      if (!Array.isArray(this.wizardData.selected_awards)) this.wizardData.selected_awards = [];
      if (!this.wizardData.selected_awards.includes("National Merit Semifinalist / Commended")) {
        this.wizardData.selected_awards.push("National Merit Semifinalist / Commended");
      }
    }
    this.renderStep(3);
    const psatEl = document.getElementById("ob-psat");
    const psatIdxEl = document.getElementById("ob-psat-index");
    if (psatEl) psatEl.value = psatScore > 0 ? psatScore : "";
    if (psatIdxEl) psatIdxEl.value = psatIdx > 0 ? psatIdx : "";
  },

  updatePsatLive(val) {
    const score = parseInt(val, 10) || 0;
    this.wizardData.psat_score = score > 0 ? score : null;
    const idx = score > 0 ? Math.min(228, Math.round(score * 0.15)) : null;
    this.wizardData.psat_index = idx;
    if (score >= 1470) this.wizardData.national_merit_status = "semifinalist";
    else if (score >= 1400) this.wizardData.national_merit_status = "commended";
    const idxEl = document.getElementById("ob-psat-index");
    if (idxEl) idxEl.value = idx || "";
    const banner = document.getElementById("ob-psat-live-banner");
    if (banner) {
      banner.innerText = score >= 1470
        ? `🏆 ${score} PSAT (${idx} Selection Index): National Merit Semifinalist/Finalist Track — Unlocks $10,000/yr to Full-Ride ($112,000–$140,000+) packages at Alabama, Texas A&M, UF, UT Dallas, Purdue & Oklahoma!`
        : score >= 1400
          ? `⭐ ${score} PSAT (${idx} Selection Index): National Merit Commended / Recognition Track — Unlocks +$2,000–$6,000/yr Honors & National Recognition scholarships!`
          : score >= 1200
            ? `📈 ${score} PSAT (${idx} Selection Index): Strong Honors Baseline — Projects to a ${Math.min(1600, score + 90)}+ SAT with targeted prep!`
            : `Tap a PSAT preset or enter your PSAT / NMSQT score to calculate National Merit & Recognition scholarships.`;
    }
  },

  setNationalMeritStatus(status) {
    this.harvestCurrentStepData();
    this.wizardData.national_merit_status = status;
    this.renderStep(3);
  },

  toggleAwardCard(awardId) {
    this.harvestCurrentStepData();
    if (!Array.isArray(this.wizardData.selected_awards)) this.wizardData.selected_awards = [];
    const idx = this.wizardData.selected_awards.indexOf(awardId);
    if (idx > -1) {
      this.wizardData.selected_awards.splice(idx, 1);
    } else {
      this.wizardData.selected_awards.push(awardId);
    }
    this.renderStep(4);
  },

  appendAwardDetail(tag) {
    this.harvestCurrentStepData();
    const cur = (this.wizardData.awards_details || "").trim();
    if (!cur.toLowerCase().includes(tag.toLowerCase())) {
      this.wizardData.awards_details = cur ? `${cur}, ${tag}` : tag;
    }
    this.renderStep(4);
    const awBox = document.getElementById("ob-awards-details");
    if (awBox) {
      awBox.value = this.wizardData.awards_details;
      if (awBox.focus) awBox.focus();
    }
  },

  setServiceHours(hrs) {
    this.harvestCurrentStepData();
    this.wizardData.community_service_hours = hrs;
    this.renderStep(4);
    const sEl = document.getElementById("ob-service-hours");
    if (sEl) sEl.value = hrs;
  },

  setCollegeAppStatus(collegeId, status, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (!this.wizardData.college_statuses) this.wizardData.college_statuses = {};
    this.wizardData.college_statuses[collegeId] = status;
    this.renderStep(5);
  },

  checkAllCoursework() {
    this.harvestCurrentStepData();
    this.wizardData.math_years_algebra2 = true;
    this.wizardData.has_endorsement = true;
    this.wizardData.fl_prep_complete = true;
    this.wizardData.science_years = 4;
    this.renderStep(4);
    App.showToast("All core college-prep prerequisites checked!", "success");
  },

  setGpaPreset(uw, w, rank, size) {
    this.wizardData.gpa_unweighted = uw;
    this.wizardData.gpa_weighted = w;
    this.wizardData.class_rank = rank;
    this.wizardData.class_size = size;
    this.renderStep(2);
    const uwEl = document.getElementById("ob-gpa-uw");
    const wEl = document.getElementById("ob-gpa-w");
    const rankEl = document.getElementById("ob-rank");
    const sizeEl = document.getElementById("ob-size");
    if (uwEl) uwEl.value = uw;
    if (wEl) wEl.value = w;
    if (rankEl) rankEl.value = rank;
    if (sizeEl) sizeEl.value = size;
    this.updatePercentileLive();
  },

  setScorePreset(rw, m, act) {
    this.wizardData.no_test_checked = false;
    this.wizardData.sat_rw = rw;
    this.wizardData.sat_m = m;
    this.wizardData.act_composite = act;
    this.renderStep(3);
    const noTestEl = document.getElementById("ob-no-test");
    const rwEl = document.getElementById("ob-sat-rw");
    const mEl = document.getElementById("ob-sat-m");
    const actEl = document.getElementById("ob-act");
    if (noTestEl) noTestEl.checked = false;
    if (rwEl) { rwEl.value = rw; rwEl.disabled = false; }
    if (mEl) { mEl.value = m; mEl.disabled = false; }
    if (actEl) { actEl.value = act; actEl.disabled = false; }
    this.updateSatTotalLive();
  },

  toggleTestInputs(isNoTest) {
    this.wizardData.no_test_checked = isNoTest;
    const fields = document.getElementById("ob-test-fields");
    if (fields) fields.style.opacity = isNoTest ? "0.4" : "1";
    ["ob-sat-rw", "ob-sat-m", "ob-act"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.disabled = isNoTest;
    });
    this.renderStep(3);
  },

  updatePercentileLive() {
    const rank = parseInt(document.getElementById("ob-rank").value, 10);
    const size = parseInt(document.getElementById("ob-size").value, 10);
    const label = document.getElementById("ob-percentile-live");
    if (label) {
      if (rank && size && size > 0) {
        label.innerText = `Top ${((rank / size) * 100).toFixed(1)}%`;
      } else {
        label.innerText = "Enter rank & size above";
      }
    }
  },

  updateSatTotalLive() {
    const rw = parseInt(document.getElementById("ob-sat-rw").value, 10) || 0;
    const m = parseInt(document.getElementById("ob-sat-m").value, 10) || 0;
    const label = document.getElementById("ob-sat-total-live");
    if (label) {
      label.innerText = (rw + m > 0) ? (rw + m) : "N/A";
    }
  },

  toggleExamCard(id, name, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (!this.wizardData.ap_exams) this.wizardData.ap_exams = [];
    const idx = this.wizardData.ap_exams.findIndex(e => e.id === id);
    if (idx > -1) {
      this.wizardData.ap_exams.splice(idx, 1);
    } else {
      const isPlanned = (this.wizardData.grade_level || 12) < 11;
      this.wizardData.ap_exams.push({
        id,
        name,
        score: isPlanned ? 0 : 5,
        status: isPlanned ? "planned" : "completed"
      });
    }
    this.renderStep(5);
  },

  setExamScoreInline(id, scoreVal) {
    if (!this.wizardData.ap_exams) return;
    const exam = this.wizardData.ap_exams.find(e => e.id === id);
    if (exam) {
      exam.score = scoreVal === 0 ? 0 : scoreVal;
      exam.status = scoreVal === 0 ? "planned" : "completed";
      this.renderStep(5);
    }
  },

  addMajorRecommendedAps() {
    const major = this.wizardData.intended_major || "STEM & Engineering";
    const map = {
      "STEM & Engineering": ["calc_bc", "phys_c_mech", "chem", "eng_lang"],
      "Computer Science & Data": ["csa", "calc_bc", "stats", "phys_c_mech"],
      "Business, Finance & Economics": ["stats", "calc_ab", "eng_lang", "ushist"],
      "Pre-Med, Biology & Health": ["bio", "chem", "stats", "psych"],
      "Humanities, Law & Social Sciences": ["eng_lang", "eng_lit", "ushist", "psych"],
      "Undecided / Exploring": ["eng_lang", "calc_ab", "ushist", "stats"]
    };
    this.addExamIdsList(map[major] || map["STEM & Engineering"]);
    App.showToast(`Added top recommended AP exams for ${major}!`, "success");
  },

  addApBundle(bundleType) {
    const ids = bundleType === "stem"
      ? ["calc_bc", "csa", "phys_c_mech", "chem"]
      : ["eng_lang", "ushist", "calc_ab"];
    this.addExamIdsList(ids);
    App.showToast("AP Bundle added! Tap any score pill to adjust your score.", "success");
  },

  addExamIdsList(ids) {
    if (!this.wizardData.ap_exams) this.wizardData.ap_exams = [];
    const catalog = CreditsEngine.AVAILABLE_EXAMS || [];
    ids.forEach(id => {
      if (!this.wizardData.ap_exams.some(e => e.id === id)) {
        const found = catalog.find(a => a.id === id);
        if (found) {
          this.wizardData.ap_exams.push({
            id: found.id,
            name: found.name,
            score: 5,
            status: "completed"
          });
        }
      }
    });
    this.renderStep(5);
  },

  clearAllExams() {
    this.wizardData.ap_exams = [];
    this.renderStep(5);
  },

  addExam() {
    const select = document.getElementById("ob-exam-select");
    const scoreSelect = document.getElementById("ob-exam-score-select");
    if (!select || !scoreSelect) return;

    const [id, name] = select.value.split("|");
    const scoreVal = parseInt(scoreSelect.value, 10);

    if (!this.wizardData.ap_exams) this.wizardData.ap_exams = [];

    if (this.wizardData.ap_exams.some(e => e.id === id)) {
      App.showToast("This exam is already added.", "warning");
      return;
    }

    this.wizardData.ap_exams.push({
      id: id,
      name: name,
      score: scoreVal === 0 ? 0 : scoreVal,
      status: scoreVal === 0 ? "planned" : "completed"
    });

    this.renderStep(5);
  },

  removeExam(idx) {
    if (this.wizardData.ap_exams) {
      this.wizardData.ap_exams.splice(idx, 1);
      this.renderStep(5);
    }
  },

  toggleCollege(collegeId) {
    if (!this.wizardData.saved_colleges) this.wizardData.saved_colleges = [];
    if (!this.wizardData.college_statuses) this.wizardData.college_statuses = {};
    const idx = this.wizardData.saved_colleges.indexOf(collegeId);
    if (idx > -1) {
      this.wizardData.saved_colleges.splice(idx, 1);
    } else {
      this.wizardData.saved_colleges.push(collegeId);
      if (!this.wizardData.college_statuses[collegeId]) {
        this.wizardData.college_statuses[collegeId] = "working";
      }
    }
    this.renderStep(5);
  },

  addCollegeBundle(bundleType) {
    const all = CollegesEngine.getAll();
    if (!this.wizardData.college_statuses) this.wizardData.college_statuses = {};
    if (bundleType === "clear") {
      this.wizardData.saved_colleges = [];
      this.renderStep(5);
      return;
    }
    let ids = [];
    if (bundleType === "tx") {
      ids = all.filter(c => c.state === "TX").map(c => c.id);
    } else if (bundleType === "public") {
      ids = ["ut-austin", "tamu", "uf", "gatech", "umich", "uc-berkeley", "ucla", "unc", "uva", "uw"];
    } else if (bundleType === "stem") {
      ids = ["ut-austin", "gatech", "purdue", "uiuc", "uc-berkeley", "umich", "mit", "cmu"];
    } else if (bundleType === "smart") {
      const sat = (this.wizardData.sat_rw && this.wizardData.sat_m) ? (this.wizardData.sat_rw + this.wizardData.sat_m) : 1410;
      ids = all
        .filter(c => sat >= c.sat_total_25 - 70 && sat <= c.sat_total_75 + 100)
        .slice(0, 6)
        .map(c => c.id);
      if (ids.length < 3) ids = ["ut-austin", "tamu", "uf", "purdue", "gatech"];
    }
    const set = new Set([...(this.wizardData.saved_colleges || []), ...ids]);
    this.wizardData.saved_colleges = Array.from(set);
    this.wizardData.saved_colleges.forEach(cid => {
      if (!this.wizardData.college_statuses[cid]) this.wizardData.college_statuses[cid] = "working";
    });
    this.renderStep(5);
    App.showToast(`Updated target college list (${this.wizardData.saved_colleges.length} selected)!`, "success");
  },

  filterCollegesGrid(query) {
    this.collegeSearchQuery = query || "";
    this.renderStep(5);
    const input = document.getElementById("ob-college-search");
    if (input && input.focus) {
      input.focus();
      if (input.setSelectionRange) {
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    }
  },

  finish() {
    this.harvestCurrentStepData();
    Auth.updateCurrentUserProfile(this.wizardData, true);
    ProfileManager.save(this.wizardData);

    this.close();
    App.activeTab = "ai";
    App.updateAppView();
    App.switchTab("ai");
    App.showToast("Profile updated! Here is your updated breakdown and scholarship plan.", "success");
  }
};
