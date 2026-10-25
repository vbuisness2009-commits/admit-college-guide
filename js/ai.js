/**
 * ShipMates: Profile Checkup & Admissions Advisor
 * Evaluates student stats against state admission rules,
 * College Scorecard percentile bands, and university AP credit policies.
 */

const AdmitAI = {
  chatHistory: [],

  /**
   * Run full multi-vector diagnostic audit
   */
  generateAudit(profile, collegesData, rulesData, apData) {
    const eff = CollegesEngine.getEffectiveSat(profile);
    const studentSat = eff.score;
    const studentGpa = profile.gpa_unweighted || 3.8;
    const studentPercentile = profile.class_percentile;
    const residency = profile.residency || "TX";

    const qualifications = [];
    const disqualifications = [];
    const relevantRules = (rulesData || []).filter(r => r.state_code === residency || r.state_code === "ALL");

    relevantRules.forEach(rule => {
      const evaluation = StatusEngine.evaluateRule(rule, profile);
      if (evaluation.isQualified) {
        const pctNote = studentPercentile !== null && studentPercentile !== undefined ? `Class percentile Top ${studentPercentile}% meets cutoff; ` : "";
        qualifications.push({
          type: "statutory",
          title: rule.name,
          statute: rule.statute,
          detail: `You meet 100% of statutory criteria (${pctNote}coursework and testing prerequisites satisfied).`,
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

    const savedColleges = (collegesData || []).filter(c => (profile.saved_colleges || []).includes(c.id));
    const competitiveReach = [];
    const middleTarget = [];
    const strongAnchor = [];

    if (studentSat !== null) {
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
            detail: `Your score (${eff.label}) is ${delta} points below the 25th percentile (${p25}).`
          });
        } else if (studentSat >= p75) {
          strongAnchor.push({
            college: col,
            status: "Above 75th Percentile",
            detail: `Your score (${eff.label}) places you in the top 25% of admitted freshmen at ${col.short_name} (75th percentile: ${p75}).`
          });
        } else {
          const delta75 = p75 - studentSat;
          middleTarget.push({
            college: col,
            delta75: delta75,
            status: "Inside Middle-50% Range",
            detail: `Your score (${eff.label}) is solidly within the median enrolled band (${p25}–${p75}). +${delta75} points needed to reach top quartile.`
          });
        }
      });
    }

    const completedExams = (profile.ap_exams || []).filter(e => e.status === "completed");
    const plannedExams = (profile.ap_exams || []).filter(e => e.status === "planned");
    
    const { maxCredits: maxCreditsSaved, maxTuition: maxTuitionSaved, bestCollege: bestSchoolForCredits } = 
      CreditsEngine.calculateMaxSavings(savedColleges, completedExams, residency);

    const allScholarships = StatusEngine.evaluateScholarships ? StatusEngine.evaluateScholarships(profile) : [];
    const scholarshipsUnlocked = allScholarships.filter(s => s.isQualified);
    const scholarshipsStretch = allScholarships.filter(s => !s.isQualified);

    const grade = parseInt(profile.grade_level, 10) || 12;
    const isSenior = grade >= 12;
    const major = profile.intended_major || "STEM & Engineering";
    const ecTier = profile.extracurricular_tier || "strong";
    const primaryGoal = profile.primary_goal || "scholarships";

    const majorBlueprints = {
      "STEM & Engineering": {
        recommendedAps: ["calc_bc", "phys_c_mech", "chem"],
        apNames: "AP Calculus BC, AP Physics C: Mechanics, and AP Chemistry",
        opportunities: " TSA (Technology Student Association), FIRST Robotics, Science Olympiad, NASA High School Aerospace Scholars, or university engineering design labs.",
        insight: "Engineering admissions heavily weight Calculus and Calculus-based Physics readiness plus hands-on build/design competitions."
      },
      "Computer Science & Data": {
        recommendedAps: ["csa", "calc_bc", "stats"],
        apNames: "AP Computer Science A, AP Calculus BC, and AP Statistics",
        opportunities: "USACO (USA Computing Olympiad), Congressional App Challenge, open-source GitHub capstone projects, or AI/data science hackathons.",
        insight: "Top CS programs look for discrete math/calculus rigor and verifiable software or algorithm projects outside the classroom."
      },
      "Business, Finance & Economics": {
        recommendedAps: ["macro_econ", "micro_econ", "stats", "calc_ab"],
        apNames: "AP Macroeconomics, AP Microeconomics, AP Statistics, and AP Calculus",
        opportunities: "DECA, FBLA, Wharton Global High School Investment Competition, Diamond Challenge entrepreneurship pitch, or founding a local micro-business.",
        insight: "Flagship business schools (like McCombs, Ross, and Warrington) value quantitative calculus/statistics preparation paired with leadership impact."
      },
      "Pre-Med, Biology & Health": {
        recommendedAps: ["bio", "chem", "stats", "psych"],
        apNames: "AP Biology, AP Chemistry, AP Statistics, and AP Psychology",
        opportunities: "HOSA Future Health Professionals, certified hospital clinical volunteering, university wet-lab summer research, or Red Cross youth leadership.",
        insight: "Pre-med tracks require strong lab science foundations; earning AP credit in Statistics and Psychology frees up schedule space for Organic Chemistry."
      },
      "Humanities, Law & Social Sciences": {
        recommendedAps: ["eng_lang", "ushist", "us_gov", "eng_lit"],
        apNames: "AP English Language, AP U.S. History, and AP U.S. Government",
        opportunities: "Mock Trial, Speech & Debate (NSDA), Model UN, Scholastic Writing Awards, Senate Page programs, or publishing in The Concord Review.",
        insight: "Selective liberal arts and pre-law programs prioritize analytical writing awards, debate leadership, and civic engagement."
      },
      "Undecided / Exploring": {
        recommendedAps: ["eng_lang", "calc_ab", "ushist", "stats"],
        apNames: "AP English Language, AP Calculus AB, AP U.S. History, and AP Statistics",
        opportunities: "Student Government, National Honor Society leadership, Eagle Scout / Gold Award capstone project, or cross-disciplinary summer pre-college programs.",
        insight: "Completing core general-education APs waives universal freshman requirements at any public university regardless of which major you declare."
      }
    };

    const blueprint = majorBlueprints[major] || majorBlueprints["STEM & Engineering"];
    const existingApIds = (profile.ap_exams || []).map(e => e.id);
    const missingMajorAps = blueprint.recommendedAps.filter(id => !existingApIds.includes(id));

    const recommendedColleges = (collegesData || [])
      .filter(c => !(profile.saved_colleges || []).includes(c.id))
      .filter(c => {
        if (!studentSat) return true;
        return studentSat >= c.sat_total_25 - 60 && studentSat <= c.sat_total_75 + 90;
      })
      .slice(0, 3);

    const ecDetailsText = (profile.extracurricular_details || "").trim();
    const goalDetailsText = (profile.priority_goal_details || "").trim();
    const awardsDetailsText = (profile.awards_details || "").trim();
    const selectedAwards = Array.isArray(profile.selected_awards) ? profile.selected_awards : [];
    const psatScore = profile.psat_score || null;
    const psatIndex = profile.psat_index || (psatScore ? Math.min(228, Math.round(psatScore * 0.15)) : null);
    const serviceHours = profile.community_service_hours ?? 100;

    const evaluatedColleges = (savedColleges.length > 0 ? savedColleges : (collegesData || []).slice(0, 5))
      .map(c => this.evaluateCollegeChance(c, profile))
      .sort((a, b) => b.chancePct - a.chancePct);

    const workingCount = evaluatedColleges.filter(item => item.appStatus === "working").length;
    const submittedCount = evaluatedColleges.filter(item => item.appStatus === "submitted").length;
    const maxCollege4YrValue = evaluatedColleges.reduce((mx, item) => Math.max(mx, item.scholarship.total4YrValue), 0);
    const maxEcAwards4Yr = evaluatedColleges.reduce((mx, item) => Math.max(mx, (item.scholarship.ecAwardsPerYr + item.scholarship.psatMeritPerYr) * 4), 0);
    const avgEcAwardsPerYr = evaluatedColleges.length > 0
      ? Math.round(evaluatedColleges.reduce((s, item) => s + item.scholarship.ecAwardsPerYr + item.scholarship.psatMeritPerYr, 0) / evaluatedColleges.length)
      : 3500;

    const personalizedSuggestions = [
      {
        category: `Major Strategy · ${major}`,
        badge: "Academic ROI",
        title: `Recommended Coursework & AP Stack for ${major}`,
        body: `${blueprint.insight} Target **${blueprint.apNames}** to waive foundational weed-out classes and save up to **$4,800+** in freshman tuition.`,
        actionLabel: missingMajorAps.length > 0 ? `+ Add Recommended APs to My Profile` : `Explore AP Credit Matrix →`,
        actionOnClick: missingMajorAps.length > 0 ? `AdmitAI.addRecommendedAps('${missingMajorAps.join(",")}')` : `App.switchTab('credits')`
      },
      {
        category: `Opportunities & Extracurriculars`,
        badge: ecTier === "national" || ecTier === "strong" ? "Leadership Edge" : "High-Impact Boost",
        title: `Stand-Out Activities & Competitions to Start Now`,
        body: `${ecDetailsText ? `Based on what you entered (**"${ecDetailsText}"**), ` : ''}For **${major}** applicants at your current activity tier, admission officers respond strongest to measurable impact: consider **${blueprint.opportunities}**`,
        actionLabel: `Open High School Action Plan →`,
        actionOnClick: `App.switchTab('roadmap')`
      },
      {
        category: `Merit Aid & Scholarship Strategy`,
        badge: `${scholarshipsUnlocked.length} Unlocked`,
        title: scholarshipsUnlocked.length > 0
          ? `You Qualify for ${scholarshipsUnlocked.length} Automatic Merit Programs`
          : `Unlock Automatic GPA & SAT Merit Scholarship Tiers`,
        body: scholarshipsUnlocked.length > 0
          ? `Your stats currently unlock **${scholarshipsUnlocked.map(s => `${s.name} (${s.award})`).slice(0, 2).join(" & ")}**. ${scholarshipsStretch.length > 0 ? `Next stretch target: **${scholarshipsStretch[0].name} (${scholarshipsStretch[0].award})** — ${scholarshipsStretch[0].gapText || (scholarshipsStretch[0].missing || []).join(" · ")}.` : 'Submit applications before priority merit deadlines!'}`
          : scholarshipsStretch.length > 0
            ? `Closest merit tier: **${scholarshipsStretch[0].name} (${scholarshipsStretch[0].award})** — ${scholarshipsStretch[0].gapText || (scholarshipsStretch[0].missing || []).join(" · ")}.`
            : `Log both GPA and SAT/ACT scores in your survey to unlock automatic institutional scholarship tiers.`,
        actionLabel: `View All Scholarships & Cutoffs →`,
        actionOnClick: `App.switchTab('status')`
      },
      {
        category: isSenior ? `12th Grade Senior Execution Plan` : `${grade}th Grade Multi-Year Roadmap`,
        badge: isSenior ? "Immediate Deadlines" : `Class of ${new Date().getFullYear() + (12 - grade)}`,
        title: goalDetailsText
          ? `Action Plan for Your Goal: "${goalDetailsText.slice(0, 48)}${goalDetailsText.length > 48 ? '...' : ''}"`
          : (isSenior ? `Lock In Priority Merit Cutoffs & Official Transcripts` : `Your Step-by-Step High School Milestone Focus`),
        body: isSenior
          ? `Submit Early Action applications by **Oct 15 – Nov 1** (essential for flagship merit aid), file the FAFSA, and send official SAT/ACT & AP score reports to your top universities.`
          : `Focus this semester on protecting your unweighted GPA (${studentGpa.toFixed(2)}), completing Algebra II / Lab Science prerequisites, and preparing for PSAT/NMSQT & spring AP exams.`,
        actionLabel: isSenior ? `Open Application Deadlines →` : `View Year-by-Year Guide →`,
        actionOnClick: `App.switchTab('roadmap')`
      }
    ];

    const executiveSummary = {
      overallHealth: qualifications.length > 0 ? "EXCELLENT (Auto-Admit + Merit Ready)" : disqualifications.length === 0 ? "STRONG COMPETITIVE STANDING" : "ACTION NEEDED ON KEY GAPS",
      keyStrengths: [
        studentGpa >= 3.8 ? `High academic baseline: Unweighted GPA of ${studentGpa.toFixed(2)} demonstrates mastery in core coursework.` : `Solid GPA baseline (${studentGpa.toFixed(2)} UW / ${(profile.gpa_weighted || studentGpa).toFixed(2)} W).`,
        scholarshipsUnlocked.length > 0 ? `Merit Scholarship Qualification: Statistically eligible for ${scholarshipsUnlocked.length} automatic merit scholarship tier(s).` : `Targeted for ${major} pathway across ${savedColleges.length} universities.`,
        qualifications.length > 0 ? `Statutory Auto-Admission Protection: Legally guaranteed admission to ${qualifications.length} state university system(s).` : `Tested within or above range for ${middleTarget.length + strongAnchor.length} of your saved universities.`,
        completedExams.length > 0 ? `Active College Credit Accumulation: ${completedExams.length} AP exams completed, yielding up to ${maxCreditsSaved} college credit hours (approx. $${maxTuitionSaved.toLocaleString()} tuition value).` : `High-ROI opportunity to add ${blueprint.apNames} for college credit.`
      ],
      criticalVulnerabilities: [
        ...disqualifications.map(d => `${d.title}: ${d.reason} ${d.fix ? `Fix: ${d.fix}` : ''}`),
        ...(studentSat === null ? ["No standardized test score logged: Add an SAT or ACT score in your survey to unlock merit scholarship tiers and middle-50% university matching."] : []),
        ...competitiveReach.map(r => `Test Score Gap at ${r.college.short_name}: ${r.delta} points below published 25th percentile (${r.college.sat_total_25}).`)
      ],
      immediateActionItem: disqualifications.length > 0 && disqualifications[0].fix 
        ? disqualifications[0].fix 
        : studentSat === null
          ? "Take an official SAT or ACT exam (or enter a target score in the Stats Survey) to unlock automatic merit scholarships."
          : competitiveReach.length > 0 
            ? `Target a ${competitiveReach[0].delta + 40}-point SAT score increase to clear the 25th percentile threshold at ${competitiveReach[0].college.short_name} and unlock higher merit tiers.`
            : `Submit Early Action applications before November 1 to capture priority merit scholarships (${scholarshipsUnlocked.length} unlocked) and claim ${maxCreditsSaved} AP credits.`
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
      maxTuitionSaved,
      scholarshipsUnlocked,
      scholarshipsStretch,
      personalizedSuggestions,
      recommendedColleges,
      evaluatedColleges,
      major,
      isSenior,
      grade,
      primaryGoal,
      ecDetailsText,
      goalDetailsText,
      awardsDetailsText,
      selectedAwards,
      psatScore,
      psatIndex,
      serviceHours,
      workingCount,
      submittedCount,
      maxCollege4YrValue,
      maxEcAwards4Yr,
      avgEcAwardsPerYr
    };
  },

  /**
   * Calculates how much money a student's GPA/SAT, ECs, Awards, PSAT & APs can earn at a specific college
   */
  calculateCollegeScholarshipValue(college, profile, savingsObj) {
    const eff = CollegesEngine.getEffectiveSat(profile);
    const studentSat = eff.score || 1350;
    const gpaUw = profile.gpa_unweighted || 3.8;
    const res = profile.residency || "TX";
    const ecTier = profile.extracurricular_tier || "strong";
    const ecDetails = (profile.extracurricular_details || "").trim();
    const awardsDetails = (profile.awards_details || "").trim();
    const selectedAwards = Array.isArray(profile.selected_awards) ? profile.selected_awards : [];
    const psat = profile.psat_score || 0;
    const nmStatus = profile.national_merit_status || (psat >= 1470 ? "semifinalist" : (psat >= 1400 ? "commended" : "none"));
    const serviceHours = profile.community_service_hours ?? 100;
    const apTuitionSaved = savingsObj ? savingsObj.tuitionSaved : 0;

    // 1. Academic Stats Merit Scholarship at this college ($/yr)
    let statsMeritPerYr = 0;
    if (res === "FL" && college.state === "FL" && gpaUw >= 3.5 && studentSat >= 1340) {
      statsMeritPerYr = college.tuition_in_state || 6380;
    } else if (res === "GA" && college.state === "GA" && gpaUw >= 3.7 && studentSat >= 1200) {
      statsMeritPerYr = college.tuition_in_state || 11180;
    } else if (college.type === "Public") {
      if (gpaUw >= 3.9 && studentSat >= college.sat_total_75) {
        statsMeritPerYr = res === college.state ? 6000 : 14000;
      } else if (gpaUw >= 3.75 && studentSat >= college.sat_total_25) {
        statsMeritPerYr = res === college.state ? 3500 : 8500;
      } else if (gpaUw >= 3.5) {
        statsMeritPerYr = 2000;
      }
    } else {
      // Private selective institutions (institutional merit / need-merit grant estimate)
      if (gpaUw >= 3.9 && studentSat >= college.sat_total_75) {
        statsMeritPerYr = 18000;
      } else if (gpaUw >= 3.75 && studentSat >= college.sat_total_25) {
        statsMeritPerYr = 10000;
      } else {
        statsMeritPerYr = 5000;
      }
    }

    // 2. User's Extracurriculars, Leadership & Awards Earnings at this college ($/yr)
    const ecBaseMap = { national: 4500, strong: 2800, developing: 1500, starter: 1000 };
    let ecAwardsPerYr = ecBaseMap[ecTier] || 2500;
    ecAwardsPerYr += selectedAwards.length * 750;
    if (ecDetails.length > 10) ecAwardsPerYr += 650;
    if (awardsDetails.length > 8) ecAwardsPerYr += 650;
    if (serviceHours >= 100) ecAwardsPerYr += 500;
    if (serviceHours >= 200) ecAwardsPerYr += 500;
    ecAwardsPerYr = Math.min(9500, Math.round(ecAwardsPerYr / 250) * 250);

    // 3. PSAT / National Merit Scholarship Bonus at this college ($/yr)
    let psatMeritPerYr = 0;
    const nmsSponsorIds = ["tamu", "uf", "purdue", "ut-austin", "gatech", "uga", "gt"];
    if (nmStatus === "semifinalist" || psat >= 1470) {
      psatMeritPerYr = nmsSponsorIds.includes(college.id) ? 10500 : 2500;
    } else if (nmStatus === "commended" || psat >= 1400) {
      psatMeritPerYr = nmsSponsorIds.includes(college.id) ? 3000 : 1500;
    } else if (psat >= 1300) {
      psatMeritPerYr = 1000;
    }

    const totalPerYr = statsMeritPerYr + ecAwardsPerYr + psatMeritPerYr;
    const total4YrValue = (totalPerYr * 4) + apTuitionSaved;

    const collegeProgramNames = {
      "ut-austin": "Texas Exes Forty Acres & Presidential Achievement Awards",
      "tamu": "President's Endowed, Brown Foundation & National Merit Package",
      "uf": "UF Presidential, Lombardi & Bright Futures Honors Package",
      "gatech": "Stamps President's Scholars & Provost Leadership Award",
      "uga": "UGA Charter, Foundation Fellowship & Zell Miller Merit",
      "purdue": "Purdue Trustees, Presidential & Engineering Leadership Grant",
      "gt": "Stamps President's Scholars & Provost Leadership Award",
      "umich": "Victors Award, Rogel Scholarship & Departmental Honors",
      "uc-berkeley": "Regents' & Chancellor's Leadership Scholarship",
      "ucla": "UCLA Regents & Alumni Leadership Scholarship",
      "unc": "Morehead-Cain & Robertson Leadership Scholarships",
      "uva": "Jefferson Scholars & Blue Ridge Merit Program",
      "uw": "Purple & Gold Merit + Presidential Leadership Award",
      "uiuc": "Illinois Commitment & Grainger Engineering Merit",
      "mit": "MIT Institutional Grant & FIRST/STEM Fellowship",
      "cmu": "Carnegie Scholarship & SCS Presidential Fellowship",
      "stanford": "Knight-Hennessy Prep & Institutional Grant Aid"
    };
    const programName = collegeProgramNames[college.id] || `${college.short_name} Presidential & Departmental Leadership Scholarships`;

    const driverParts = [];
    if (ecDetails) driverParts.push(`ECs ("${ecDetails.slice(0, 34)}${ecDetails.length > 34 ? '...' : ''}")`);
    else driverParts.push(`${ecTier.toUpperCase()} EC Tier`);
    if (selectedAwards.length > 0) driverParts.push(`${selectedAwards.length} Award(s)`);
    if (psat >= 1350) driverParts.push(`${psat} PSAT`);
    if (serviceHours >= 100) driverParts.push(`${serviceHours} Service Hrs`);

    return {
      statsMeritPerYr,
      ecAwardsPerYr,
      psatMeritPerYr,
      apTuitionSaved,
      totalPerYr,
      total4YrValue,
      programName,
      userDriversLabel: driverParts.join(" + ")
    };
  },

  /**
   * Calculates AI Acceptance Chance (0-98%) and visual bar styling for a specific university
   */
  evaluateCollegeChance(college, profile) {
    const eff = CollegesEngine.getEffectiveSat(profile);
    const studentSat = eff.score;
    const gpaUw = profile.gpa_unweighted || 3.8;
    const pct = profile.class_percentile;
    const res = profile.residency || "TX";
    const ecTier = profile.extracurricular_tier || "strong";
    const ecDetails = (profile.extracurricular_details || "").trim();
    const apCount = (profile.ap_exams || []).length;
    const completedExams = (profile.ap_exams || []).filter(e => e.status === "completed");
    const savings = CreditsEngine.calculateCollegeSavings(college, completedExams, res);
    const scholarship = this.calculateCollegeScholarshipValue(college, profile, savings);
    const appStatus = ProfileManager.getCollegeStatus ? ProfileManager.getCollegeStatus(college.id, profile) : "working";

    // 1. Check statutory auto-admission guarantee first
    const hasCorePrereqs = !!(profile.math_years_algebra2 && profile.has_endorsement);
    if (res === "TX" && college.state === "TX" && pct !== null && hasCorePrereqs) {
      if (college.id === "ut-austin" && pct <= 5.0) {
        return {
          college,
          chancePct: 96,
          tierLabel: "Guaranteed Auto-Admit",
          barGradient: "linear-gradient(90deg, #059669 0%, #10B981 55%, #34D399 100%)",
          badgeBg: "rgba(16, 185, 129, 0.16)",
          badgeColor: "#34D399",
          savings,
          scholarship,
          appStatus,
          reasonText: `✓ Top ${pct}% class rank legally guarantees admission to UT Austin under TX SB 175 (Top 5% cutoff)`
        };
      }
      if (college.id !== "ut-austin" && pct <= 10.0 && college.type === "Public") {
        return {
          college,
          chancePct: 97,
          tierLabel: "Guaranteed Auto-Admit",
          barGradient: "linear-gradient(90deg, #059669 0%, #10B981 55%, #34D399 100%)",
          badgeBg: "rgba(16, 185, 129, 0.16)",
          badgeColor: "#34D399",
          savings,
          scholarship,
          appStatus,
          reasonText: `✓ Top ${pct}% class rank legally guarantees admission under Texas Top 10% Law (TEC § 51.803)`
        };
      }
    }

    if (res === "FL" && college.state === "FL" && pct !== null && pct <= 20.0 && profile.fl_prep_complete) {
      return {
        college,
        chancePct: 92,
        tierLabel: "State Guarantee",
        barGradient: "linear-gradient(90deg, #059669 0%, #10B981 55%, #34D399 100%)",
        badgeBg: "rgba(16, 185, 129, 0.16)",
        badgeColor: "#34D399",
        savings,
        scholarship,
        appStatus,
        reasonText: `✓ Top ${pct}% rank + college-prep track qualifies for Florida Talented Twenty guarantee`
      };
    }

    // 2. Holistic & Academic Scorecard Calculation
    let baseChance = Math.round((college.admit_rate || 0.35) * 100);
    let scoreReason = "";

    if (studentSat !== null) {
      const mid = Math.round((college.sat_total_25 + college.sat_total_75) / 2);
      if (studentSat >= college.sat_total_75) {
        const diff = studentSat - college.sat_total_75;
        baseChance += Math.min(28, 16 + Math.round(diff / 10));
        scoreReason = `SAT ${studentSat} is +${diff} pts above 75th pct (${college.sat_total_75})`;
      } else if (studentSat >= mid) {
        baseChance += 12;
        scoreReason = `SAT ${studentSat} is in upper half of middle-50% (${college.sat_total_25}–${college.sat_total_75})`;
      } else if (studentSat >= college.sat_total_25) {
        baseChance += 5;
        scoreReason = `SAT ${studentSat} is inside middle-50% range (${college.sat_total_25}–${college.sat_total_75})`;
      } else {
        const deficit = college.sat_total_25 - studentSat;
        baseChance -= Math.min(35, Math.round(deficit / 4));
        scoreReason = `SAT ${studentSat} is ${deficit} pts below 25th pct (${college.sat_total_25})`;
      }
    } else {
      scoreReason = `Test-Optional (${college.sat_total_25}–${college.sat_total_75} SAT range)`;
    }

    // GPA & Rank adjustment
    if (gpaUw >= 3.92) baseChance += 9;
    else if (gpaUw >= 3.75) baseChance += 5;
    else if (gpaUw < 3.4) baseChance -= 10;

    if (pct !== null) {
      if (pct <= 5) baseChance += 7;
      else if (pct <= 10) baseChance += 4;
      else if (pct > 30) baseChance -= 5;
    }

    // Extracurricular tier & written details adjustment
    const ecBonusMap = { national: 9, strong: 5, developing: 2, starter: 0 };
    baseChance += (ecBonusMap[ecTier] ?? 4);
    if (ecDetails.length > 8) baseChance += 3;

    // AP rigor adjustment
    baseChance += Math.min(6, Math.round(apCount * 1.5));

    // Clamp to realistic probability bounds based on institutional selectivity
    const maxCap = college.admit_rate < 0.12 ? 62 : (college.admit_rate < 0.25 ? 82 : 94);
    const chancePct = Math.max(8, Math.min(maxCap, baseChance));

    let tierLabel = "Target Match";
    let barGradient = "linear-gradient(90deg, #2563EB 0%, #3B82F6 60%, #60A5FA 100%)";
    let badgeBg = "rgba(59, 130, 246, 0.16)";
    let badgeColor = "#93C5FD";

    if (chancePct >= 72) {
      tierLabel = "Likely / Safety";
      barGradient = "linear-gradient(90deg, #059669 0%, #10B981 55%, #34D399 100%)";
      badgeBg = "rgba(16, 185, 129, 0.16)";
      badgeColor = "#34D399";
    } else if (chancePct < 28) {
      tierLabel = "High Reach";
      barGradient = "linear-gradient(90deg, #DC2626 0%, #EF4444 60%, #F87171 100%)";
      badgeBg = "rgba(239, 68, 68, 0.16)";
      badgeColor = "#FCA5A5";
    } else if (chancePct < 48) {
      tierLabel = "Competitive Reach";
      barGradient = "linear-gradient(90deg, #D97706 0%, #F59E0B 60%, #FBBF24 100%)";
      badgeBg = "rgba(245, 158, 11, 0.16)";
      badgeColor = "#FCD34D";
    }

    const ecLabel = ecTier === "national" ? "Tier 1 National/State ECs" : (ecTier === "strong" ? "Tier 2 Leadership ECs" : "Holistic Profile");
    return {
      college,
      chancePct,
      tierLabel,
      barGradient,
      badgeBg,
      badgeColor,
      savings,
      scholarship,
      appStatus,
      reasonText: `${scoreReason} · ${gpaUw.toFixed(2)} GPA · ${ecLabel}${savings.tuitionSaved > 0 ? ` · $${savings.tuitionSaved.toLocaleString()} AP Credit Value` : ''}`
    };
  },

  /**
   * Interactive AI Assistant query handler
   */
  respondToQuery(query, profile, collegesData, rulesData, apData) {
    const q = query.toLowerCase().trim();
    const audit = this.generateAudit(profile, collegesData, rulesData, apData);
    const eff = CollegesEngine.getEffectiveSat(profile);
    const studentSat = eff.score;
    const pct = profile.class_percentile;
    const completed = (profile.ap_exams || []).filter(e => e.status === "completed");

    const matchedCollege = (collegesData || []).find(c =>
      q.includes(c.short_name.toLowerCase()) ||
      q.includes(c.name.toLowerCase()) ||
      q.includes(c.id.replace("-", " "))
    );

    if (matchedCollege) {
      const savings = CreditsEngine.calculateCollegeSavings(matchedCollege, completed, profile.residency);
      const scoreStatus = studentSat === null
        ? `No SAT/ACT logged yet (Middle-50% SAT: **${matchedCollege.sat_total_25}–${matchedCollege.sat_total_75}**, ACT: **${matchedCollege.act_composite_25}–${matchedCollege.act_composite_75}**).`
        : studentSat < matchedCollege.sat_total_25
          ? `Your score (${eff.label}) is **${matchedCollege.sat_total_25 - studentSat} pts below** the 25th percentile (${matchedCollege.sat_total_25}).`
          : studentSat > matchedCollege.sat_total_75
            ? `Your score (${eff.label}) is **+${studentSat - matchedCollege.sat_total_75} pts above** the 75th percentile (${matchedCollege.sat_total_75}).`
            : `Your score (${eff.label}) is **inside the middle-50% range** (${matchedCollege.sat_total_25}–${matchedCollege.sat_total_75}).`;

      return `### Institutional Diagnostic: ${matchedCollege.name}\n\n* **Scorecard Standing:** ${scoreStatus}\n* **Admit & Graduation Rates:** ${(matchedCollege.admit_rate * 100).toFixed(0)}% admit rate · ${(matchedCollege.grad_rate * 100).toFixed(0)}% graduation rate\n* **Deadlines & Scholarship Cutoffs:** Early: **${matchedCollege.early_deadline || 'N/A'}** · Regular: **${matchedCollege.regular_deadline}** · Scholarship Cutoff: **${matchedCollege.scholarship_deadline}**\n* **Merit & Tuition Grant Policy:** ${matchedCollege.merit_aid_note}\n* **Tuition & Net Cost:** In-State $${matchedCollege.tuition_in_state.toLocaleString()}/yr · Out-of-State $${matchedCollege.tuition_out_of_state.toLocaleString()}/yr · Avg Net Price **$${(matchedCollege.avg_cost || matchedCollege.tuition_in_state).toLocaleString()}/yr**\n* **Your AP Credit Value at ${matchedCollege.short_name}:** **${savings.credits} credit hours** (**$${savings.tuitionSaved.toLocaleString()}** estimated tuition saved)`;
    }

    if (q.includes("deadline") || q.includes("scholarship") || q.includes("merit") || q.includes("early action") || q.includes("financial aid") || q.includes("grant")) {
      const scholarships = StatusEngine.evaluateScholarships ? StatusEngine.evaluateScholarships(profile) : [];
      const unlockedSch = scholarships.filter(s => s.isQualified);
      const savedColleges = (collegesData || []).filter(c => (profile.saved_colleges || []).includes(c.id));
      const list = savedColleges.length > 0 ? savedColleges : (collegesData || []).slice(0, 5);
      return `### Automatic Merit Scholarships & Priority Cutoffs (${unlockedSch.length} Unlocked)\n\n${unlockedSch.length > 0 ? unlockedSch.map(s => `* **${s.name}**: **${s.award}** (Cutoff: **${s.deadline}**) — *✓ Qualified by your stats*`).join("\n") : "* Enter or raise your GPA & SAT/ACT scores to unlock automatic institutional merit tiers."}\n\n**Saved University Priority Deadlines:**\n${list.map(c => `* **${c.short_name}**: Early **${c.early_deadline}** · Regular **${c.regular_deadline}** · Merit Cutoff **${c.scholarship_deadline}** — *${c.merit_aid_note}*`).join("\n")}\n\n*Open the **Scholarships & Auto-Admit** or **High School Guide & Plan** tab to claim these awards.*`;
    }

    if (q.includes("qualify") || q.includes("eligible") || q.includes("guarantee") || q.includes("auto")) {
      if (audit.qualifications.length === 0) {
        return `### Statutory Qualification Status\n\nBased on your current profile, **you do NOT currently qualify for automatic statutory admission**.\n\n**Key Missing Criteria:**\n${audit.disqualifications.map(d => `* **${d.title}:** ${d.reason}\n* *Immediate Fix:* ${d.fix}`).join("\n\n")}\n\n*Note: Holistic admission is still possible, but you are not statutorily guaranteed admission.*`;
      } else {
        return `### Official Statutory Qualifications Confirmed\n\nGood news! You meet all legal requirements for:\n\n${audit.qualifications.map(item => `* **${item.title}** (${item.statute}): **${item.impact}** (${pct ? `Top ${pct}% rank and ` : ''}coursework prerequisites satisfied)`).join("\n")}\n\n${audit.disqualifications.length > 0 ? `\n\n**Where you are currently disqualified:**\n${audit.disqualifications.map(d => `* **${d.title}:** ${d.fix}`).join("\n")}` : ""}`;
      }
    }

    if (q.includes("sat") || q.includes("act") || q.includes("score") || q.includes("test")) {
      if (studentSat === null) {
        return `### Standardized Testing Status\n\nYou have not logged an SAT or ACT score yet.\n\n* **National College Readiness Benchmark:** Scoring at least **480 ERW + 530 Math** on the SAT or **22+ Composite** on the ACT satisfies college readiness placement nationwide.\n* **Next Step:** Open **Edit Profile** to enter an SAT or ACT score, or open the **Colleges** tab and launch the **What-If Goal Simulator** to test hypothetical scores.`;
      }
      const reaches = audit.competitiveReach.map(r => `* **${r.college.short_name}**: Your score (${eff.label}) is **${r.delta} points below** the 25th percentile (${r.college.sat_total_25}).`).join("\n");
      const targets = audit.middleTarget.map(t => `* **${t.college.short_name}**: Inside median band (${t.college.sat_total_25}–${t.college.sat_total_75}). You need **+${t.delta75} pts** to reach the 75th percentile.`).join("\n");
      const anchors = audit.strongAnchor.map(a => `* **${a.college.short_name}**: In the top 25% of admitted freshmen (Above 75th percentile: ${a.college.sat_total_75}).`).join("\n");

      return `### Test Score Analysis (${eff.label})\n\nHere is how your standardized test score matches against your saved colleges:\n\n${anchors ? `**Academically Strong (>75th Percentile):**\n${anchors}\n\n` : ""}${targets ? `**Inside Middle-50% Admitted Range:**\n${targets}\n\n` : ""}${reaches ? `**Test Score Deficit (<25th Percentile):**\n${reaches}\n\n` : ""}\n**Recommendation:** If you retake the exam, aim for **+${audit.competitiveReach.length > 0 ? audit.competitiveReach[0].delta + 30 : 50} SAT points** to position your score in the median band across your target list.`;
    }

    if (q.includes("ap") || q.includes("ib") || q.includes("credit") || q.includes("tuition") || q.includes("save") || q.includes("money")) {
      const completed = (profile.ap_exams || []).filter(e => e.status === "completed");
      const planned = (profile.ap_exams || []).filter(e => e.status === "planned");
      
      return `### AP/IB Credit & Tuition ROI Assessment\n\n* **Completed AP Exams:** ${completed.length} logged (${completed.map(e => `${e.name}: ${e.score}`).join(", ") || "None"}).\n* **Maximum Estimated Tuition Saved:** **$${audit.maxTuitionSaved.toLocaleString()}** (representing approx. **${audit.maxCreditsSaved} college credits** at ${audit.bestSchoolForCredits ? audit.bestSchoolForCredits.short_name : "your saved schools"}).\n* **Planned Exams:** ${planned.length} upcoming (${planned.map(e => e.name).join(", ") || "None"}).\n\n**High-Value Advice:** Under state law (such as Texas HB 1992 / TEC § 51.968), public universities cannot require more than a score of 3 for credit unless special exemptions apply. Scoring a 4 or 5 in planned exams like Calculus BC or Chemistry directly waives up to 8 credits per subject, bypassing introductory lab weed-out courses.`;
    }

    if (q.includes("major") || q.includes("opportunit") || q.includes("activity") || q.includes("extracurricular") || q.includes("suggest") || q.includes("club") || q.includes("start")) {
      return `### Personalized Suggestions & Opportunities (${audit.major})\n\n${audit.personalizedSuggestions.map(s => `* **${s.title}:** ${s.body}`).join("\n\n")}\n\n*Click any suggestion card above to add recommended AP exams or open your step-by-step roadmap.*`;
    }

    if (q.includes("fix") || q.includes("do next") || q.includes("roadmap") || q.includes("priority") || q.includes("improve")) {
      return `### Priority Diagnostic: Your #1 Action Item\n\n**Primary Focus:**\n> **${audit.executiveSummary.immediateActionItem}**\n\n**Secondary Priorities:**\n${audit.executiveSummary.criticalVulnerabilities.slice(0, 3).map((v, i) => `${i + 1}. ${v}`).join("\n")}\n\nThis sequence addresses hard statutory barriers first, followed by score competitive positioning.`;
    }

    return `### Academic Profile Diagnostics\n\n**Executive Health Rating:** ${audit.executiveSummary.overallHealth}\n\n**Top Strengths:**\n${audit.executiveSummary.keyStrengths.map(s => `* ${s}`).join("\n")}\n\n**Identified Deficits & Disqualifications:**\n${audit.executiveSummary.criticalVulnerabilities.length > 0 ? audit.executiveSummary.criticalVulnerabilities.map(v => `* ${v}`).join("\n") : "* No critical disqualifications detected."}\n\n**Recommended Immediate Action:**\n> ${audit.executiveSummary.immediateActionItem}\n\n*Tip: You can ask me specific questions like: "What opportunities fit my major?", "Do I qualify for scholarships?", "How do my SAT scores compare?", or "How much money do my APs save me?"*`;
  }
};


