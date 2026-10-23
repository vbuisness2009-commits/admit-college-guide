/**
 * Tab 2: Colleges & Published Score Ranges
 * Visualizes official middle-50% SAT/ACT percentile bars from U.S. Dept. of Education College Scorecard.
 * Strictly descriptive: "Below range / In range / Above range", with target points needed to reach 75th percentile.
 */

const CollegesEngine = {
  collegesData: [],
  activeFilter: "all",
  searchQuery: "",

  async init() {
    try {
      const res = await fetch("data/colleges.json");
      this.collegesData = await res.json();
    } catch (e) {
      console.error("Failed to load colleges data", e);
    }
  },

  getAll() {
    return this.collegesData;
  },

  getCollege(id) {
    return this.collegesData.find(c => c.id === id);
  },

  setFilter(filter) {
    this.activeFilter = filter;
    this.renderCards();
  },

  setSearch(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.renderCards();
  },

  render(containerId, profile) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="section-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2>What should I aim for?</h2>
            <p>Compare your test scores against the official middle-50% published ranges from the U.S. Dept. of Education College Scorecard.</p>
          </div>
          <button class="compare-counter-pill" id="compare-modal-btn" onclick="CollegesEngine.openComparisonModal()">
            <span>Compare Saved</span>
            <span class="tab-badge" id="compare-badge">${profile.saved_colleges ? profile.saved_colleges.length : 0}</span>
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="colleges-toolbar">
        <div class="search-box">
          <span class="search-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
          <input type="text" class="input-control" placeholder="Search by college name, city, or state..." oninput="CollegesEngine.setSearch(this.value)" value="${this.searchQuery}">
        </div>

        <div class="filter-pills">
          <button class="pill-btn ${this.activeFilter === 'all' ? 'active' : ''}" onclick="CollegesEngine.setFilter('all')">All Schools</button>
          <button class="pill-btn ${this.activeFilter === 'saved' ? 'active' : ''}" onclick="CollegesEngine.setFilter('saved')">Saved Only</button>
          <button class="pill-btn ${this.activeFilter === 'in-state' ? 'active' : ''}" onclick="CollegesEngine.setFilter('in-state')">In-State (${profile.residency})</button>
          <button class="pill-btn ${this.activeFilter === 'public' ? 'active' : ''}" onclick="CollegesEngine.setFilter('public')">Public</button>
          <button class="pill-btn ${this.activeFilter === 'private' ? 'active' : ''}" onclick="CollegesEngine.setFilter('private')">Private</button>
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
    const hasScore = profile.sat_total !== null && profile.sat_total !== undefined && profile.sat_total > 0;
    const studentScore = hasScore ? profile.sat_total : null;

    // Filter logic
    let filtered = this.collegesData.filter(c => {
      // Search
      if (this.searchQuery) {
        const text = `${c.name} ${c.short_name} ${c.city} ${c.state}`.toLowerCase();
        if (!text.includes(this.searchQuery)) return false;
      }
      // Filter pills
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
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-dim);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No universities found matching your filter.</p>
          <button class="btn-secondary" onclick="CollegesEngine.setFilter('all'); CollegesEngine.setSearch('');">Clear Filters</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(col => {
      const isSaved = (profile.saved_colleges || []).includes(col.id);
      
      // Range calculation: SAT scale 800 to 1600 (min 800, max 1600 = span of 800)
      const scaleMin = 900;
      const scaleMax = 1600;
      const scaleSpan = scaleMax - scaleMin;

      const p25 = col.sat_total_25;
      const p75 = col.sat_total_75;

      const leftPercent = Math.max(0, Math.min(100, ((p25 - scaleMin) / scaleSpan) * 100));
      const widthPercent = Math.max(2, Math.min(100 - leftPercent, ((p75 - p25) / scaleSpan) * 100));
      const dotPercent = hasScore ? Math.max(0, Math.min(100, ((studentScore - scaleMin) / scaleSpan) * 100)) : 0;

      // Range classification
      let verdictLabel = "In middle-50% range";
      let verdictClass = "in-range";
      let targetText = "";

      if (!hasScore) {
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

      return `
        <div class="college-card">
          <div class="college-card-header">
            <div class="college-title">
              <h3>${col.name}</h3>
              <div class="college-location">${col.city}, ${col.state} · ${col.type}</div>
            </div>
            <button class="btn-secondary" onclick="CollegesEngine.toggleSave('${col.id}')" style="padding: 0.35rem 0.6rem; font-size: 0.85rem;" title="${isSaved ? 'Remove from saved' : 'Save to compare'}">
              ${isSaved ? 'Saved' : 'Save'}
            </button>
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

              <!-- Student Dot (Rendered only if test score exists) -->
              ${hasScore ? `
                <div class="student-dot" style="left: ${dotPercent}%;" title="Your SAT: ${studentScore}">
                  <div class="student-dot-label">You: ${studentScore}</div>
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

          <!-- Tuition & Scorecard Source -->
          <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
            <span>In-State: <strong>$${col.tuition_in_state.toLocaleString()}</strong> / Out: <strong>$${col.tuition_out_of_state.toLocaleString()}</strong></span>
            <a href="${col.scorecard_source_url}" target="_blank" rel="noopener noreferrer" class="badge-source">
              Dept. of Ed Scorecard ↗
            </a>
          </div>

          <!-- Card Actions -->
          <div class="college-card-actions">
            <button class="btn-secondary" style="font-size: 0.78rem; width: 100%; justify-content: center;" onclick="App.switchToCreditsTabForCollege('${col.id}')">
              View AP/IB Credit Policy & Tuition Saved →
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Update compare counter badge
    const badge = document.getElementById("compare-badge");
    if (badge) badge.innerText = (profile.saved_colleges || []).length;
  },

  toggleSave(collegeId) {
    const isNowSaved = ProfileManager.toggleSavedCollege(collegeId);
    App.showToast(isNowSaved ? "Added to saved colleges" : "Removed from saved colleges", "success");
    this.renderCards();
    // Also re-render status tab if open
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
    const studentScore = profile.sat_total || 1200;

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
                  <div style="font-size: 0.72rem; color: ${studentScore >= s.sat_total_25 && studentScore <= s.sat_total_75 ? 'var(--success)' : studentScore > s.sat_total_75 ? '#93C5FD' : 'var(--warning)'}; margin-top: 2px;">
                    ${studentScore < s.sat_total_25 ? `Below (-${s.sat_total_25 - studentScore})` : studentScore > s.sat_total_75 ? `Above (+${studentScore - s.sat_total_75})` : 'In Range'}
                  </div>
                </td>
              `).join('')}
            </tr>
            <tr>
              <td class="feature-title">Middle-50% ACT Range</td>
              ${savedSchools.map(s => `<td><strong>${s.act_composite_25} – ${s.act_composite_75}</strong></td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Admission Rate</td>
              ${savedSchools.map(s => `<td><strong style="color: #FFFFFF;">${(s.admit_rate * 100).toFixed(0)}%</strong></td>`).join('')}
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
              <td class="feature-title">Per Credit Hour (In-State)</td>
              ${savedSchools.map(s => `<td>$${s.cost_per_credit_hour_in_state}</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Graduation Rate (6-Year)</td>
              ${savedSchools.map(s => `<td>${(s.grad_rate * 100).toFixed(0)}%</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Average Net Price / Year</td>
              ${savedSchools.map(s => `<td>$${s.avg_cost.toLocaleString()}</td>`).join('')}
            </tr>
            <tr>
              <td class="feature-title">Official Scorecard Link</td>
              ${savedSchools.map(s => `
                <td>
                  <a href="${s.scorecard_source_url}" target="_blank" rel="noopener noreferrer" class="badge-source">
                    Scorecard ↗
                  </a>
                </td>
              `).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    modal.classList.add("open");
  }
};
