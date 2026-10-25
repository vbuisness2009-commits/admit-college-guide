/**
 * Interactive Onboarding Wizard for Admit
 * Guides new students through a clean 5-step stats input experience.
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
      if (!this.wizardData.extracurricular_tier) this.wizardData.extracurricular_tier = "School Club Officer / Varsity / Research";
      if (!this.wizardData.primary_goal) this.wizardData.primary_goal = "Maximize Merit Scholarships ($5k–$28k/yr)";
    } else {
      this.wizardData = {
        name: user ? user.name : "",
        grade_level: defaultGrade,
        residency: "TX",
        high_school: "",
        intended_major: "STEM & Engineering",
        extracurricular_tier: "School Club Officer / Varsity / Research",
        primary_goal: defaultGrade >= 12 ? "Maximize Merit Scholarships ($5k–$28k/yr)" : "Build My 4-Year High School Game Plan",
        gpa_unweighted: 3.85,
        gpa_weighted: 4.3,
        class_rank: 28,
        class_size: 520,
        class_percentile: 5.4,
        sat_rw: 690,
        sat_m: 730,
        sat_total: 1420,
        act_composite: 31,
        math_years_algebra2: true,
        science_years: 4,
        has_endorsement: true,
        fl_prep_complete: true,
        saved_colleges: ["ut-austin", "tamu", "uf", "uga", "purdue"],
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
        break;
      }
      case 4: {
        const alg2 = document.getElementById("ob-alg2");
        const sci = document.getElementById("ob-sci");
        const end = document.getElementById("ob-end");
        const fl = document.getElementById("ob-fl");
        const ec = document.getElementById("ob-ec");
        const goal = document.getElementById("ob-goal");
        if (alg2) this.wizardData.math_years_algebra2 = alg2.checked;
        if (sci) {
          const parsedSci = parseInt(sci.value, 10);
          this.wizardData.science_years = Number.isNaN(parsedSci) ? 4 : parsedSci;
        }
        if (end) this.wizardData.has_endorsement = end.checked;
        if (fl) this.wizardData.fl_prep_complete = fl.checked;
        if (ec && ec.value) this.wizardData.extracurricular_tier = ec.value;
        if (goal && goal.value) this.wizardData.primary_goal = goal.value;
        break;
      }
    }
  },

  renderStep(step) {
    const container = document.getElementById("onboarding-step-container");
    const progressFill = document.getElementById("onboarding-progress-fill");
    const stepLabel = document.getElementById("onboarding-step-label");
    const prevBtn = document.getElementById("ob-prev-btn");
    const nextBtn = document.getElementById("ob-next-btn");

    if (!container) return;

    const percent = ((step - 1) / (this.totalSteps - 1)) * 100;
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (stepLabel) stepLabel.innerText = `Question Set ${step} of ${this.totalSteps}`;

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

    let html = "";

    switch (step) {
      case 1:
        const currentGrade = this.wizardData.grade_level || 12;
        const currentMajor = this.wizardData.intended_major || "STEM & Engineering";
        html = `
          <div class="onboarding-step-body">
            <div class="step-title-group">
              <h3>1. Your Grade Track, Location & Intended Major</h3>
              <p>Tell us where you are in high school and what field you want to pursue so the AI can tailor your breakdown.</p>
            </div>

            <!-- Interactive Track Selector Pills -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
              <button type="button" onclick="Onboarding.selectGradeTrack(12)" style="text-align: left; padding: 0.85rem 1rem; border-radius: 10px; cursor: pointer; border: 1.5px solid ${currentGrade === 12 ? '#3B82F6' : 'var(--border-subtle)'}; background: ${currentGrade === 12 ? 'rgba(37, 99, 235, 0.14)' : 'var(--bg-input)'}; color: var(--text-main);">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #60A5FA; margin-bottom: 0.2rem;">🎓 Senior / Grad Track</div>
                <div style="font-size: 0.9rem; font-weight: 700;">12th Grade or High School Grad</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">See scholarships, auto-admit & AP cash unlocked now</div>
              </button>
              <button type="button" onclick="Onboarding.selectGradeTrack(10)" style="text-align: left; padding: 0.85rem 1rem; border-radius: 10px; cursor: pointer; border: 1.5px solid ${currentGrade < 12 ? '#818CF8' : 'var(--border-subtle)'}; background: ${currentGrade < 12 ? 'rgba(99, 102, 241, 0.14)' : 'var(--bg-input)'}; color: var(--text-main);">
                <div style="font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #A5B4FC; margin-bottom: 0.2rem;">🗺️ 9th–11th Grade Roadmap</div>
                <div style="font-size: 0.9rem; font-weight: 700;">Freshman, Sophomore, or Junior</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">Build a custom step-by-step high school guide</div>
              </button>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="ob-name">Full Name</label>
                <input type="text" id="ob-name" class="input-control" value="${this.wizardData.name || ''}" placeholder="e.g. Alex Rivera" required>
              </div>

              <div class="form-group">
                <label for="ob-hs">High School Name <span class="hint">(optional)</span></label>
                <input type="text" id="ob-hs" class="input-control" value="${this.wizardData.high_school || ''}" placeholder="e.g. Westlake High School">
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="ob-grade">Exact Grade Level</label>
                <select id="ob-grade" class="select-control">
                  <option value="9" ${currentGrade === 9 ? 'selected' : ''}>9th Grade (Freshman)</option>
                  <option value="10" ${currentGrade === 10 ? 'selected' : ''}>10th Grade (Sophomore)</option>
                  <option value="11" ${currentGrade === 11 ? 'selected' : ''}>11th Grade (Junior)</option>
                  <option value="12" ${currentGrade === 12 ? 'selected' : ''}>12th Grade (Senior / Grad)</option>
                </select>
              </div>

              <div class="form-group">
                <label for="ob-residency">State of Legal Residency</label>
                <select id="ob-residency" class="select-control">
                  <option value="AL">Alabama (AL)</option>
                  <option value="AK">Alaska (AK)</option>
                  <option value="AZ">Arizona (AZ)</option>
                  <option value="AR">Arkansas (AR)</option>
                  <option value="CA" ${this.wizardData.residency === 'CA' ? 'selected' : ''}>California (CA)</option>
                  <option value="CO">Colorado (CO)</option>
                  <option value="CT">Connecticut (CT)</option>
                  <option value="DE">Delaware (DE)</option>
                  <option value="DC">District of Columbia (DC)</option>
                  <option value="FL" ${this.wizardData.residency === 'FL' ? 'selected' : ''}>Florida (FL)</option>
                  <option value="GA" ${this.wizardData.residency === 'GA' ? 'selected' : ''}>Georgia (GA)</option>
                  <option value="HI">Hawaii (HI)</option>
                  <option value="ID">Idaho (ID)</option>
                  <option value="IL">Illinois (IL)</option>
                  <option value="IN">Indiana (IN)</option>
                  <option value="IA">Iowa (IA)</option>
                  <option value="KS">Kansas (KS)</option>
                  <option value="KY">Kentucky (KY)</option>
                  <option value="LA">Louisiana (LA)</option>
                  <option value="ME">Maine (ME)</option>
                  <option value="MD">Maryland (MD)</option>
                  <option value="MA">Massachusetts (MA)</option>
                  <option value="MI">Michigan (MI)</option>
                  <option value="MN">Minnesota (MN)</option>
                  <option value="MS">Mississippi (MS)</option>
                  <option value="MO">Missouri (MO)</option>
                  <option value="MT">Montana (MT)</option>
                  <option value="NE">Nebraska (NE)</option>
                  <option value="NV">Nevada (NV)</option>
                  <option value="NH">New Hampshire (NH)</option>
                  <option value="NJ">New Jersey (NJ)</option>
                  <option value="NM">New Mexico (NM)</option>
                  <option value="NY">New York (NY)</option>
                  <option value="NC">North Carolina (NC)</option>
                  <option value="ND">North Dakota (ND)</option>
                  <option value="OH">Ohio (OH)</option>
                  <option value="OK">Oklahoma (OK)</option>
                  <option value="OR">Oregon (OR)</option>
                  <option value="PA">Pennsylvania (PA)</option>
                  <option value="RI">Rhode Island (RI)</option>
                  <option value="SC">South Carolina (SC)</option>
                  <option value="SD">South Dakota (SD)</option>
                  <option value="TN">Tennessee (TN)</option>
                  <option value="TX" ${this.wizardData.residency === 'TX' ? 'selected' : ''}>Texas (TX)</option>
                  <option value="UT">Utah (UT)</option>
                  <option value="VT">Vermont (VT)</option>
                  <option value="VA">Virginia (VA)</option>
                  <option value="WA" ${this.wizardData.residency === 'WA' ? 'selected' : ''}>Washington (WA)</option>
                  <option value="WV">West Virginia (WV)</option>
                  <option value="WI">Wisconsin (WI)</option>
                  <option value="WY">Wyoming (WY)</option>
                  <option value="OTHER" ${this.wizardData.residency === 'OTHER' ? 'selected' : ''}>U.S. Territory / International</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-top: 0.75rem;">
              <label for="ob-major">Intended College Major / Career Track</label>
              <select id="ob-major" class="select-control">
                <option value="STEM & Engineering" ${currentMajor === 'STEM & Engineering' ? 'selected' : ''}>STEM & Engineering (Mechanical, Aerospace, Electrical, Civil)</option>
                <option value="Computer Science & Data" ${currentMajor === 'Computer Science & Data' ? 'selected' : ''}>Computer Science, AI & Data Science</option>
                <option value="Business, Finance & Economics" ${currentMajor === 'Business, Finance & Economics' ? 'selected' : ''}>Business, Finance & Economics</option>
                <option value="Pre-Med, Biology & Health" ${currentMajor === 'Pre-Med, Biology & Health' ? 'selected' : ''}>Pre-Med, Nursing, Biology & Health Sciences</option>
                <option value="Humanities, Law & Social Sciences" ${currentMajor === 'Humanities, Law & Social Sciences' ? 'selected' : ''}>Humanities, Pre-Law, Psychology & Political Science</option>
                <option value="Undecided / Exploring" ${currentMajor === 'Undecided / Exploring' ? 'selected' : ''}>Undecided / Exploring Multiple Tracks</option>
              </select>
            </div>
          </div>
        `;
        break;

      case 2:
        const pct = (this.wizardData.class_rank && this.wizardData.class_size) ? ((this.wizardData.class_rank / this.wizardData.class_size) * 100).toFixed(1) : null;
        html = `
          <div class="onboarding-step-body">
            <div class="step-title-group">
              <h3>2. Your GPA & Class Rank Standing</h3>
              <p>Enter your unweighted/weighted GPA and class rank (or pick a quick estimate below) to unlock merit aid and auto-admission rules.</p>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); align-self: center; margin-right: 0.25rem;">Quick GPA Presets:</span>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setGpaPreset(3.95, 4.45, 18, 500)">Straight A's (3.95 UW / Top 4%)</button>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setGpaPreset(3.75, 4.15, 42, 500)">A/B Honor Roll (3.75 UW / Top 9%)</button>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setGpaPreset(3.45, 3.80, 95, 500)">Solid B+ Student (3.45 UW / Top 19%)</button>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setGpaPreset(3.15, 3.35, 160, 500)">B Average (3.15 UW)</button>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="ob-gpa-uw">Unweighted GPA <span class="hint">0.00 – 4.00</span></label>
                <input type="number" step="0.01" min="0" max="4.0" id="ob-gpa-uw" class="input-control" value="${this.wizardData.gpa_unweighted || ''}" placeholder="3.85">
              </div>

              <div class="form-group">
                <label for="ob-gpa-w">Weighted GPA <span class="hint">e.g. 4.35</span></label>
                <input type="number" step="0.01" min="0" max="6.0" id="ob-gpa-w" class="input-control" value="${this.wizardData.gpa_weighted || ''}" placeholder="4.35">
              </div>
            </div>

            <div class="form-grid">
              <div class="form-group">
                <label for="ob-rank">Class Rank <span class="hint">Optional</span></label>
                <input type="number" min="1" id="ob-rank" class="input-control" value="${this.wizardData.class_rank || ''}" placeholder="e.g. 24" oninput="Onboarding.updatePercentileLive()">
              </div>

              <div class="form-group">
                <label for="ob-size">Graduating Class Size <span class="hint">Optional</span></label>
                <input type="number" min="1" id="ob-size" class="input-control" value="${this.wizardData.class_size || ''}" placeholder="e.g. 500" oninput="Onboarding.updatePercentileLive()">
              </div>
            </div>

            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
              <span style="font-size: 0.84rem; color: var(--text-muted);">Calculated Class Percentile:</span>
              <strong style="color: #60A5FA; font-size: 1.05rem;" id="ob-percentile-live">${pct ? `Top ${pct}%` : 'Enter rank & size above'}</strong>
            </div>
          </div>
        `;
        break;

      case 3:
        const hasScores = this.wizardData.sat_rw && this.wizardData.sat_m;
        const totalSat = hasScores ? (this.wizardData.sat_rw + this.wizardData.sat_m) : "N/A";
        html = `
          <div class="onboarding-step-body">
            <div class="step-title-group">
              <h3>3. Standardized Test Scores (SAT / ACT)</h3>
              <p>Enter your current or target SAT/ACT scores so our AI can match you with automatic merit scholarships and university score ranges.</p>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1rem;">
              <span style="font-size: 0.75rem; color: var(--text-muted); align-self: center; margin-right: 0.25rem;">Quick Score Presets:</span>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setScorePreset(740, 770, 34)">1510 SAT / 34 ACT</button>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setScorePreset(690, 720, 31)">1410 SAT / 31 ACT</button>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setScorePreset(640, 660, 28)">1300 SAT / 28 ACT</button>
              <button type="button" class="btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;" onclick="Onboarding.setScorePreset(580, 600, 24)">1180 SAT / 24 ACT</button>
            </div>

            <label class="checkbox-group" style="margin-bottom: 1rem;">
              <input type="checkbox" id="ob-no-test" onchange="Onboarding.toggleTestInputs(this.checked)" ${this.wizardData.no_test_checked ? 'checked' : ''}>
              <div class="checkbox-label">
                <strong>I haven't taken the SAT or ACT yet (Test-Optional / Future Tester)</strong>
                <span class="checkbox-sub">Our AI will recommend a target score timeline and show test-optional pathways.</span>
              </div>
            </label>

            <div id="ob-test-fields" style="opacity: ${this.wizardData.no_test_checked ? '0.4' : '1'};">
              <div class="form-grid">
                <div class="form-group">
                  <label for="ob-sat-rw">SAT Reading & Writing <span class="hint">200–800</span></label>
                  <input type="number" min="200" max="800" step="10" id="ob-sat-rw" class="input-control" value="${this.wizardData.sat_rw || ''}" placeholder="690" oninput="Onboarding.updateSatTotalLive()">
                </div>

                <div class="form-group">
                  <label for="ob-sat-m">SAT Math <span class="hint">200–800</span></label>
                  <input type="number" min="200" max="800" step="10" id="ob-sat-m" class="input-control" value="${this.wizardData.sat_m || ''}" placeholder="720" oninput="Onboarding.updateSatTotalLive()">
                </div>

                <div class="form-group">
                  <label for="ob-act">ACT Composite <span class="hint">1–36</span></label>
                  <input type="number" min="1" max="36" id="ob-act" class="input-control" value="${this.wizardData.act_composite || ''}" placeholder="31">
                </div>
              </div>

              <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; display: flex; align-items: center; justify-content: space-between; margin-top: 1rem;">
                <span style="font-size: 0.84rem; color: var(--text-muted);">Combined Total SAT Score:</span>
                <strong style="color: #34D399; font-size: 1.15rem;" id="ob-sat-total-live">${totalSat}</strong>
              </div>
            </div>
          </div>
        `;
        break;

      case 4:
        const ecTier = this.wizardData.extracurricular_tier || "strong";
        const primaryGoal = this.wizardData.primary_goal || "scholarships";
        html = `
          <div class="onboarding-step-body">
            <div class="step-title-group">
              <h3>4. Course Rigor, Extracurriculars & Primary Goal</h3>
              <p>Tell us about your high school curriculum and activities so the AI can spot gaps and suggest high-impact next steps.</p>
            </div>

            <div class="form-grid" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label for="ob-ec">Extracurricular & Leadership Involvement</label>
                <select id="ob-ec" class="select-control">
                  <option value="national" ${ecTier === 'national' ? 'selected' : ''}>Tier 1: State/National Awards, Olympiad, Research, or Founder</option>
                  <option value="strong" ${ecTier === 'strong' ? 'selected' : ''}>Tier 2: Club President, Varsity Captain, or Eagle Scout / Gold Award</option>
                  <option value="developing" ${ecTier === 'developing' ? 'selected' : ''}>Tier 3: Active Club Member, Volunteering, Part-Time Job</option>
                  <option value="starter" ${ecTier === 'starter' ? 'selected' : ''}>Tier 4: Just Getting Started — Need Activity Ideas & Suggestions</option>
                </select>
              </div>

              <div class="form-group">
                <label for="ob-goal">What is your #1 Priority right now?</label>
                <select id="ob-goal" class="select-control">
                  <option value="scholarships" ${primaryGoal === 'scholarships' ? 'selected' : ''}>Maximize Merit Scholarships & Lower Tuition Costs</option>
                  <option value="flagship" ${primaryGoal === 'flagship' ? 'selected' : ''}>Get Into Top Flagship & Reach Universities</option>
                  <option value="roadmap" ${primaryGoal === 'roadmap' ? 'selected' : ''}>Build a Year-by-Year High School Course & Activity Plan</option>
                  <option value="credits" ${primaryGoal === 'credits' ? 'selected' : ''}>Graduate Early Using AP/IB College Credits</option>
                </select>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 0.65rem;">
              <label class="checkbox-group">
                <input type="checkbox" id="ob-alg2" ${this.wizardData.math_years_algebra2 ? 'checked' : ''}>
                <div class="checkbox-label">
                  <strong>Completed (or on track for) Algebra II & 4 Years of Math</strong>
                  <span class="checkbox-sub">Core requirement across all 50 states for automatic admission & STEM degrees.</span>
                </div>
              </label>

              <div class="form-group" style="margin-top: 0.15rem;">
                <label for="ob-sci">Total Lab Science Years (Biology, Chemistry, Physics)</label>
                <input type="number" min="0" max="6" id="ob-sci" class="input-control" value="${this.wizardData.science_years ?? 4}">
              </div>

              <label class="checkbox-group">
                <input type="checkbox" id="ob-end" ${this.wizardData.has_endorsement ? 'checked' : ''}>
                <div class="checkbox-label">
                  <strong>Distinguished Graduation Endorsement & 2+ Years World Language</strong>
                  <span class="checkbox-sub">Unlocks Texas Top 10% / Top 5% statutory eligibility and out-of-state merit waivers.</span>
                </div>
              </label>

              <label class="checkbox-group">
                <input type="checkbox" id="ob-fl" ${this.wizardData.fl_prep_complete ? 'checked' : ''}>
                <div class="checkbox-label">
                  <strong>Honors / AP / IB College-Prep Diploma Track</strong>
                  <span class="checkbox-sub">Taking advanced, dual-enrollment, AP, or IB coursework.</span>
                </div>
              </label>
            </div>
          </div>
        `;
        break;

      case 5:
        const currentExams = this.wizardData.ap_exams || [];
        const savedColleges = this.wizardData.saved_colleges || [];
        const collegesList = CollegesEngine.getAll();
        const availableExamOptions = CreditsEngine.AVAILABLE_EXAMS;

        html = `
          <div class="onboarding-step-body">
            <div class="step-title-group">
              <h3>5. AP Exams & Target Universities</h3>
              <p>Add any AP exams you've taken (or plan to take) and check the universities you want in your AI Breakdown.</p>
            </div>

            <!-- AP Exams Section -->
            <div style="margin-bottom: 1.5rem;">
              <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">
                Your AP Exams (${currentExams.length} added):
              </label>

              <div id="ob-exam-list" style="display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.75rem;">
                ${currentExams.length === 0 ? `
                  <div style="font-size: 0.8rem; color: var(--text-dim); padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 6px;">
                    No AP exams added yet. Select an exam below and click '+ Add', or let our AI suggest the best APs for your major!
                  </div>
                ` : currentExams.map((e, idx) => `
                  <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 0.35rem 0.6rem; border-radius: 6px; font-size: 0.82rem;">
                    <span><strong>${e.name}</strong> (${e.status === 'completed' ? `Score: ${e.score}` : 'Planned'})</span>
                    <button class="btn-secondary" style="padding: 0.15rem 0.4rem; font-size: 0.7rem; color: #F87171;" onclick="Onboarding.removeExam(${idx})">✕</button>
                  </div>
                `).join('')}
              </div>

              <div style="display: flex; gap: 0.5rem;">
                <select id="ob-exam-select" class="select-control" style="font-size: 0.8rem;">
                  ${availableExamOptions.map(ae => `<option value="${ae.id}|${ae.name}">${ae.name}</option>`).join('')}
                </select>
                <select id="ob-exam-score-select" class="select-control" style="width: auto; font-size: 0.8rem;">
                  <option value="5">Score: 5</option>
                  <option value="4" selected>Score: 4</option>
                  <option value="3">Score: 3</option>
                  <option value="0">Planned (Future)</option>
                </select>
                <button class="btn-secondary" style="font-size: 0.8rem; white-space: nowrap;" onclick="Onboarding.addExam()">+ Add</button>
              </div>
            </div>

            <!-- College Selection Checklist -->
            <div>
              <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">
                Select Target Colleges to Analyze (${savedColleges.length} selected):
              </label>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; max-height: 180px; overflow-y: auto; padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
                ${collegesList.map(c => `
                  <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; cursor: pointer;">
                    <input type="checkbox" ${savedColleges.includes(c.id) ? 'checked' : ''} onchange="Onboarding.toggleCollege('${c.id}')">
                    <span>${c.short_name} (${c.state})</span>
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
        `;
        break;
    }

    container.innerHTML = html;
  },

  selectGradeTrack(grade) {
    this.harvestCurrentStepData();
    this.wizardData.grade_level = grade;
    this.renderStep(1);
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
    const idx = this.wizardData.saved_colleges.indexOf(collegeId);
    if (idx > -1) {
      this.wizardData.saved_colleges.splice(idx, 1);
    } else {
      this.wizardData.saved_colleges.push(collegeId);
    }
    this.renderStep(5);
  },

  finish() {
    this.harvestCurrentStepData();
    Auth.updateCurrentUserProfile(this.wizardData, true);
    ProfileManager.save(this.wizardData);

    this.close();
    App.activeTab = "ai";
    App.updateAppView();
    App.switchTab("ai");
    App.showToast("✨ Survey analyzed! Here is your custom AI Breakdown & Suggestions.", "success");
  }
};
