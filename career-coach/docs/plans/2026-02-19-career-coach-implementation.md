# Career Coach Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-featured Claude Code plugin for job search and career coaching with 3 agents, 1 skill, 2 commands, hooks, 4 output styles, a TypeScript MCP server, and 6 LaTeX templates.

**Architecture:** Modular monolith pattern — single plugin with components communicating through a shared `career-profile.json` contract. Hub-and-spoke agent architecture with Career Director orchestrating Job Search and Interview Prep specialists. MCP server provides read-only job market data; Chrome MCP integrated externally.

**Tech Stack:** Claude Code plugin system (markdown agents/skills/commands), TypeScript + @modelcontextprotocol/sdk + zod + axios (MCP server), LaTeX (resume compilation), bash (hooks).

**Reference codebase:** `consulting-toolkit/` in same repo — follow its patterns exactly for agents, MCP server, hooks.

---

## Parallelization Strategy

Tasks 1-2 are sequential (foundation). Tasks 3-9 are **fully independent** and should be dispatched as parallel agent workstreams. Task 10 is the final integration step.

```
Task 1: Foundation (plugin.json, directories)
Task 2: Career Profile Schema (shared contract — all other tasks depend on this)
  ↓
  ├── Task 3: Career Director Agent        ← parallel
  ├── Task 4: Job Search Agent             ← parallel
  ├── Task 5: Interview Prep Agent         ← parallel
  ├── Task 6: Resume Updater Skill         ← parallel
  ├── Task 7: Commands                     ← parallel
  ├── Task 8: Output Styles                ← parallel
  ├── Task 9: Hooks + LaTeX Templates      ← parallel
  ↓
Task 10: MCP Server (largest workstream, own sequential steps)
Task 11: README + Final Integration
```

---

## Task 1: Foundation — Plugin Manifest & Directory Structure

**Files:**
- Create: `career-coach/.claude-plugin/plugin.json`
- Create: `career-coach/.claude-plugin/marketplace.json`
- Create: All directories (empty)

**Step 1: Create directory structure**

```bash
mkdir -p career-coach/.claude-plugin
mkdir -p career-coach/agents
mkdir -p career-coach/skills/resume-updater/references
mkdir -p career-coach/commands
mkdir -p career-coach/hooks
mkdir -p career-coach/output-styles
mkdir -p career-coach/mcp-servers/job-intelligence/src/{tools,services,schemas}
mkdir -p career-coach/templates/latex
```

**Step 2: Write plugin.json**

Create `career-coach/.claude-plugin/plugin.json`:

```json
{
  "name": "career-coach",
  "version": "1.0.0",
  "description": "Career coaching and job search plugin with AI-powered resume building, interview preparation, and multi-platform job discovery. Features a Career Director orchestrator, job search automation via MCP, industry-specific output styles, and LaTeX resume compilation.",
  "author": {
    "name": "Antony Zaki"
  },
  "homepage": "https://github.com/Aznatkoiny/zAI-Skills",
  "repository": "https://github.com/Aznatkoiny/zAI-Skills",
  "license": "MIT",
  "keywords": [
    "career",
    "job-search",
    "resume",
    "interview-prep",
    "career-coaching",
    "linkedin",
    "latex-resume"
  ]
}
```

**Step 3: Write marketplace.json (dev only)**

Create `career-coach/.claude-plugin/marketplace.json`:

```json
{
  "name": "career-coach-dev",
  "plugins": [
    {
      "name": "career-coach",
      "source": "./"
    }
  ]
}
```

**Step 4: Commit**

```bash
git add career-coach/
git commit -m "feat(career-coach): scaffold plugin directory structure and manifests"
```

---

## Task 2: Career Profile Schema — Shared Contract

**Files:**
- Create: `career-coach/skills/resume-updater/references/career-profile-schema.md`

This file defines the `career-profile.json` schema that ALL agents, skills, and commands depend on. It must be written first.

**Step 1: Write the schema reference**

Create `career-coach/skills/resume-updater/references/career-profile-schema.md`:

