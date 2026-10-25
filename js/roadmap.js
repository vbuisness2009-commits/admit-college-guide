/**
 * Tab 4: Roadmap Engine
 * Generates an individualized grade-by-grade action timeline dynamically synthesized from
 * verified profile gaps, test score deltas against saved colleges, and AP credit opportunities.
 */

const RoadmapEngine = {
  deadlineScope: "saved",

  setDeadlineScope(scope) {
    this.deadlineScope = scope;
    const profile = ProfileManager.get();
    this.render("roadmap-tab-content", profile, CollegesEngine.getAll());
  },

  updateAppStatus(collegeId, status) {
    const profile = ProfileManager.get();
    if (!profile.application_tracker) profile.application_tracker = {};
    profile.application_tracker[collegeId] = status;
    ProfileManager.save(profile);
  },

  render(containerId, profile, collegesData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentGrade = profile.grade_level || 11;
    const eff = CollegesEngine.getEffectiveSat(profile);
    const studentSat = eff.score;
    const savedColleges = (collegesData || []).filter(c => (profile.saved_colleges || []).includes(c.id));
    const trackerMap = profile.application_tracker || {};
    const displayedColleges = this.deadlineScope === "all" ? (collegesData || []) : savedColleges;

    const gaps = {
      coursework: [],
      testing: [],
      ap: [],
      application: []
    };

    if (!profile.math_years_algebra2) {
      gaps.coursework.push({
        title: "Enroll in Algebra II and 4th Year Mathematics",
        desc: "Crucial prerequisite required for advanced high school diploma endorsements, state automatic admission programs, and STEM college readiness.",
        urgency: currentGrade >= 11 ? "gap-fix" : "academic"
      });
    }

    if ((profile.science_years || 0) < 4) {
      const remaining = 4 - (profile.science_years || 0);
      gaps.coursework.push({
        title: `Plan ${remaining} Additional Lab Science Credit${remaining > 1 ? 's' : ''}`,
        desc: `You currently have ${profile.science_years || 0} science credits. Most selective universities and state automatic admission statutes require 4 distinct laboratory sciences.`,
        urgency: "gap-fix"
      });
    }

    if (!profile.has_endorsement) {
      gaps.coursework.push({
        title: "Complete Advanced College-Prep Diploma Sequence",
        desc: "Ensure completion of your high school's advanced honors curriculum, state diploma endorsements, or foreign language requirements.",
        urgency: "gap-fix"
      });
    }

    if (savedColleges.length > 0 && studentSat !== null) {
      const schoolsBelow = savedColleges.filter(s => studentSat < s.sat_total_25);
      const schoolsInMid = savedColleges.filter(s => studentSat >= s.sat_total_25 && studentSat < s.sat_total_75);

      if (schoolsBelow.length > 0) {
        const topGap = Math.max(...schoolsBelow.map(s => s.sat_total_25 - studentSat));
        gaps.testing.push({
          title: `Schedule SAT/ACT Retake: Aim for +${topGap} Points`,
          desc: `Your current ${eff.label} is below the middle-50% threshold for ${schoolsBelow.length} of your saved schools (${schoolsBelow.map(s => s.short_name).join(', ')}). A targeted ${topGap}-point gain moves your score into their published median band.`,
          urgency: "gap-fix"
        });
      } else if (schoolsInMid.length > 0) {
        const target75 = Math.max(...schoolsInMid.map(s => s.sat_total_75 - studentSat));
        gaps.testing.push({
          title: `Optional Retake to Reach 75th Percentile (+${target75} pts)`,
          desc: `Your score (${eff.label}) is solidly in the middle-50% range for ${schoolsInMid.map(s => s.short_name).join(', ')}. Gaining +${target75} points places you in the top quartile of admitted students.`,
          urgency: "testing"
        });
      }
    } else if (savedColleges.length > 0 && studentSat === null) {
      const min25 = Math.min(...savedColleges.map(s => s.sat_total_25));
      const max75 = Math.max(...savedColleges.map(s => s.sat_total_75));
      gaps.testing.push({
        title: `Sit for Official SAT or ACT Exam (Target ${min25}–${max75} SAT)`,
        desc: `No test score is currently logged. Your saved universities publish middle-50% SAT bands spanning ${min25} to ${max75}. Register for a junior-year SAT or ACT exam date to establish your baseline.`,
        urgency: "gap-fix"
      });
    } else {
      gaps.testing.push({
        title: "Take Official SAT or ACT Exam",
        desc: "Sit for the SAT or ACT in spring of junior year to benchmark your score against prospective colleges.",
        urgency: "testing"
      });
    }

    const plannedExams = (profile.ap_exams || []).filter(e => e.status === "planned");
    if (plannedExams.length > 0) {
      gaps.ap.push({
        title: `Prepare for ${plannedExams.length} Upcoming AP Exams (${plannedExams.map(e => e.name).join(', ')})`,
        desc: `Scoring a 4 or 5 on these exams can unlock up to 16 additional college credit hours, saving thousands in lower-division tuition.`,
        urgency: "credit-target"
      });
    } else {
      gaps.ap.push({
        title: "Consider Advanced Placement (AP) Course Registration",
        desc: "AP credits provide direct course waivers and substantial tuition savings at all major public universities.",
        urgency: "credit-target"
      });
    }

    if (savedColleges.length > 0) {
      const earlySummary = savedColleges.map(c => `${c.short_name} (${c.early_deadline || c.regular_deadline})`).join(", ");
      gaps.application.push({
        title: `Meet Saved College Priority & Scholarship Cutoffs`,
        desc: `Target early submission dates for your saved list: ${earlySummary}. Applying by the priority cutoff is required at many public flagships (such as UH, Purdue, Ohio State, and Georgia Tech) to qualify for automatic merit scholarships.`,
        urgency: "gap-fix"
      });
    } else {
      gaps.application.push({
        title: "Prepare Early Action & Priority Deadlines (Oct 15 – Nov 30)",
        desc: "Submit Common App, ApplyTexas, and state public university portals prior to priority deadlines (Oct 15 / Nov 1 for EA and Merit Scholarships, Nov 30 for University of California).",
        urgency: "application"
      });
    }

    gaps.application.push({
      title: "File FAFSA & State Tuition Grant Applications",
      desc: "Complete the Free Application for Federal Student Aid and verify institutional free-tuition income guarantees (e.g., UT Austin Texas Advance Commitment, TAMU Aggie Assurance, Rice Investment, UC Blue & Gold).",
      urgency: "application"
    });

    const submittedCount = savedColleges.filter(c => trackerMap[c.id] === "submitted").length;
    const inProgressCount = savedColleges.filter(c => trackerMap[c.id] === "in_progress").length;

    container.innerHTML = `
      <div class="section-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2>${currentGrade >= 12 ? '🎓 Senior Priority Deadlines &amp; Action Plan' : `🗺️ Your Personalized Grade ${currentGrade} High School Guide &amp; 4-Year Roadmap`}</h2>
            <p>${currentGrade >= 12
              ? 'Claim your qualified merit scholarships before priority cutoffs and track your Early Action and Regular Decision applications.'
              : 'Follow this customized year-by-year game plan to hit auto-admit GPA/rank benchmarks, pick high-ROI AP courses, and unlock maximum merit scholarships.'}</p>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 0.4rem 0.8rem; border-radius: var(--radius-md); font-size: 0.82rem;">
              Current Stage: <strong style="color: #60A5FA;">Grade ${currentGrade}</strong>
            </div>
            <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 0.4rem 0.8rem; border-radius: var(--radius-md); font-size: 0.82rem;">
              Applications: <strong style="color: var(--success);">${submittedCount}/${savedColleges.length} Submitted</strong> ${inProgressCount > 0 ? `<span style="color: var(--text-dim);">(${inProgressCount} drafting)</span>` : ''}
            </div>
          </div>
        </div>
      </div>

      <!-- 9th–11th Grade Strategic High School Blueprint -->
      <div class="card" style="margin-bottom: 1.75rem; padding: 1.35rem; background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), rgba(79, 70, 229, 0.1)); border: 1px solid rgba(96, 165, 250, 0.32);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.12rem; font-weight: 700; color: #FFFFFF;">
              🧭 9th–11th Grade Strategic High School Blueprint &amp; Target Benchmarks
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Exact GPA, class rank, testing, and AP course targets to lock in automatic merit scholarships ($5k–$28k/yr) and guaranteed state admissions.
            </p>
          </div>
          <span style="font-size: 0.74rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 999px; background: rgba(59, 130, 246, 0.2); color: #93C5FD; border: 1px solid rgba(96, 165, 250, 0.35);">
            Active Track: Grade ${currentGrade}
          </span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;">
          <div style="background: rgba(13, 20, 36, 0.75); border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px; padding: 1rem;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #60A5FA; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.3rem;">9th &amp; 10th Grade: Foundation</div>
            <strong style="color: #FFFFFF; font-size: 0.92rem; display: block; margin-bottom: 0.35rem;">Protect Unweighted GPA &amp; Class Rank</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
              Target a <strong>3.85+ Unweighted GPA</strong> and <strong>Top 6%–10% Class Rank</strong> to lock in statutory state auto-admit (TX, CA, FL, GA, WA) and take 1–2 starter APs (AP World, AP Human Geo, AP CSP).
            </p>
          </div>
          <div style="background: rgba(13, 20, 36, 0.75); border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px; padding: 1rem;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #818CF8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.3rem;">11th Grade: Scholarship &amp; AP Core</div>
            <strong style="color: #FFFFFF; font-size: 0.92rem; display: block; margin-bottom: 0.35rem;">Hit 1350–1420+ SAT / 29–32+ ACT</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
              Crossing <strong>1350–1420+ SAT</strong> unlocks automatic $13,500–$28,000/yr merit tiers. Take high-ROI core waiver APs (AP English Lang, AP Calc AB/BC, AP US History, AP Bio/Chem).
            </p>
          </div>
          <div style="background: rgba(13, 20, 36, 0.75); border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px; padding: 1rem;">
            <div style="font-size: 0.74rem; font-weight: 700; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.3rem;">12th Grade: Claim Aid &amp; Waivers</div>
            <strong style="color: #FFFFFF; font-size: 0.92rem; display: block; margin-bottom: 0.35rem;">File Before Oct 15 / Nov 1 Cutoffs</strong>
            <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.45; margin: 0;">
              Submit Common App prior to <strong>Nov 1 Early Action</strong> to claim priority institutional scholarships, submit official AP scores for course waivers, and file FAFSA.
            </p>
          </div>
        </div>
      </div>

      <!-- Saved College Deadlines & Merit Scholarship Tracker -->
      <div class="card" style="margin-bottom: 2rem; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <h3 style="font-size: 1.12rem; font-weight: 700; color: #FFFFFF;">
              Institutional Deadlines & Merit Scholarship Tracker
            </h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
              Official Early Action, Regular Decision, priority merit scholarship cutoffs, and tuition guarantee programs.
            </p>
          </div>
          <div style="display: flex; gap: 0.4rem; align-items: center; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-full); padding: 3px;">
            <button type="button" class="pill-btn ${this.deadlineScope === 'saved' ? 'active' : ''}" style="border: none; padding: 0.3rem 0.7rem; font-size: 0.75rem;" onclick="RoadmapEngine.setDeadlineScope('saved')">
              My Saved Colleges (${savedColleges.length})
            </button>
            <button type="button" class="pill-btn ${this.deadlineScope === 'all' ? 'active' : ''}" style="border: none; padding: 0.3rem 0.7rem; font-size: 0.75rem;" onclick="RoadmapEngine.setDeadlineScope('all')">
              All 20 Universities
            </button>
          </div>
        </div>

        ${displayedColleges.length === 0 ? `
          <div style="text-align: center; padding: 2rem 1rem; color: var(--text-dim); background: rgba(255,255,255,0.02); border-radius: var(--radius-md);">
            <p style="margin-bottom: 0.75rem;">No colleges saved yet. Save universities in the Colleges tab or view all 20 institutions.</p>
            <div style="display: flex; gap: 0.5rem; justify-content: center;">
              <button type="button" class="btn-primary" style="font-size: 0.8rem;" onclick="App.switchTab('colleges')">Browse & Save Colleges →</button>
              <button type="button" class="btn-secondary" style="font-size: 0.8rem;" onclick="RoadmapEngine.setDeadlineScope('all')">Show All 20 Schools</button>
            </div>
          </div>
        ` : `
          <div class="credit-table-container">
            <table class="credit-table">
              <thead>
                <tr>
                  <th>University & Portal</th>
                  <th>Early / Priority Cutoff</th>
                  <th>Regular Decision</th>
                  <th>Priority Scholarship Deadline</th>
                  <th>Merit Scholarships & Tuition Guarantees</th>
                  <th>Application Status</th>
                </tr>
              </thead>
              <tbody>
                ${displayedColleges.map(col => {
                  const status = trackerMap[col.id] || "not_started";
                  const statusColor = status === "submitted" ? "var(--success)" : status === "in_progress" ? "#FBBF24" : "var(--text-dim)";
                  return `
                    <tr>
                      <td>
                        <strong style="color: #FFFFFF; display: block; font-size: 0.88rem;">${col.name}</strong>
                        <span style="font-size: 0.72rem; color: var(--text-dim);">${col.application_portal || 'Common App'} · ${col.city}, ${col.state}</span>
                      </td>
                      <td>
                        <span class="course-code-tag" style="background: rgba(59, 130, 246, 0.14); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.3);">
                          ${col.early_deadline || 'See Regular'}
                        </span>
                      </td>
                      <td style="font-weight: 700; color: #FFFFFF; font-size: 0.84rem; white-space: nowrap;">
                        ${col.regular_deadline || 'Jan 1'}
                      </td>
                      <td style="font-size: 0.8rem; color: #FCD34D; font-weight: 600;">
                        ${col.scholarship_deadline || col.early_deadline || col.regular_deadline}
                      </td>
                      <td style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; max-width: 310px;">
                        ${col.merit_aid_note || 'Automatic merit & need-based review with admission.'}
                      </td>
                      <td>
                        <select class="select-control" style="width: auto; font-size: 0.76rem; padding: 0.28rem 0.5rem; color: ${statusColor}; font-weight: 600;" onchange="RoadmapEngine.updateAppStatus('${col.id}', this.value)">
                          <option value="not_started" ${status === 'not_started' ? 'selected' : ''}>Not Started</option>
                          <option value="in_progress" ${status === 'in_progress' ? 'selected' : ''}>Drafting Essays</option>
                          <option value="submitted" ${status === 'submitted' ? 'selected' : ''}>✓ Submitted</option>
                        </select>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <div class="roadmap-timeline">
        <!-- Grade 9 -->
        <div class="roadmap-grade-block">
          <div class="grade-marker ${currentGrade === 9 ? 'active-grade' : ''}">09</div>
          <div class="grade-content">
            <div class="grade-title">
              <h3>Freshman Year · Foundation Building</h3>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${currentGrade > 9 ? 'Completed' : currentGrade === 9 ? 'Current Stage' : 'Upcoming'}</span>
            </div>
            <div class="action-items-list">
              <div class="action-item">
                <div class="action-item-body">
                  <span class="action-tag academic">Coursework</span>
                  <h4>Establish Unweighted GPA Baseline</h4>
                  <p>Freshman year grades set the mathematical foundation for cumulative GPA. Focus on core high school prerequisites: Biology, Algebra I/Geometry, and English I.</p>
                </div>
              </div>
              <div class="action-item">
                <div class="action-item-body">
                  <span class="action-tag academic">Four-Year Plan</span>
                  <h4>Map Out 4 Math & 4 Science Progression</h4>
                  <p>Verify that your 4-year schedule has space for Algebra II and at least 4 natural lab sciences to satisfy state statutory diploma standards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grade 10 -->
        <div class="roadmap-grade-block">
          <div class="grade-marker ${currentGrade === 10 ? 'active-grade' : ''}">10</div>
          <div class="grade-content">
            <div class="grade-title">
              <h3>Sophomore Year · Rigor & Early APs</h3>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${currentGrade > 10 ? 'Completed' : currentGrade === 10 ? 'Current Stage' : 'Upcoming'}</span>
            </div>
            <div class="action-items-list">
              <div class="action-item">
                <div class="action-item-body">
                  <span class="action-tag testing">Testing</span>
                  <h4>Sit for PSAT 10 Benchmark</h4>
                  <p>Identify question-level deficits in Reading/Writing and Math without test stress before junior year National Merit qualifiers.</p>
                </div>
              </div>
              <div class="action-item">
                <div class="action-item-body">
                  <span class="action-tag ap">Credit Building</span>
                  <h4>Take First AP/Honors Courses (e.g. AP World or AP Psych)</h4>
                  <p>Begin building AP credits early. A single 4 or 5 in 10th grade proves college rigor on high school transcripts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Grade 11 -->
        <div class="roadmap-grade-block">
          <div class="grade-marker ${currentGrade === 11 ? 'active-grade' : ''}">11</div>
          <div class="grade-content">
            <div class="grade-title">
              <h3>Junior Year · Peak Testing & Coursework Optimization</h3>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${currentGrade > 11 ? 'Completed' : currentGrade === 11 ? 'Current Stage' : 'Upcoming'}</span>
            </div>
            <div class="action-items-list">
              ${gaps.coursework.map(item => `
                <div class="action-item ${item.urgency}">
                  <div class="action-item-body">
                    <span class="action-tag academic">Curriculum Requirement</span>
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                  </div>
                </div>
              `).join('')}

              ${gaps.testing.map(item => `
                <div class="action-item ${item.urgency}">
                  <div class="action-item-body">
                    <span class="action-tag testing">Score Target</span>
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                  </div>
                </div>
              `).join('')}

              ${gaps.ap.map(item => `
                <div class="action-item ${item.urgency}">
                  <div class="action-item-body">
                    <span class="action-tag ap">Credit Strategy</span>
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Grade 12 -->
        <div class="roadmap-grade-block">
          <div class="grade-marker ${currentGrade === 12 ? 'active-grade' : ''}">12</div>
          <div class="grade-content">
            <div class="grade-title">
              <h3>Senior Year · Applications & Credit Conversion</h3>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${currentGrade === 12 ? 'Current Stage' : 'Upcoming'}</span>
            </div>
            <div class="action-items-list">
              ${gaps.application.map(item => `
                <div class="action-item">
                  <div class="action-item-body">
                    <span class="action-tag application">Application Action</span>
                    <h4>${item.title}</h4>
                    <p>${item.desc}</p>
                  </div>
                </div>
              `).join('')}
              <div class="action-item credit-target">
                <div class="action-item-body">
                  <span class="action-tag ap">Registrar Submission</span>
                  <h4>Send Official College Board AP Score Reports to Enrolled Institution</h4>
                  <p>In July after graduation, send your complete official score report to your committed university registrar so equivalency credits are logged prior to freshman orientation course registration.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
