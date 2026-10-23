/**
 * Tab 3: AP/IB Credit & Tuition ROI Calculator
 * Evaluates student AP/IB exams against official university testing services credit tables.
 * Calculates credit hours earned, replaced course codes, and estimated tuition dollars saved.
 */

const CreditsEngine = {
  apData: null,
  selectedCollegeId: "ut-austin",

  async init() {
    try {
      const res = await fetch("data/ap_credit_rules.json");
      this.apData = await res.json();
    } catch (e) {
      console.error("Failed to load AP credit data", e);
    }
  },

  selectCollege(collegeId) {
    this.selectedCollegeId = collegeId;
    const profile = ProfileManager.get();
    this.render("credits-tab-content", profile);
  },

  render(containerId, profile) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!this.apData) {
      container.innerHTML = `<div class="card"><p>Loading AP credit tables...</p></div>`;
      return;
    }

    const colleges = CollegesEngine.getAll();
    const college = colleges.find(c => c.id === this.selectedCollegeId) || colleges[0];
    if (!college) return;

    // Get policies for this college
    const collegePolicy = this.apData.policies[college.id] || { rules: [], source_url: college.scorecard_source_url };
    const rules = collegePolicy.rules || [];

    // Calculate earned credits for completed exams
    let totalCreditsEarned = 0;
    const earnedRows = [];
    const completedExams = (profile.ap_exams || []).filter(e => e.status === "completed");
    const plannedExams = (profile.ap_exams || []).filter(e => e.status === "planned");

    for (const studentExam of completedExams) {
      // Find matching rules for this exam
      const matchingRules = rules.filter(r => r.exam_id === studentExam.id && studentExam.score >= r.min_score);
      // Pick rule that matches best score (highest min_score <= studentExam.score)
      if (matchingRules.length > 0) {
        // sort by min_score descending
        matchingRules.sort((a, b) => b.min_score - a.min_score);
        const bestRule = matchingRules[0];
        totalCreditsEarned += bestRule.credit_hours;
        earnedRows.push({
          exam: studentExam,
          rule: bestRule,
          qualifies: true
        });
      } else {
        // Did not meet minimum score
        // Find minimum score needed
        const minReqRule = rules.filter(r => r.exam_id === studentExam.id).sort((a, b) => a.min_score - b.min_score)[0];
        earnedRows.push({
          exam: studentExam,
          rule: minReqRule || null,
          qualifies: false,
          minRequired: minReqRule ? minReqRule.min_score : 4
        });
      }
    }

    // Determine tuition rate (in-state vs out-of-state)
    const isResident = profile.residency === college.state;
    const costPerCredit = isResident ? college.cost_per_credit_hour_in_state : college.cost_per_credit_hour_out_of_state;
    const totalTuitionSaved = totalCreditsEarned * costPerCredit;
    const semestersSaved = (totalCreditsEarned / 15).toFixed(1); // Standard college semester = 15 credits

    container.innerHTML = `
      <div class="section-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2>What are my exams worth?</h2>
            <p>Every university sets its own AP/IB credit cutoffs. See your replaced college course codes and real tuition dollars saved.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label style="font-size: 0.82rem; color: var(--text-muted); font-weight: 600;">Selected College:</label>
            <select class="select-control" style="width: auto; font-size: 0.85rem;" onchange="CreditsEngine.selectCollege(this.value)">
              ${colleges.map(c => `
                <option value="${c.id}" ${c.id === college.id ? 'selected' : ''}>${c.name} (${c.state})</option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Real-Time Tuition & Credits ROI Banner -->
      <div class="credit-banner">
        <div class="credit-banner-title">
          <h3>${college.name}</h3>
          <p>Tuition Rate Applied: <strong>${isResident ? 'In-State ($' + costPerCredit + '/credit)' : 'Out-of-State ($' + costPerCredit + '/credit)'}</strong></p>
          <div style="margin-top: 0.5rem;">
            <a href="${collegePolicy.source_url}" target="_blank" rel="noopener noreferrer" class="badge-source">
              Official University Credit Chart ↗
            </a>
          </div>
        </div>

        <div class="credit-stat-card">
          <div class="number">${totalCreditsEarned}</div>
          <div class="desc">College Credits Earned</div>
        </div>

        <div class="credit-stat-card">
          <div class="number">${semestersSaved}</div>
          <div class="desc">Semesters Skipped (~15 cr/sem)</div>
        </div>

        <div class="credit-stat-card">
          <div class="number green">$${totalTuitionSaved.toLocaleString()}</div>
          <div class="desc">Estimated Tuition Saved</div>
        </div>
      </div>

      <!-- Completed Exams Equivalency Table -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
        <h3 style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF;">Completed Exam Equivalencies</h3>
        <button class="btn-secondary" onclick="App.openProfileModal()" style="font-size: 0.78rem;">
          + Add / Edit AP Scores
        </button>
      </div>

      <div class="credit-table-container">
        <table class="credit-table">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Your Score</th>
              <th>Status</th>
              <th>Course Equivalent Replaced</th>
              <th>Credits Awarded</th>
              <th>Policy Notes</th>
            </tr>
          </thead>
          <tbody>
            ${earnedRows.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                  No completed AP exams entered yet. Click "+ Add / Edit AP Scores" to test your courses.
                </td>
              </tr>
            ` : earnedRows.map(row => {
              if (row.qualifies) {
                return `
                  <tr>
                    <td>
                      <div class="exam-pill">
                        <span>${row.exam.name}</span>
                      </div>
                    </td>
                    <td>
                      <span class="score-badge score-${row.exam.score}">${row.exam.score}</span>
                    </td>
                    <td>
                      <span style="color: var(--success); font-weight: 700; font-size: 0.78rem; letter-spacing: 0.03em;">CREDIT GRANTED</span>
                    </td>
                    <td>
                      <span class="course-code-tag">${row.rule.course_code}</span>
                    </td>
                    <td>
                      <strong style="color: #60A5FA;">+${row.rule.credit_hours} Credits</strong>
                      <span style="font-size: 0.72rem; color: var(--text-dim); display: block;">~$${(row.rule.credit_hours * costPerCredit).toLocaleString()} val</span>
                    </td>
                    <td style="font-size: 0.8rem; color: var(--text-muted);">
                      ${row.rule.notes}
                    </td>
                  </tr>
                `;
              } else {
                return `
                  <tr>
                    <td>
                      <div class="exam-pill">
                        <span>${row.exam.name}</span>
                      </div>
                    </td>
                    <td>
                      <span class="score-badge score-${row.exam.score}">${row.exam.score}</span>
                    </td>
                    <td>
                      <span style="color: var(--warning); font-weight: 600; font-size: 0.78rem; letter-spacing: 0.03em;">BELOW CUTOFF</span>
                    </td>
                    <td style="color: var(--text-dim); font-size: 0.85rem;">
                      None (Requires score of ${row.minRequired}+)
                    </td>
                    <td style="color: var(--text-dim);">0 Credits</td>
                    <td style="font-size: 0.8rem; color: var(--text-dim);">
                      ${college.short_name} requires at least a ${row.minRequired} on this exam for academic credit.
                    </td>
                  </tr>
                `;
              }
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Score Needed / Planned Exams Section -->
      <div style="margin-top: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 0.75rem;">
          <div>
            <h3 style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF;">Target Scores Needed for Upcoming Exams</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted);">What you need to score on your planned exams to unlock additional credit at ${college.short_name}.</p>
          </div>
        </div>

        <div class="future-targets-grid">
          ${plannedExams.length === 0 ? `
            <div class="card" style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 1.5rem;">
              No planned exams registered. You can add future AP classes in your profile to simulate upcoming savings.
            </div>
          ` : plannedExams.map(planned => {
            const possibleRules = rules.filter(r => r.exam_id === planned.id);
            if (possibleRules.length === 0) {
              return `
                <div class="future-target-card">
                  <h4>${planned.name}</h4>
                  <p style="font-size: 0.8rem; color: var(--text-dim);">University policy under review or handled departmental evaluation.</p>
                </div>
              `;
            }
            possibleRules.sort((a, b) => a.min_score - b.min_score);
            const baseRule = possibleRules[0];
            return `
              <div class="future-target-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <h4>${planned.name}</h4>
                  <span class="score-badge score-planned">Planned</span>
                </div>
                <div style="font-size: 0.84rem; color: var(--text-main); margin-top: 0.35rem;">
                  Score a <strong>${baseRule.min_score}+</strong> to earn:
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center; margin: 0.25rem 0;">
                  <span class="course-code-tag">${baseRule.course_code}</span>
                  <span style="color: var(--success); font-weight: 700; font-size: 0.85rem;">+${baseRule.credit_hours} Credits</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-muted);">
                  Saves approx. <strong style="color: #60A5FA;">$${(baseRule.credit_hours * costPerCredit).toLocaleString()}</strong> in course tuition. ${baseRule.notes}
                </p>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Legal Context Box -->
      <div class="card" style="margin-top: 2rem; background: rgba(30, 41, 59, 0.4); border-left: 4px solid #60A5FA;">
        <div style="font-size: 0.82rem; font-weight: 700; color: #93C5FD; margin-bottom: 0.25rem;">
          Nationwide State Higher Education Credit Statutes
        </div>
        <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
          <strong>Over 30 States Nationwide:</strong> State legislation across the U.S. (including California AB 1985, Illinois Public Act 099-0358, Ohio ORC 3333.163, Florida Title XLVIII, and Texas HB 1992) mandates that public colleges and universities award undergraduate course credit for AP exam scores of 3 or higher, preventing arbitrary departmental denials and guaranteeing student tuition savings.
        </p>
      </div>
    `;
  }
};