```markdown
# Career Profile Schema

The `career-profile.json` file is the single source of truth for the user's professional data. All agents, skills, and commands read from and write to this file.

## Location

Always stored at the project root as `career-profile.json`.

## Full Schema

\`\`\`json
{
  "personal": {
    "name": "string — Full legal name",
    "email": "string — Primary contact email",
    "phone": "string — Phone with country code",
    "location": "string — City, State/Country",
    "linkedin": "string — Full LinkedIn URL",
    "github": "string — Full GitHub URL (optional)",
    "portfolio": "string — Portfolio/website URL (optional)"
  },
  "summary": "string — 2-3 sentence professional summary. Written in third person, emphasizing value proposition for target roles.",
  "target": {
    "roles": ["string — Target job titles, e.g., 'Senior ML Engineer', 'Staff Software Engineer'"],
    "industries": ["string — Target industries, e.g., 'AI/ML', 'FinTech', 'Healthcare'"],
    "locations": ["string — Preferred locations, e.g., 'San Francisco, CA', 'Remote'"],
    "salary_range": {
      "min": "number — Minimum acceptable base salary in USD",
      "max": "number — Target/ideal base salary in USD",
      "currency": "string — ISO 4217 code, default 'USD'"
    },
    "remote_preference": "string — One of: 'remote', 'hybrid', 'onsite', 'flexible'"
  },
  "experience": [
    {
      "company": "string — Company name",
      "title": "string — Job title",
      "start_date": "string — YYYY-MM format",
      "end_date": "string — YYYY-MM format or null if current",
      "current": "boolean — true if this is the current role",
      "responsibilities": ["string — Key responsibility descriptions"],
      "achievements": [
        {
          "statement": "string — Full achievement statement",
          "metric": "string — Quantified result (e.g., '40% reduction in latency')",
          "method": "string — How it was accomplished (e.g., 'by implementing Redis caching layer')"
        }
      ],
      "skills_used": ["string — Technologies and skills used in this role"],
      "projects": ["string — Notable project names or descriptions"]
    }
  ],
  "education": [
    {
      "institution": "string — University/school name",
      "degree": "string — Degree type (e.g., 'B.S.', 'M.S.', 'Ph.D.')",
      "field": "string — Field of study",
      "graduation": "string — YYYY or YYYY-MM format",
      "gpa": "string — GPA if notable (3.5+), otherwise omit",
      "honors": ["string — Dean's list, cum laude, etc."]
    }
  ],
  "skills": {
    "technical": ["string — Programming languages, frameworks, algorithms"],
    "tools": ["string — Software tools, platforms, IDEs"],
    "languages": ["string — Spoken languages with proficiency"],
    "certifications": ["string — Professional certifications with dates"]
  },
  "projects": [
    {
      "name": "string — Project name",
      "description": "string — 1-2 sentence description",
      "url": "string — GitHub/demo URL (optional)",
      "technologies": ["string — Tech stack used"],
      "impact": "string — Quantified impact or outcome"
    }
  ],
  "volunteer_leadership": [
    {
      "organization": "string — Organization name",
      "role": "string — Role/title",
      "start_date": "string — YYYY-MM format",
      "end_date": "string — YYYY-MM format or null if current",
      "description": "string — What you did",
      "impact": "string — Quantified impact or outcome"
    }
  ],
  "preferences": {
    "industry_style": "string — Active output style name (e.g., 'software-engineering', 'ai-ml', 'sales', 'consulting')"
  }
}
\`\`\`

## Validation Rules

1. **Required fields**: `personal.name`, `personal.email`, at least one entry in `experience`
2. **Dates**: Always YYYY-MM format for consistency
3. **Achievements**: Every achievement SHOULD have all three fields (statement, metric, method). The `metric` field is the most important — without quantification, achievements are just responsibilities.
4. **Experience order**: Most recent first (reverse chronological)
5. **Skills**: No duplicates within a category. Skills should be specific (e.g., "PyTorch 2.x" not just "Python")
6. **Target roles**: Maximum 5 target roles to maintain focus

## Usage by Component

| Component | Reads | Writes |
|-----------|-------|--------|
| Career Director | Full profile | target, preferences |
| Job Search Agent | target, skills, experience | — |
| Interview Prep Agent | experience, achievements, skills, projects | — |
| Resume Updater Skill | Full profile | Full profile |
| /resume-generator | Full profile | — |
| /cover-letter | Full profile + target | — |
```

**Step 2: Commit**

```bash
git add career-coach/skills/resume-updater/references/career-profile-schema.md
git commit -m "feat(career-coach): add career-profile.json schema reference"
```

---

## Task 3: Career Director Agent

**Files:**
- Create: `career-coach/agents/career-director.md`

**Step 1: Write the agent file**

Create `career-coach/agents/career-director.md` with the full optimized prompt from the design doc. The complete prompt is in the design document's "Optimized Agent Prompts" section, including:

- Frontmatter: name, description (with 3 `<example>` blocks), model: opus, tools, color: indigo
- Body sections: `<team>`, `<career_profile>`, `<coaching_protocol>` (4 subsections with bad/good examples), `<orchestration_protocol>` (4 subsections with brief template), `<communication_style>`
- State files: reads `career-profile.json`, maintains `job-search-state.json`

The full prompt text was approved in the brainstorming phase. Copy it exactly as presented.

**Step 2: Verify frontmatter has example blocks**

Confirm the description includes `<example>` blocks with `user:`, `assistant:`, `<commentary>` — required for agent trigger matching.

**Step 3: Commit**

```bash
git add career-coach/agents/career-director.md
git commit -m "feat(career-coach): add career-director orchestrator agent"
```

---

## Task 4: Job Search Agent

**Files:**
- Create: `career-coach/agents/job-search.md`

**Step 1: Write the agent file**

Create `career-coach/agents/job-search.md` with the full optimized prompt from the design doc. The complete prompt includes:

- Frontmatter: name, description (with 3 `<example>` blocks), model: sonnet, tools, color: green
- Body sections: `<data_sources>` (5 MCP tools listed), `<search_protocol>` (4-step: load profile → search → score/rank → enrich), `<application_tracking>` (with `applications.json` schema), `<output_format>` (table format for job listings, structured format for company deep-dives)

**Step 2: Verify MCP tool names match**

Confirm the tool names referenced in the prompt match what the MCP server will expose:
- `search_jobs`, `get_company_info`, `get_salary_data`, `get_interview_experiences`, `search_trending_roles`

**Step 3: Commit**

```bash
git add career-coach/agents/job-search.md
git commit -m "feat(career-coach): add job-search specialist agent"
```

---

## Task 5: Interview Prep Agent

**Files:**
- Create: `career-coach/agents/interview-prep.md`

**Step 1: Write the agent file**

Create `career-coach/agents/interview-prep.md` with the full optimized prompt from the design doc. The complete prompt includes:

- Frontmatter: name, description (with 3 `<example>` blocks), model: sonnet, tools, color: amber
- Body sections: `<profile_usage>` (how to use career-profile.json), `<prep_protocol>` (4 subsections: company research, question bank by type, STAR story crafting, mock interview simulation), `<feedback_framework>` (with bad/good feedback example), `<state_management>` (with `interview-prep-notes.json` schema), `<industry_adaptation>` (4 industry-specific prep strategies)

**Step 2: Commit**

```bash
git add career-coach/agents/interview-prep.md
git commit -m "feat(career-coach): add interview-prep specialist agent"
```

---

## Task 6: Resume Updater Skill

