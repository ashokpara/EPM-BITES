---
title: "How I Built an AI-Powered Chatbot for Oracle EPM Enterprise Data Management — And What I Learned"
date: "2026-06-17"
excerpt: "A full disclosure demonstration of what modern AI agents can do when wired directly to the Oracle EDM REST API — and why Oracle's own June 2025 AI release is the real story."
---

# How I Built an AI-Powered Chatbot for Oracle EPM Enterprise Data Management — And What I Learned

## Introduction: A Demonstration, Not a Disruption

Let me be upfront before a single line of code is discussed: this project was built as a learning exercise and a demonstration of what modern AI agents can do when connected to a live enterprise REST API. It is not intended to replace, compete with, or undermine Oracle's own AI capabilities — least of all the AI-powered change management agent that Oracle themselves shipped as part of their June 2025 EPM release.

Oracle has an entire engineering organisation dedicated to building AI safely into their platform. I have a Python script and a free afternoon. These are not the same thing, and pretending otherwise would be dishonest.

What this project *does* demonstrate is something genuinely important: the barrier to connecting AI reasoning to real enterprise systems has collapsed. The gap between "Oracle has a REST API" and "I can ask it questions in plain English and get useful answers" is now measured in hours, not months. That is a profound shift, and understanding it matters whether you are an EPM administrator, an AI developer, or a finance leader thinking about what your team's tools might look like in two years.

With that framing established — let's get into it.

---

## What Is Oracle EDM, and Why Does It Need AI?

Oracle Enterprise Data Management (EDM) is the master data governance hub for Oracle Cloud EPM. It sits at the centre of your financial reporting and planning stack, managing the hierarchies that flow into Planning, Financial Consolidation and Close (FCCS), and Account Reconciliation. Think of it as the single source of truth for your Chart of Accounts, Cost Centres, Legal Entities, and any other financial dimension your organisation uses.

EDM is organised around a few core concepts:

- **Applications** — the connected EPM applications (Planning, FCCS, etc.) whose metadata EDM governs
- **Views** — logical groupings of related hierarchy data, often mapped to a specific reporting use case or consolidation
- **Viewpoints** — the actual data-entry forms within a view, where members and hierarchies are maintained; these are the workhorse objects that administrators interact with daily
- **Requests** — the workflow engine, tracking pending changes, approvals, and rejections across the platform
- **Nodes** — individual members within a viewpoint hierarchy (your actual Chart of Accounts entries, cost centre codes, etc.)

Managing all of this through the GUI is manageable when you know exactly what you're looking for. But when a new analyst asks "can you just tell me what forms we have and what they're for?", you either spend an hour walking them through it or you write yet another manual inventory spreadsheet that will be out of date within a week.

The Oracle EDM REST API exposes all of this data programmatically. The question I wanted to explore was: how quickly can a developer — without Oracle's engineering resources — wire AI reasoning into that API and produce something genuinely useful?

---

## Oracle's June 2025 Release: The Real AI Story

Before going further, it's worth pausing to acknowledge what Oracle actually shipped in their June 2025 EPM release, because it puts this project in proper context.

Oracle's new AI-powered change management agent is a native, platform-integrated capability. It understands your EDM environment not just at the API surface level but deep into the business logic: workflow rules, approval hierarchies, data governance policies, and the semantic meaning of your financial dimensions. It is built by people who wrote the platform itself, tested against enterprise-scale deployments, supported under Oracle's SLA, and designed to evolve alongside the platform.

That is categorically different from what I built.

My tools are a read-only exploration interface — useful for questions like "what's in my environment?" — but Oracle's native AI agent addresses the genuinely harder problem: governing *changes* to that environment safely, intelligently, and at enterprise scale. The two are not in competition. If anything, Oracle's release validates the underlying idea: AI and EPM belong together. Oracle's engineering investment proves the concept has legs; my demonstration proves the concept is accessible.

If your organisation is on Oracle Cloud EPM, you should be evaluating Oracle's native AI capabilities first. They have the security, support, and platform integration that a home-grown Python script simply cannot match.

