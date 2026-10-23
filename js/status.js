/**
 * Tab 1: Status & Automatic Admission Engine
 * Evaluates published state admission statutes (Texas Top 10%/UT Top 5%, UC ELC, FL Talented Twenty)
 * against the student's verified profile data.
 */

const StatusEngine = {
  rulesData: [],

  async init() {
    try {
      const res = await fetch("data/state_rules.json");
      this.rulesData = await res.json();
    } catch (e) {
      console.error("Failed to load state rules data", e);
    }
  },

  evaluateRule(rule, profile) {
    let allMet = true;
    const evaluatedCriteria = [];

    for (const criterion of rule.criteria) {
      let isMet = false;

      if (criterion.subcriteria_type === "any") {
        // Any subcriteria can be satisfied
        for (const sub of criterion.subcriteria) {
          if (sub.operator === "all_true") {
            const pass = sub.fields.every(f => {
              if (f === "science_years") return (profile[f] || 0) >= 4;
              return !!profile[f];
            });
            if (pass) { isMet = true; break; }
          } else if (sub.operator === "sat_benchmark_check") {
            const rw = profile.sat_rw || 0;
            const m = profile.sat_m || 0;
            if (rw >= 480 && m >= 530) { isMet = true; break; }
          } else if (sub.operator === "act_benchmark_check") {
            if ((profile.act_composite || 0) >= 23) { isMet = true; break; }
          }
        }
      } else if (criterion.operator === "equals") {
        isMet = profile[criterion.field] === criterion.value;
      } else if (criterion.operator === "lte") {
        isMet = (profile[criterion.field] !== undefined && profile[criterion.field] !== null) && profile[criterion.field] <= criterion.value;
      } else if (criterion.operator === "gte") {
        isMet = (profile[criterion.field] !== undefined && profile[criterion.field] !== null) && profile[criterion.field] >= criterion.value;
      } else if (criterion.operator === "all_true") {
        isMet = criterion.fields.every(f => {
          if (f === "science_years") return (profile[f] || 0) >= 4;
          return !!profile[f];
        });
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
      criteria: evaluatedCriteria
    };
  },

  render(containerId, profile, collegesData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!this.rulesData || this.rulesData.length === 0) {
      container.innerHTML = `<div class="card"><p>Loading state admission statutory data...</p></div>`;
      return;
    }

    // Filter rules relevant to student state or show all
    const relevantRules = this.rulesData.filter(r => r.state === (profile.residency === "TX" ? "Texas" : profile.residency === "CA" ? "California" : profile.residency === "FL" ? "Florida" : "Texas"));

    // Render HTML
    container.innerHTML = `
      <div class="status-grid">
        <!-- Profile Summary Column -->
        <div class="profile-summary-box">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
            <div>
              <h3 style="font-size: 1.1rem; color: #FFFFFF; font-weight: 700;">Student Snapshot</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Grade ${profile.grade_level || "11"} · ${profile.residency || "US"} Resident</p>
            </div>
            <button class="btn-secondary" onclick="App.openProfileModal()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
              Edit Profile
            </button>
          </div>

          <div class="stat-row">
            <span class="stat-label">Class Rank</span>
            <span class="stat-value">${profile.class_rank ? `${profile.class_rank} / ${profile.class_size}` : "Unranked"} <span style="font-size: 0.8rem; color: #60A5FA;">(Top ${profile.class_percentile}%)</span></span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Unweighted GPA</span>
            <span class="stat-value">${profile.gpa_unweighted ? profile.gpa_unweighted.toFixed(2) : "N/A"} <span style="font-size: 0.75rem; color: var(--text-dim);">/ 4.0</span></span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Weighted GPA</span>
            <span class="stat-value">${profile.gpa_weighted ? profile.gpa_weighted.toFixed(2) : "N/A"}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">SAT Score</span>
            <span class="stat-value">${profile.sat_total || "N/A"} <span style="font-size: 0.75rem; color: var(--text-dim);">(ERW ${profile.sat_rw || 0} / M ${profile.sat_m || 0})</span></span>
          </div>

          <div class="stat-row">
            <span class="stat-label">ACT Composite</span>
            <span class="stat-value">${profile.act_composite || "N/A"}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Distinguished Diploma Track</span>
            <span class="stat-value" style="color: ${profile.math_years_algebra2 && profile.science_years >= 4 && profile.has_endorsement ? 'var(--success)' : 'var(--warning)'}; font-size: 0.85rem;">
              ${profile.math_years_algebra2 && profile.science_years >= 4 && profile.has_endorsement ? '✓ On Track (4 Math + 4 Sci)' : '⚠ Missing Coursework'}
            </span>
          </div>

          <div class="stat-row">
            <span class="stat-label">AP/IB Exams</span>
            <span class="stat-value" style="font-size: 0.85rem;">${(profile.ap_exams || []).filter(e => e.status === 'completed').length} completed, ${(profile.ap_exams || []).filter(e => e.status === 'planned').length} planned</span>
          </div>

          <div style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.08);">
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">Target College List (${profile.saved_colleges ? profile.saved_colleges.length : 0})</div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              ${(profile.saved_colleges || []).map(id => {
                const c = (collegesData || []).find(col => col.id === id);
                if (!c) return '';
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 0.35rem 0.6rem; border-radius: 6px; font-size: 0.8rem;">
                    <span>${c.short_name}</span>
                    <span style="font-family: monospace; font-size: 0.75rem; color: var(--text-dim);">${(c.admit_rate * 100).toFixed(0)}% admit</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Rules & Automatic Admission Column -->
        <div class="rules-container">
          <div style="margin-bottom: 0.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #FFFFFF;">State Statutory Automatic Admission Status</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">
                  Official, legally mandated guaranteed admission policies based on state statutes. No speculative chances.
                </p>
              </div>
              <select id="state-rules-selector" class="select-control" style="width: auto; font-size: 0.8rem; padding: 0.4rem 0.75rem;" onchange="StatusEngine.onStateFilterChange(this.value)">
                <option value="TX" ${profile.residency === 'TX' ? 'selected' : ''}>Texas Rules</option>
                <option value="CA" ${profile.residency === 'CA' ? 'selected' : ''}>California Rules</option>
                <option value="FL" ${profile.residency === 'FL' ? 'selected' : ''}>Florida Rules</option>
                <option value="ALL">Show All States</option>
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

  renderEvaluatedRules(profile, overrideState = null) {
    const filterState = overrideState || (profile.residency === "TX" ? "TX" : profile.residency === "CA" ? "CA" : profile.residency === "FL" ? "FL" : "ALL");
    
    const rulesToDisplay = this.rulesData.filter(r => {
      if (filterState === "ALL") return true;
      if (filterState === "TX") return r.state === "Texas";
      if (filterState === "CA") return r.state === "California";
      if (filterState === "FL") return r.state === "Florida";
      return true;
    });

    return rulesToDisplay.map(rule => {
      const result = this.evaluateRule(rule, profile);
      const isQualified = result.isQualified;

      return `
        <div class="rule-card" style="margin-bottom: 1rem;">
          <div class="rule-header">
            <div class="rule-title">
              <h3>${rule.name}</h3>
              <div class="statute">Statute: ${rule.statute}</div>
            </div>
            <div class="rule-status-badge ${isQualified ? 'qualified' : 'not-qualified'}">
              ${isQualified ? '✓ STATUTORILY QUALIFIED' : '⚠ CRITERIA MISSING'}
            </div>
          </div>
          <div class="rule-body">
            <p class="rule-desc">${rule.description}</p>

            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-dim); margin-bottom: 0.5rem; letter-spacing: 0.04em;">
              Statutory Qualification Checklist:
            </div>

            <div class="criteria-list">
              ${result.criteria.map(c => `
                <div class="criteria-item ${c.isMet ? 'met' : 'unmet'}">
                  <div class="criteria-icon">${c.isMet ? '✓' : '✗'}</div>
                  <div class="criteria-text">
                    <div class="criteria-label">${c.label}</div>
                    ${c.fix ? `<div class="criteria-fix"><strong>Single Fix Needed:</strong> ${c.fix}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.75rem;">
              <span style="font-size: 0.75rem; color: var(--text-dim);">Applies to: ${rule.applicable_universities.slice(0, 3).join(', ')}${rule.applicable_universities.length > 3 ? '...' : ''}</span>
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