**Files:**
- Create: `career-coach/skills/resume-updater/SKILL.md`
- Create: `career-coach/skills/resume-updater/references/interview-questions.md`
- Create: `career-coach/skills/resume-updater/references/achievement-frameworks.md`
- Already created: `career-coach/skills/resume-updater/references/career-profile-schema.md` (Task 2)

**Step 1: Write SKILL.md**

Create `career-coach/skills/resume-updater/SKILL.md`:

```markdown
---
name: resume-updater
description: >
  Conversational skill that interviews the user to capture professional
  experience and build/update their career-profile.json. Use when the user
  says "update my resume", "add my recent experience", "refresh my profile",
  "capture my work history", "build my resume", "add a new job to my resume",
  or wants to create or modify their professional profile data.

  When to Use:
  - User wants to add new experience, skills, projects, or achievements
  - User wants to create their career profile from scratch
  - User wants to update existing profile entries
  - User mentions they changed jobs, got promoted, or completed a project

  When NOT to Use:
  - User wants to generate/format a resume (use /resume-generator command)
  - User wants career advice (use career-director agent)
  - User wants to search for jobs (use job-search agent)
---

# Resume Updater

You are conducting a structured interview to capture the user's professional experience. Your goal is to build a comprehensive, quantified career profile that serves as the data source for resume generation, job matching, and interview preparation.

## Before You Start

1. Read `career-profile.json` if it exists in the project root
2. If it doesn't exist, tell the user you'll create one from scratch
3. Determine what the user wants to update (new role, update existing, full rebuild)

## Interview Protocol

Ask ONE question at a time. Wait for the user's response before proceeding. Use multiple-choice when possible (via AskUserQuestion tool).

### For a New Experience Entry

Follow this sequence:

1. **Company and Role**: "What company and job title?"
2. **Dates**: "When did you start? Are you still there?"
3. **Context**: "What does the company do? What team were you on? How big was the team?"
4. **Responsibilities**: "What were your 3-5 main responsibilities?"
5. **Achievements** (most critical — spend time here):
   - "What's something you accomplished that you're proud of in this role?"
   - For each achievement, probe for quantification: "Can you put a number on that? Percentage improvement? Revenue impact? Time saved? Scale handled?"
   - Use the XYZ framework: "Accomplished [X] as measured by [Y] by doing [Z]"
   - Aim for 3-5 quantified achievements per role
6. **Skills**: "What technologies, tools, or methodologies did you use?"
7. **Projects**: "Any notable projects worth highlighting separately?"

### For Profile Updates

- Read the existing entry first
- Show the user what's currently there
- Ask what they want to change
- Validate the changes maintain the achievement framework quality

### For Full Profile Rebuild

Follow the sections in order:
1. Personal info
2. Professional summary
3. Target roles and preferences
4. Experience (most recent first, detailed interview per role)
5. Education
6. Skills inventory
7. Projects
8. Volunteer/leadership

## Achievement Quality Gate

Before saving any achievement, verify it meets this standard:

**Weak** (reject and probe further):
- "Improved system performance" — no metric, no method
- "Led a team" — no scope, no outcome

**Strong** (accept):
- "Reduced API latency by 40% (from 200ms to 120ms) by implementing a Redis caching layer for the 3 most-queried endpoints" — has metric, method, and specifics
- "Led a team of 8 engineers to deliver the payment processing system 2 weeks ahead of schedule, handling $2M+ daily transaction volume" — has scope, outcome, and scale

When the user gives a weak achievement, say: "That's a good start. Can we quantify it? For example, how much did performance improve? What was the before and after? What specific approach did you use?"

## Saving Data

- Write to `career-profile.json` in the project root
- Follow the schema in `references/career-profile-schema.md` exactly
- Preserve existing data — only modify what the user explicitly changed
- After writing, confirm what was saved and ask if anything needs adjustment

## Reference Files

- `references/career-profile-schema.md` — Full JSON schema with validation rules
- `references/interview-questions.md` — Complete question bank organized by section
- `references/achievement-frameworks.md` — XYZ framework, STAR format, quantification guides
```

**Step 2: Write interview-questions.md**

Create `career-coach/skills/resume-updater/references/interview-questions.md`:

```markdown
# Interview Question Bank

Organized by career profile section. Use these to guide the conversational data capture.

## Personal Information

- What is your full name as you'd like it on your resume?
- What email address should employers contact you at?
- What phone number should be on your resume?
- Where are you currently located (city, state/country)?
- Do you have a LinkedIn profile URL?
- Do you have a GitHub profile or portfolio website?

## Professional Summary

- In one sentence, how would you describe what you do professionally?
- What's your biggest professional strength?
- What kind of work energizes you the most?
- How would a colleague describe your work style?

## Target Roles

- What job titles are you targeting?
- Which industries interest you?
- What locations are you open to? Are you open to remote?
- What's your salary expectation range?

## Experience (Per Role)

### Context
- What company did you work for?
- What was your job title?
- When did you start? When did you leave (or are you still there)?
- What does the company do? What industry are they in?
- What team or department were you on?
- How big was the team? Did you manage anyone?

### Responsibilities
- What were your main day-to-day responsibilities?
- What was the most important part of your job?
- What were you accountable for?

### Achievements (Critical — Spend Most Time Here)
- What's your proudest accomplishment in this role?
- Did you build or launch anything significant?
- Did you improve any process, system, or metric? By how much?
- Did you save the company time or money? How much?
- Did you lead any cross-functional initiatives? What was the outcome?
- Were there any awards, recognitions, or promotions during this role?
- What would your manager say was your biggest impact?

### Achievement Probes (When Answers Are Vague)
- "You mentioned you improved performance — can you quantify that? What was the before and after?"
- "How many users/customers/transactions were affected?"
- "What was the business value in dollars, percentage, or time saved?"
- "What specific technical approach or tool did you use?"
- "How did you know it was successful? What metrics did you track?"

### Skills
- What programming languages did you use daily?
- What frameworks and libraries?
- What tools and platforms (AWS, GCP, etc.)?
- Any methodologies (Agile, etc.)?

## Education

- Where did you go to school?
- What degree and field?
- When did you graduate?
- Any notable GPA (3.5+), honors, or relevant coursework?

## Skills Inventory

- What are your strongest technical skills?
- What tools do you use most frequently?
- Any languages spoken besides English?
- Any professional certifications?

## Projects

- Any personal projects, open source contributions, or side projects?
- For each: What is it, what tech did you use, what was the impact?

## Volunteer & Leadership

- Any volunteer work, board positions, or community involvement?
- Any leadership roles outside of work?
```

