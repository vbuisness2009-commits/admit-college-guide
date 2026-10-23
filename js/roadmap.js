/**
 * Tab 4: Roadmap Engine
 * Generates an individualized grade-by-grade action timeline dynamically synthesized from
 * verified profile gaps, test score deltas against saved colleges, and AP credit opportunities.
 */

const RoadmapEngine = {
  render(containerId, profile, collegesData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentGrade = profile.grade_level || 11;
    const studentSat = profile.sat_total || 1200;
    const savedColleges = (collegesData || []).filter(c => (profile.saved_colleges || []).includes(c.id));

    // Analyze gaps
    const gaps = {
      coursework: [],
      testing: [],
      ap: [],
      application: []
    };

    // Coursework gaps
    if (!profile.math_years_algebra2) {
      gaps.coursework.push({
        title: "Enroll in Algebra II and 4th Year Mathematics",
        desc: "Crucial prerequisite required for the Texas Distinguished Level of Achievement and STEM college readiness.",
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

    // Testing gaps
    if (savedColleges.length > 0) {
      const schoolsBelow = savedColleges.filter(s => studentSat < s.sat_total_25);
      const schoolsInMid = savedColleges.filter(s => studentSat >= s.sat_total_25 && studentSat < s.sat_total_75);

      if (schoolsBelow.length > 0) {
        const topGap = Math.max(...schoolsBelow.map(s => s.sat_total_25 - studentSat));
        gaps.testing.push({
          title: `Schedule SAT/ACT Retake: Aim for +${topGap} Points`,
          desc: `Your current SAT (${studentSat}) is below the middle-50% threshold for ${schoolsBelow.length} of your saved schools (${schoolsBelow.map(s => s.short_name).join(', ')}). A targeted ${topGap}-point gain moves your score into their published median band.`,
          urgency: "gap-fix"
        });
      } else if (schoolsInMid.length > 0) {
        const target75 = Math.max(...schoolsInMid.map(s => s.sat_total_75 - studentSat));
        gaps.testing.push({
          title: `Optional Retake to Reach 75th Percentile (+${target75} pts)`,
          desc: `Your score is solidly in the middle-50% range for ${schoolsInMid.map(s => s.short_name).join(', ')}. Gaining +${target75} points places you in the top quartile of admitted students.`,
          urgency: "testing"
        });
      }
    } else {
      gaps.testing.push({
        title: "Take Official SAT or ACT Exam",
        desc: "Sit for the SAT or ACT in spring of junior year to benchmark your score against prospective colleges.",
        urgency: "testing"
      });
    }

    // AP Opportunities
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

    // Application items
    gaps.application.push({
      title: "File FAFSA & CSS Profile for Financial Aid",
      desc: "Complete the Free Application for Federal Student Aid (opens in December/January) and submit state grants prior to priority deadlines.",
      urgency: "application"
    });

    gaps.application.push({
      title: "Prepare Early Action & Priority Deadlines (Nov 1 – Nov 30)",
      desc: "Submit Common App, Coalition App, and state public university portals prior to priority deadlines (Nov 1 for EA/Priority, Nov 30 for University of California).",
      urgency: "application"
    });

    container.innerHTML = `
      <div class="section-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2>What do I do next?</h2>
            <p>Your grade-by-grade actionable timeline dynamically synthesized from your exact profile, test score gaps, and target university cutoffs.</p>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 0.4rem 0.8rem; border-radius: var(--radius-md); font-size: 0.82rem;">
            Current Status: <strong style="color: #60A5FA;">Grade ${currentGrade}</strong>
          </div>
        </div>
      </div>

      <div class="roadmap-timeline">
        <!-- Grade 9 -->
        <div class="roadmap-grade-block">
          <div class="grade-marker ${currentGrade === 9 ? 'active-grade' : ''}">09</div>
          <div class="grade-content">
            <div class="grade-title">
              <h3>Freshman Year · Foundation Building</h3>
              <span style="font-size: 0.75rem; color: var(--text-dim);">${currentGrade > 9 ? '✓ Completed' : currentGrade === 9 ? 'Current Stage' : 'Upcoming'}</span>
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
              <span style="font-size: 0.75rem; color: var(--text-dim);">${currentGrade > 10 ? '✓ Completed' : currentGrade === 10 ? 'Current Stage' : 'Upcoming'}</span>
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
              <span style="font-size: 0.75rem; color: var(--text-dim);">${currentGrade > 11 ? '✓ Completed' : currentGrade === 11 ? 'Current Stage' : 'Upcoming'}</span>
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
