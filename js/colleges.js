/**
 * Tab 2: Colleges & Published Score Ranges
 * Visualizes official middle-50% SAT/ACT percentile bars from U.S. Dept. of Education College Scorecard.
 * Features:
 *  - Descriptive middle-50% range positioning & target deltas
 *  - Interactive "What-If" Goal Simulator (re-evaluates range alignment live)
 *  - Net Cost vs. Sticker Tuition financial equity toggle
 *  - Side-by-side college comparison matrix
 */

const CollegesEngine = {
  collegesData: [],
  activeFilter: "all",
  searchQuery: "",
  simulatorActive: false,
  simSatDelta: 0,
  costMetric: "tuition", // 'tuition' | 'net_price'

  async init() {
    try {
      const res = await fetch("data/colleges.json");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.collegesData = await res.json();
    } catch (e) {
      this.collegesData = [];
      this.loadError = e.message;
    }
  },

  getAll() {
    return this.collegesData;
  },

  getCollege(id) {
    return this.collegesData.find(c => c.id === id);
  },

  getById(id) {
    return this.getCollege(id);
  },

  getEffectiveSat(profile) {
    if (profile.sat_total !== null && profile.sat_total !== undefined && profile.sat_total > 0) {
      return { score: profile.sat_total, isActConcordance: false, label: `SAT ${profile.sat_total}` };
    }
    if (profile.act_composite !== null && profile.act_composite !== undefined && profile.act_composite > 0) {
      const actTable = {
        36: 1590, 35: 1540, 34: 1500, 33: 1460, 32: 1430, 31: 1400, 30: 1370,
        29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140,
        22: 1110, 21: 1080, 20: 1040, 19: 1010, 18: 970, 17: 930, 16: 890, 15: 850
      };
      const act = Math.min(36, Math.max(15, Math.round(profile.act_composite)));
      const eq = actTable[act] || 1000;
      return { score: eq, isActConcordance: true, label: `ACT ${profile.act_composite} (~${eq} SAT)` };
    }
    return { score: null, isActConcordance: false, label: "No Test Score" };
  },

  setFilter(filter) {
    this.activeFilter = filter;
    this.renderCards();
  },

  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.renderCards();
  },

  setCostMetric(metric) {
    this.costMetric = metric;
    this.renderCards();
  },

  toggleSimulator() {
    this.simulatorActive = !this.simulatorActive;
    if (!this.simulatorActive) {
      this.simSatDelta = 0;
    }
    const profile = ProfileManager.get();
    this.render("colleges-tab-content", profile);
  },

  setSimDelta(delta) {
    this.simSatDelta = parseInt(delta, 10) || 0;
    const profile = ProfileManager.get();
    this.updateSimulatorHeader(profile);
    this.renderCards();
  },

  updateSimulatorHeader(profile) {
    const valElem = document.getElementById("sim-delta-val");
    const scoreElem = document.getElementById("sim-effective-score");
    const summaryElem = document.getElementById("sim-unlocked-summary");
    if (!valElem || !scoreElem) return;

    const eff = this.getEffectiveSat(profile);
    const baseScore = eff.score || 1200;
    const effective = Math.min(1600, Math.max(400, baseScore + this.simSatDelta));

    valElem.innerText = (this.simSatDelta >= 0 ? `+${this.simSatDelta}` : `${this.simSatDelta}`) + " pts";
    scoreElem.innerText = `Simulated SAT: ${effective}`;

    if (summaryElem) {
      const inRangeNow = this.collegesData.filter(c => baseScore >= c.sat_total_25 && baseScore <= c.sat_total_75).length;
      const inRangeSim = this.collegesData.filter(c => effective >= c.sat_total_25 && effective <= c.sat_total_75).length;
      const diff = inRangeSim - inRangeNow;
      
      summaryElem.innerHTML = `
        <span>Range Impact: <strong>${inRangeSim}</strong> of ${this.collegesData.length} universities inside median band ${diff > 0 ? `<span style="color: var(--success);">(+${diff} unlocked)</span>` : diff < 0 ? `<span style="color: var(--warning);">(${diff} shifted)</span>` : ''}</span>
      `;
    }
  },

  render(containerId, profile) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const eff = this.getEffectiveSat(profile);
    const baseScore = eff.score || 1200;
    const effectiveScore = Math.min(1600, Math.max(400, baseScore + this.simSatDelta));

    container.innerHTML = `
      <div class="section-header">
        <div class="colleges-header-row">
          <div>
            <h2>What should I aim for?</h2>
            <p>Compare your test scores against official middle-50% published ranges from the U.S. Dept. of Education College Scorecard.</p>
          </div>
          <div class="colleges-header-actions">
            <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.45rem 0.85rem;" onclick="CollegesEngine.toggleSimulator()">
              ${this.simulatorActive ? 'Close Goal Simulator' : 'What-If Goal Simulator'}
            </button>
            <button class="compare-counter-pill" id="compare-modal-btn" onclick="CollegesEngine.openComparisonModal()">
              <span>Compare Saved</span>
              <span class="tab-badge" id="compare-badge">${profile.saved_colleges ? profile.saved_colleges.length : 0}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- What-If Scenario Simulator Panel (Conditional) -->
      ${this.simulatorActive ? `
        <div class="simulator-panel tf-simulator-panel">
          <div class="tf-sim-header">
            <div>
              <strong class="tf-sim-title">Interactive What-If Goal Simulator</strong>
              <div class="tf-sim-desc">Simulate score adjustments to see real-time shifts in university range alignment and eligibility.</div>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <span id="sim-effective-score" class="tf-sim-badge">
                Simulated SAT: ${effectiveScore}
              </span>
              <button class="btn-secondary" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;" onclick="CollegesEngine.setSimDelta(0); document.getElementById('sim-range-slider').value = 0;">Reset</button>
            </div>
          </div>

          <div class="tf-sim-controls">
            <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">Score Adjustment:</span>
            <input type="range" id="sim-range-slider" min="-150" max="250" step="10" value="${this.simSatDelta}" class="tf-sim-slider" oninput="CollegesEngine.setSimDelta(this.value)">
            <span id="sim-delta-val" class="tf-sim-delta">
              ${this.simSatDelta >= 0 ? `+${this.simSatDelta}` : this.simSatDelta} pts
            </span>
          </div>

          <div id="sim-unlocked-summary" class="tf-sim-footer">
            <span>Range Impact: <strong>${this.collegesData.filter(c => effectiveScore >= c.sat_total_25 && effectiveScore <= c.sat_total_75).length}</strong> of 20 universities inside median band</span>
          </div>
        </div>
      ` : ''}

      <!-- Toolbar & Cost Metric Switcher -->
      <div class="colleges-toolbar">
        <div class="search-box">
          <span class="search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
          <input type="text" class="input-control" placeholder="Search by college name, city, or state..." oninput="CollegesEngine.setSearch(this.value)" value="${this.searchQuery}">
        </div>

        <!-- Filter Pills -->
        <div class="filter-pills">
          <button class="pill-btn ${this.activeFilter === 'all' ? 'active' : ''}" onclick="CollegesEngine.setFilter('all')">All Schools</button>
          <button class="pill-btn ${this.activeFilter === 'saved' ? 'active' : ''}" onclick="CollegesEngine.setFilter('saved')">Saved Only</button>
          <button class="pill-btn ${this.activeFilter === 'in-state' ? 'active' : ''}" onclick="CollegesEngine.setFilter('in-state')">In-State (${profile.residency})</button>
          <button class="pill-btn ${this.activeFilter === 'public' ? 'active' : ''}" onclick="CollegesEngine.setFilter('public')">Public</button>
          <button class="pill-btn ${this.activeFilter === 'private' ? 'active' : ''}" onclick="CollegesEngine.setFilter('private')">Private</button>
        </div>

        <!-- Equity Metric Toggle: Sticker vs Net Price -->
        <div class="colleges-cost-toggle">
          <button class="pill-btn colleges-cost-btn ${this.costMetric === 'tuition' ? 'active' : ''}" onclick="CollegesEngine.setCostMetric('tuition')">
            Sticker Tuition
          </button>
          <button class="pill-btn colleges-cost-btn ${this.costMetric === 'net_price' ? 'active' : ''}" onclick="CollegesEngine.setCostMetric('net_price')">
            Avg Net Cost (After Grants)
          </button>
        </div>
      </div>

      <!-- Cards Grid -->
      <div class="college-cards-grid" id="college-cards-grid">
        <!-- Rendered reactively -->
      </div>
    `;

    this.renderCards();
  },

  renderCards() {
    const grid = document.getElementById("college-cards-grid");
    if (!grid) return;

    const profile = ProfileManager.get();
    const eff = this.getEffectiveSat(profile);
    const hasBaseScore = eff.score !== null || this.simulatorActive;
    const baseScore = eff.score !== null ? eff.score : (this.simulatorActive ? 1200 : null);
    const studentScore = hasBaseScore ? Math.min(1600, Math.max(400, baseScore + this.simSatDelta)) : null;

    let filtered = this.collegesData.filter(c => {
      if (this.searchQuery) {
        const text = `${c.name} ${c.short_name} ${c.city} ${c.state}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }
      if (this.activeFilter === "saved") {
        return (profile.saved_colleges || []).includes(c.id);
      }
      if (this.activeFilter === "in-state") {
        return c.state === profile.residency;
      }
      if (this.activeFilter === "public") {
        return c.type === "Public";
      }
      if (this.activeFilter === "private") {
        return c.type === "Private";
      }
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="colleges-empty-state">
          <p>No universities found matching your filter.</p>
          <button class="btn-secondary" onclick="CollegesEngine.setFilter('all'); CollegesEngine.setSearch('');">Clear Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(col => {
      const isSaved = (profile.saved_colleges || []).includes(col.id);
      const appStatus = ProfileManager.getCollegeStatus ? ProfileManager.getCollegeStatus(col.id, profile) : "working";
      const completedExams = (profile.ap_exams || []).filter(e => e.status === "completed");
      const colSavings = (typeof CreditsEngine !== "undefined" && CreditsEngine.calculateCollegeSavings)
        ? CreditsEngine.calculateCollegeSavings(col, completedExams, profile.residency)
        : { credits: 0, tuitionSaved: 0 };
      const sch = (typeof AdmitAI !== "undefined" && AdmitAI.calculateCollegeScholarshipValue)
        ? AdmitAI.calculateCollegeScholarshipValue(col, profile, colSavings)
        : { statsMeritPerYr: 4000, ecAwardsPerYr: 3000, psatMeritPerYr: 0, totalPerYr: 7000, total4YrValue: 28000, programName: `${col.short_name} Merit & Leadership` };
      
      // Range calculation: SAT scale 900 to 1600
      const scaleMin = 900;
      const scaleMax = 1600;
      const scaleSpan = scaleMax - scaleMin;

      const p25 = col.sat_total_25;
      const p75 = col.sat_total_75;

      const leftPercent = Math.max(0, Math.min(100, ((p25 - scaleMin) / scaleSpan) * 100));
      const widthPercent = Math.max(2, Math.min(100 - leftPercent, ((p75 - p25) / scaleSpan) * 100));
      
      const dotPercent = hasBaseScore ? Math.max(0, Math.min(100, ((studentScore - scaleMin) / scaleSpan) * 100)) : 0;
      const originalDotPercent = (hasBaseScore && this.simulatorActive && this.simSatDelta !== 0) 
        ? Math.max(0, Math.min(100, ((baseScore - scaleMin) / scaleSpan) * 100)) 
        : null;

      // Range classification
      let verdictLabel = "In middle-50% range";
      let verdictClass = "in-range";
      let targetText = "";

      if (!hasBaseScore) {
        verdictLabel = "No Test Score";
        verdictClass = "below-range";
        targetText = `Enter SAT/ACT in your profile to plot against the ${p25}–${p75} middle-50% range.`;
      } else if (studentScore < p25) {
        verdictLabel = "Below middle-50% range";
        verdictClass = "below-range";
        const delta = p75 - studentScore;
        targetText = `Target: <strong>+${delta} pts</strong> to reach 75th percentile (${p75})`;
      } else if (studentScore > p75) {
        verdictLabel = "Above 75th percentile";
        verdictClass = "above-range";
        targetText = `Score exceeds 75th percentile by <strong>+${studentScore - p75} pts</strong>`;
      } else {
        const delta = p75 - studentScore;
        targetText = delta > 0 ? `Target: <strong>+${delta} pts</strong> to reach top of range (${p75})` : `At 75th percentile`;
      }

      // Cost display logic (Sticker vs Avg Net Price)
      const costHtml = this.costMetric === "net_price" ? `
        <span>Avg Annual Net Cost: <strong>$${(col.avg_cost || col.tuition_in_state).toLocaleString()}</strong> <span style="font-size: 0.7rem; color: var(--text-dim);">(After Federal Aid)</span></span>
      ` : `
        <span>In-State: <strong>$${col.tuition_in_state.toLocaleString()}</strong> / Out: <strong>$${col.tuition_out_of_state.toLocaleString()}</strong></span>
      `;

      return `
        <div class="college-card tf-college-card" id="college-card-${col.id}">
          <div class="college-card-header">
            <div class="college-title">
              <h3>${col.name}</h3>
              <div class="college-location">${col.city}, ${col.state} · ${col.type}</div>
            </div>
            <div class="tf-college-actions">
              ${isSaved ? `
                <button class="ob-score-pill ${appStatus === 'working' ? 'active' : ''}" onclick="AdmitAI.setCollegeStatus('${col.id}', 'working'); CollegesEngine.renderCards();" style="font-size: 0.72rem; padding: 0.25rem 0.55rem;">
                  🛠️ Working On It
                </button>
                <button class="ob-score-pill ${appStatus === 'submitted' ? 'active' : ''}" onclick="AdmitAI.setCollegeStatus('${col.id}', 'submitted'); CollegesEngine.renderCards();" style="font-size: 0.72rem; padding: 0.25rem 0.55rem; ${appStatus === 'submitted' ? 'background:#059669;border-color:#34D399;' : ''}">
                  ✅ Submitted
                </button>
              ` : ''}
              <button class="btn-secondary" onclick="CollegesEngine.toggleSave('${col.id}')" style="padding: 0.35rem 0.6rem; font-size: 0.82rem;" title="${isSaved ? 'Remove from saved' : 'Select college'}">
                ${isSaved ? '✓ Selected' : '+ Select'}
              </button>
            </div>
          </div>

          <!-- Personalized Scholarship & EC/Awards Earnings Box -->
          <div class="tf-sch-earnings-box">
            <div class="tf-sch-earnings-header">
              <strong class="tf-sch-earnings-val">
                💰 Est. Scholarship for You: $${sch.totalPerYr.toLocaleString()}/yr ($${sch.total4YrValue.toLocaleString()} 4-Yr)
              </strong>
              <span class="tf-sch-earnings-ec">
                🏅 ECs &amp; Awards: +$${sch.ecAwardsPerYr.toLocaleString()}/yr
              </span>
            </div>
            <div class="tf-sch-earnings-detail">
              📊 Stats Merit: $${sch.statsMeritPerYr.toLocaleString()}/yr${sch.psatMeritPerYr > 0 ? ` · 🎓 PSAT Bonus: +$${sch.psatMeritPerYr.toLocaleString()}/yr` : ''} · ${sch.programName}
            </div>
          </div>

          <!-- SAT Middle-50% Range Bar Chart -->
          <div class="range-chart-container">
            <div class="range-chart-title">
              <span>Middle-50% SAT (${p25} – ${p75})</span>
              <span class="range-verdict ${verdictClass}">${verdictLabel}</span>
            </div>

            <div class="range-track">
              <!-- Middle 50% shaded band -->
              <div class="range-middle-band" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
              
              <!-- 25th and 75th labels -->
              <span class="range-tick-25" style="left: ${leftPercent}%;">${p25}</span>
              <span class="range-tick-75" style="left: ${leftPercent + widthPercent}%;">${p75}</span>

              <!-- Baseline Ghost Dot (If simulator active) -->
              ${originalDotPercent !== null ? `
                <div class="student-dot-ghost" style="left: ${originalDotPercent}%; position: absolute; top: 50%; width: 12px; height: 12px; background: rgba(255,255,255,0.4); border: 1px dashed #FFFFFF; border-radius: 50%; transform: translate(-50%, -50%); z-index: 4;" title="Original Baseline: ${baseScore}"></div>
              ` : ''}

              <!-- Active Student Dot -->
              ${hasBaseScore ? `
                <div class="student-dot" style="left: ${dotPercent}%;" title="${this.simulatorActive ? `Simulated SAT: ${studentScore}` : eff.label}">
                  <div class="student-dot-label">${this.simulatorActive ? `Sim: ${studentScore}` : (eff.isActConcordance ? `ACT ${profile.act_composite}` : `You: ${studentScore}`)}</div>
                </div>
              ` : ''}
            </div>

            <div class="range-target-hint">
              <span>${targetText}</span>
            </div>
          </div>

          <!-- Quick Metrics Grid -->
          <div class="college-metrics-grid">
            <div class="metric-item">
              <div class="val">${(col.admit_rate * 100).toFixed(0)}%</div>
              <div class="lbl">Admit Rate</div>
            </div>
            <div class="metric-item">
              <div class="val">${col.act_composite_25}–${col.act_composite_75}</div>
              <div class="lbl">ACT Middle-50%</div>
            </div>
            <div class="metric-item">
              <div class="val">${(col.grad_rate * 100).toFixed(0)}%</div>
              <div class="lbl">Grad Rate</div>
            </div>
          </div>

          <!-- Tuition / Net Cost & Scorecard Source -->
          <div class="college-card-footer">
            ${costHtml}
            <a href="${col.scorecard_source_url}" target="_blank" rel="noopener noreferrer" class="badge-source">
              Dept. of Ed Scorecard ↗
            </a>
          </div>

          <!-- Card Actions -->
          <div class="college-card-actions">
            <button class="btn-secondary colleges-view-credits-btn" onclick="App.switchToCreditsTabForCollege('${col.id}')">
              View AP/IB Credit Policy & Tuition Saved →
            </button>
          </div>
        </div>
      `;
    }).join('');

    const badge = document.getElementById("compare-badge");
    if (badge) badge.innerText = (profile.saved_colleges || []).length;
  },

  toggleSave(collegeId) {
    const isNowSaved = ProfileManager.toggleSavedCollege(collegeId);
    App.showToast(isNowSaved ? "Added to saved colleges" : "Removed from saved colleges", "success");
    this.renderCards();
    const profile = ProfileManager.get();
    StatusEngine.render("status-tab-content", profile, this.collegesData);
  },

  openComparisonModal() {
    const profile = ProfileManager.get();
    const savedIds = profile.saved_colleges || [];

    if (savedIds.length === 0) {
      App.showToast("Save at least 1 college to compare side-by-side.", "warning");
      return;
    }

    const modal = document.getElementById("comparison-modal");
    const container = document.getElementById("comparison-modal-body");
    if (!modal || !container) return;

    const savedSchools = this.collegesData.filter(c => savedIds.includes(c.id)).slice(0, 5);
    const eff = this.getEffectiveSat(profile);
    const studentScore = eff.score;

    container.innerHTML = `
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th style="text-align: left; min-width: 150px;">Metric</th>
              ${savedSchools.map(s => `
                <th style="min-width: 160px;">
                  <div style="font-weight: 700; font-size: 0.95rem;">${s.short_name}</div>
                  <div style="font-size: 0.72rem; color: var(--text-dim);">${s.city}, ${s.state} · ${s.type}</div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="feature-title">Middle-50% SAT Range</td>
              ${savedSchools.map(s => `
                <td>
                  <strong style="color: #60A5FA;">${s.sat_total_25} – ${s.sat_total_75}</strong>
                  <div style="font-size: 0.72rem; color: ${!studentScore ? 'var(--text-dim)' : studentScore >= s.sat_total_25 && studentScore <= s.sat_total_75 ? 'var(--success)' : studentScore > s.sat_total_75 ? '#93C5FD' : 'var(--warning)'}; margin-top: 2px;">
                    ${!studentScore ? 'No score entered' : studentScore < s.sat_total_25 ? `Below (-${s.sat_total_25 - studentScore})` : studentScore > s.sat_total_75 ? `Above (+${studentScore - s.sat_total_75})` : 'In Range'}
                  </div>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="feature-title">Middle-50% ACT Range</td>
              ${savedSchools.map(s => `<td><strong>${s.act_composite_25} – ${s.act_composite_75}</strong></td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Undergraduate Admission Rate</td>
              ${savedSchools.map(s => `<td><strong style="font-size: 1.05rem;">${(s.admit_rate * 100).toFixed(0)}%</strong></td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">In-State Tuition</td>
              ${savedSchools.map(s => `<td>$${s.tuition_in_state.toLocaleString()} / yr</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Out-of-State Tuition</td>
              ${savedSchools.map(s => `<td>$${s.tuition_out_of_state.toLocaleString()} / yr</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Avg Annual Net Cost (After Grants)</td>
              ${savedSchools.map(s => `<td><strong style="color: #34D399;">$${(s.avg_cost || s.tuition_in_state).toLocaleString()}</strong></td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Undergraduate Graduation Rate</td>
              ${savedSchools.map(s => `<td>${(s.grad_rate * 100).toFixed(0)}%</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Undergraduate Enrollment</td>
              ${savedSchools.map(s => `<td>${s.student_size.toLocaleString()} students</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Early / Priority Deadline</td>
              ${savedSchools.map(s => `<td><strong style="color: #93C5FD;">${s.early_deadline || 'See Regular'}</strong></td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Regular Decision Deadline</td>
              ${savedSchools.map(s => `<td><strong>${s.regular_deadline || 'Jan 1'}</strong></td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Priority Scholarship Cutoff</td>
              ${savedSchools.map(s => `<td style="color: #FCD34D; font-size: 0.78rem;">${s.scholarship_deadline || s.early_deadline || 'Automatic review'}</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Official Scorecard Source</td>
              ${savedSchools.map(s => `<td><a href="${s.scorecard_source_url}" target="_blank" rel="noopener noreferrer" class="badge-source">Scorecard ↗</a></td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    modal.classList.add("open");
  }
};