**Step 3: Write achievement-frameworks.md**

Create `career-coach/skills/resume-updater/references/achievement-frameworks.md`:

```markdown
# Achievement Frameworks

Use these frameworks to transform vague experience descriptions into compelling, quantified achievement statements.

## XYZ Framework (Google's Format)

**Formula:** "Accomplished [X] as measured by [Y] by doing [Z]"

| Component | Description | Example |
|-----------|-------------|---------|
| X | What you accomplished | Reduced API response latency |
| Y | How it was measured | by 40% (200ms → 120ms) |
| Z | How you did it | by implementing Redis caching for top 3 endpoints |

**Full example:** "Reduced API response latency by 40% (200ms → 120ms) by implementing a Redis caching layer for the three most-queried endpoints, improving user experience for 50K+ daily active users."

## STAR Framework (For Behavioral Interview Stories)

| Component | Description | Resume Usage |
|-----------|-------------|-------------|
| Situation | The context/challenge | Implied or briefly stated |
| Task | Your specific responsibility | What you owned |
| Action | What you specifically did | The method (Z in XYZ) |
| Result | The quantified outcome | The metric (Y in XYZ) |

## Quantification Guide

When the user gives a vague achievement, probe for these types of metrics:

### Scale Metrics
- Users/customers affected: "serving 50K+ daily active users"
- Data volume: "processing 2TB of data daily"
- Transaction volume: "$2M+ daily transaction volume"
- Team size: "leading a team of 8 engineers"

### Impact Metrics
- Percentage improvement: "reduced errors by 35%"
- Time savings: "cut deployment time from 4 hours to 15 minutes"
- Cost savings: "saving $200K annually in infrastructure costs"
- Revenue impact: "contributing to $5M in new ARR"

### Speed/Efficiency Metrics
- Time-to-delivery: "delivered 2 weeks ahead of schedule"
- Throughput: "increased processing speed by 3x"
- Latency: "reduced response time from 500ms to 50ms"

### Quality Metrics
- Reliability: "achieving 99.99% uptime"
- Error reduction: "reducing bug escape rate by 60%"
- Test coverage: "increasing test coverage from 40% to 92%"

## Weak → Strong Transformation Examples

| Weak | Strong |
|------|--------|
| "Improved system performance" | "Improved API throughput by 3x (from 100 to 300 RPS) by redesigning the database query layer and adding connection pooling" |
| "Led a team" | "Led a cross-functional team of 8 (5 engineers, 2 designers, 1 PM) to deliver the payment processing system 2 weeks ahead of schedule" |
| "Worked on the search feature" | "Rebuilt the search infrastructure using Elasticsearch, reducing search latency by 70% and increasing relevance scores by 25% for 2M+ monthly searches" |
| "Managed customer relationships" | "Managed a portfolio of 15 enterprise accounts totaling $8M ARR, achieving 95% renewal rate and $1.2M in upsell revenue" |
| "Did data analysis" | "Built an automated reporting pipeline processing 50M+ events daily, replacing a manual 8-hour weekly process and enabling real-time business decisions" |
```

**Step 4: Commit**

```bash
git add career-coach/skills/
git commit -m "feat(career-coach): add resume-updater skill with references"
```

---

## Task 7: Commands — Resume Generator & Cover Letter

**Files:**
- Create: `career-coach/commands/resume-generator.md`
- Create: `career-coach/commands/cover-letter.md`

**Step 1: Write resume-generator command**

Create `career-coach/commands/resume-generator.md`:

```markdown
---
description: Generate a formatted resume from your career profile, optionally tailored to a specific role
---
You are a professional resume writer. Generate a resume from the user's career-profile.json data.

Read `career-profile.json` from the project root. If it doesn't exist, tell the user to run the resume-updater skill first.

## Arguments

$ARGUMENTS

If arguments are provided, they specify a target role or company to tailor the resume for. When tailoring:
- Reorder skills to emphasize those relevant to the target
- Lead with the most relevant experience
- Adjust the professional summary to align with the target
- Incorporate relevant keywords for ATS optimization

If no arguments, generate a general-purpose resume using the user's `preferences.industry_style`.

## Output Format

Check the active output style (from preferences.industry_style in career-profile.json) and adapt:

- **software-engineering**: Lead with Technical Skills, then Experience (emphasize system design, scale), then Projects
- **ai-ml**: Lead with Experience (emphasize research and models), then Publications/Projects, then Skills
- **sales**: Lead with Experience (emphasize revenue metrics), then Key Achievements summary, then Skills
- **consulting**: Lead with Experience (emphasize client impact), then Education, then Skills/Frameworks

## Resume Structure

1. **Header**: Name, contact info, LinkedIn, GitHub/portfolio
2. **Professional Summary**: 2-3 sentences from profile summary, tailored if target specified
3. **Sections**: Ordered per industry style above
4. **Experience entries**: Company, title, dates, then 3-5 bullet points mixing responsibilities and achievements. Achievements MUST include quantified metrics.
5. **Education**: Institution, degree, field, date, honors
6. **Skills**: Grouped by category (Technical, Tools, Languages, Certifications)

## File Output

Write the resume to `resumes/resume.md` (creates the directory if needed). This will trigger the LaTeX compilation hook automatically.

If the user specifies a company/role, name the file `resumes/resume-{company}-{role}.md`.
```

