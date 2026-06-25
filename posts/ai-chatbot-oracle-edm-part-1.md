---
title: "I Built an AI Chatbot for Oracle EDM (Part 1 of 2) — Here's What Actually Happened"
date: "2026-06-18"
excerpt: "I connected an AI agent to Oracle's EDM REST API to see what would happen. Part 1 covers why I built it, what Oracle EDM really is, and how the thing actually works."
---

# I Built an AI Chatbot for Oracle EDM (Part 1 of 2) — Here's What Actually Happened

Full disclosure up front, because I'd rather you know this before you read another word: I built this on a free afternoon, mostly out of curiosity about how far AI agents have come, not because I think it belongs anywhere near production. Oracle shipped a genuinely serious AI-powered change management agent as part of their June 2026 EPM release — built by people who actually work on the platform, tested at enterprise scale, backed by an SLA. What I built is a couple of Python scripts. I'm not trying to compete with Oracle's release, and if you came here looking for a replacement for it, this isn't that.

What I am trying to do is show you something I think is genuinely interesting: how little code it now takes to wire a real AI model into a real enterprise system and get something useful out of it. A few years ago this would have been a multi-month integration project with a dedicated team. I did it in an afternoon, with two scripts, using off-the-shelf tools. That gap closing is the actual story here, and I think it's worth understanding regardless of whether you ever touch my code.

So let's talk about what I built, and more importantly, about the system I built it on top of — because Oracle EDM deserves a bit more credit than people usually give it.

## Oracle EDM Is Bigger Than People Think

If you've only encountered Oracle Enterprise Data Management (EDM) through its EPM context, you'd be forgiven for assuming it's just the metadata layer for Planning, FCCS, and Account Reconciliation. That's how most people meet it — it governs the Chart of Accounts, the Cost Centres, the Legal Entity hierarchies that feed your consolidations and your budgets.

But that's actually undervaluing the tool. EDM isn't an EPM-only product. It's a general-purpose master data and metadata governance platform that happens to be most commonly deployed alongside Oracle's EPM suite because that's where the original use case came from. Underneath, it's built to do one job really well: be the single, governed, version-controlled source of truth for any hierarchy or dimension that multiple downstream systems need to agree on.

That means EDM can sit just as comfortably in front of your ERP as it does in front of your EPM stack. It can govern the product hierarchy feeding your data warehouse. It can manage the customer or vendor master that your CRM and your finance system both need to agree on. Any time you have more than one system that needs the same answer to "what is this account/department/product/customer actually called, and where does it sit in the hierarchy" — that's a job EDM is built for, EPM or not.

I mention this because it reframes what this whole project is actually about. I wasn't just building a chatbot for an EPM admin tool. I was poking at what happens when you put an AI reasoning layer in front of any centralized master data and metadata system — the kind of system that, almost by definition, every serious data warehouse and ERP rollout eventually needs and usually builds badly, late, and with a lot of regret. EDM happens to do this well already. The question I wanted to answer was: can an AI model make that governance layer conversational, without compromising what makes it trustworthy?

## Why I Actually Did This

I'll be honest about the motivation, because I think pretending otherwise would undercut the whole point of writing this. I didn't sit down because some EPM team came to me with a business case. I sat down because I wanted to see, hands-on, what current AI models can actually do with tool use when pointed at a real, gnarly enterprise REST API — not a toy API, not a demo sandbox, the real thing with real auth quirks and real inconsistent field names.

Two things came out of that afternoon: a chatbot you can talk to, and an agent that runs on its own and writes you a report. Different tools, different jobs, same underlying idea.

### The Chatbot — `epm_chat.py`

This one's conversational. You run it, it asks for your EPM credentials once (encrypted, never shown back to you in plain text), and then you just talk to it:

> *"What views do I have?"*
> *"Show me the viewpoints in view 42."*
> *"What requests are pending right now?"*

It remembers what you've already asked, so you can follow up naturally — "now show me the nodes in that one" works exactly how you'd expect a conversation to work. Underneath, it's running on Claude Haiku via OpenRouter, which is the right call here: this is fast, factual lookup work, and you want a snappy model that doesn't make you wait.

### The Agent — `epm_agent.py`

This one doesn't wait for you to ask anything. You trigger it, walk away, and it goes and does the work itself: discovers every application and view in your environment, drills into every viewpoint, pulls recent workflow requests, and then writes you both a Markdown report and a properly formatted Excel workbook — without you telling it how to structure any of it.

That's powered by Claude Opus, because this job actually requires sustained multi-step reasoning: deciding what to explore next, recognising when it has enough information, and structuring a coherent report at the end. A lighter model would probably wander or stop too early. Opus doesn't.

## How It Actually Talks to Oracle

Here's where it gets genuinely interesting from an engineering point of view, and it's also where the "AI did everything" narrative falls apart — because honestly, the AI model is the easy part. Getting it to talk to a real Oracle environment safely is where the actual work was.

### It Never Writes Anything. Ever.

This was non-negotiable for me from the start. An AI model hallucinating a wrong answer about your data is annoying. An AI model hallucinating a write call against your EDM environment is a different category of problem entirely. So both tools have a hard rule baked directly into the code, not just suggested to the model in a prompt:

```python
WRITE_METHODS = {"post", "put", "patch", "delete"}

def run_tool(name, args, auth_headers):
    method = str(args.get("method", "get")).lower()
    if method in WRITE_METHODS:
        return "BLOCKED: this chatbot is read-only. Write operations are not permitted."
```

The function that actually talks to Oracle, `epm_get`, only ever knows how to do `requests.get`. There's no `requests.post` anywhere in the code it can accidentally reach. I also told the model directly, in plain language, that it's read-only and must refuse politely if asked to change anything — but I didn't want to rely on that alone. A system prompt is a strong suggestion. A missing function is a guarantee.

### Credentials Don't Sit Around in Plain Text

The chatbot asks for your EPM URL, username, and password once. While you type your password, it shows you asterisks — not through Python's standard `getpass`, but through a small custom input handler I wrote that catches backspace properly and works the same way on Windows and Linux terminals (which, if you've ever tried to write cross-platform terminal input code, is a more annoying problem than it sounds).

Once you've entered everything, it gets encrypted with Fernet symmetric encryption and saved locally. Next time you run the tool, it shows you a masked preview — something like `jo***e` for your username, `https://yourhost***` for the URL — and asks if you want to reuse it. No plaintext password ever touches disk, and the encryption key file itself is locked down to owner-only permissions.

### It Figures Out Your REST Path on Its Own

This one's a small thing but it saved me real annoyance. Oracle's REST API doesn't always live at the same base path — depending on your environment and version, it might be `/epm/rest/edm/v1`, `/epm/rest/v1`, or one of the older Hyperion Planning REST paths. Rather than make you go dig that up, the chatbot just probes a ranked list of likely paths on startup and watches the response codes. A 401 still tells you the path is real, just that your credentials are wrong. A 404 tells you to try the next one. Within a couple of seconds, it's found the right base path and you never had to think about it.

---

That's the foundation. In **Part 2**, I'll get into the part I actually think matters most — why the flexibility of Oracle's REST API made this whole thing possible in the first place, why clean EDM metadata is the actual precondition for any of this being trustworthy (AI or otherwise), and what I'd genuinely recommend doing next if any of this sparked an idea for your own environment.

*Continue to [Part 2](/posts/ai-chatbot-oracle-edm-part-2).*
