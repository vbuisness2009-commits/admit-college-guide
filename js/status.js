/**
 * Tab 1: Status & Automatic Admission Engine
 * Evaluates published state admission statutes (California UC ELC, Washington GAP, Georgia Match,
 * Florida Talented 20, Texas Top 10%, and National College Readiness Placement)
 * against the student's verified profile data.
 */

const StatusEngine = {
  rulesData: [],

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

    for (const criterion of rule.criteria) {
      let isMet = false;

      if (criterion.subcriteria_type === "any") {
        for (const sub of criterion.subcriteria) {
          if (sub.operator === "all_true") {
            const pass = sub.fields.every(f => {
              if (f === "science_years") return (profile[f] || 0) >= 3;
              return !!profile[f];
            });
            if (pass) { isMet = true; break; }
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
        isMet = criterion.fields.every(f => {
          if (f === "science_years") return (profile[f] || 0) >= 3;
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

    const studentState = profile.residency || "CA";

    container.innerHTML = `
      <!-- AI Quick Callout Banner -->
      <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 28px; height: 28px; border-radius: 6px; background: var(--primary); color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em;">
            AI
          </div>
          <div>
            <strong style="color: #FFFFFF; font-size: 0.92rem;">Admit AI Nationwide Eligibility Scanner Active</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 1px;">
              Multi-vector analysis of your GPA, test scores, and coursework against official state public university admission laws.
            </p>
          </div>
        </div>
        <button class="btn-primary" style="font-size: 0.8rem; padding: 0.45rem 0.9rem;" onclick="App.switchTab('ai')">
          Launch Full AI Audit & Advisor →
        </button>
      </div>

      <div class="status-grid">
        <!-- Profile Summary Column -->
        <div class="profile-summary-box">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.75rem;">
            <div>
              <h3 style="font-size: 1.1rem; color: #FFFFFF; font-weight: 700;">Student Snapshot</h3>
              <p style="font-size: 0.75rem; color: var(--text-muted);">Grade ${profile.grade_level || "11"} · ${profile.residency || "US"} Resident</p>
            </div>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <button class="btn-primary" onclick="App.openExportModal()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;">
                Export Dossier
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
            <span class="stat-label">Core College Prep Curriculum</span>
            <span class="stat-value" style="color: ${profile.math_years_algebra2 && (profile.science_years || 0) >= 3 ? 'var(--success)' : 'var(--warning)'}; font-size: 0.85rem;">
              ${profile.math_years_algebra2 && (profile.science_years || 0) >= 3 ? 'On Track (Math + Science)' : 'Incomplete'}
            </span>
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
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); padding: 0.35rem 0.6rem; border-radius: 6px; font-size: 0.8rem;">
                    <span>${c.short_name} (${c.state})</span>
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
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 700; color: #FFFFFF;">State Statutory Automatic Admission Status</h3>
                <p style="font-size: 0.82rem; color: var(--text-muted);">
                  Legally mandated guaranteed public university admission programs and national direct placement criteria.
                </p>
              </div>
              <select id="state-rules-selector" class="select-control" style="width: auto; font-size: 0.8rem; padding: 0.4rem 0.75rem;" onchange="StatusEngine.onStateFilterChange(this.value)">
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
        <div class="rule-card" style="margin-bottom: 1rem;">
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

            <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--text-dim); margin-bottom: 0.5rem; letter-spacing: 0.04em;">
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