**Step 2: Write cover-letter command**

Create `career-coach/commands/cover-letter.md`:

```markdown
---
description: Generate a tailored cover letter for a specific job posting or company
---
You are a professional cover letter writer. Generate a compelling, tailored cover letter using the user's career-profile.json data.

Read `career-profile.json` from the project root. If it doesn't exist, tell the user to run the resume-updater skill first.

## Arguments

$ARGUMENTS

Arguments should specify the target: a job URL, job description, company name, or role title. If no arguments provided, ask the user what role they're applying for.

## Writing Protocol

1. **Research the target**: If a URL is provided, use WebFetch to read the job posting. Extract key requirements, qualifications, and company values.

2. **Match experience**: Map the user's achievements from career-profile.json to the job requirements. Identify the 3-4 strongest matches.

3. **Adapt tone to industry style** (from preferences.industry_style):
   - **software-engineering**: Direct, technical, project-focused. Reference specific technologies and scale.
   - **ai-ml**: Research-oriented, methodical. Reference models, datasets, publications.
   - **sales**: Energetic, results-driven. Lead with revenue numbers and relationship wins.
   - **consulting**: Structured, analytical. Reference client impact and problem-solving frameworks.

4. **Write the letter** in this structure:
   - **Opening** (2-3 sentences): Hook with a specific connection to the company or role. Not "I am writing to apply for..." — instead, lead with why this specific opportunity excites you, referencing something specific about the company.
   - **Body paragraph 1** (3-4 sentences): Your strongest relevant achievement with quantified results. Connect it directly to what the company needs.
   - **Body paragraph 2** (3-4 sentences): A second achievement or skill set that addresses a different key requirement. Show breadth.
   - **Body paragraph 3** (2-3 sentences): Why this company specifically — what you'd bring and what you'd gain. Be authentic, not generic.
   - **Closing** (2 sentences): Clear call to action. Express enthusiasm without desperation.

5. **Quality check before output**:
   - Total length: 250-400 words (under one page)
   - Every claim backed by a specific achievement from the profile
   - No generic phrases: "passionate about technology", "team player", "fast learner"
   - Company name and role title correct
   - Tone matches industry style

## File Output

Write to `resumes/cover-letter-{company}.md`. This will trigger the LaTeX compilation hook.
```

**Step 3: Commit**

```bash
git add career-coach/commands/
git commit -m "feat(career-coach): add resume-generator and cover-letter commands"
```

---

## Task 8: Output Styles

**Files:**
- Create: `career-coach/output-styles/software-engineering.md`
- Create: `career-coach/output-styles/ai-ml.md`
- Create: `career-coach/output-styles/sales.md`
- Create: `career-coach/output-styles/consulting.md`

**Step 1: Write software-engineering style**

Create `career-coach/output-styles/software-engineering.md`:

```markdown
---
name: Software Engineering
description: Technical career output formatting for software engineering roles. Emphasizes system design, technical depth, scale metrics, and engineering levels. Use when targeting SWE, SRE, DevOps, Platform Engineering, or similar technical IC roles.
keep-coding-instructions: true
---

# Software Engineering Output Style

When generating career-related output, adapt to software engineering conventions:

## Resume Formatting
- **Section order**: Technical Skills → Experience → Projects → Education
- **Achievement metrics**: Emphasize scale (RPS, DAU, data volume), performance (latency, throughput), reliability (uptime, error rates), and engineering efficiency (deployment frequency, test coverage)
- **Skills format**: Group by category — Languages, Frameworks, Infrastructure, Databases, Tools
- **Project emphasis**: Include open source contributions, system design decisions, and technical architecture

## Career Advice Framing
- Reference engineering levels (L3-L8 / Junior-Principal-Fellow)
- Discuss technical depth vs breadth tradeoffs
- Emphasize: system design skills, code review, mentoring, technical decision-making
- Key growth signals: scope of impact, complexity of systems, cross-team influence

## Interview Prep Focus
- **Primary**: System design interviews (60% weight)
- **Secondary**: Coding challenges / data structures & algorithms (25% weight)
- **Tertiary**: Behavioral / leadership (15% weight)
- Prep for whiteboard/live coding format

## Keyword Optimization (ATS)
Include relevant keywords: distributed systems, microservices, CI/CD, cloud infrastructure, API design, database optimization, system design, scalability, observability, infrastructure as code
```

**Step 2: Write ai-ml style**

Create `career-coach/output-styles/ai-ml.md`:

```markdown
---
name: AI/ML
description: Academic-practitioner output formatting for AI, ML, data science, and research roles. Emphasizes model performance, research contributions, datasets, and benchmarks. Use when targeting ML Engineer, Research Scientist, Data Scientist, Applied AI, or similar roles.
keep-coding-instructions: true
---

# AI/ML Output Style

When generating career-related output, adapt to AI/ML conventions:

## Resume Formatting
- **Section order**: Experience → Publications/Research → Projects → Skills → Education
- **Achievement metrics**: Emphasize model performance (accuracy, F1, BLEU), training efficiency (compute, time), data scale (dataset size, features), and business impact of ML systems
- **Skills format**: Group by ML stack — Models/Architectures, Frameworks (PyTorch, JAX, TensorFlow), Data Tools, Cloud ML (SageMaker, Vertex AI), Research Tools
- **Project emphasis**: Include paper references, model architectures, dataset contributions, benchmark results

## Career Advice Framing
- Discuss research vs applied ML career paths
- Emphasize: paper publications, conference talks, open source model contributions
- Key growth signals: first-author papers, novel architectures, production ML systems at scale
- Reference titles: Research Scientist, Applied Scientist, ML Engineer, Research Engineer

## Interview Prep Focus
- **Primary**: ML system design + technical deep-dive (40% weight)
- **Secondary**: Coding in Python/ML frameworks (30% weight)
- **Tertiary**: Research discussion / paper walkthrough (20% weight)
- **Quaternary**: Behavioral (10% weight)
- Prep for research presentation and whiteboard ML architecture format

## Keyword Optimization (ATS)
Include relevant keywords: machine learning, deep learning, NLP, computer vision, transformers, fine-tuning, RLHF, LLMs, MLOps, experiment tracking, model serving, A/B testing, PyTorch, TensorFlow, distributed training
```

