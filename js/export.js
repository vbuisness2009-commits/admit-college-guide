/**
 * Student Summary & Credit Report (Export Module)
 * Builds a clean, printable academic report from the student's profile,
 * state admission rules, College Scorecard ranges, and AP credit policies.
 */

const DossierExporter = {
  open() {
    const modal = document.getElementById("dossier-modal");
    const body = document.getElementById("dossier-modal-body");
    if (!modal || !body) return;

    const profile = ProfileManager.get();
    const colleges = CollegesEngine.getAll();
    const rules = StatusEngine.rulesData;
    const apData = CreditsEngine.apData;

    body.innerHTML = this.generateDossierHTML(profile, colleges, rules, apData);
    modal.classList.add("open");
  },

  close() {
    const modal = document.getElementById("dossier-modal");
    if (modal) modal.classList.remove("open");
  },

  print() {
    window.print();
  },

  generateDossierHTML(profile, collegesData, rulesData, apData) {
    const user = Auth.getCurrentUser();
    const studentName = escapeHTML(user ? user.name : "Student");
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const dossierId = "ADMIT-2026-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const currentGrade = profile.grade_level || 11;
    const residency = profile.residency || "US";
    const eff = CollegesEngine.getEffectiveSat(profile);
    const studentSat = eff.score;
    const studentGpa = profile.gpa_unweighted ? profile.gpa_unweighted.toFixed(2) : "Not entered";
    const rankStr = profile.class_rank ? `${profile.class_rank} / ${profile.class_size} (Top ${profile.class_percentile}%)` : "Unranked";

    const relevantRules = (rulesData || []).filter(r => r.state_code === residency || r.state_code === "ALL");
    const evaluatedRules = relevantRules.map(r => StatusEngine.evaluateRule(r, profile));
    const savedColleges = (collegesData || []).filter(c => (profile.saved_colleges || []).includes(c.id));
    const completedExams = (profile.ap_exams || []).filter(e => e.status === "completed");
    const plannedExams = (profile.ap_exams || []).filter(e => e.status === "planned");

    const { maxCredits, maxTuition, bestCollege } = 
      CreditsEngine.calculateMaxSavings(savedColleges, completedExams, residency);
    const sampleCollegeName = bestCollege ? bestCollege.short_name : "Public Universities";

    return `
      <div class="dossier-document" id="printable-dossier-area">
        <!-- Document Header / Official Letterhead -->
        <div class="dossier-header">
          <div class="dossier-branding">
            <div class="dossier-logo" style="display:flex;align-items:center;gap:0.55rem;">
              <img src="assets/admit-logo.svg" alt="ShipMates" style="width:28px;height:28px;border-radius:7px;" />
              <span>ShipMates</span>
            </div>
            <div class="dossier-subtitle">Academic Standing &amp; AP Credit Summary Report</div>
            <div class="dossier-meta">Prepared for Student, Family &amp; Counselor Review</div>
          </div>
          <div class="dossier-ref-box">
            <div class="ref-label">REPORT ID</div>
            <div class="ref-value">${dossierId}</div>
            <div class="ref-date">${dateStr}</div>
          </div>
        </div>

        <!-- Section 1: Student Demographics & Verified Metrics -->
        <div class="dossier-section">
          <div class="dossier-section-title">
            <span>1. Student Academic Snapshot</span>
          </div>
          <div class="dossier-metrics-grid">
            <div class="dossier-metric-cell">
              <span class="lbl">Student Name</span>
              <span class="val">${studentName}</span>
            </div>
            <div class="dossier-metric-cell">
              <span class="lbl">Grade Level / Cohort</span>
              <span class="val">Grade ${currentGrade} (Class of ${2026 + (12 - currentGrade)})</span>
            </div>
            <div class="dossier-metric-cell">
              <span class="lbl">State of Legal Residency</span>
              <span class="val">${residency}</span>
            </div>
            <div class="dossier-metric-cell">
              <span class="lbl">Unweighted / Weighted GPA</span>
              <span class="val">${studentGpa} / ${profile.gpa_weighted ? profile.gpa_weighted.toFixed(2) : 'N/A'}</span>
            </div>
            <div class="dossier-metric-cell">
              <span class="lbl">Official Class Rank</span>
              <span class="val">${rankStr}</span>
            </div>
            <div class="dossier-metric-cell">
              <span class="lbl">Standardized Testing</span>
              <span class="val">${studentSat ? `SAT ${studentSat} (ERW ${profile.sat_rw || 0} / M ${profile.sat_m || 0})` : profile.act_composite ? `ACT ${profile.act_composite}` : 'No official test on record'}</span>
            </div>
          </div>

          <div class="dossier-curriculum-row">
            <span class="lbl">College-Prep Curriculum Standards:</span>
            <span class="tag ${profile.math_years_algebra2 ? 'met' : 'unmet'}">Algebra II: ${profile.math_years_algebra2 ? 'Completed' : 'Missing'}</span>
            <span class="tag ${(profile.science_years ?? 0) >= 4 ? 'met' : 'unmet'}">Lab Sciences: ${profile.science_years ?? 0} Years ${(profile.science_years ?? 0) >= 4 ? '(Distinguished)' : '(Need 4 for DLA)'}</span>
            <span class="tag ${profile.has_endorsement ? 'met' : 'unmet'}">State Endorsement / Honors: ${profile.has_endorsement ? 'Verified' : 'Pending'}</span>
          </div>
        </div>

        <!-- Section 2: Statutory Automatic Admission Determinations -->
        <div class="dossier-section">
          <div class="dossier-section-title">
            <span>2. State Statutory Admission Standing</span>
          </div>
          <p class="dossier-desc">
            Evaluated against published legislative mandates (e.g., Texas Uniform Admission Policy TEC § 51.803, California UC ELC Regents Policy 2102, Washington Guaranteed Admissions Program, Florida Board of Governors Reg. 6.002, and National Placement Standards).
          </p>

          <table class="dossier-table">
            <thead>
              <tr>
                <th style="width: 25%;">Governing Statute</th>
                <th style="width: 20%;">Statutory Status</th>
                <th style="width: 35%;">Criteria Audit</th>
                <th style="width: 20%;">Applicable Scope</th>
              </tr>
            </thead>
            <tbody>
              ${evaluatedRules.length === 0 ? `
                <tr><td colspan="4" style="text-align: center; color: var(--text-dim);">No published state admission statutes found for selected residency.</td></tr>
              ` : evaluatedRules.map(res => {
                const unmet = res.criteria.filter(c => !c.isMet);
                return `
                  <tr>
                    <td>
                      <strong>${res.rule.name}</strong>
                      <div class="statute-cite">${res.rule.statute}</div>
                    </td>
                    <td>
                      <span class="dossier-badge ${res.isQualified ? 'qualified' : 'unqualified'}">
                        ${res.isQualified ? 'ELIGIBLE (PROTECTED)' : 'ACTION REQUIRED'}
                      </span>
                    </td>
                    <td>
                      ${res.isQualified ? `
                        <div class="criteria-ok">100% of published academic criteria satisfied.</div>
                      ` : `
                        <div class="criteria-gap">Missing: ${unmet.map(u => u.label).join('; ')}</div>
                        ${unmet[0] && unmet[0].fix ? `<div class="criteria-fix-note"><strong>Single Fix:</strong> ${unmet[0].fix}</div>` : ''}
                      `}
                    </td>
                    <td>${res.rule.applicable_universities.slice(0, 2).join(', ')}${res.rule.applicable_universities.length > 2 ? ' et al.' : ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 3: College Scorecard Middle-50% Percentile Alignment -->
        <div class="dossier-section">
          <div class="dossier-section-title">
            <span>3. College Scorecard Admitted Student Middle-50% Distribution</span>
          </div>
          <p class="dossier-desc">
            Official middle-50% SAT/ACT enrolled freshman distributions from the U.S. Department of Education College Scorecard. Strictly descriptive metrics, not speculative probabilities.
          </p>

          <table class="dossier-table">
            <thead>
              <tr>
                <th>University</th>
                <th>Type / Location</th>
                <th>Admit Rate</th>
                <th>Scorecard Middle-50%</th>
                <th>Priority / Reg Deadlines</th>
                <th>Candidate Standing</th>
                <th>Target Delta to 75th %ile</th>
              </tr>
            </thead>
            <tbody>
              ${savedColleges.length === 0 ? `
                <tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 1.5rem;">No saved colleges in student list. Add universities in the Colleges tab to generate matrix.</td></tr>
              ` : savedColleges.map(col => {
                let standing = "In Range";
                let deltaText = "At / above 75th %ile";
                let badgeClass = "in-range";

                if (!studentSat) {
                  standing = "No Score Logged";
                  deltaText = `Target: ${col.sat_total_75}`;
                  badgeClass = "unqualified";
                } else if (studentSat < col.sat_total_25) {
                  standing = "Below Median Band";
                  deltaText = `+${col.sat_total_75 - studentSat} pts to reach 75th %ile (${col.sat_total_75})`;
                  badgeClass = "unqualified";
                } else if (studentSat > col.sat_total_75) {
                  standing = "Top 25% (>75th %ile)";
                  deltaText = `+${studentSat - col.sat_total_75} pts above 75th %ile`;
                  badgeClass = "qualified";
                } else {
                  standing = "Inside Middle-50%";
                  deltaText = `+${col.sat_total_75 - studentSat} pts to top of range`;
                  badgeClass = "in-range";
                }

                return `
                  <tr>
                    <td><strong>${col.name}</strong> (${col.short_name})</td>
                    <td>${col.city}, ${col.state} · ${col.type}</td>
                    <td>${(col.admit_rate * 100).toFixed(0)}%</td>
                    <td><strong>${col.sat_total_25} – ${col.sat_total_75}</strong></td>
                    <td>${col.early_deadline || col.regular_deadline} · RD: ${col.regular_deadline || 'Jan 1'}</td>
                    <td><span class="dossier-badge ${badgeClass}">${standing}</span></td>
                    <td>${deltaText}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Section 4: AP/IB Credit Conversion & Tuition Savings -->
        <div class="dossier-section">
          <div class="dossier-section-title">
            <span>4. AP/IB Credit Conversion & College Tuition ROI</span>
          </div>
          <div class="dossier-summary-callout">
            <div>
              <strong>Completed Exams on File:</strong> ${completedExams.length} exams (${completedExams.map(e => `${e.name}: ${e.score}`).join(', ') || 'None'})
            </div>
            <div>
              <strong>Degree Acceleration:</strong> Up to <strong>${maxCredits} college credit hours</strong> awarded at ${sampleCollegeName}, representing an estimated <strong>$${maxTuition.toLocaleString()} in waived undergraduate tuition</strong>.
            </div>
          </div>
          <div class="dossier-legal-footnote">
            Statutory Mandate Notice: Over 30 states nationwide (including TX HB 1992, CA AB 1985, FL Title XLVIII, IL Public Act 099-0358, OH ORC 3333.163) legally require public institutions to award college credit for AP exam scores of 3 or higher.
          </div>
        </div>

        <!-- Section 5: Synthesized Grade-by-Grade Roadmap & Deadlines -->
        <div class="dossier-section">
          <div class="dossier-section-title">
            <span>5. Recommended Next Steps for Guidance Meeting</span>
          </div>
          <ol class="dossier-action-list">
            <li><strong>Core Curriculum Prerequisite Audit:</strong> Verify 4th year lab science and 4th year mathematics enrollment on high school transcripts prior to senior registration.</li>
            <li><strong>Priority Application Filing:</strong> Complete and submit state and national applications prior to November 1 (Early Action / Priority deadlines for public research universities).</li>
            <li><strong>Official AP Score Reporting:</strong> Request College Board score report transmission to committed university registrar in July post-graduation to waive prerequisite course registrations.</li>
            <li><strong>Federal & Institutional Financial Aid:</strong> Submit FAFSA (Free Application for Federal Student Aid) and CSS Profile immediately upon opening to access priority institutional grant allocations.</li>
          </ol>
        </div>

        <!-- Document Footer / Verification -->
        <div class="dossier-footer">
          <div>
            <span>Data Sources: U.S. Dept. of Education College Scorecard (June 2026) · State Education Statutes · Institutional Registrar Testing Catalogs</span>
          </div>
          <div>
            <span>Generated by ShipMates · Public Education Data &amp; State Policy Reference</span>
          </div>
        </div>
      </div>
    `;
  }
};
window.ReportExporter = DossierExporter;