/**
 * UI Renderer for Tab 1: AI Personal Stats Breakdown & Suggestions Hub
 */
AdmitAI.render = function(containerId, profile, collegesData, rulesData, apData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const audit = this.generateAudit(profile, collegesData, rulesData, apData);
  const user = Auth.getCurrentUser();
  const userName = user ? user.name.split(" ")[0] : "Student";
  const eff = CollegesEngine.getEffectiveSat(profile);
  const gpaUw = (profile.gpa_unweighted || 3.85).toFixed(2);
  const gpaW = profile.gpa_weighted ? profile.gpa_weighted.toFixed(2) : "—";
  const pctText = profile.class_percentile ? `Top ${profile.class_percentile}%` : "Rank Unspecified";
  const formatSuggestionBody = (str) => str.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#F8FAFC;">$1</strong>');

  container.innerHTML = `
    <div class="section-header" style="margin-bottom: 1.15rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #60A5FA; background: rgba(37, 99, 235, 0.14); border: 1px solid rgba(59, 130, 246, 0.32); padding: 0.28rem 0.7rem; border-radius: 999px; margin-bottom: 0.45rem;">
            📊 Profile Evaluation · ${audit.major} · ${gpaUw} / ${gpaW} GPA · ${eff.score ? eff.label : 'Test-Optional'} · ${audit.psatScore ? `${audit.psatScore} PSAT` : 'PSAT Ready'} · ${pctText}
          </div>
          <h2>${userName}'s Stats Breakdown &amp; Personalized Suggestions</h2>
          <p>See how much scholarship money your GPA/SAT, PSAT, Extracurriculars, and Awards can earn you at every selected college — and mark each college as <strong>Working On It</strong> or <strong>Submitted</strong>.</p>
        </div>
        <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
          <button class="btn-secondary" style="font-size: 0.85rem; padding: 0.55rem 1rem;" onclick="Onboarding.open()">
            📋 Retake / Edit Stats Survey
          </button>
          <button class="btn-primary" style="font-size: 0.85rem; padding: 0.55rem 1rem;" onclick="App.openProfileModal()">
            ⚡ Quick Adjust Stats
          </button>
        </div>
      </div>
    </div>

    <!-- MAIN 2-COLUMN VISUAL HUB: LEFT SIDE (User Scholarship, EC/Award Earnings, App Tracker) | RIGHT SIDE (College Standing & Scholarship Bars) -->
    <div class="ai-layout-grid" style="display: grid; grid-template-columns: 345px 1fr; gap: 1.35rem; align-items: start; margin-bottom: 1.6rem;">
      
      <!-- LEFT SIDE COLUMN: User-Focused Scholarship & EC Earnings Cards -->
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        
        <!-- 1. __ Scholarships & Total 4-Yr Package Potential Card -->
        <div class="card tf-stat-card" style="border-left: 4px solid #3B82F6 !important; cursor: pointer;" onclick="App.switchTab('status')">
          <svg class="tf-stat-card-svg" viewBox="0 0 300 200" fill="none" aria-hidden="true">
            <circle cx="230" cy="95" r="85" fill="#3B82F6" fill-opacity="0.10" />
            <circle cx="265" cy="55" r="55" fill="#60A5FA" fill-opacity="0.12" />
            <circle cx="205" cy="155" r="45" fill="#818CF8" fill-opacity="0.08" />
          </svg>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="tf-stat-badge" style="background: rgba(37, 99, 235, 0.2); color: #93C5FD;">💰 Merit Scholarships</span>
            <span style="font-size: 0.72rem; color: #93C5FD; font-weight: 700;">View All →</span>
          </div>
          <div style="font-size: 2.05rem; font-weight: 900; color: #FFFFFF; line-height: 1.1; letter-spacing: -0.02em;">
            ${audit.scholarshipsUnlocked.length} Scholarships
          </div>
          <div style="font-size: 0.82rem; color: #34D399; font-weight: 700; margin-top: 0.25rem; margin-bottom: 0.65rem;">
            ${audit.scholarshipsUnlocked.length > 0 ? `Automatic Merit Scholarships Unlocked · Up to $${audit.maxCollege4YrValue.toLocaleString()} 4-Yr Potential` : `Up to $${audit.maxCollege4YrValue.toLocaleString()} 4-Yr Scholarship & Aid Potential`}
          </div>
          ${audit.scholarshipsUnlocked.length > 0 ? `
            <div style="display: flex; flex-direction: column; gap: 0.4rem; padding-top: 0.6rem; border-top: 1px solid rgba(255,255,255,0.08);">
              ${audit.scholarshipsUnlocked.slice(0, 3).map(s => `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; background: rgba(37, 99, 235, 0.14); border: 1px solid rgba(96, 165, 250, 0.22); padding: 0.42rem 0.65rem; border-radius: 10px;">
                  <span style="color: #F8FAFC; font-weight: 600;">${s.name.split("—")[0].trim()}</span>
                  <strong style="color: #34D399;">${s.award}</strong>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <!-- 2. Your ECs, Awards & PSAT Dollar Value Card -->
        <div class="card tf-stat-card" style="border-left: 4px solid #F59E0B !important;">
          <svg class="tf-stat-card-svg" viewBox="0 0 300 200" fill="none" aria-hidden="true">
            <circle cx="235" cy="90" r="80" fill="#F59E0B" fill-opacity="0.10" />
            <circle cx="270" cy="140" r="50" fill="#FBBF24" fill-opacity="0.12" />
          </svg>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="tf-stat-badge" style="background: rgba(245, 158, 11, 0.2); color: #FDE68A;">🏅 Your ECs, Awards &amp; PSAT Value</span>
            <button type="button" class="ob-score-pill" style="font-size: 0.7rem; padding: 0.18rem 0.5rem;" onclick="Onboarding.open(); Onboarding.goToStep(4);">+ Add More</button>
          </div>
          <div style="font-size: 1.9rem; font-weight: 900; color: #FCD34D; line-height: 1.1; letter-spacing: -0.02em;">
            +$${audit.avgEcAwardsPerYr.toLocaleString()} / yr
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.22rem;">
            Up to <strong style="color: #FFFFFF;">+$${audit.maxEcAwards4Yr.toLocaleString()} over 4 yrs</strong> from your Activities, ${audit.selectedAwards.length} Award(s), ${audit.serviceHours} Service Hrs${audit.psatScore ? ` &amp; ${audit.psatScore} PSAT` : ''}
          </div>
        </div>

        <!-- 3. __ Auto-Admits, $__ AP Saved & Application Tracker Card -->
        <div class="card tf-stat-card" style="border-left: 4px solid #10B981 !important;">
          <svg class="tf-stat-card-svg" viewBox="0 0 300 200" fill="none" aria-hidden="true">
            <circle cx="225" cy="100" r="85" fill="#10B981" fill-opacity="0.10" />
            <circle cx="265" cy="60" r="45" fill="#34D399" fill-opacity="0.12" />
          </svg>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span class="tf-stat-badge" style="background: rgba(16, 185, 129, 0.18); color: #6EE7B7;">📋 Guarantees, APs &amp; App Status</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem;">
            <div style="font-size: 1.65rem; font-weight: 900; color: #FFFFFF; line-height: 1.1;">
              ${audit.qualifications.length} Auto-Admits
            </div>
            <div style="font-size: 1.15rem; font-weight: 900; color: #A5B4FC;">
              $${audit.maxTuitionSaved.toLocaleString()} Saved
            </div>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
            ${audit.maxCreditsSaved} AP Credits Waived · ${audit.strongAnchor.length + audit.middleTarget.length} Colleges In Range
          </div>
          <div style="display: flex; gap: 0.45rem; margin-top: 0.65rem; padding-top: 0.65rem; border-top: 1px solid rgba(255,255,255,0.08);">
            <span style="flex: 1; text-align: center; font-size: 0.76rem; font-weight: 800; padding: 0.35rem 0.5rem; border-radius: 8px; background: rgba(59, 130, 246, 0.16); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.3);">
              🛠️ ${audit.workingCount} Working On It
            </span>
            <span style="flex: 1; text-align: center; font-size: 0.76rem; font-weight: 800; padding: 0.35rem 0.5rem; border-radius: 8px; background: rgba(16, 185, 129, 0.16); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3);">
              ✅ ${audit.submittedCount} Submitted
            </span>
          </div>
        </div>

        <!-- 4. Interactive User ECs, Awards & PSAT Live Portfolio Card -->
        <div class="card tf-stat-card" style="border-left: 4px solid #818CF8 !important;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.55rem;">
            <span class="tf-stat-badge" style="background: rgba(129, 140, 248, 0.2); color: #C7D2FE;">✍️ Your Personal ECs, Awards &amp; PSAT</span>
            <button type="button" class="ob-score-pill" style="font-size: 0.72rem; padding: 0.2rem 0.55rem;" onclick="Onboarding.open(); Onboarding.goToStep(4);">Full Editor</button>
          </div>
          <div style="font-size: 0.81rem; color: #E2E8F0; line-height: 1.45; margin-bottom: 0.4rem;">
            <strong style="color: #93C5FD;">Extracurriculars:</strong> ${audit.ecDetailsText ? escapeHTML(audit.ecDetailsText) : `<span style="color: var(--text-muted);">Tier: ${profile.extracurricular_tier || 'strong'} — add your clubs &amp; roles below</span>`}
          </div>
          <div style="font-size: 0.81rem; color: #E2E8F0; line-height: 1.45; margin-bottom: 0.4rem;">
            <strong style="color: #FCD34D;">Awards &amp; Honors:</strong> ${audit.awardsDetailsText ? escapeHTML(audit.awardsDetailsText) : (audit.selectedAwards.length > 0 ? escapeHTML(audit.selectedAwards.join(", ")) : `<span style="color: var(--text-muted);">Add your awards below to boost college $</span>`)}
          </div>
          <div style="font-size: 0.81rem; color: #E2E8F0; line-height: 1.45; margin-bottom: 0.4rem;">
            <strong style="color: #38BDF8;">PSAT / NMSQT:</strong> ${audit.psatScore ? `${audit.psatScore} Total (${audit.psatIndex || ''} Selection Index)` : `<span style="color: var(--text-muted);">Not entered — add PSAT below</span>`}
          </div>
          <div style="font-size: 0.81rem; color: #E2E8F0; line-height: 1.45; margin-bottom: 0.65rem;">
            <strong style="color: #6EE7B7;">#1 Priority Goal:</strong> ${audit.goalDetailsText ? escapeHTML(audit.goalDetailsText) : `<span style="color: var(--text-muted);">${audit.primaryGoal}</span>`}
          </div>

          <!-- Interactive 1-Click Live Update Inputs Right on the Dashboard -->
          <div style="padding-top: 0.65rem; border-top: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 0.45rem;">
            <div style="font-size: 0.73rem; font-weight: 800; color: #93C5FD; text-transform: uppercase; letter-spacing: 0.04em;">
              ⚡ Live Update Your ECs, Awards or PSAT:
            </div>
            <input type="text" id="dash-quick-ec" class="input-control" style="font-size: 0.8rem; padding: 0.42rem 0.65rem;" value="${escapeHTML(audit.ecDetailsText)}" placeholder="Your ECs (e.g. TSA Webmaster, Robotics President)...">
            <input type="text" id="dash-quick-awards" class="input-control" style="font-size: 0.8rem; padding: 0.42rem 0.65rem;" value="${escapeHTML(audit.awardsDetailsText)}" placeholder="Your Awards (e.g. TSA State Finalist, AP Scholar)...">
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <input type="number" id="dash-quick-psat" class="input-control" style="font-size: 0.8rem; padding: 0.42rem 0.65rem; flex: 1;" min="320" max="1520" step="10" value="${audit.psatScore || ''}" placeholder="PSAT Score (320-1520)">
              <button type="button" class="btn-primary" style="font-size: 0.78rem; padding: 0.45rem 0.8rem;" onclick="AdmitAI.saveQuickUserFocus()">
                Update $ Value
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- RIGHT SIDE MAIN COLUMN: Selected Colleges Shown as Admission Standing + Scholarship Dollar Bars -->
      <div class="card tf-bento-card" style="padding: 1.55rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle);">
          <div>
            <h3 style="font-size: 1.3rem; font-weight: 800; color: #FFFFFF; margin: 0;">
              🏛️ Your Selected Colleges — Admission Standing &amp; Scholarship Value
            </h3>
            <p style="font-size: 0.86rem; color: var(--text-muted); margin-top: 0.25rem;">
              Every selected college shows your admission match standing, how much scholarship money your <strong>GPA/SAT, ECs, Awards &amp; PSAT</strong> can earn you there, and lets you mark it as <strong>Working On It</strong> or <strong>Submitted</strong>.
            </p>
          </div>
          <button type="button" class="btn-secondary" style="font-size: 0.82rem; padding: 0.48rem 0.95rem;" onclick="Onboarding.open(); Onboarding.goToStep(5);">
            + Add / Change Colleges
          </button>
        </div>

        <!-- Legend Pills -->
        <div style="display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
          <span class="tf-stat-badge" style="background: rgba(16, 185, 129, 0.14); color: #34D399; border-color: rgba(16, 185, 129, 0.32);">
            🟢 72%–97% Likely / Auto-Admit
          </span>
          <span class="tf-stat-badge" style="background: rgba(59, 130, 246, 0.14); color: #93C5FD; border-color: rgba(59, 130, 246, 0.32);">
            🔵 48%–71% Target Match
          </span>
          <span class="tf-stat-badge" style="background: rgba(245, 158, 11, 0.14); color: #FCD34D; border-color: rgba(245, 158, 11, 0.32);">
            🟡 28%–47% Competitive Reach
          </span>
          <span class="tf-stat-badge" style="background: rgba(239, 68, 68, 0.14); color: #FCA5A5; border-color: rgba(239, 68, 68, 0.32);">
            🔴 &lt;28% High Reach
          </span>
        </div>

        <!-- College Admission Standing Horizontal Bars List -->
        <div id="ai-college-bars-list" style="display: flex; flex-direction: column; gap: 1.1rem;">
          ${audit.evaluatedColleges.map(item => `
            <div class="tf-progress-card">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.6rem; margin-bottom: 0.6rem;">
                <div style="display: flex; align-items: center; gap: 0.55rem; flex-wrap: wrap;">
                  <strong style="font-size: 1.1rem; font-weight: 800; color: #FFFFFF;">${item.college.name}</strong>
                  <span class="tf-stat-badge" style="background: ${item.badgeBg}; color: ${item.badgeColor};">
                    ${item.tierLabel}
                  </span>
                </div>

                <!-- Interactive 1-Click Application Status Toggles (Working On It / Submitted) -->
                <div style="display: flex; align-items: center; gap: 0.7rem; flex-wrap: wrap;">
                  <div style="display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(7, 13, 25, 0.85); border: 1px solid rgba(148, 163, 184, 0.2); padding: 0.22rem; border-radius: 999px;">
                    <button type="button" class="ob-score-pill ${item.appStatus === 'working' ? 'active' : ''}" style="border-radius: 999px; font-size: 0.72rem; padding: 0.22rem 0.65rem; border: none;" onclick="AdmitAI.setCollegeStatus('${item.college.id}', 'working')">
                      🛠️ Working On It
                    </button>
                    <button type="button" class="ob-score-pill ${item.appStatus === 'submitted' ? 'active' : ''}" style="border-radius: 999px; font-size: 0.72rem; padding: 0.22rem 0.65rem; border: none; ${item.appStatus === 'submitted' ? 'background: #059669; color: #FFFFFF;' : ''}" onclick="AdmitAI.setCollegeStatus('${item.college.id}', 'submitted')">
                      ✅ Submitted
                    </button>
                  </div>

                  <div style="display: flex; align-items: baseline; gap: 0.3rem;">
                    <span style="font-size: 1.4rem; font-weight: 900; color: ${item.badgeColor};">${item.chancePct}%</span>
                    <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Match Score</span>
                  </div>
                </div>
              </div>

              <!-- Specular Progress Bar -->
              <div class="tf-progress-shell" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.chancePct}">
                <div class="tf-progress-fill" style="width: ${item.chancePct}%; background: ${item.barGradient};">
                  <span style="font-size: 0.74rem; font-weight: 900; color: #FFFFFF; text-shadow: 0 1px 2px rgba(0,0,0,0.65);">${item.chancePct}%</span>
                </div>
              </div>

              <!-- Personalized Scholarship & EC/Award Dollar Earnings Breakdown at This College -->
              <div style="margin-top: 0.65rem; background: rgba(9, 15, 29, 0.78); border: 1px solid rgba(96, 165, 250, 0.22); border-radius: 12px; padding: 0.7rem 0.9rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.45rem;">
                  <span style="font-size: 0.84rem; font-weight: 800; color: #34D399;">
                    💰 Est. Scholarship &amp; Aid at ${item.college.short_name}: $${item.scholarship.totalPerYr.toLocaleString()}/yr ($${item.scholarship.total4YrValue.toLocaleString()} 4-Yr Total)
                  </span>
                  <span style="font-size: 0.74rem; font-weight: 700; color: #93C5FD;">
                    Merit Cutoff: ${item.college.scholarship_deadline || item.college.early_deadline || 'Nov 1'}
                  </span>
                </div>
                <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; margin-bottom: 0.35rem;">
                  <span style="font-size: 0.74rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; background: rgba(245, 158, 11, 0.16); color: #FDE68A; border: 1px solid rgba(245, 158, 11, 0.3);">
                    🏅 Your ECs &amp; Awards Earn: +$${item.scholarship.ecAwardsPerYr.toLocaleString()}/yr ($${(item.scholarship.ecAwardsPerYr * 4).toLocaleString()} 4-Yr)
                  </span>
                  <span style="font-size: 0.74rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; background: rgba(37, 99, 235, 0.16); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.3);">
                    📊 GPA/SAT Merit: $${item.scholarship.statsMeritPerYr.toLocaleString()}/yr
                  </span>
                  ${item.scholarship.psatMeritPerYr > 0 ? `
                    <span style="font-size: 0.74rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; background: rgba(56, 189, 248, 0.16); color: #7DD3FC; border: 1px solid rgba(56, 189, 248, 0.3);">
                      🎓 PSAT / Natl Merit: +$${item.scholarship.psatMeritPerYr.toLocaleString()}/yr
                    </span>
                  ` : ''}
                  ${item.savings.tuitionSaved > 0 ? `
                    <span style="font-size: 0.74rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 6px; background: rgba(16, 185, 129, 0.15); color: #6EE7B7; border: 1px solid rgba(16, 185, 129, 0.3);">
                      💵 AP Credits: +$${item.savings.tuitionSaved.toLocaleString()} Waived
                    </span>
                  ` : ''}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; font-size: 0.77rem; color: #CBD5E1;">
                  <span>🎯 <strong>${item.scholarship.programName}</strong> · Driven by your ${item.scholarship.userDriversLabel}</span>
                  <span style="color: #93C5FD; font-weight: 700;">Middle-50% SAT: ${item.college.sat_total_25}–${item.college.sat_total_75}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        ${audit.recommendedColleges.length > 0 ? `
          <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.6rem;">
            <span style="font-size: 0.82rem; color: var(--text-muted);">
              💡 <strong>Quick Add More Colleges to Your Bars:</strong>
            </span>
            <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
              ${audit.recommendedColleges.map(c => `
                <button class="pill-btn" style="font-size: 0.76rem; padding: 0.32rem 0.75rem;" onclick="AdmitAI.addRecommendedCollege('${c.id}')">
                  + Add ${c.short_name} (${c.sat_total_25}–${c.sat_total_75} SAT)
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

    </div>

    <!-- CLEAN 2-COLUMN BOTTOM SECTION: Personalized Suggestions | Quick Advisor Chat -->
    <div class="ai-layout-grid" style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.35rem; align-items: start;">
      
      <!-- Personalized Suggestions & Opportunities Grid -->
      <div class="card" style="background: var(--bg-card); border: 1px solid var(--border-subtle);">
        <div style="margin-bottom: 1rem;">
          <h3 style="font-size: 1.12rem; color: #FFFFFF; font-weight: 800;">
            🚀 Personalized Suggestions, Opportunities &amp; Next Steps
          </h3>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            Tailored to your <strong>${audit.major}</strong> major, activities, and priority goal
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem;">
          ${audit.personalizedSuggestions.map(s => `
            <div style="background: rgba(15, 23, 42, 0.72); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
                  <span style="font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #60A5FA;">${s.category}</span>
                  <span style="font-size: 0.66rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px; background: rgba(59, 130, 246, 0.14); color: #93C5FD;">${s.badge}</span>
                </div>
                <h4 style="font-size: 0.94rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.35rem;">${s.title}</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.48;">${formatSuggestionBody(s.body)}</p>
              </div>
              <div>
                <button class="btn-secondary" style="font-size: 0.76rem; padding: 0.38rem 0.75rem;" onclick="${s.actionOnClick}">
                  ${s.actionLabel}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Interactive Advisor Chat Interface -->
      <div class="card tf-bento-card" style="display: flex; flex-direction: column; height: 485px; padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.65rem; margin-bottom: 0.65rem;">
          <div>
            <h3 style="font-size: 1.04rem; font-weight: 800; color: #FFFFFF;">
              💬 Ask Your Admissions Advisor
            </h3>
            <span style="font-size: 0.74rem; color: var(--text-muted);">Ask anything about your standing, scholarships, or APs</span>
          </div>
          <button class="btn-secondary" style="font-size: 0.7rem; padding: 0.22rem 0.55rem;" onclick="AdmitAI.clearChat()">
            Clear
          </button>
        </div>

        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.65rem;">
          <button class="pill-btn" style="font-size: 0.72rem; padding: 0.24rem 0.55rem;" onclick="AdmitAI.askQuickQuestion('What opportunities and suggestions fit my major?')">
            "Opportunities for my major?"
          </button>
          <button class="pill-btn" style="font-size: 0.72rem; padding: 0.24rem 0.55rem;" onclick="AdmitAI.askQuickQuestion('What scholarships do I qualify for right now?')">
            "What scholarships do I unlock?"
          </button>
          <button class="pill-btn" style="font-size: 0.72rem; padding: 0.24rem 0.55rem;" onclick="AdmitAI.askQuickQuestion('What is my single biggest fix to qualify for more schools?')">
            "How do I boost my standing?"
          </button>
        </div>

        <div id="ai-chat-messages" class="tf-chat-viewport" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.75rem;">
          <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(96, 165, 250, 0.25); border-radius: 14px; padding: 0.85rem; font-size: 0.83rem; line-height: 1.48; color: var(--text-main);">
            <strong style="color: #60A5FA; display: block; margin-bottom: 0.2rem;">ShipMates Advisor:</strong>
            Hello ${userName}! I've evaluated your admission standing and scholarship value for <strong>${audit.evaluatedColleges.length} universities</strong>. Ask me how to strengthen your match standing or unlock more scholarships!
          </div>
        </div>

        <form id="ai-chat-form" class="tf-chat-input-group" onsubmit="event.preventDefault(); AdmitAI.handleChatSubmit();">
          <input type="text" id="ai-chat-input" class="input-control" placeholder="Ask about your colleges, scholarships, or AP credits..." style="font-size: 0.85rem;" autocomplete="off" required>
          <button type="submit" class="btn-primary tf-shimmer-btn" style="padding: 0.48rem 1rem; font-size: 0.82rem; border-radius: 999px; white-space: nowrap;">
            Ask ↑
          </button>
        </form>
      </div>

    </div>
  `;
};

AdmitAI.addRecommendedAps = function(idsCsv) {
  if (!idsCsv) return;
  const ids = idsCsv.split(",").filter(Boolean);
  const profile = ProfileManager.get();
  if (!profile.ap_exams) profile.ap_exams = [];
  const catalog = CreditsEngine.AVAILABLE_EXAMS || [];
  let added = 0;

  ids.forEach(id => {
    if (!profile.ap_exams.some(e => e.id === id)) {
      const found = catalog.find(a => a.id === id);
      if (found) {
        profile.ap_exams.push({
          id: found.id,
          name: found.name,
          score: 5,
          status: profile.grade_level >= 12 ? "completed" : "planned"
        });
        added++;
      }
    }
  });

  if (added > 0) {
    ProfileManager.save(profile);
    App.showToast(`Added ${added} major-recommended AP exam(s) to your profile!`, "success");
  } else {
    App.switchTab("credits");
  }
};

AdmitAI.addRecommendedCollege = function(collegeId) {
  if (!collegeId) return;
  ProfileManager.toggleSavedCollege(collegeId);
  const col = CollegesEngine.getById(collegeId);
  App.showToast(`Added ${col ? col.short_name : collegeId} to your target college list!`, "success");
};

AdmitAI.setCollegeStatus = function(collegeId, status) {
  if (!collegeId || !status) return;
  ProfileManager.setCollegeStatus(collegeId, status);
  const col = CollegesEngine.getById(collegeId);
  const label = status === "submitted" ? "✅ Submitted" : "🛠️ Working On It";
  App.showToast(`${col ? col.short_name : collegeId} marked as ${label}!`, "success");
};

AdmitAI.saveQuickUserFocus = function() {
  const profile = ProfileManager.get();
  const ecInput = document.getElementById("dash-quick-ec");
  const awInput = document.getElementById("dash-quick-awards");
  const psatInput = document.getElementById("dash-quick-psat");
  if (ecInput) profile.extracurricular_details = ecInput.value.trim();
  if (awInput) profile.awards_details = awInput.value.trim();
  if (psatInput && psatInput.value) {
    const pVal = parseInt(psatInput.value, 10);
    if (pVal >= 320 && pVal <= 1520) {
      profile.psat_score = pVal;
      profile.psat_index = Math.min(228, Math.round(pVal * 0.15));
      if (pVal >= 1470) profile.national_merit_status = "semifinalist";
      else if (pVal >= 1400) profile.national_merit_status = "commended";
    }
  }
  ProfileManager.save(profile);
  App.showToast("✨ Updated your ECs, Awards & PSAT — recalculated college scholarship values!", "success");
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

AdmitAI.askQuestion = function(question) {
  this.postUserMessage(question);
};

AdmitAI.postUserMessage = function(text) {
  const container = document.getElementById("ai-chat-messages");
  if (!container) return;

  const userBubble = document.createElement("div");
  userBubble.style.cssText = "align-self: flex-end; background: var(--primary); color: #FFFFFF; border-radius: var(--radius-md); padding: 0.6rem 0.85rem; font-size: 0.84rem; max-width: 85%;";
  userBubble.innerText = text;
  container.appendChild(userBubble);

  const profile = ProfileManager.get();
  const colleges = CollegesEngine.getAll();
  const rules = StatusEngine.rulesData;
  const apData = CreditsEngine.apData;

  const answerMarkdown = AdmitAI.respondToQuery(text, profile, colleges, rules, apData);
  this.chatHistory.push({ role: "user", content: text }, { role: "assistant", content: answerMarkdown });

  const botBubble = document.createElement("div");
  botBubble.style.cssText = "background: rgba(30, 41, 59, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.84rem; line-height: 1.5; color: var(--text-main); max-width: 95%;";
  
  const formattedHtml = answerMarkdown
    .replace(/### (.*?)\n/g, '<h4 style="color: #60A5FA; font-size: 0.95rem; margin-bottom: 0.4rem;">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\* ([^\n]+)/g, '<li style="margin-left: 1.25rem;">$1</li>')
    .replace(/\n\n/g, '<div style="margin-bottom: 0.6rem;"></div>');

  botBubble.innerHTML = `
    <strong style="color: #60A5FA; display: block; margin-bottom: 0.35rem;">ShipMates Advisor:</strong>
    <div>${formattedHtml}</div>
  `;

  container.appendChild(botBubble);
  container.scrollTop = container.scrollHeight;
};

AdmitAI.clearChat = function() {
  const container = document.getElementById("ai-chat-messages");
  if (!container) return;
  const user = Auth.getCurrentUser();
  const userName = user ? user.name.split(" ")[0] : "Student";
  container.innerHTML = `
    <div style="background: rgba(30, 41, 59, 0.8); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem; font-size: 0.84rem; line-height: 1.45; color: var(--text-main);">
      <strong style="color: #60A5FA; display: block; margin-bottom: 0.25rem;">ShipMates Advisor:</strong>
      Chat cleared. Ask me any question about your statutory admission standing, score percentiles, or AP credit conversions.
    </div>
  `;
};

window.CheckupEngine = AdmitAI;