**Step 3: Write sales style**

Create `career-coach/output-styles/sales.md`:

```markdown
---
name: Sales
description: Results-driven output formatting for sales, business development, and account management roles. Emphasizes revenue metrics, quota attainment, relationship building, and pipeline management. Use when targeting AE, SDR, BDR, Account Executive, Sales Manager, or similar roles.
keep-coding-instructions: true
---

# Sales Output Style

When generating career-related output, adapt to sales conventions:

## Resume Formatting
- **Section order**: Experience (revenue-first) → Key Achievements → Skills → Education
- **Achievement metrics**: Emphasize revenue ($M closed, ARR growth), quota (% attainment, club status), deal metrics (avg deal size, sales cycle length, win rate), and relationship scope (accounts managed, territory size)
- **Skills format**: Group by sales competency — Sales Methodology (MEDDIC, Challenger, SPIN), CRM Tools, Industry Verticals, Sales Technologies
- **Every bullet must have a number**: Revenue, percentage, count, or dollar amount. No vague "built relationships" bullets.

## Career Advice Framing
- Discuss IC vs management career paths in sales
- Emphasize: consistent quota attainment, deal complexity, account expansion, leadership
- Key growth signals: President's Club, territory expansion, team quota achievement
- Reference titles: SDR → AE → Senior AE → Enterprise AE → Sales Manager → Director → VP Sales

## Interview Prep Focus
- **Primary**: Role-play / mock sales call (40% weight)
- **Secondary**: Pipeline review and deal walkthrough (30% weight)
- **Tertiary**: Behavioral with revenue stories (20% weight)
- **Quaternary**: Industry knowledge (10% weight)
- Prep for live objection handling and closing scenarios

## Keyword Optimization (ATS)
Include relevant keywords: quota attainment, pipeline management, enterprise sales, SaaS, ARR, MRR, consultative selling, solution selling, account management, territory planning, forecast accuracy, customer acquisition, upsell, cross-sell
```

**Step 4: Write consulting style**

Create `career-coach/output-styles/consulting.md`:

```markdown
---
name: Consulting
description: Structured, strategic output formatting for management consulting, strategy, and advisory roles. Emphasizes structured problem-solving, client impact, industry expertise, and presentation skills. Use when targeting roles at MBB, Big 4, boutique firms, or internal strategy teams.
keep-coding-instructions: true
---

# Consulting Output Style

When generating career-related output, adapt to consulting conventions:

## Resume Formatting
- **Section order**: Experience (client impact first) → Education → Skills/Frameworks → Leadership
- **Achievement metrics**: Emphasize client impact ($M value created, % improvement), project scope (industry, geography, duration), team leadership (analysts managed, stakeholders engaged), and strategic outcomes (recommendations adopted, transformation results)
- **Skills format**: Group by consulting competency — Analytical Frameworks (MECE, Porter's, BCG Matrix), Industries Served, Functional Expertise, Tools (Excel modeling, PowerPoint, Tableau)
- **Education prominence**: Higher than other styles — MBA, top university, and academic honors matter more in consulting

## Career Advice Framing
- Discuss firm hierarchy: Analyst → Associate → Engagement Manager → Principal → Partner
- Emphasize: structured thinking, client management, team leadership, business development
- Key growth signals: client feedback scores, repeat engagements, thought leadership, practice area development
- Reference exit opportunities: PE, corporate strategy, startups, C-suite

## Interview Prep Focus
- **Primary**: Case interviews — market sizing, profitability, M&A, market entry (50% weight)
- **Secondary**: Behavioral / fit interviews (30% weight)
- **Tertiary**: Written case / presentation (20% weight)
- Prep for structured problem decomposition, hypothesis-driven analysis, and executive communication

## Keyword Optimization (ATS)
Include relevant keywords: strategic planning, due diligence, market analysis, business transformation, stakeholder management, MECE, hypothesis-driven, data-driven insights, change management, operational excellence, value creation
```

**Step 5: Commit**

```bash
git add career-coach/output-styles/
git commit -m "feat(career-coach): add 4 industry output styles (SWE, AI/ML, Sales, Consulting)"
```

---

## Task 9: Hooks & LaTeX Templates

**Files:**
- Create: `career-coach/hooks/hooks.json`
- Create: `career-coach/hooks/compile-latex.sh`
- Create: 6 files in `career-coach/templates/latex/`

**Step 1: Write hooks.json**

Create `career-coach/hooks/hooks.json`:

```json
[
  {
    "event": "PostToolUse",
    "matcher": {
      "tool_name": "Write"
    },
    "hooks": [
      {
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/compile-latex.sh"
      }
    ]
  }
]
```

**Step 2: Write compile-latex.sh**

Create `career-coach/hooks/compile-latex.sh`:

