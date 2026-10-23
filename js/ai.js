/**
 * Admit AI: Comprehensive Diagnostic Engine & Interactive Admissions Advisor
 * Performs deterministic multi-vector analysis across student stats, statutory admission laws,
 * College Scorecard percentile bands, and university AP credit policies.
 */

const AdmitAI = {
  chatHistory: [],

  /**
   * Run full multi-vector diagnostic audit
   */
  generateAudit(profile, collegesData, rulesData, apData) {
    const studentSat = profile.sat_total || 1200;
    const studentGpa = profile.gpa_unweighted || 3.8;
    const studentPercentile = profile.class_percentile || 10.0;
    const residency = profile.residency || "TX";

    // 1. Evaluate Statutory Qualifications
    const qualifications = [];
    const disqualifications = [];

    (rulesData || []).forEach(rule => {
      const evaluation = StatusEngine.evaluateRule(rule, profile);
      if (evaluation.isQualified) {
        qualifications.push({
          type: "statutory",
          title: rule.name,
          statute: rule.statute,
          detail: `You meet 100% of statutory criteria (Class percentile ${studentPercentile}% meets cutoff; coursework prerequisites satisfied).`,
          impact: "Guaranteed Automatic Admission"
        });
      } else {
        const unmetCriteria = evaluation.criteria.filter(c => !c.isMet);
        disqualifications.push({
          type: "statutory",
          title: rule.name,
          statute: rule.statute,
          unmet: unmetCriteria.map(c => c.label),
          fix: unmetCriteria.map(c => c.fix).filter(Boolean).join(" "),
          reason: `Disqualified under current stats: ${unmetCriteria.map(c => c.label).join(", ")}.`
        });
      }
    });

    // 2. Evaluate College Scorecard Alignment (Saved Colleges)
    const savedColleges = (collegesData || []).filter(c => (profile.saved_colleges || []).includes(c.id));
    const competitiveReach = [];
    const middleTarget = [];
    const strongAnchor = [];

    savedColleges.forEach(col => {
      const p25 = col.sat_total_25;
      const p75 = col.sat_total_75;

      if (studentSat < p25) {
        const delta = p25 - studentSat;
        competitiveReach.push({
          college: col,
          delta: delta,
          target75: p75 - studentSat,
          status: "Below Middle-50% Range",
          detail: `Your score (${studentSat}) is ${delta} points below the 25th percentile (${p25}). Admitted students in this band typically require exceptional non-cognitive hooks or holistic extracurricular differentiation.`
        });
      } else if (studentSat >= p75) {
        strongAnchor.push({
          college: col,
          status: "Above 75th Percentile",
          detail: `Your score (${studentSat}) places you in the top 25% of admitted freshmen at ${col.short_name} (75th percentile: ${p75}). Academically very competitive.`
        });
      } else {
        const delta75 = p75 - studentSat;
        middleTarget.push({
          college: col,
          delta75: delta75,
          status: "Inside Middle-50% Range",
          detail: `Your score is solidly within the median enrolled band (${p25}–${p75}). +${delta75} points needed to reach top quartile.`
        });
      }
    });

    // 3. AP Credit Tuition ROI Audit
    const completedExams = (profile.ap_exams || []).filter(e => e.status === "completed");
    const plannedExams = (profile.ap_exams || []).filter(e => e.status === "planned");
    
    // Calculate total potential across saved schools
    let maxCreditsSaved = 0;
    let maxTuitionSaved = 0;
    let bestSchoolForCredits = null;

    savedColleges.forEach(col => {
      const policy = (apData && apData.policies && apData.policies[col.id]) ? apData.policies[col.id].rules : [];
      let creditsEarned = 0;
      completedExams.forEach(exam => {
        const match = policy.filter(r => r.exam_id === exam.id && exam.score >= r.min_score).sort((a,b) => b.min_score - a.min_score)[0];
        if (match) creditsEarned += match.credit_hours;
      });

      const costPerCr = (profile.residency === col.state) ? col.cost_per_credit_hour_in_state : col.cost_per_credit_hour_out_of_state;
      const dollarVal = creditsEarned * costPerCr;

      if (dollarVal > maxTuitionSaved) {
        maxTuitionSaved = dollarVal;
        maxCreditsSaved = creditsEarned;
        bestSchoolForCredits = col;
      }
    });

    // 4. Executive AI Verdict Formulation
    const executiveSummary = {
      overallHealth: qualifications.length > 0 ? "EXCELLENT (Statutorily Protected)" : disqualifications.length === 0 ? "STRONG" : "NEEDS COURSEWORK / TESTING ACTION",
      keyStrengths: [
        studentGpa >= 3.8 ? `High academic baseline: Unweighted GPA of ${studentGpa.toFixed(2)} demonstrates mastery in core coursework.` : `Solid GPA baseline (${studentGpa.toFixed(2)}).`,
        qualifications.length > 0 ? `Statutory Auto-Admission Protection: Legally guaranteed admission to ${qualifications.length} state university system(s).` : `Tested within range for ${middleTarget.length + strongAnchor.length} of your saved universities.`,
        completedExams.length > 0 ? `Active College Credit Accumulation: ${completedExams.length} AP exams completed, yielding up to ${maxCreditsSaved} college credit hours (approx. $${maxTuitionSaved.toLocaleString()} tuition value).` : `Opportunity to capitalize on upcoming AP exams for degree acceleration.`
      ],
      criticalVulnerabilities: [
        ...disqualifications.map(d => `${d.title}: ${d.reason} ${d.fix ? `Fix: ${d.fix}` : ''}`),
        ...competitiveReach.map(r => `Test Score Gap at ${r.college.short_name}: ${r.delta} points below published 25th percentile (${r.college.sat_total_25}).`)
      ],
      immediateActionItem: disqualifications.length > 0 && disqualifications[0].fix 
        ? disqualifications[0].fix 
        : competitiveReach.length > 0 
          ? `Target a ${competitiveReach[0].delta + 40}-point SAT score increase to clear the 25th percentile threshold at ${competitiveReach[0].college.short_name}.`
          : `Maintain rigorous senior year course grades and submit official AP score reports during university registration.`
    };

    return {
      executiveSummary,
      qualifications,
      disqualifications,
      competitiveReach,
      middleTarget,
      strongAnchor,
      bestSchoolForCredits,
      maxCreditsSaved,
      maxTuitionSaved
    };
  },

  /**
   * Interactive AI Assistant query handler
   */
  respondToQuery(query, profile, collegesData, rulesData, apData) {
    const q = query.toLowerCase().trim();
    const audit = this.generateAudit(profile, collegesData, rulesData, apData);
    const studentSat = profile.sat_total || 1200;
    const studentGpa = profile.gpa_unweighted || 3.8;
    const rank = profile.class_rank;
    const pct = profile.class_percentile;

    // 1. "Do I qualify?" / "What do I qualify for?"
    if (q.includes("qualify") || q.includes("eligible") || q.includes("guarantee") || q.includes("auto")) {
      if (audit.qualifications.length === 0) {
        return `### ⚠ Statutory Qualification Status\n\nBased on your current profile, **you do NOT currently qualify for automatic statutory admission**.\n\n**Key Missing Criteria:**\n${audit.disqualifications.map(d => `* **${d.title}:** ${d.reason}\n  * *Immediate Fix:* ${d.fix}`).join("\n\n")}\n\n*Note: Holistic admission is still possible, but you are not statutorily guaranteed admission.*`;
      } else {
        return `### ✓ Official Statutory Qualifications Confirmed\n\nGood news! You meet all legal requirements for:\n\n${audit.qualifications.map(q => `* **${q.title}** (${q.statute}):\n  * Status: **${q.impact}**\n  * Reason: Class rank (Top ${pct}%) and coursework prerequisites satisfy published criteria.`).join("\n\n")}\n\n${audit.disqualifications.length > 0 ? `\n\n**Where you are currently disqualified:**\n${audit.disqualifications.map(d => `* **${d.title}:** ${d.fix}`).join("\n")}` : ""}`;
      }
    }

    // 2. Questions about SAT / ACT / Scores
    if (q.includes("sat") || q.includes("act") || q.includes("score") || q.includes("test")) {
      const reaches = audit.competitiveReach.map(r => `* **${r.college.short_name}**: Your score (${studentSat}) is **${r.delta} points below** the 25th percentile (${r.college.sat_total_25}).`).join("\n");
      const targets = audit.middleTarget.map(t => `* **${t.college.short_name}**: Inside median band (${t.college.sat_total_25}–${t.college.sat_total_75}). You need **+${t.delta75} pts** to reach the 75th percentile.`).join("\n");
      const anchors = audit.strongAnchor.map(a => `* **${a.college.short_name}**: In the top 25% of admitted freshmen (Above 75th percentile: ${a.college.sat_total_75}).`).join("\n");

      return `### 📊 AI Test Score Analysis (SAT: ${studentSat})\n\nHere is how your standardized test score matches against your saved colleges:\n\n${anchors ? `**Academically Strong (>75th Percentile):**\n${anchors}\n\n` : ""}${targets ? `**Inside Middle-50% Admitted Range:**\n${targets}\n\n` : ""}${reaches ? `**Test Score Deficit (<25th Percentile):**\n${reaches}\n\n` : ""}\n**AI Recommendation:** If you retake the SAT, focus primarily on Math/ERW subscores to gain **+${audit.competitiveReach.length > 0 ? audit.competitiveReach[0].delta + 30 : 50} points**, which places you safely into the median band across your entire list.`;
    }

    // 3. Questions about AP / IB / College Credits
    if (q.includes("ap") || q.includes("ib") || q.includes("credit") || q.includes("tuition") || q.includes("save") || q.includes("money")) {
      const completed = (profile.ap_exams || []).filter(e => e.status === "completed");
      const planned = (profile.ap_exams || []).filter(e => e.status === "planned");
      
      return `### 🎓 AP/IB Credit & Tuition ROI Assessment\n\n* **Completed AP Exams:** ${completed.length} logged (${completed.map(e => `${e.name}: ${e.score}`).join(", ") || "None"}).\n* **Maximum Estimated Tuition Saved:** **$${audit.maxTuitionSaved.toLocaleString()}** (representing approx. **${audit.maxCreditsSaved} college credits** at ${audit.bestSchoolForCredits ? audit.bestSchoolForCredits.short_name : "your saved schools"}).\n* **Planned Exams:** ${planned.length} upcoming (${planned.map(e => e.name).join(", ") || "None"}).\n\n**High-Value Advice:** Under state law (such as Texas HB 1992 / TEC § 51.968), public universities cannot require more than a score of 3 for credit unless special exemptions apply. Scoring a 4 or 5 in planned exams like Calculus BC or Chemistry directly waives up to 8 credits per subject, bypassing introductory lab weed-out courses.`;
    }

    // 4. Questions about single biggest fix / next steps
    if (q.includes("fix") || q.includes("do next") || q.includes("roadmap") || q.includes("priority") || q.includes("improve")) {
      return `### 🎯 AI Priority Diagnostic: Your #1 Action Item\n\n**Primary Focus:**\n> **${audit.executiveSummary.immediateActionItem}**\n\n**Secondary Priorities:**\n${audit.executiveSummary.criticalVulnerabilities.slice(0, 3).map((v, i) => `${i + 1}. ${v}`).join("\n")}\n\nThis sequence addresses hard statutory barriers first, followed by score competitive positioning.`;
    }

    // 5. Default Comprehensive Response
    return `### 🤖 Comprehensive Academic Profile Diagnostics\n\n**Executive Health Rating:** ${audit.executiveSummary.overallHealth}\n\n**Top Strengths:**\n${audit.executiveSummary.keyStrengths.map(s => `* ${s}`).join("\n")}\n\n**Identified Deficits & Disqualifications:**\n${audit.executiveSummary.criticalVulnerabilities.length > 0 ? audit.executiveSummary.criticalVulnerabilities.map(v => `* ${v}`).join("\n") : "* No critical disqualifications detected."}\n\n**Recommended Immediate Action:**\n> ${audit.executiveSummary.immediateActionItem}\n\n*Tip: You can ask me specific questions like: "Do I qualify for Texas Top 10%?", "How do my SAT scores compare?", or "How much money do my APs save me?"*`;
  }
};


