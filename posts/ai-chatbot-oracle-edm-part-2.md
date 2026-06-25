---
title: "I Built an AI Chatbot for Oracle EDM (Part 2 of 2) — What Actually Makes It Work"
date: "2026-06-19"
excerpt: "The AI model was the easy part. Part 2 is about the real foundation: a flexible REST API, clean metadata, and why Oracle EDM's real job goes well beyond EPM."
---

# I Built an AI Chatbot for Oracle EDM (Part 2 of 2) — What Actually Makes It Work

If you haven't read [Part 1](/posts/ai-chatbot-oracle-edm-part-1) yet, the short version: I built a read-only chatbot and an autonomous reporting agent on top of Oracle EDM's REST API, mostly to see how far AI tool use has come, with zero intention of competing with Oracle's own (genuinely impressive) AI change management agent from their June 2026 release. Go read it if you want the credential handling and the read-only safeguards — this part picks up where that left off.

Here's the thing I didn't expect going in, but that became obvious about an hour into building this: the AI model was easily the least interesting part of the whole project. The two things that actually determined whether this worked were the flexibility of Oracle's REST API, and the cleanliness of the metadata sitting behind it. Let me explain both, because I think they matter way beyond this one project.

## The API Did Most of the Heavy Lifting

I went in assuming I'd need to write a fair amount of bespoke logic for each different type of object — one chunk of code to handle applications, a different chunk for views, another for viewpoints, and so on. That's usually how it goes with enterprise APIs; they're inconsistent enough that you end up writing a small adapter for every endpoint.

That's not what happened here, and it's genuinely down to how Oracle built the EDM REST API.

**Everything composes the same way.** A view exposes its viewpoints at a predictable nested path — `views/{id}/viewpoints`. A viewpoint exposes its nodes the exact same way. Once I understood that one pattern, I could reach almost the entire object model without writing anything new.

**There's a real escape hatch, and it actually works.** Both tools have a `call_epm_api` tool that's basically a raw passthrough — point it at any endpoint under `/epm/rest/v1/` and it'll fetch it. I was honestly a little surprised this worked as cleanly as it did. A lot of enterprise APIs are inconsistent enough that a generic wrapper like this falls over the second you hit an endpoint that doesn't follow the rules. Oracle's didn't do that to me. `systemSettings`, `policies`, `globalConnections` — all reachable through the exact same generic function.

**Pagination behaves itself.** Every list endpoint uses the same `offset`/`limit` pattern. I wrote that logic once, in one helper function, and it just worked everywhere I pointed it.

**It's predictable even when it's wrong.** When I was building the auto-discovery routine that figures out your REST base path, I needed the API to behave consistently when I guessed wrong — a 401 when the path's right but credentials aren't, a 404 only when the path genuinely doesn't exist. Oracle's API gave me exactly that. No surprises, no generic 500s masking what actually happened.

I want to be specific about why this matters beyond my own convenience: this is what "AI-ready" actually means in practice. It's not about whether an API has good documentation or a nice developer portal. It's about whether the resource model is consistent enough that a model — or a human, honestly — can generalize from a handful of examples to the whole system. A rigid, deeply nested, bespoke-everything API makes AI integration painful no matter how capable the underlying model is. Oracle's EDM API, for everything else you might say about the platform's complexity, got this right.

These are the actual notes the autonomous agent wrote about its own approach at the end of one run — endpoints used, binding types, node types, all things it figured out on its own just by exploring:

![Agent's own technical architecture notes listing the API endpoints, binding types, and node types it discovered](/images/edm-ai-chatbot/agent-technical-architecture-notes.png)

## But None of That Matters If Your Metadata Is a Mess

Here's the less comfortable half of this. A flexible API gets you access to the data. It says nothing about whether the data is any good. And an AI chatbot, more than almost any other interface, will expose exactly how good — or how bad — your underlying metadata actually is.

Think about what happens when someone asks the chatbot "how many cost centres do we have?" It doesn't know what's clean and what isn't. It just queries the API and tells you what's there — duplicates and all, orphaned hierarchy nodes and all, the cost centre someone created in 2019 and forgot to retire, included without comment. A GUI lets that kind of mess hide in a screen nobody looks at carefully. A chatbot reports it back to you in a confident, conversational sentence, which is somehow worse, because confident answers get believed even when they shouldn't be.

A few ways this actually bit me while building this:

**Unnamed or badly named objects are functionally invisible to the model.** A viewpoint called `VP_047` with no description tells the chatbot — and the user — nothing. It can confirm the thing exists. It can't tell you what it's for. Compare that to a viewpoint called `Intercompany Eliminations — EMEA` with an actual description, which the chatbot can use to genuinely help someone who has no idea where to look.

**Inconsistent naming across applications creates contradictions, not synthesis.** If one application calls something "Department" and another calls the same concept "Cost Center," with slightly different hierarchies underneath, the AI layer can't quietly reconcile that for you. It'll report both, as written, and now you've got an AI tool surfacing an inconsistency that's been sitting there for years, except now it's impossible to ignore.

**Governance debt becomes visible governance debt.** Stale nodes, duplicate members, broken parent-child links — none of that disappears because you added an AI layer on top. If anything, it gets asked about more often, because suddenly it's easy to ask.

Here's a concrete example. When I pointed the autonomous agent at a real environment and asked it to summarise workflow activity, it pulled back the full detail on individual draft requests, exactly as recorded — who created it, who it's assigned to, how long it's been sitting there (names redacted below, since this came from a real environment):

![A single workflow request's full detail as returned by the EDM API — status, stage, age, and ownership, exactly as recorded](/images/edm-ai-chatbot/agent-workflow-request-detail-redacted.png)

And when it rolled all of that up into a final "Key Findings" summary, it didn't soften anything — it just named who was actively sitting on the data and how old the oldest drafts were:

![Agent-generated key findings summarising real workflow ownership and recent activity across the environment](/images/edm-ai-chatbot/agent-key-findings-redacted.png)

Neither of those is a flaw in the tool. That's the tool doing exactly its job — reporting what's actually in the system. Whether that's a comfortable thing to read back depends entirely on how well the underlying data and process discipline have been maintained, not on anything the AI did.

This is, genuinely, the whole reason a platform like Oracle EDM exists in the first place. Its actual job is to be the discipline that keeps your master data clean, consistent, and well-described across every system that depends on it. An AI interface doesn't replace that discipline. It just makes the absence of it a lot more obvious, a lot faster, to a lot more people.

If you take one practical thing away from this whole project, take this: before you put any AI layer — mine, Oracle's, or anyone else's — in front of your EDM environment, do the unglamorous work first. Clean naming conventions. Complete descriptions. Deduplicated hierarchies. Consistent modelling of the same dimension across every connected application. None of that is optional groundwork you can skip because the AI is smart. It's the actual precondition for the AI being worth listening to. Garbage in, eloquently phrased garbage out.

## Where the Real Opportunity Sits

I said this in passing in Part 1 but I want to come back to it properly, because I think it's the most underrated thing about Oracle EDM: it is not, at its core, an EPM tool. It's a metadata and master data governance engine that happens to have grown up inside the EPM world.

That means the pattern I built here — read-only AI exploration sitting on top of a governed metadata layer — isn't actually EPM-specific at all. EDM can be the single source of truth in front of an ERP rollout, governing the chart of accounts and cost centre structures that feed it. It can sit in front of a data warehouse, governing the product and customer dimensions that every downstream report depends on agreeing about. Anywhere you have more than one system that needs to agree on what a thing is called and where it sits in a hierarchy, EDM is doing the same job, EPM label or not.

Which means an AI conversational layer on top of EDM isn't just "a chatbot for your EPM admin." It's potentially a conversational interface to your organisation's actual single source of truth for *any* governed dimension — ERP, EPM, warehouse, or otherwise. That's a much bigger idea than the one I set out to demonstrate, and I think it's worth somebody at Oracle, or somebody building on top of Oracle, taking seriously.

## What I'd Actually Do Next

A few honest next steps, roughly in order of how much I think they'd matter:

**Get the metadata clean first.** Before any AI layer, of any kind. This isn't a nice-to-have, it's the actual prerequisite, covered above.

**Look at Oracle's native AI change management agent before building anything custom.** If you're on Oracle Cloud EPM, it has security, support, and platform-level business logic understanding that nothing I built here comes close to. Evaluate that first.

**If you do explore something custom, keep it read-only and keep the safety logic in code, not just in the prompt.** A model instruction is a strong suggestion. A missing function is a guarantee.

**Think about EDM beyond EPM.** If your organisation has a master data mess somewhere outside the finance stack — a product hierarchy, a customer master, anything multiple systems need to agree on — it's worth asking whether a governed metadata layer like EDM belongs there too, before reaching for a custom-built solution.

## The Honest Conclusion

Oracle's June 2026 AI change management release is the real story here, not anything I built. Their team did the hard part: integrating AI reasoning into a platform that actually governs financial data, with the security and platform trust that requires. What I built is a much smaller thing — a demonstration of the underlying pattern, built with some free time, with two scripts and a couple of API keys.

But the pattern is worth understanding on its own terms, separate from any one vendor's product. The barrier between "there's a REST API" and "I can just ask it things in plain English" has basically disappeared, provided the API is flexible enough and the data behind it is clean enough. Oracle EDM, when it's well-governed, clears both bars easily. Most enterprise systems still don't.

Build the demonstration if you're curious. Learn the pattern. Then, if you're running production EPM, go use Oracle's actual product — and spend the real effort on the metadata hygiene that makes any of this trustworthy in the first place.

*Full disclosure (again, because it matters): this project is not affiliated with, endorsed by, or intended to replace any Oracle product, including the AI-powered change management capabilities released in Oracle's June 2026 EPM update. All read-only constraints described above are hard-coded at the application level, not just suggested to the model.*