```bash
#!/usr/bin/env bash
# PostToolUse hook: Auto-compile resume files to PDF via LaTeX
# Triggers on Write tool — checks if the written file is in a resumes/ directory
# Gracefully degrades if LaTeX is not installed

set -euo pipefail

# Read the tool input from stdin (PostToolUse provides JSON)
INPUT=$(cat)

# Extract the file path from the tool input
FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    # PostToolUse input has tool_input.file_path for Write tool
    path = data.get('tool_input', {}).get('file_path', '')
    print(path)
except:
    print('')
" 2>/dev/null || echo "")

# Only process files in a resumes/ directory
if [[ ! "$FILE_PATH" =~ /resumes/ ]]; then
    exit 0
fi

# Check if it's a .md or .tex file
if [[ ! "$FILE_PATH" =~ \.(md|tex)$ ]]; then
    exit 0
fi

# Check if LaTeX is available
if ! command -v xelatex &> /dev/null && ! command -v pdflatex &> /dev/null; then
    echo "LaTeX not installed — skipping PDF compilation. Install with: brew install --cask mactex-no-gui" >&2
    exit 0
fi

LATEX_CMD="xelatex"
if ! command -v xelatex &> /dev/null; then
    LATEX_CMD="pdflatex"
fi

DIR=$(dirname "$FILE_PATH")
BASENAME=$(basename "$FILE_PATH")
NAME="${BASENAME%.*}"

# If markdown, we'd need pandoc to convert — check for it
if [[ "$FILE_PATH" =~ \.md$ ]]; then
    if ! command -v pandoc &> /dev/null; then
        echo "Pandoc not installed — skipping .md to PDF conversion. Install with: brew install pandoc" >&2
        exit 0
    fi
    # Convert markdown to PDF via pandoc with LaTeX
    pandoc "$FILE_PATH" -o "$DIR/$NAME.pdf" \
        --pdf-engine="$LATEX_CMD" \
        -V geometry:margin=0.75in \
        -V fontsize=11pt \
        2>/dev/null || echo "PDF compilation failed for $BASENAME" >&2
else
    # Compile .tex directly
    cd "$DIR"
    $LATEX_CMD -interaction=nonstopmode -output-directory="$DIR" "$FILE_PATH" 2>/dev/null || echo "LaTeX compilation failed for $BASENAME" >&2
    # Clean up aux files
    rm -f "$DIR/$NAME.aux" "$DIR/$NAME.log" "$DIR/$NAME.out" 2>/dev/null
fi

echo "Compiled $BASENAME → $NAME.pdf" >&2
```

**Step 3: Make hook executable**

```bash
chmod +x career-coach/hooks/compile-latex.sh
```

**Step 4: Create LaTeX templates**

Create 6 template files in `career-coach/templates/latex/`. Each template should be a complete, compilable `.tex` file with placeholder variables that the resume generator can fill in. Templates to create:

1. `modern-professional.tex` — Clean single-column, ATS-optimized, minimal styling
2. `technical-clean.tex` — Two-column with skills sidebar, for technical roles
3. `jakes-resume.tex` — Based on Jake Gutierrez's popular open-source template
4. `deedy-resume.tex` — Based on Deedy's two-column resume template
5. `altacv.tex` — Based on the AltaCV template (modern, colorful sidebar)
6. `awesome-cv.tex` — Based on Awesome-CV template (elegant, professional)

Each template must:
- Use `\newcommand` for all variable data (name, email, phone, etc.)
- Include comments explaining where to insert experience, education, skills sections
- Compile with xelatex (prefer) or pdflatex
- Use freely available fonts (no proprietary font dependencies)

**Step 5: Commit**

```bash
git add career-coach/hooks/ career-coach/templates/
git commit -m "feat(career-coach): add LaTeX compilation hook and 6 resume templates"
```

---

## Task 10: MCP Server — Job Intelligence

This is the largest workstream. Follow the consulting-toolkit's `financial-intelligence` MCP server pattern exactly.

**Files:**
- Create: `career-coach/mcp-servers/job-intelligence/package.json`
- Create: `career-coach/mcp-servers/job-intelligence/tsconfig.json`
- Create: `career-coach/mcp-servers/job-intelligence/src/index.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/types.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/constants.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/schemas/inputs.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/services/rate-limiter.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/services/indeed.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/services/linkedin.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/services/trueup.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/services/glassdoor.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/services/levelsfyi.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/tools/search-jobs.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/tools/company-info.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/tools/salary-data.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/tools/interview-experiences.ts`
- Create: `career-coach/mcp-servers/job-intelligence/src/tools/trending-roles.ts`

### Step 1: Write package.json

```json
{
  "name": "job-intelligence-mcp-server",
  "version": "1.0.0",
  "description": "MCP server providing job market data tools — Indeed, LinkedIn, TrueUp, Glassdoor, and Levels.fyi",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.1",
    "axios": "^1.7.9",
    "zod": "^3.24.1",
    "cheerio": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.0",
    "typescript": "^5.7.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

Note: `cheerio` is added for HTML parsing since these services require web scraping.

### Step 2: Write tsconfig.json

Copy exactly from `consulting-toolkit/mcp-servers/financial-intelligence/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 3: Write constants.ts

```typescript
// Job board data sources — all use web scraping (no official APIs)
// Be conservative with rate limits to avoid blocks

export const RATE_LIMITS = {
  indeed: 0.2,      // ~12 req/min — conservative
  linkedin: 0.1,    // ~6 req/min — very conservative (aggressive blocking)
  glassdoor: 0.2,   // ~12 req/min
  trueup: 0.5,      // ~30 req/min — smaller site, more lenient
  levelsfyi: 0.2,   // ~12 req/min
} as const;

export const CHARACTER_LIMIT = 50_000;
export const MAX_JOB_RESULTS = 25;
export const MAX_SALARY_COMPARISONS = 10;

export const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
```

### Step 4: Write types.ts

Define TypeScript interfaces for all data structures:
- `JobListing` (title, company, location, salary, url, description, posted_date, source)
- `CompanyInfo` (name, industry, size, rating, culture_ratings, interview_process, headquarters, founded, revenue)
- `SalaryData` (role, company, location, base, equity, bonus, total_comp, level, source)
- `InterviewExperience` (company, role, difficulty, experience, questions, process, offer, date)
- `TrendingRole` (title, companies_hiring, growth_rate, avg_salary, demand_level)