/**
 * UI Renderer for Tab 5: AI Audit & Interactive Advisor
 */
AdmitAI.render = function(containerId, profile, collegesData, rulesData, apData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const audit = this.generateAudit(profile, collegesData, rulesData, apData);
  const user = Auth.getCurrentUser();
  const userName = user ? user.name.split(" ")[0] : "Student";

  container.innerHTML = `
    <div class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2>🤖 Admit AI Diagnostic Audit & Interactive Advisor</h2>
          <p>Multi-vector algorithmic analysis of your academic profile against official state laws, published score percentiles, and university credit matrices.</p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span style="font-size: 0.78rem; color: var(--text-muted);">Audit Status:</span>
          <span class="range-verdict in-range" style="font-size: 0.8rem; padding: 4px 10px;">
            ${audit.executiveSummary.overallHealth}
          </span>
        </div>
      </div>
    </div>

    <!-- AI Executive Verdict Card -->
    <div class="card" style="margin-bottom: 1.5rem; background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(20, 28, 45, 0.95) 100%); border: 1px solid rgba(59, 130, 246, 0.4);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: #3B82F6; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800;">
            AI
          </div>
          <div>
            <h3 style="font-size: 1.15rem; color: #FFFFFF; font-weight: 700;">Executive Diagnostic Brief for ${userName}</h3>
            <span style="font-size: 0.75rem; color: #60A5FA;">Generated from verified profile parameters & official statutes</span>
          </div>
        </div>
        <button class="btn-secondary" style="font-size: 0.78rem;" onclick="App.openProfileModal()">
          Adjust Stats & Re-Scan
        </button>
      </div>

      <div class="ai-layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <!-- Strengths -->
        <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md); padding: 1rem;">
          <h4 style="font-size: 0.88rem; color: #34D399; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>✓</span> Key Strategic Strengths:
          </h4>
          <ul style="font-size: 0.82rem; color: var(--text-main); display: flex; flex-direction: column; gap: 0.4rem; padding-left: 1.1rem;">
            ${audit.executiveSummary.keyStrengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>

        <!-- Vulnerabilities -->
        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md); padding: 1rem;">
          <h4 style="font-size: 0.88rem; color: #F87171; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚠</span> Identified Deficits & Disqualifications:
          </h4>
          <ul style="font-size: 0.82rem; color: var(--text-main); display: flex; flex-direction: column; gap: 0.4rem; padding-left: 1.1rem;">
            ${audit.executiveSummary.criticalVulnerabilities.length > 0 
              ? audit.executiveSummary.criticalVulnerabilities.map(v => `<li>${v}</li>`).join('')
              : '<li>No severe structural deficits detected. Maintain consistent academic trajectory.</li>'}
          </ul>
        </div>
      </div>

      <!-- Priority Action Banner -->
      <div style="margin-top: 1.25rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 800; color: #60A5FA; letter-spacing: 0.05em; display: block;">
            Recommended #1 Immediate Action:
          </span>
          <p style="font-size: 0.88rem; color: #FFFFFF; font-weight: 600; margin-top: 2px;">
            ${audit.executiveSummary.immediateActionItem}
          </p>
        </div>
        <button class="btn-primary" style="font-size: 0.78rem; padding: 0.4rem 0.8rem;" onclick="App.switchTab('roadmap')">
          View Step-by-Step Roadmap →
        </button>
      </div>
    </div>

    <!-- Interactive AI Assistant Split View -->
    <div class="ai-layout-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 1.25rem;">
      <!-- Column 1: Detailed Qualification Breakdown Cards -->
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Qualifications Card -->
        <div class="card">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #34D399; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>✓</span> Confirmed Qualifications (${audit.qualifications.length})
          </h3>
          ${audit.qualifications.length === 0 ? `
            <p style="font-size: 0.84rem; color: var(--text-dim); padding: 0.5rem 0;">No guaranteed statutory admissions confirmed based on current inputs.</p>
          ` : audit.qualifications.map(q => `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <strong style="color: #FFFFFF; font-size: 0.92rem;">${q.title}</strong>
                <span class="rule-status-badge qualified" style="font-size: 0.7rem; padding: 2px 6px;">Qualifies</span>
              </div>
              <div style="font-size: 0.72rem; color: #60A5FA; font-family: monospace; margin: 2px 0 6px 0;">Statute: ${q.statute}</div>
              <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">${q.detail}</p>
            </div>
          `).join('')}

          <!-- In-Range Colleges -->
          <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">
              Academic Scorecard Alignment:
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.4rem;">
              ${audit.strongAnchor.map(a => `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; background: rgba(59, 130, 246, 0.08); padding: 0.4rem 0.6rem; border-radius: 4px;">
                  <span><strong>${a.college.short_name}</strong></span>
                  <span style="color: #93C5FD; font-weight: 600;">Top 25% (>75th Pct)</span>
                </div>
              `).join('')}
              ${audit.middleTarget.map(t => `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; background: rgba(16, 185, 129, 0.08); padding: 0.4rem 0.6rem; border-radius: 4px;">
                  <span><strong>${t.college.short_name}</strong></span>
                  <span style="color: #34D399; font-weight: 600;">In Middle-50% Range</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Disqualifications Card -->
        <div class="card">
          <h3 style="font-size: 1.05rem; font-weight: 700; color: #F87171; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
            <span>⚠</span> Current Disqualifications & Gaps (${audit.disqualifications.length + audit.competitiveReach.length})
          </h3>
          ${audit.disqualifications.length === 0 && audit.competitiveReach.length === 0 ? `
            <p style="font-size: 0.84rem; color: var(--text-dim); padding: 0.5rem 0;">No active disqualifications detected across saved schools.</p>
          ` : `
            ${audit.disqualifications.map(d => `
              <div style="background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <strong style="color: #FFFFFF; font-size: 0.92rem;">${d.title}</strong>
                  <span class="rule-status-badge not-qualified" style="font-size: 0.7rem; padding: 2px 6px;">Unmet</span>
                </div>
                <div style="font-size: 0.72rem; color: #FCA5A5; font-family: monospace; margin: 2px 0 4px 0;">Statute: ${d.statute}</div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px;">${d.reason}</p>
                <div style="font-size: 0.78rem; color: #FCD34D;"><strong>Action Needed:</strong> ${d.fix}</div>
              </div>
            `).join('')}

            ${audit.competitiveReach.map(r => `
              <div style="background: rgba(245, 158, 11, 0.04); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 0.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <strong style="color: #FFFFFF; font-size: 0.92rem;">${r.college.name}</strong>
                  <span class="range-verdict below-range" style="font-size: 0.7rem; padding: 2px 6px;">Score Deficit</span>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                  Your score is <strong>${r.delta} points below</strong> the published 25th percentile (${r.college.sat_total_25}). +${r.target75} points needed to reach 75th percentile.
                </p>
              </div>
            `).join('')}
          `}
        </div>
      </div>

      <!-- Column 2: Interactive AI Advisor Chat Interface -->
      <div class="card" style="display: flex; flex-direction: column; height: 600px; max-height: 80vh; padding: 1.15rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 700; color: #FFFFFF; display: flex; align-items: center; gap: 0.4rem;">
              <span>💬</span> Interactive Admissions Advisor
            </h3>
            <span style="font-size: 0.74rem; color: var(--text-muted);">Instant responses grounded in your active stats</span>
          </div>
          <button class="btn-secondary" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;" onclick="AdmitAI.clearChat()">
            Clear Chat
          </button>
        </div>

        <!-- Preset Suggested Questions -->
        <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
          <button class="pill-btn" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;" onclick="AdmitAI.askQuickQuestion('What do I qualify for right now?')">
            "What do I qualify for?"
          </button>
          <button class="pill-btn" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;" onclick="AdmitAI.askQuickQuestion('How does my SAT compare to my saved schools?')">
            "How does my SAT compare?"
          </button>
          <button class="pill-btn" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;" onclick="AdmitAI.askQuickQuestion('How much money do my AP exams save me?')">
            "How much do my APs save?"
          </button>
          <button class="pill-btn" style="font-size: 0.72rem; padding: 0.25rem 0.6rem;" onclick="AdmitAI.askQuickQuestion('What is my single biggest fix to qualify for more schools?')">
            "What is my #1 fix?"
          </button>
        </div>

        <!-- Chat Conversation Messages Container -->
        <div id="ai-chat-messages" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 0.75rem;">
          <!-- Default welcome message -->
          <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.84rem; line-height: 1.45; color: var(--text-main);">
            <strong style="color: #60A5FA; display: block; margin-bottom: 0.25rem;">🤖 Admit AI Advisor:</strong>
            Hello ${userName}! I've completed a full diagnostic scan of your academic profile. Ask me any question about your statutory eligibility, test score percentile standing, or AP course equivalencies.
          </div>
        </div>

        <!-- Input Box & Send Button -->
        <form id="ai-chat-form" onsubmit="event.preventDefault(); AdmitAI.handleChatSubmit();" style="display: flex; gap: 0.5rem;">
          <input type="text" id="ai-chat-input" class="input-control" placeholder="Ask anything: e.g. Do I qualify for UT Austin? How many SAT points do I need?" style="font-size: 0.85rem;" autocomplete="off" required>
          <button type="submit" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; white-space: nowrap;">
            Ask AI →
          </button>
        </form>
      </div>
    </div>
  `;
};

AdmitAI.handleChatSubmit = function() {
  const input = document.getElementById("ai-chat-input");
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;

  input.value = "";
  this.postUserMessage(q);
};

AdmitAI.askQuickQuestion = function(question) {
  this.postUserMessage(question);
};

AdmitAI.postUserMessage = function(text) {
  const container = document.getElementById("ai-chat-messages");
  if (!container) return;

  // Append user bubble
  const userBubble = document.createElement("div");
  userBubble.style.cssText = "align-self: flex-end; background: var(--primary); color: #FFFFFF; border-radius: var(--radius-md); padding: 0.6rem 0.85rem; font-size: 0.84rem; max-width: 85%; box-shadow: 0 2px 4px rgba(0,0,0,0.3);";
  userBubble.innerText = text;
  container.appendChild(userBubble);
  container.scrollTop = container.scrollHeight;

  // Thinking indicator
  const thinkingBubble = document.createElement("div");
  thinkingBubble.style.cssText = "background: rgba(30, 41, 59, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.6rem 0.85rem; font-size: 0.82rem; color: var(--text-dim); max-width: 85%;";
  thinkingBubble.innerHTML = `<em>Admit AI is scanning statutory criteria & score data...</em>`;
  container.appendChild(thinkingBubble);
  container.scrollTop = container.scrollHeight;

  // Generate response
  setTimeout(() => {
    thinkingBubble.remove();
    const profile = ProfileManager.get();
    const colleges = CollegesEngine.getAll();
    const rules = StatusEngine.rulesData;
    const apData = CreditsEngine.apData;

    const answerMarkdown = AdmitAI.respondToQuery(text, profile, colleges, rules, apData);

    const botBubble = document.createElement("div");
    botBubble.style.cssText = "background: rgba(30, 41, 59, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.84rem; line-height: 1.5; color: var(--text-main); max-width: 95%;";
    
    // Quick format simple markdown headings and lists
    const formattedHtml = answerMarkdown
      .replace(/### (.*?)\n/g, '<h4 style="color: #60A5FA; font-size: 0.95rem; margin-bottom: 0.4rem;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\* (.*?)/g, '<li style="margin-left: 1.25rem;">$1</li>')
      .replace(/\n\n/g, '<div style="margin-bottom: 0.6rem;"></div>');

    botBubble.innerHTML = `
      <strong style="color: #60A5FA; display: block; margin-bottom: 0.35rem;">🤖 Admit AI Advisor:</strong>
      <div>${formattedHtml}</div>
    `;

    container.appendChild(botBubble);
    container.scrollTop = container.scrollHeight;
  }, 400);
};

AdmitAI.clearChat = function() {
  const container = document.getElementById("ai-chat-messages");
  if (!container) return;
  const user = Auth.getCurrentUser();
  const userName = user ? user.name.split(" ")[0] : "Student";
  container.innerHTML = `
    <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.84rem; line-height: 1.45; color: var(--text-main);">
      <strong style="color: #60A5FA; display: block; margin-bottom: 0.25rem;">🤖 Admit AI Advisor:</strong>
      Chat cleared. Ask me any question about your statutory admission standing, score percentiles, or AP credit conversions.
    </div>
  `;
};
