# Admit — Fact-Based College Standing & AP Credit ROI Engine

> **2026 Congressional App Challenge Submission**  
> *Enter your scores once to see published college score ranges, statutory admission guarantees, and AP/IB credit tuition savings without speculative predictions.*

---

## 🎯 The Core Philosophy: Zero Guesswork

Most commercial college tools give students a speculative *"X% admission chance"* calculated by proprietary black-box algorithms. In reality, university admissions involve holistic qualitative evaluations (essays, extracurricular leadership, regional quotas, and recommendation letters) that no machine can reliably calculate. Reviewers consistently note that these percentage guesses mislead students and run unrealistically high.

**Admit takes the opposite approach:** It never guesses or predicts admissions. Instead, it operates strictly on **facts it can verify with 100% certainty**:
1. **Official Published Score Ranges:** Direct middle-50% SAT/ACT percentile bands from the U.S. Department of Education.
2. **Statutory Admission Rules:** Verified state laws guaranteeing admission (e.g., Texas Uniform Admission Policy TEC § 51.803, California UC ELC, Florida Talented Twenty).
3. **Institutional AP/IB Credit Catalogs:** Real course code equivalencies and per-credit-hour tuition savings calculated from university registrar catalogs and state legislation (e.g., Texas HB 1992).

---

## 💻 Features & Architecture

### User Account & Authentication Flow (Production-Grade)
* **Dedicated Landing & Auth Page (`#view-auth`):** When unauthenticated, visitors see a high-conversion, professional educational landing page modeled after modern SAT prep platforms (Khan Academy / College Board), with feature pillars and a tabbed "Sign In" / "Create Account" card.
* **Real Account Registration:** Validates student names, unique emails, and secure passwords stored in local client-side storage. Zero pre-seeded fake demo accounts.
* **5-Step Student Onboarding Wizard (`#view-onboarding`):** New students are seamlessly guided through a focused, multi-step profile configuration:
  * **Step 1:** Location & Grade Level (Residency, High School, 9th–12th).
  * **Step 2:** Academic Performance (Unweighted & Weighted GPA, Class Rank & Size with live percentile calculation).
  * **Step 3:** Standardized Testing (SAT Math/ERW subscores, ACT, or "haven't taken yet" toggle).
  * **Step 4:** Curriculum & Coursework (Algebra II, lab sciences count, state endorsement).
  * **Step 5:** AP/IB Exams taken or planned + target university selection.
* **Persistent Session Management:** Remembering logged-in state across browser sessions with a top-nav user menu dropdown for profile editing, wizard re-running, and sign out.

### Tab 1 — Status: "Where do I stand?"
* **Student Academic Snapshot:** Displays GPA (unweighted & weighted), class rank percentile, SAT/ACT splits, and graduation diploma endorsements.
* **State Statutory Admission Engine:** Evaluates student profile against published state automatic admission laws.
  * **Texas Public Universities (TEC § 51.803):** Checks Top 10% class rank + Distinguished Level of Achievement diploma (4 math incl. Algebra II, 4 lab sciences, endorsement) OR College Readiness Benchmarks (SAT 480 ERW + 530 Math).
  * **UT Austin Automatic Admission Cap (TEC § 51.803(a-1) / SB 175):** Capped statutory threshold for Texas residents (Top 6% current / Top 5% for Fall 2027 entry).
  * **California UC Eligibility in the Local Context (ELC):** Top 9% in participating CA high schools guaranteed admission to at least one UC campus.
  * **Florida Talented Twenty Program:** Top 20% in Florida public high schools completing 18 core college-prep courses.
* **Single-Fix Indicator:** If a requirement is unmet, the engine explicitly identifies the single concrete action needed (e.g. *"Enroll in Algebra II and 4th lab science"*).

### Tab 2 — Colleges: "What should I aim for?"
* **College Scorecard Integration:** Instant search and filtering across major US institutions using official U.S. Department of Education data.
* **Middle-50% Range Bar Visualization:** Horizontal bar chart displaying the 25th to 75th percentile SAT score range for admitted freshmen, with the student's score plotted as an interactive marker.
* **Descriptive Classifications:** Categorizes scores as *"Below range"*, *"In middle-50% range"*, or *"Above range"*.
* **Target Score Deltas:** Calculates the exact points required to reach the 75th percentile of each university (e.g. *"Target: +60 pts to reach 75th percentile (1490)"*).
* **Side-by-Side Comparison Modal:** Compare up to 5 saved universities across SAT/ACT percentiles, admission rates, in-state vs. out-of-state tuition, per-credit costs, and graduation rates.