### Step 5: Write schemas/inputs.ts

Define Zod schemas for each tool's input:
- `searchJobsSchema` — query, location, remote, salary_min, experience_level, limit
- `companyInfoSchema` — company_name
- `salaryDataSchema` — role, company (optional), location (optional)
- `interviewExperiencesSchema` — company_name, role (optional)
- `trendingRolesSchema` — industry (optional), location (optional)

### Step 6: Write services

Each service file implements web scraping for its data source:

- `rate-limiter.ts` — Copy from financial-intelligence (identical implementation)
- `indeed.ts` — Export `searchIndeedJobs(query, location, remote, limit)`: scrape Indeed search results
- `linkedin.ts` — Export `searchLinkedInJobs(query, location, remote, limit)`: scrape LinkedIn Jobs (public listings only, no auth)
- `trueup.ts` — Export `searchTrueUpJobs(query, limit)`, `getTrendingRoles(industry)`: scrape TrueUp.io
- `glassdoor.ts` — Export `getGlassdoorCompanyInfo(company)`, `getGlassdoorSalaries(role, company)`, `getGlassdoorInterviews(company, role)`: scrape Glassdoor
- `levelsfyi.ts` — Export `getLevelsSalaryData(role, company, location)`: scrape Levels.fyi

Each service must:
- Use the rate limiter before every request
- Set proper User-Agent headers
- Handle errors gracefully (return error messages, not throw)
- Parse HTML with cheerio
- Return typed data matching the interfaces in types.ts

### Step 7: Write tools

Each tool handler processes input and calls services:

- `search-jobs.ts` — Aggregates results from Indeed + TrueUp + LinkedIn, deduplicates by company+title, ranks by relevance
- `company-info.ts` — Calls Glassdoor company info, formats as markdown
- `salary-data.ts` — Aggregates from Glassdoor + Levels.fyi, formats as comparison table
- `interview-experiences.ts` — Calls Glassdoor interviews, formats with difficulty ratings
- `trending-roles.ts` — Calls TrueUp trending, formats as ranked table

Follow the `consulting-toolkit/mcp-servers/financial-intelligence/src/tools/stock-data.ts` pattern: typed input, service call, markdown string output.

### Step 8: Write index.ts

Register all 5 tools with the MCP server, following the financial-intelligence pattern:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// ... schema and handler imports

const server = new McpServer({
  name: "job-intelligence",
  version: "1.0.0",
});

// Register: search_jobs, get_company_info, get_salary_data,
//           get_interview_experiences, search_trending_roles
// Each with try/catch error handling pattern matching financial-intelligence

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Job Intelligence MCP Server started (stdio transport)");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
```

### Step 9: Install dependencies and build

```bash
cd career-coach/mcp-servers/job-intelligence
npm install
npm run build
```

Verify: `ls dist/index.js` should exist.

### Step 10: Commit

```bash
git add career-coach/mcp-servers/
git commit -m "feat(career-coach): add job-intelligence MCP server with 5 data tools"
```

---

## Task 11: README & Final Integration

**Files:**
- Create: `career-coach/README.md`

**Step 1: Write README**

Include:
- Plugin description and feature overview
- Installation instructions (`/plugin marketplace add ...`, `/plugin install ...`)
- Prerequisites (Node.js 18+, optional: LaTeX, Pandoc, Chrome MCP)
- Component list with descriptions:
  - Agents: career-director, job-search, interview-prep
  - Skill: resume-updater
  - Commands: /resume-generator, /cover-letter
  - Output styles: software-engineering, ai-ml, sales, consulting (+ how to add custom)
  - MCP server: job-intelligence (+ setup for Chrome MCP)
  - LaTeX hook: auto-compilation
- Quick start workflow:
  1. Install plugin
  2. Run resume-updater to build profile
  3. Select output style
  4. Search for jobs, generate resumes, prep for interviews
- Chrome MCP integration instructions
- Adding custom output styles guide
- License (MIT)

**Step 2: Update marketplace .gitignore if needed**

Verify `career-coach/` is fully tracked in git.

**Step 3: Build MCP server**

```bash
cd career-coach/mcp-servers/job-intelligence && npm run build
```

**Step 4: Final commit**

```bash
git add career-coach/README.md
git commit -m "feat(career-coach): add README and complete plugin"
```

**Step 5: Verify plugin structure**

Run a quick check:
```bash
# Verify all expected files exist
find career-coach -type f | sort
# Verify plugin.json is valid JSON
python3 -c "import json; json.load(open('career-coach/.claude-plugin/plugin.json'))"
# Verify hooks.json is valid JSON
python3 -c "import json; json.load(open('career-coach/hooks/hooks.json'))"
# Verify hook is executable
test -x career-coach/hooks/compile-latex.sh && echo "Hook is executable"
```

---

## Summary

| Task | Files | Parallel? | Est. Complexity |
|------|-------|-----------|----------------|
| 1. Foundation | 2 | Sequential (first) | Low |
| 2. Career Profile Schema | 1 | Sequential (second) | Low |
| 3. Career Director Agent | 1 | Yes | Medium |
| 4. Job Search Agent | 1 | Yes | Medium |
| 5. Interview Prep Agent | 1 | Yes | Medium |
| 6. Resume Updater Skill | 3 (+1 from T2) | Yes | Medium |
| 7. Commands | 2 | Yes | Low |
| 8. Output Styles | 4 | Yes | Low |
| 9. Hooks + Templates | 8 | Yes | Medium |
| 10. MCP Server | ~17 | Sequential (largest) | High |
| 11. README + Integration | 1 | Sequential (last) | Low |
| **Total** | **~40** | | |
