# ShipMates — Fact-Based College Standing & AP Credit Planner

> **Congressional App Challenge Submission**  
> *Enter your GPA, class rank, and test scores once to see state automatic admission rules, merit scholarships, middle-50% college score ranges, and AP/IB course credit waivers.*

---

## Why I Built ShipMates

When my friends and I started looking at colleges and scholarships, most online tools either hid everything behind a paywall or spat out random "X% chance of admission" guesses without explaining what courses or scores we actually needed. Meanwhile, information about state automatic admission laws (like Texas Top 10%/Top 5%, Florida Talented Twenty, or Georgia's HOPE/Zell Miller scholarships) and AP credit policies is scattered across dozens of university PDFs and state statutes.

**ShipMates** puts all of those rules in one place:
1. **Official Published Score Ranges:** Middle-50% SAT and ACT ranges from the U.S. Department of Education College Scorecard.
2. **State Admission & Scholarship Rules:** Verified state programs (Texas TEC § 51.803, California UC ELC, Florida Bright Futures & Talented Twenty, Georgia HOPE & Zell Miller, New York Excelsior, and national scholarships like National Merit and Gates).
3. **University AP/IB Credit Policies:** Course code equivalencies and estimated tuition savings calculated from university registrar catalogs and state credit laws (such as Texas HB 1992).

---

## Features

### 1. Overview & Scholarships ("Where do I stand?")
* **Academic Snapshot:** Tracks unweighted/weighted GPA, class rank percentile, SAT/ACT subscores, and graduation coursework requirements.
* **State & National Scholarship Checker:** Evaluates your profile against 12 major state and national programs and shows either "Eligible" or the exact requirement you are still missing (e.g., *"Need +40 SAT pts (1200 req)"* or *"Enroll in Algebra II"*).

### 2. Colleges ("What should I aim for?")
* **College Scorecard Search & Filter:** Browse and save universities with live middle-50% SAT/ACT range bars.
* **Score Target Deltas:** Shows where your current score sits relative to each college's 25th and 75th percentiles and how many points you need to reach the middle-50% or 75th percentile.
* **Side-by-Side Comparison:** Compare up to 5 saved schools across SAT/ACT ranges, admission rates, tuition, per-credit costs, and graduation rates.

### 3. AP/IB Credit ("What are my exams worth?")
* **Course Equivalency Lookup:** Matches AP exam scores (3, 4, or 5) to specific university course numbers (for example, scoring a 4 on AP Calculus AB gives credit for `M 408K` at UT Austin or `MATH 151` at Texas A&M).
* **Tuition & Semester Savings Calculator:** Multiplies earned credit hours by each college's published per-credit-hour rate and estimates how many 15-credit semesters you can skip.

### 4. Roadmap ("What do I do next?")
* **Grade-by-Grade Checklist:** Builds a 9th–12th grade checklist from your profile gaps, upcoming SAT/ACT targets, AP exams, and application deadlines (FAFSA, Common App, ApplyTexas, UC Application).

### 5. Profile Checkup ("What should I focus on?")
* **Profile Summary & Action Items:** Combines your saved colleges, AP courses, and scholarship eligibility into a single summary page with a rule-based Q&A helper to answer quick questions about your numbers.

---

## Tech Stack

* **Frontend:** HTML5, CSS3, and vanilla JavaScript (ES6 modules/IIFEs).
* **Storage:** Browser `localStorage` so student academic data stays private on the user's device.
* **No External Frameworks Required:** Runs directly in any modern browser with zero build steps.

---

## Running Locally

Clone the repository and open `index.html` in a browser, or run a local static server:

```bash
git clone https://github.com/vbuisness2009-commits/admit-college-guide.git
cd admit-college-guide
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

---

## Data Sources

1. **U.S. Department of Education College Scorecard:** [collegescorecard.ed.gov](https://collegescorecard.ed.gov/)
2. **Texas Education Code § 51.803 (Uniform Admission Policy):** [statutes.capitol.texas.gov](https://statutes.capitol.texas.gov/Docs/ED/htm/ED.51.htm#51.803)
3. **Texas HB 1992 (AP/IB Credit Policy):** [capitol.texas.gov](https://capitol.texas.gov/BillLookup/History.aspx?LegSess=84R&Bill=HB1992)
4. **University of California Eligibility in the Local Context (ELC):** [admission.universityofcalifornia.edu](https://admission.universityofcalifornia.edu/admission-requirements/freshman-requirements/california-residents/local-guarantee-elc.html)
5. **Florida Bright Futures & Talented Twenty:** [fldoe.org](https://www.fldoe.org/schools/family-community/activities-programs/talented-twenty-program/)
6. **University Testing & Registrar Catalogs:** Official AP credit tables published by each university's registrar office.