### Tab 3 — AP/IB Credit: "What are my exams worth?"
* **Course Code Equivalencies:** Direct lookup of university-specific course waivers (e.g., scoring a 4 on AP Calculus AB awards `M 408K` at UT Austin or `MATH 151` at Texas A&M).
* **Tuition & Time Saved Calculator:** Multiplies earned credit hours by the university's official cost per credit hour:
  $$\text{Tuition Saved} = \text{Credits Earned} \times \text{Cost per Credit Hour}$$
  Calculates equivalent college semesters skipped (standard 15-credit semester baseline).
* **Future Target Simulator:** Displays the exact minimum score needed on upcoming planned exams to unlock additional course credits.
* **Statutory Compliance Context:** Highlights state credit protections, including Texas HB 1992 (TEC § 51.968) prohibiting public universities from requiring scores higher than 3 for credit without special accreditation waivers.

### Tab 4 — Roadmap: "What do I do next?"
* **Dynamic Synthesis:** Automatically generates a customized 9th–12th grade action timeline synthesized from the student's detected profile gaps:
  * Coursework prerequisites needed for state automatic admission.
  * Retake score targets for saved colleges where the student is below the 25th percentile.
  * Recommended AP exams to maximize college credit savings.
  * Standardized application timeline (FAFSA, ApplyTexas, Common App, UC application deadlines).

### Tab 5 — AI Audit & Advisor: "What do I qualify for and what don't I?"
* **Executive Diagnostic Brief:** Algorithmically analyzes the student's full profile (GPA, class rank, SAT/ACT splits, course prerequisites, and AP scores) to produce an authoritative diagnosis:
  * **Key Strategic Strengths:** Pinpoints academic anchors, statutory guarantees, and course credit gains.
  * **Critical Deficits & Disqualifications:** Explicitly flags why a student does *not* qualify for specific programs (e.g. *"Missing 4th lab science course required under TEC § 51.803"* or *"SAT score is 70 points below the 25th percentile at Rice University"*).
  * **Recommended #1 Immediate Action:** Identifies the single highest-leverage academic or testing adjustment.
* **Interactive Admissions Advisor (AI Chat):** Context-aware conversational assistant that answers questions grounded directly in the student's numbers without hallucination (e.g., *"What do I qualify for right now?"*, *"How does my SAT compare to my saved schools?"*, *"How much money do my APs save me?"*).

---

## 🛠 Tech Stack & Design Principles

* **Frontend:** Clean Semantic HTML5, Modular Modern JavaScript (ES6+), Vanilla CSS Custom Properties.
* **Zero External Dependencies / Zero Slop:** No bloated frameworks, no third-party tracking scripts, and no API keys required. Runs 100% offline.
* **Local Persistence:** Uses browser `localStorage` to save user profile changes automatically.
* **Responsive & Accessible:** Fully mobile-responsive layout designed with accessible color contrast and high-density information display.

---

## 🚀 Running the App Locally

Clone the repository and open `index.html` directly in any web browser, or launch a local development server:

```bash
# Clone the repository
git clone https://github.com/vbuisness2009-commits/admit-college-guide.git
cd admit-college-guide

# Start a local static server
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

---

## 📑 Official Data Sources

All application data is drawn directly from public domain and statutory sources:
1. **U.S. Department of Education College Scorecard:** [collegescorecard.ed.gov](https://collegescorecard.ed.gov/) (June 2026 release)
2. **Texas Education Code § 51.803 (Uniform Admission Policy):** [Texas Capitol Statutes](https://statutes.capitol.texas.gov/Docs/ED/htm/ED.51.htm#51.803)
3. **Texas HB 1992 (AP Credit Standard):** [Texas Legislature Online](https://capitol.texas.gov/BillLookup/History.aspx?LegSess=84R&Bill=HB1992)
4. **University of California Board of Regents Policy 2102 (ELC):** [UC Admissions](https://admission.universityofcalifornia.edu/admission-requirements/freshman-requirements/california-residents/local-guarantee-elc.html)
5. **Florida Board of Governors Regulation 6.002 (Talented Twenty):** [Florida Dept. of Education](https://www.fldoe.org/schools/family-community/activities-programs/talented-twenty-program/)
6. **University Testing Catalogs:** Curated from official testing and registrar offices (UT Austin Student Testing Services, Texas A&M Testing Services, UC Berkeley Registrar, UF Undergraduate Catalog, etc.).

---

## 🤖 2026 Congressional App Challenge AI Tool Disclosure

In accordance with the 2026 Congressional App Challenge rules governing the use of artificial intelligence:
* **Tool Usage:** Generative AI tools (Claude 3.7 / Gemini) were utilized strictly as a technical mentor and pair programmer for debugging JavaScript DOM logic, resolving CSS responsive layout quirks, and reviewing data schemas.
* **Human Authorship & Contribution:** The application architecture, deterministic rule validation engine, mathematical tuition calculation formulas, state statutory analysis, UI design, and JSON data mapping were conceived, structured, and implemented by the student author. The student has complete comprehension of all underlying functions and logic in the codebase.