What this project *can* offer is a window into the mechanics — a way to understand how AI agent patterns work before your organisation adopts them in their production-grade form.

---

## Two Tools, Two Purposes

The project ended up as two distinct Python scripts, each solving a different problem:

### 1. `epm_chat.py` — The Conversational Interface

This is an interactive, command-line chatbot. You run it, authenticate once (credentials are encrypted and saved locally), and then you can ask it anything in plain English:

> *"What views do I have?"*
> *"Show me the viewpoints in view 42"*
> *"What requests are currently pending?"*
> *"How many applications are registered?"*

The chatbot maintains a conversation history, so you can ask follow-up questions naturally. It's powered by Claude Haiku via OpenRouter — a lightweight, fast model that's ideal for this kind of factual retrieval task where you want near-instant responses.

### 2. `epm_agent.py` — The Autonomous Reporting Agent

This is an autonomous AI agent, powered by Claude Opus. You run it, it connects to your EPM environment, and it systematically explores every application, view, viewpoint, and recent request — then saves both a structured Markdown report and a fully formatted Excel workbook to disk.

You don't direct it. You just trigger it and let it work. The agent decides how to explore, which API calls to make in what sequence, and how to structure the output. It's a genuine AI agent with tool use, not just a wrapper around a few API calls.

---

## The Architecture: Keeping It Honest

### Read-Only by Design

The single most important architectural decision in both tools is the hard read-only constraint. This is especially important to highlight given Oracle's native AI agent, which *does* have the platform-level trust and safeguards required to make changes. My tools do not have that trust, and they are coded accordingly.

Write operations are blocked at the code level — not just instructed away in the system prompt:

```python
WRITE_METHODS = {"post", "put", "patch", "delete"}

def run_tool(name: str, args: dict, auth_headers: dict) -> str:
    method = str(args.get("method", "get")).lower()
    if method in WRITE_METHODS:
        return "BLOCKED: this chatbot is read-only. Write operations are not permitted."
```

The `epm_get` function only ever calls `requests.get`. There is no code path that reaches `requests.post`. The system prompt reinforces this at the model level:

> *"⚠️ READ-ONLY MODE: You may ONLY retrieve and display data. You must NEVER create, update, delete, or modify anything in the system."*

This multi-layer defence — code enforcement plus model instruction — is the right pattern for any AI system that touches production data without platform-native governance baked in.

### Credential Management: Encrypt Everything

On first run, the chatbot prompts for the EPM URL, username, and password. The password input uses a custom `masked_input()` function — not Python's standard `getpass` — that shows an asterisk for every character typed, handles backspace correctly, and works cross-platform (different code paths for Windows vs. Unix terminal modes).

Credentials are encrypted using Fernet symmetric encryption and stored in `.epm_credentials`. The encryption key is stored in `.epm_key`, both files set to `chmod 0o600` (owner read/write only). Subsequent runs detect saved credentials, show masked previews (`jo***e` style masking for usernames, `https://yourhost***` for URLs), and ask whether to reuse them.

This is meaningfully better than putting credentials in a `.env` file and hoping it never reaches version control — though it is still nowhere near the enterprise-grade credential management that Oracle's native integrations provide.

### Auto-Discovery of the REST Base Path

Oracle EPM's REST API doesn't always live at a predictable path. Depending on your environment, version, and deployment type, the correct base could be `/epm/rest/edm/v1`, `/epm/rest/v1`, `/HyperionPlanning/rest/v3`, or something else. The chatbot probes a ranked list of candidate paths on startup and accepts any non-404 HTTP response (including 400, 403, and 401) as evidence that the path exists:

```python
candidate_paths = [
    "/epm/rest/edm/v1",
    "/epm/rest/v1",
    "/epm/rest/edm/v2",
    "/epm/rest/v2",
    "/HyperionPlanning/rest/v3",
    ...
]
```

This eliminates a significant setup hurdle — users don't need to know (or look up) the correct API base for their specific environment.

---

## Tool Use: The Core AI Pattern

Both scripts use the model's tool use (function calling) capability to translate natural language into structured API calls. The tools available to the model are:

- **`list_applications`** — all registered EPM applications with ID, name, type, and status
- **`list_views`** — all views in the environment
- **`list_viewpoints`** — viewpoints for a given view ID
- **`get_viewpoint_nodes`** — hierarchy nodes within a specific viewpoint
- **`list_requests`** — recent workflow requests
- **`call_epm_api`** — an escape hatch for any endpoint not covered above

When you ask "what views do I have?", the model does not answer from its training data (which knows nothing about your specific EPM instance). It calls `list_views`, receives real JSON from your Oracle environment, and then formulates its answer from actual data.

This is the core principle: **the model is a reasoning and presentation layer, not a knowledge source**. The system prompt is explicit:

> *"ALWAYS call a tool to fetch real data — never guess or make up information."*

This same principle is, in a much more sophisticated form, what Oracle's native AI agent applies. The model reasons over real platform data rather than hallucinating answers. That's what separates useful AI integrations from impressive-looking demos that collapse under production conditions.

### Response Slimming

Raw Oracle EDM API responses are verbose — dozens of internal metadata fields per object. The `_slim_items()` function strips each response down to only the fields relevant for human consumption (ID, name, description, type, status), keeping the model context clean and responses focused.

---

## The Autonomous Agent: What Agentic Really Means

The `epm_agent.py` script demonstrates a pattern worth understanding because it mirrors — at a small scale — what Oracle's own AI agents are doing natively inside the platform.

**Step 1 — Discover**: Call `applications` and `views` to understand the environment's top-level structure.

**Step 2 — Drill down**: For each view discovered, call `views/{id}/viewpoints`. Also query recent workflow requests.

**Step 3 — Report**: Call `write_markdown_report` and `write_excel_report` with the full findings.

The agent loops, making as many API calls as needed (up to a safety limit of 40 iterations) until it has gathered everything and produced both output files. If it reaches `end_turn` without writing the files, the orchestrating code detects this and re-prompts explicitly:

> *"You have not yet saved the output files. Please call write_markdown_report AND write_excel_report NOW."*

This recovery pattern is important for production agentic systems of any kind: always verify the agent completed its required terminal actions, and have a programmatic fallback if it didn't. This is a design lesson that applies whether you're building a hobby script or an enterprise product.

### The Excel Output

The generated Excel workbook uses `openpyxl` to produce properly formatted output: dark blue headers with white bold text, alternating row colours, cell borders, auto-calculated column widths (capped at 50 characters), and frozen header rows. The agent provides data as a JSON schema; the builder turns it into something you could share in a management meeting without embarrassment. Output that looks polished gets used. Output that looks like a debug dump does not.

---

## Dual LLM Provider Support

Both scripts support two providers:

- **Anthropic API directly** — Claude Opus for the agent (high-reasoning multi-step tasks), configured for Haiku via OpenRouter for the chatbot (speed and cost efficiency)
- **OpenRouter** — an OpenAI-compatible gateway providing access to Claude and other models

Since the Anthropic and OpenAI-compatible APIs have different schemas for tool use and messages, the agent includes conversion logic to translate between formats. This adds modest complexity but means the tools work regardless of which API access you have available.

---

## What This Demonstrates (and What It Doesn't)

It's worth being specific, precisely because Oracle's native AI agent exists.

**This project demonstrates:**

- How quickly AI tool use can be wired to an enterprise REST API
- The read-only agentic pattern for data exploration and reporting
- How to handle credential encryption, API auto-discovery, and response slimming in a Python AI integration
- What the gap looks like between "API available" and "natural language accessible" — and how thin that gap now is

**This project does not demonstrate:**

- Production-grade security or enterprise scalability
- AI-assisted data governance or change management
- Anything approaching Oracle's native understanding of EPM business logic, workflow rules, or data integrity constraints
- A path to replacing institutional EPM expertise

Oracle's June 2025 AI change management agent addresses a fundamentally harder problem than this project touches: not just reading what exists, but safely governing what changes. That requires platform-native trust, deep business logic integration, and the kind of testing and validation that only Oracle can perform on their own platform. This project is an exploration of the *pattern*; Oracle's release is the *product*.

