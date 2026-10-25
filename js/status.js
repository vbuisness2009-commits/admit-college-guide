/**
 * Tab 1: Status & Automatic Admission Engine
 * Evaluates published state admission statutes (California UC ELC, Washington GAP, Georgia Match,
 * Florida Talented 20, Texas Top 10%, and National College Readiness Placement)
 * against the student's verified profile data.
 */

const StatusEngine = {
  rulesData: [],

  MERIT_SCHOLARSHIPS: [
    {
      id: "ua-presidential",
      name: "University of Alabama — Presidential Merit Scholarship",
      award: "$28,000 / yr ($112,000 Total)",
      min_gpa: 3.5,
      min_sat: 1420,
      min_act: 32,
      state: "ALL",
      deadline: "Jan 15 Priority",
      action: "Automatic upon admission with qualifying GPA & test score — no separate scholarship essay required.",
      url: "https://afford.ua.edu/scholarships/out-of-state-freshman/"
    },
    {
      id: "uarizona-wildcat",
      name: "University of Arizona — Wildcat Distinction Award",
      award: "$20,000 – $32,000 / yr",
      min_gpa: 3.9,
      min_sat: 0,
      min_act: 0,
      state: "ALL",
      deadline: "Rolling / May 1",
      action: "100% automatic based on unweighted core GPA (3.90+ unlocks top tier; 3.50+ unlocks $12,500/yr).",
      url: "https://financialaid.arizona.edu/types-of-aid/scholarships/incoming-first-year-transfer"
    },
    {
      id: "osu-buckeye",
      name: "Ohio State University — National Buckeye & Maximus Merit",
      award: "$13,500 – $16,500 / yr ($66,000 Total)",
      min_gpa: 3.8,
      min_sat: 1350,
      min_act: 29,
      state: "ALL",
      deadline: "Nov 1 Early Action",
      action: "Must submit Common App and official scores by the Nov 1 Early Action priority deadline.",
      url: "https://sfa.osu.edu/incoming-freshmen/about-aid/types-of-aid/scholarships"
    },
    {
      id: "uh-excellence",
      name: "University of Houston — Academic Excellence Scholarship",
      award: "$6,000 / yr + In-State Tuition Waiver",
      min_gpa: 3.7,
      min_sat: 1320,
      min_act: 28,
      state: "ALL",
      deadline: "Nov 1 Priority",
      action: "Submit admission application and transcripts by Nov 1; out-of-state recipients also receive an in-state tuition waiver.",
      url: "https://uh.edu/financial/undergraduate/types-aid/scholarships/"
    },
    {
      id: "purdue-trustees",
      name: "Purdue University — Trustees & Presidential Scholarship",
      award: "$10,000 – $16,000 / yr ($64,000 Total)",
      min_gpa: 3.85,
      min_sat: 1400,
      min_act: 31,
      state: "ALL",
      deadline: "Nov 1 Early Action",
      action: "Automatic review when applying by the Nov 1 Early Action deadline on the Common App.",
      url: "https://www.admissions.purdue.edu/costsandfinaid/freshman.php"
    },
    {
      id: "fl-bright-futures",
      name: "Florida Bright Futures — Academic Scholars (FAS)",
      award: "100% Public University Tuition Covered",
      min_gpa: 3.5,
      min_sat: 1340,
      min_act: 29,
      state: "FL",
      deadline: "Before Graduation",
      action: "Florida residents meeting GPA, 1340+ SAT / 29+ ACT, and service hours receive 100% tuition at UF, FSU, UCF, USF.",
      url: "https://www.floridastudentfinancialaidsg.org/"
    },
    {
      id: "ga-zell-miller",
      name: "Georgia Zell Miller & HOPE Merit Scholarship",
      award: "100% Standard Tuition Covered",
      min_gpa: 3.7,
      min_sat: 1200,
      min_act: 26,
      state: "GA",
      deadline: "GSFAPPS / FAFSA",
      action: "Georgia residents with 3.70+ GPA and 1200+ SAT receive 100% tuition at Georgia Tech, UGA, and all USG institutions.",
      url: "https://www.gafutures.org/hope-state-aid-programs/hope-zell-miller-scholarships/"
    }
  ],

  evaluateScholarships(profile) {
    const gpa = profile.gpa_unweighted || 0;
    const sat = profile.sat_total || 0;
    const act = profile.act_composite || 0;

    return this.MERIT_SCHOLARSHIPS.map(sch => {
      const gpaMet = gpa >= sch.min_gpa;
      const testMet = sch.min_sat === 0 || sat >= sch.min_sat || act >= sch.min_act;
      const stateMet = sch.state === "ALL" || profile.residency === sch.state;
      const isQualified = gpaMet && testMet && stateMet;

      const missing = [];
      if (!gpaMet) missing.push(`Raise GPA to ${sch.min_gpa.toFixed(2)}+ (currently ${gpa ? gpa.toFixed(2) : 'N/A'})`);
      if (!testMet) missing.push(`Reach ${sch.min_sat}+ SAT or ${sch.min_act}+ ACT (currently ${sat ? sat + ' SAT' : (act ? act + ' ACT' : 'no score')})`);
      if (!stateMet) missing.push(`Requires ${sch.state} State Residency`);

      return {
        ...sch,
        isQualified,
        missing,
        gapText: missing.join(" · ")
      };
    });
  },

  async init() {
    try {
      const res = await fetch("data/state_rules.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.rulesData = await res.json();
    } catch (e) {
      this.rulesData = [];
      this.loadError = e.message;
    }
  },

  evaluateRule(rule, profile) {
    let allMet = true;
    const evaluatedCriteria = [];
    const checkField = f => {
      if (f === "science_years_4") return (profile.science_years ?? 0) >= 4;
      if (f === "science_years") return (profile.science_years ?? 0) >= 3;
      return !!profile[f];
    };

    for (const criterion of rule.criteria) {
      let isMet = false;

      if (criterion.subcriteria_type === "any") {
        for (const sub of criterion.subcriteria) {
          if (sub.operator === "all_true") {
            if (sub.fields.every(checkField)) { isMet = true; break; }
          } else if (sub.operator === "sat_benchmark_check") {
            const rw = profile.sat_rw || 0;
            const m = profile.sat_m || 0;
            if (rw >= 480 && m >= 530) { isMet = true; break; }
          } else if (sub.operator === "act_benchmark_check") {
            if ((profile.act_composite || 0) >= 22) { isMet = true; break; }
          }
        }
      } else if (criterion.operator === "equals") {
        isMet = profile[criterion.field] === criterion.value;
      } else if (criterion.operator === "lte") {
        isMet = (profile[criterion.field] !== undefined && profile[criterion.field] !== null) && profile[criterion.field] <= criterion.value;
      } else if (criterion.operator === "gte") {
        isMet = (profile[criterion.field] !== undefined && profile[criterion.field] !== null) && profile[criterion.field] >= criterion.value;
      } else if (criterion.operator === "all_true") {
        isMet = criterion.fields.every(checkField);
      }

      if (!isMet) allMet = false;

      evaluatedCriteria.push({
        label: criterion.label,
        isMet: isMet,
        fix: isMet ? null : criterion.fix
      });
    }

    return {
      rule: rule,
      isQualified: allMet,
      status: allMet ? "qualified" : "action_required",
      criteria: evaluatedCriteria
    };
  },

  evaluateAll(profile) {
    if (!this.rulesData || !Array.isArray(this.rulesData)) return [];
    const userState = (profile && profile.residency) || "TX";
    const relevant = this.rulesData.filter(r => r.state_code === userState || r.state_code === "ALL");
    return relevant.map(r => this.evaluateRule(r, profile || {}));
  },

  render(containerId, profile, collegesData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!this.rulesData || this.rulesData.length === 0) {
      container.innerHTML = `<div class="card"><p>Loading state admission statutory data...</p></div>`;
      return;
    }

    const isSenior = (profile.grade_level || 11) >= 12;
    const scholarships = this.evaluateScholarships(profile);
    const qualifiedScholarshipsCount = scholarships.filter(s => s.isQualified).length;

    container.innerHTML = `
      <!-- Dynamic Pathway Banner -->
      <div class="tf-pathway-banner">
        <div class="tf-banner-left">
          <div class="tf-banner-icon">
            ${isSenior ? '🎓' : '🎒'}
          </div>
          <div>
            <strong class="tf-banner-title">
              ${isSenior ? `Senior &amp; Graduate Opportunity Scanner (${qualifiedScholarshipsCount} Automatic Merit Awards Unlocked)` : `Grade ${profile.grade_level || 11} Scholarship &amp; Auto-Admit Target Tracker`}
            </strong>
            <p class="tf-banner-desc">
              ${isSenior
                ? 'Your GPA and test scores have been matched against automatic university merit scholarships and state admission guarantees you can claim right now.'
                : 'See which scholarships and guaranteed admissions your current stats unlock, and the exact GPA/SAT targets to hit before senior year.'}
            </p>
          </div>
        </div>
        <div class="tf-banner-actions">
          <button class="btn-secondary" style="font-size: 0.78rem; padding: 0.45rem 0.85rem;" onclick="App.switchTab('roadmap')">
            ${isSenior ? 'View Priority Deadlines →' : 'Open My 4-Year High School Guide →'}
          </button>
          <button class="btn-primary" style="font-size: 0.78rem; padding: 0.45rem 0.85rem;" onclick="App.switchTab('ai')">
            Open Scholarship Advisor →
          </button>
        </div>
      </div>

      <div class="status-grid">
        <!-- Profile Summary Column -->
        <div class="profile-summary-box tf-profile-summary">
          <div class="tf-profile-header">
            <div>
              <h3 style="font-size: 1.1rem; color: #FFFFFF; font-weight: 700; margin: 0;">Student Snapshot</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Grade ${profile.grade_level || "11"} · ${profile.residency || "US"} Resident</p>
            </div>
            <div class="tf-profile-actions">
              <button class="btn-primary" onclick="App.openExportModal()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
                Export Summary
              </button>
              <button class="btn-secondary" onclick="App.openProfileModal()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
                Edit
              </button>
            </div>
          </div>

          <div class="stat-row">
            <span class="stat-label">Class Rank</span>
            <span class="stat-value">
              ${profile.class_rank ? `${profile.class_rank} / ${profile.class_size}` : "Unranked"} 
              ${profile.class_percentile ? `<span style="font-size: 0.8rem; color: #60A5FA;">(Top ${profile.class_percentile}%)</span>` : ''}
            </span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Unweighted GPA</span>
            <span class="stat-value">${profile.gpa_unweighted ? profile.gpa_unweighted.toFixed(2) : "Not entered"} <span style="font-size: 0.75rem; color: var(--text-dim);">${profile.gpa_unweighted ? '/ 4.0' : ''}</span></span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Weighted GPA</span>
            <span class="stat-value">${profile.gpa_weighted ? profile.gpa_weighted.toFixed(2) : "Not entered"}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">SAT Score</span>
            <span class="stat-value">
              ${profile.sat_total ? `${profile.sat_total} <span style="font-size: 0.75rem; color: var(--text-dim);">(ERW ${profile.sat_rw || 0} / M ${profile.sat_m || 0})</span>` : 'No test score'}
            </span>
          </div>

          <div class="stat-row">
            <span class="stat-label">ACT Composite</span>
            <span class="stat-value">${profile.act_composite || "Not entered"}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">PSAT / NMSQT</span>
            <span class="stat-value tf-stat-highlight-sky">
              ${profile.psat_score ? `${profile.psat_score} <span style="font-size: 0.74rem; color: var(--text-dim);">(${profile.psat_index || Math.round(profile.psat_score * 0.15)} Index)</span>` : 'Not entered'}
            </span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Awards &amp; ECs logged</span>
            <span class="stat-value tf-stat-highlight-amber">
              ${(profile.selected_awards || []).length} Awards · ${(profile.extracurricular_tier || 'strong').toUpperCase()}
            </span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Core College Prep Curriculum</span>
            <span class="stat-value" style="color: ${profile.math_years_algebra2 && (profile.science_years ?? 0) >= 4 && profile.has_endorsement ? 'var(--success)' : 'var(--warning)'}; font-size: 0.85rem;">
              ${profile.math_years_algebra2 && (profile.science_years ?? 0) >= 4 && profile.has_endorsement ? 'Distinguished Ready' : 'Action Needed'}
            </span>
          </div>

          <div class="tf-quickcheck-box">
            <div class="tf-quickcheck-label">
              Interactive Curriculum Quick-Check (Click to Toggle)
            </div>
            <div class="tf-quickcheck-pills">
              <button type="button" class="pill-btn" onclick="StatusEngine.quickToggleCurriculum('math_years_algebra2')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem; border-color: ${profile.math_years_algebra2 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}; color: ${profile.math_years_algebra2 ? '#34D399' : '#F87171'};">
                ${profile.math_years_algebra2 ? '✓' : '✕'} 4 Math (incl. Alg II)
              </button>
              <button type="button" class="pill-btn" onclick="StatusEngine.quickToggleCurriculum('science_years')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem; border-color: ${(profile.science_years ?? 0) >= 4 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}; color: ${(profile.science_years ?? 0) >= 4 ? '#34D399' : '#F87171'};">
                ${(profile.science_years ?? 0) >= 4 ? '✓' : '✕'} Lab Science (${profile.science_years ?? 0}/4 yrs)
              </button>
              <button type="button" class="pill-btn" onclick="StatusEngine.quickToggleCurriculum('has_endorsement')" style="font-size: 0.72rem; padding: 0.22rem 0.55rem; border-color: ${profile.has_endorsement ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}; color: ${profile.has_endorsement ? '#34D399' : '#F87171'};">
                ${profile.has_endorsement ? '✓' : '✕'} Endorsement & Lang
              </button>
            </div>
          </div>

          <div class="stat-row">
            <span class="stat-label">AP/IB Exams</span>
            <span class="stat-value" style="font-size: 0.85rem;">
              ${(profile.ap_exams || []).filter(e => e.status === 'completed').length} completed, ${(profile.ap_exams || []).filter(e => e.status === 'planned').length} planned
            </span>
          </div>

          <div style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">Target College List (${profile.saved_colleges ? profile.saved_colleges.length : 0})</div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              ${(profile.saved_colleges || []).length === 0 ? `
                <div style="font-size: 0.75rem; color: var(--text-dim); padding: 0.4rem; background: rgba(255,255,255,0.02); border-radius: 4px;">
                  No colleges saved yet. Click the Colleges tab to browse and add schools.
                </div>
              ` : (profile.saved_colleges || []).map(id => {
                const c = (collegesData || []).find(col => col.id === id);
                if (!c) return '';
                const appSt = ProfileManager.getCollegeStatus ? ProfileManager.getCollegeStatus(c.id, profile) : "working";
                return `
                  <div class="tf-saved-college-row">
                    <span>${c.short_name} (${c.state})</span>
                    <div style="display: flex; align-items: center; gap: 0.3rem;">
                      <button type="button" class="ob-score-pill ${appSt === 'working' ? 'active' : ''}" style="font-size: 0.68rem; padding: 0.14rem 0.42rem;" onclick="AdmitAI.setCollegeStatus('${c.id}', 'working'); StatusEngine.render('status-tab-content', ProfileManager.get(), CollegesEngine.getAll());">🛠️ Working</button>
                      <button type="button" class="ob-score-pill ${appSt === 'submitted' ? 'active' : ''}" style="font-size: 0.68rem; padding: 0.14rem 0.42rem; ${appSt === 'submitted' ? 'background:#059669;border-color:#34D399;' : ''}" onclick="AdmitAI.setCollegeStatus('${c.id}', 'submitted'); StatusEngine.render('status-tab-content', ProfileManager.get(), CollegesEngine.getAll());">✅ Submitted</button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Scholarships & Automatic Admission Column -->
        <div class="rules-container">
          <!-- Section 0: Personalized EC, Awards & PSAT Scholarship Earnings by College -->
          <div class="tf-sch-earnings-banner">
            <div class="tf-sch-earnings-header-row">
              <div>
                <h3 class="tf-sch-earnings-title">🏅 How Much Your ECs, Awards &amp; PSAT Earn at Your Colleges</h3>
                <p class="tf-sch-earnings-desc">
                  Personalized 4-year scholarship projection combining your GPA/SAT Merit, Extracurricular Leadership (${(profile.extracurricular_tier || 'strong').toUpperCase()}), ${(profile.selected_awards || []).length} Award(s)${profile.psat_score ? `, and ${profile.psat_score} PSAT` : ''}.
                </p>
              </div>
              <button type="button" class="btn-secondary" style="font-size: 0.76rem; padding: 0.38rem 0.75rem;" onclick="Onboarding.open(); Onboarding.goToStep(4);">
                + Edit My ECs, Awards &amp; PSAT
              </button>
            </div>
            <div class="tf-sch-earnings-list">
              ${((profile.saved_colleges || []).map(id => (collegesData || []).find(col => col.id === id)).filter(Boolean)).map(col => {
                const completedExams = (profile.ap_exams || []).filter(e => e.status === "completed");
                const sav = (typeof CreditsEngine !== "undefined" && CreditsEngine.calculateCollegeSavings) ? CreditsEngine.calculateCollegeSavings(col, completedExams, profile.residency) : { tuitionSaved: 0 };
                const sch = (typeof AdmitAI !== "undefined" && AdmitAI.calculateCollegeScholarshipValue)
                  ? AdmitAI.calculateCollegeScholarshipValue(col, profile, sav)
                  : { statsMeritPerYr: 4000, ecAwardsPerYr: 3000, psatMeritPerYr: 0, totalPerYr: 7000, total4YrValue: 28000, programName: `${col.short_name} Merit`, userDriversLabel: "Profile" };
                return `
                  <div class="tf-sch-earnings-item">
                    <div>
                      <div class="tf-sch-earnings-col-title">${col.name}</div>
                      <div class="tf-sch-earnings-col-sub">
                        🎯 <strong>${sch.programName}</strong> · Driven by your ${sch.userDriversLabel}
                      </div>
                      <div class="tf-sch-earnings-badges">
                        <span class="tf-sch-badge-ec">🏅 ECs &amp; Awards: +$${sch.ecAwardsPerYr.toLocaleString()}/yr</span>
                        <span class="tf-sch-badge-merit">📊 Stats Merit: $${sch.statsMeritPerYr.toLocaleString()}/yr</span>
                        ${sch.psatMeritPerYr > 0 ? `<span class="tf-sch-badge-psat">🎓 PSAT: +$${sch.psatMeritPerYr.toLocaleString()}/yr</span>` : ''}
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div class="tf-sch-earnings-amount">$${sch.totalPerYr.toLocaleString()} / yr</div>
                      <div class="tf-sch-earnings-total">$${sch.total4YrValue.toLocaleString()} 4-Yr Total</div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Section 1: Automatic Merit Scholarships & Grants -->
          <div style="margin-bottom: 2rem;">
            <div style="margin-bottom: 0.85rem;">
              <h3 class="tf-section-heading">💰 Automatic Merit Scholarships &amp; Tuition Grants</h3>
              <p class="tf-section-subheading">
                Guaranteed institutional merit scholarships and state tuition awards matched directly against your GPA and SAT/ACT scores.
              </p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${scholarships.map(s => `
                <div class="rule-card tf-rule-card ${s.isQualified ? 'tf-sch-qualified-card' : 'tf-sch-unmet-card'}" id="scholarship-card-${s.id}">
                  <div class="tf-rule-header">
                    <div>
                      <div class="tf-rule-title">${s.name}</div>
                      <div style="font-size: 0.84rem; font-family: var(--font-mono); color: #34D399; font-weight: 700; margin-top: 2px;">Award: ${s.award} · Cutoff: ${s.deadline}</div>
                    </div>
                    <div class="rule-status-badge ${s.isQualified ? 'qualified' : 'not-qualified'}">
                      ${s.isQualified ? '✓ QUALIFIED BY STATS' : 'TARGET BENCHMARK'}
                    </div>
                  </div>
                  <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.65rem; line-height: 1.45;">
                    <strong>How to Claim / Start:</strong> ${s.action}
                  </p>
                  ${!s.isQualified && s.missing.length > 0 ? `
                    <div class="tf-missing-req-banner">
                      <strong>To Unlock This Scholarship:</strong> ${s.missing.join(' · ')}
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.74rem; color: var(--text-dim); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
                    <span>Min Req: ${s.min_gpa.toFixed(2)} GPA ${s.min_sat > 0 ? `· ${s.min_sat}+ SAT / ${s.min_act}+ ACT` : '(Test-Free)'}</span>
                    <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="badge-source">Official Scholarship Page ↗</a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Section 2: State Statutory Automatic Admission Guarantees -->
          <div style="margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 class="tf-section-heading">⚖️ Guaranteed State University Admissions</h3>
                <p class="tf-section-subheading">
                  Legally mandated automatic public university admission programs based on class rank or GPA.
                </p>
              </div>
              <select id="state-rules-selector" class="select-control tf-state-selector" onchange="StatusEngine.onStateFilterChange(this.value)">
                <option value="AUTO" selected>My State (${profile.residency || 'Home'})</option>
                <option value="ALL">All U.S. State Programs</option>
                <option value="CA">California (UC ELC)</option>
                <option value="WA">Washington (GAP)</option>
                <option value="GA">Georgia (Match)</option>
                <option value="FL">Florida (Talented 20)</option>
                <option value="TX">Texas (Top 10%)</option>
              </select>
            </div>
          </div>

          <div id="evaluated-rules-list">
            ${this.renderEvaluatedRules(profile)}
          </div>
        </div>
      </div>
    `;
  },

  onStateFilterChange(stateVal) {
    const listElem = document.getElementById("evaluated-rules-list");
    if (!listElem) return;
    const profile = ProfileManager.get();
    listElem.innerHTML = this.renderEvaluatedRules(profile, stateVal);
  },

  quickToggleCurriculum(field) {
    const profile = ProfileManager.get();
    if (field === "science_years") {
      profile.science_years = (profile.science_years ?? 0) >= 4 ? 3 : 4;
    } else {
      profile[field] = !profile[field];
    }
    ProfileManager.save(profile);
  },

  renderEvaluatedRules(profile, overrideState = null) {
    const filterState = overrideState || "AUTO";
    const userState = profile.residency || "OTHER";

    const rulesToDisplay = this.rulesData.filter(r => {
      if (filterState === "ALL") return true;
      if (filterState === "AUTO") {
        return r.state_code === userState || r.state_code === "ALL";
      }
      return r.state_code === filterState || r.state_code === "ALL";
    });

    return rulesToDisplay.map(rule => {
      const result = this.evaluateRule(rule, profile);
      const isQualified = result.isQualified;

      return `
        <div class="rule-card tf-rule-card">
          <div class="rule-header">
            <div class="rule-title">
              <h3>${rule.name}</h3>
              <div class="statute">Authority: ${rule.statute}</div>
            </div>
            <div class="rule-status-badge ${isQualified ? 'qualified' : 'not-qualified'}">
              ${isQualified ? 'ELIGIBLE' : 'ACTION REQUIRED'}
            </div>
          </div>
          <div class="rule-body">
            <p class="rule-desc">${rule.description}</p>

            <div class="tf-rule-checklist-header">
              Statutory Criteria Checklist:
            </div>

            <div class="criteria-list">
              ${result.criteria.map(c => `
                <div class="criteria-item ${c.isMet ? 'met' : 'unmet'}">
                  <div class="criteria-icon">${c.isMet ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'}</div>
                  <div class="criteria-text">
                    <div class="criteria-label">${c.label}</div>
                    ${c.fix ? `<div class="criteria-fix"><strong>Single Fix Needed:</strong> ${c.fix}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <div class="tf-rule-footer">
              <span>Applies to: ${rule.applicable_universities.slice(0, 3).join(', ')}${rule.applicable_universities.length > 3 ? '...' : ''}</span>
              <a href="${rule.source_url}" target="_blank" rel="noopener noreferrer" class="badge-source">
                Official Law Source ↗
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};