---

## Security Considerations

Any tool connecting to enterprise financial systems warrants honest security scrutiny — especially one you built yourself rather than procured from a vendor with an enterprise SLA.

**What's handled well:**
- Credentials never appear in logs or terminal output (masking functions throughout)
- Fernet encryption for saved credentials with `0o600` file permissions
- Hard-coded read-only constraint that cannot be overridden by model instructions
- Response slimming limits the volume of sensitive data sent to external AI APIs

**What this project doesn't address:**
- Audit logging of queries made against the EPM environment
- Per-user access controls or role-based permissions
- Enterprise-grade secret management (HSM, vault integration)
- Compliance certification of any kind

If your organisation operates under SOX, GDPR, or similar frameworks — and if you use Oracle Cloud EPM, it almost certainly does — use Oracle's native tooling, not a custom Python script. That's not a criticism of the project; it's a straightforward acknowledgement of what this is and what it is for.

---

## Lessons for Building AI Tools on Enterprise APIs

These patterns are broadly applicable beyond EPM:

**Hard-code the safety constraints.** The read-only constraint exists in code, not just in the system prompt. A model instruction can be overridden by an adversarial prompt; a Python `if method in WRITE_METHODS: return "BLOCKED"` cannot.

**Slim API responses before sending to the LLM.** Enterprise APIs return far more data than the model needs. Stripping to essential fields reduces token costs, speeds response times, and improves answer quality by reducing noise.

**Verify terminal actions programmatically.** If the agent is supposed to write files, check whether it did. Re-prompt if it didn't. Don't trust that the model will always complete its output steps without verification.

**Multi-provider support adds resilience.** Being able to route to Anthropic directly or via OpenRouter means the tools keep working through provider outages, pricing changes, or access issues.

**Conversation history transforms the user experience.** Maintaining full history across turns lets users ask follow-up questions that reference earlier answers naturally. "Show me the viewpoints in the first view you listed" just works.

**Be honest about what you built.** A demonstration is valuable. A demonstration that pretends to be a product is dangerous. Oracle's June 2025 release is a product. This is a demonstration. Both have a place.

---

## What's Next

These tools are a starting point. Natural extensions include:

**A web UI**: A simple Flask or FastAPI backend with a React frontend would make this accessible to non-technical users without requiring them to run Python scripts.

**Scheduled reporting**: Running `epm_agent.py` on a schedule and committing output to Git gives you an automatic audit trail of your EDM configuration over time — a lightweight complement to Oracle's native governance tooling.

**Deeper integration with Oracle's AI capabilities**: Rather than building in parallel to Oracle's platform, the more interesting direction is building *on top* of it — using Oracle's native AI agent for governed changes while using a custom interface layer for exploration and reporting queries that don't require write access.

**A teaching tool**: The most honest and enduring use case for this project is probably educational — a concrete, readable codebase that shows developers exactly how AI tool use patterns work against a real enterprise API, before they go on to build with Oracle's production-grade capabilities.

---

## Conclusion

The Oracle EPM platform contains critical financial governance information that too few people can access independently. AI agents — whether Oracle's native implementation or the lightweight demonstration here — change that by making the system's own data conversationally accessible.

Oracle's June 2025 AI change management release is the significant story. Their engineering team has done something genuinely important: they've integrated AI reasoning into a platform that governs real financial data, with the security, scalability, and platform trust that requires.

What this project contributes is a window into the underlying mechanics — a clear, readable demonstration of how AI tool use patterns connect to enterprise APIs, and how thin the barrier now is between "there's an API" and "I can just ask it things." Understanding that mechanic matters, because it's the same mechanic Oracle's engineers scaled up into a production product.

Build the demonstration. Learn the pattern. Then go use the product.

---

*Full disclosure: This project was built purely as an AI agent capability demonstration. It is not affiliated with, endorsed by, or intended to replace any Oracle product — including Oracle's AI-powered change management capabilities released in the June 2025 EPM update. All read-only constraints are hard-coded at the application level. Always evaluate Oracle's native AI tooling for production EPM environments.*
