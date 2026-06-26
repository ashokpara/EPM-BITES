---
title: "Migrating Legacy Oracle DRM to EDM? Read the Back End First — Here's the Query Toolkit That Saved Me Months"
date: "2026-06-25"
excerpt: "Oracle DRM's GUI was never built for migration discovery. Here's the back-end SQL toolkit I built over years of running DRM, and how to use it to actually plan a clean cutover to Oracle EDM."
---

If you've ever tried to plan a migration off legacy Oracle Data Relationship Management (DRM) onto Oracle Enterprise Data Management (EDM), you've probably hit the same wall I did: the DRM web client is a fine tool for day-to-day stewardship, but it is a genuinely terrible tool for answering the questions a migration actually needs answered. "How many node types do we have, and what properties are attached to each?" "Which exports actually feed a downstream table, and which ones are dead?" "Who has access to what, across every hierarchy?" None of that is one click away. Most of it isn't reachable through the UI at all.

So over a few years of running DRM as a day-to-day admin, I built up a personal library of SQL that reads directly from the DRM back-end schema (`RM_DB`). It started as convenience — the GUI just wasn't fast enough for daily admin work — but it turned out to be exactly the toolkit you need when the real question becomes "how do we move everything in here to EDM without missing something important."

This article is that toolkit, organized around an actual migration plan rather than just a pile of queries. The SQL below uses illustrative table, hierarchy, and export names — swap in your own — but the underlying `RM_DB` schema objects (`RM_NODE`, `RM_HIERARCHY`, `RM_EXPORT`, `RM_ACCESS_GROUP_DEFINITION`, and so on) are Oracle's actual DRM data model, so the queries will work against any DRM instance with minimal adjustment.

A quick caveat before we start: these are direct, read-only queries against the DRM database schema, not anything exposed or supported through Oracle's official API. Treat this as an internal discovery and audit technique — run it against a non-production copy where you can, get DBA sign-off for read access, and never run anything beyond a `SELECT` against a live production DRM instance.

## Why the GUI Fails You Here

DRM's web client is built around browsing one hierarchy, one version, one node at a time. A migration needs the opposite view: every hierarchy at once, every node type and its properties at once, every export and what it actually feeds, every security group and who's in it. That's an inventory problem, not a browsing problem, and DRM's `RM_DB` schema is a relational database — which means it answers inventory questions in seconds once you know where to look.

## The Discovery Phase: What Actually Exists

Before you can map anything to EDM, you need a complete, accurate inventory of what's actually in the legacy system — not what the documentation says is in there, which is almost always stale.

**Node types and properties.** This is the single most useful query in the whole toolkit, because it's the direct input to your EDM node type and property design:

```sql
SELECT DISTINCT
    P.C_ABBREV         AS PROPERTY,
    P.C_DESCR          AS DESCRIPTION,
    P.E_PROP_TYPE      AS PROPERTY_TYPE,
    P.E_DATA_TYPE      AS DATA_TYPE,
    P.C_DERIVER_CLASS  AS SCRIPT_OR_FORMULA,
    NT.C_ABBREV        AS NODE_TYPE
FROM RM_DB.RM_PROPERTY_DEFINITION P,
     RM_DB.RM_NODE_TYPE_PROPERTY NTP,
     RM_DB.RM_NODE_TYPE NT,
     RM_DB.RM_PROPERTY_PARAM V
WHERE P.I_PROPERTY_ID = NTP.I_PROPERTY_ID
  AND NTP.I_PROPERTY_ID = V.I_PROPERTY_ID
  AND NT.I_NODE_TYPE_ID = NTP.I_NODE_TYPE_ID;
```

Run this once and you have, in a spreadsheet, every node type in the system and every property attached to it — including whether the property is a formula, a script-derived value, or a plain attribute. This is exactly the shape of decision EDM asks you to make for every dimension you build: what properties does this node type need, and what type is each one?

**Property categories.** DRM groups properties into categories for security and organizational purposes, and this often maps directly onto how you'll want to organize access and edit permissions in EDM:

```sql
SELECT DISTINCT
    C.C_ABBREV        AS PROPERTY,
    C.C_LABEL         AS PROPERTY_LABEL,
    C.E_PROP_TYPE     AS PROPERTY_TYPE,
    CAT.C_CATEGORY_CODE AS PROPERTY_CATEGORY
FROM RM_DB.RM_PROPERTY_CATEGORY PC,
     RM_DB.RM_CATEGORY CAT,
     RM_DB.RM_PROPERTY_DEFINITION C
WHERE PC.I_CATEGORY_ID = CAT.I_CATEGORY_ID
  AND PC.I_PROPERTY_ID = C.I_PROPERTY_ID
ORDER BY 4, 1;
```

**Hierarchies and node counts.** You need a real number for how big each hierarchy actually is, by version, before you can plan extraction batches or estimate EDM load times:

```sql
SELECT DISTINCT
    B.C_ABBREV  AS VERSION_NAME,
    B.I_VERSION_ID,
    COUNT(A.I_NODE_ID) AS NODE_COUNT
FROM RM_DB.RM_NODE A,
     RM_DB.RM_VERSION B
WHERE B.I_VERSION_ID = :working_version_id
  AND A.I_VERSION_ID = B.I_VERSION_ID
GROUP BY B.I_VERSION_ID, B.C_ABBREV;
```

Run that against both your working version and your current (production) version, and you immediately know whether there's drift between them that needs to be reconciled before migration — a surprisingly common gap that nobody notices until cutover week.

**Top node and hierarchy structure.** Useful for confirming your hierarchy inventory matches what stakeholders believe exists:

```sql
SELECT DISTINCT
    B.C_ABBREV AS VERSION_NAME,
    A.C_ABBREV AS HIERARCHY,
    C.C_ABBREV AS TOP_NODE
FROM RM_DB.RM_HIERARCHY A,
     RM_DB.RM_VERSION B,
     RM_DB.RM_NODE C
WHERE A.I_VERSION_ID = B.I_VERSION_ID
  AND A.I_TOP_NODE_ID = C.I_NODE_ID
  AND B.C_ABBREV = :version_label;
```

## The Integration Map: What Actually Depends on This Data

This is the phase migrations most often get wrong, because it's invisible from the GUI: DRM exports feed downstream systems, and if you don't know which exports are live and what they feed, you will break something during cutover that nobody remembers existed.

**Full export inventory with target tables.** This single query is worth the entire toolkit on its own:

```sql
SELECT DISTINCT
    EN.I_EXPORT_ID                AS EXPORT_ID,
    EN.C_HIERARCHY_ABBREV         AS HIERARCHY,
    E.C_EXPORT_ABBREV             AS EXPORT_NAME,
    E.C_EXPORT_DESCR              AS EXPORT_DESCRIPTION,
    E.E_EXPORT_OUTPUT_MODE        AS TARGET_TYPE,
    TO_CHAR(EP.X_VALUE)           AS TARGET_TABLE
FROM RM_DB.RM_EXPORT_NODE EN,
     RM_DB.RM_EXPORT_COLUMN EC,
     RM_DB.RM_EXPORT E,
     RM_DB.RM_EXPORT_PARAM EP
WHERE EN.I_EXPORT_ID = EC.I_EXPORT_ID
  AND EC.I_EXPORT_ID = E.I_EXPORT_ID
  AND E.I_EXPORT_ID = EP.I_EXPORT_ID
  AND E.E_EXPORT_OUTPUT_MODE LIKE 'Table'
  AND EP.C_KEY LIKE 'DBTableName'
ORDER BY E.C_EXPORT_ABBREV;
```

Every row in the result is a live integration point: an export feeding a real downstream table somewhere — a data warehouse staging table, a reporting layer, a consolidation system. Before you stand up EDM, every one of these needs a decision: does this integration get rebuilt as an EDM export, does it get retired because the downstream system is also being decommissioned, or does it need a bridge during the transition period?

**Export-to-book mapping with full property detail**, for exports organized under DRM "books" (commonly used for general ledger or ERP-bound feeds):

```sql
SELECT DISTINCT
    B1.C_BOOK_NAME      AS BOOK_NAME,
    E.C_EXPORT_ABBREV   AS EXPORT_NAME,
    EC.C_TITLE          AS PROPERTY_NAME,
    TO_CHAR(V.X_KEY)    AS PROPERTY_VALUE
FROM RM_DB.RM_EXPORT_COLUMN EC,
     RM_DB.RM_EXPORT E,
     RM_DB.RM_PROPERTY_PARAM V,
     RM_DB.RM_BOOK_ITEM BI,
     RM_DB.RM_BOOK B1
WHERE E.I_EXPORT_ID = EC.I_EXPORT_ID
  AND BI.I_EXPORT_ID = E.I_EXPORT_ID
  AND B1.I_BOOK_ID = BI.I_BOOK_ID
  AND E.C_EXPORT_ABBREV LIKE :export_name_pattern;
```

This is particularly valuable when you're consolidating multiple legacy GL feeds into a single EDM-managed chart of accounts — it shows you exactly which properties each book-organized export pulls, so you can confirm the new EDM export design captures everything the old one did.

## The Security Model: What Has to Be Rebuilt

Security in DRM is organized around Node Access Groups (local and global) and Workflow Access Groups, each tied to Active Directory group membership. None of this carries over automatically — EDM has its own access group model — so you need a complete export of who has access to what before you can design the equivalent structure in EDM.

**Local node access, with hierarchy and node context** — this is the one that actually tells you *what* a group has access to, not just that the group exists:

```sql
SELECT DISTINCT
    G.C_ABBREV              AS SECURITY_GROUP,
    G.C_DESCR               AS GROUP_DESCRIPTION,
    G.E_ACCESS_GROUP_TYPE   AS GROUP_TYPE,
    G.C_CSS_GROUP_NAME      AS AD_GROUP_NAME,
    GL.E_ACCESS_LEVEL       AS ACCESS_LEVEL,
    GL.E_WORKFLOW_ACCESS_LEVEL AS WORKFLOW_ACCESS_LEVEL,
    U.C_USER_NAME           AS USER_ID,
    H.C_ABBREV              AS HIERARCHY,
    N.C_ABBREV              AS NODE
FROM RM_DB.RM_ACCESS_GROUP_DEFINITION G,
     RM_DB.RM_ACCESS_GROUP_PROP_LOCAL GL,
     RM_DB.RM_ACCESS_GROUP_USER GU,
     RM_DB.RM_USER U,
     RM_DB.RM_HIERARCHY H,
     RM_DB.RM_NODE N
WHERE G.I_SECURITY_ID = GL.I_SECURITY_ID
  AND GL.I_SECURITY_ID = GU.I_SECURITY_ID
  AND GL.I_HIERARCHY_ID = H.I_HIERARCHY_ID
  AND GL.I_NODE_ID = N.I_NODE_ID
  AND GL.B_LEAF = 0
  AND GL.I_VERSION_ID = :working_version_id
  AND H.I_VERSION_ID = N.I_VERSION_ID
  AND GU.I_USER_ID = U.I_USER_ID
ORDER BY G.C_ABBREV, H.C_ABBREV;
```

Run the same pattern against `RM_ACCESS_GROUP_PROP_GLOBAL` for global node access groups, since global and local access are stored separately and both need to be captured.

**Active, non-locked users with their roles** — your actual user provisioning list for the new system:

```sql
SELECT DISTINCT
    U.I_USER_ID,
    U.C_USER_NAME,
    U.C_FULL_NAME,
    R.C_ROLE_NAME AS DRM_ROLE
FROM RM_DB.RM_USER U,
     RM_DB.RM_USER_ROLE UR,
     RM_DB.RM_ROLE R
WHERE U.I_USER_ID = UR.I_USER_ID
  AND R.I_ROLE_ID = UR.I_ROLE_ID
  AND U.B_LOGIN_LOCKOUT <> 1
ORDER BY U.I_USER_ID;
```

This becomes the master list you reconcile against EDM's user/role provisioning before go-live — anyone active in DRM who isn't accounted for in the EDM access design is a gap that will surface as a support ticket in week one.

## The Business Logic: Workflow Models, Tasks, and Validations

This is the part of a DRM environment that's easiest to forget entirely, because it lives almost entirely in configuration rather than data — and it's exactly the kind of business logic that determines whether your EDM workflow design actually matches how the business works today.

**Workflow models, tasks, and the node access groups assigned to each stage:**

```sql
SELECT DISTINCT
    A.C_ABBREV AS WORKFLOW_MODEL,
    A.C_LABEL  AS MODEL_LABEL,
    E.C_ASSIGNED_GROUP AS ASSIGNED_NAG,
    D.E_WORKFLOW_STAGE_TYPE AS STAGE_TYPE,
    D.C_LABEL AS STAGE_DESCRIPTION
FROM RM_DB.RM_WF_MODEL A,
     RM_DB.RM_WF_MODEL_STAGE_TASK B,
     RM_DB.RM_WF_TASK C,
     RM_DB.RM_WF_MODEL_STAGE D,
     RM_DB.RM_WF_MODEL_STAGE_ASSG_GROUP E
WHERE A.I_MODEL_ID = B.I_MODEL_ID
  AND B.I_MODEL_ID = D.I_MODEL_ID
  AND B.I_TASK_ID = C.I_TASK_ID
  AND A.I_MODEL_ID = E.I_MODEL_ID
  AND D.I_STAGE_ID = E.I_STAGE_ID
  AND A.C_ABBREV = :workflow_model_name
ORDER BY 1;
```

**Validations attached to each workflow task**, which tells you exactly what business rules fire at each step — these are the rules you need to either replicate in EDM's validation framework or consciously decide to retire:

```sql
SELECT DISTINCT
    B.C_ABBREV AS WF_TASK,
    D.C_ABBREV AS VALIDATION,
    E.C_PROPERTY_NAME AS VALIDATED_PROPERTY
FROM RM_DB.RM_WF_TASK_VALIDATION A,
     RM_DB.RM_WF_TASK B,
     RM_DB.RM_VALIDATION_DEFINITION D,
     RM_DB.RM_WF_TASK_VALIDATION_PROPERTY E
WHERE A.I_TASK_ID = B.I_TASK_ID
  AND A.I_VALIDATION_ID = D.I_VALIDATION_ID
  AND A.I_TASK_ID = E.I_TASK_ID
  AND A.I_TASK_VALIDATION_ID = E.I_TASK_VALIDATION_ID;
```

Every validation rule you find here is a business requirement that existed for a reason — usually because something broke once, and a validation got added so it would never break that way again. Don't treat these as legacy clutter to skip; treat them as a list of lessons the business already paid to learn.

## The Open Work: What Can't Be Frozen on Cutover Day

A migration has a cutover date, but DRM doesn't stop accumulating in-flight work just because you've picked one. Before you can lock the legacy system, you need to know exactly what's still moving.

**Requests that are neither committed nor rejected** — this is your literal "what's still open" list, and it should be empty (or fully accounted for) before the legacy system goes read-only:

```sql
SELECT DISTINCT
    I.I_WORKFLOW_REQUEST_ID,
    I.C_NODE_NAME,
    I.C_NODE_DESCR,
    I.E_WORKFLOW_ACTION__ORIGINATING,
    R.I_CURRENT_STAGE_ID
FROM RM_DB.RM_WF_REQUEST_ITEM I
LEFT JOIN RM_DB.RM_WF_REQUEST R
    ON R.I_WORKFLOW_REQUEST_ID = I.I_WORKFLOW_REQUEST_ID
WHERE R.E_WORKFLOW_STATUS__CURRENT NOT IN ('Committed', 'Rejected');
```

**Draft and pending requests by submitter**, for chasing down owners directly rather than broadcasting a generic "please finish your work" email to the whole organization:

```sql
SELECT DISTINCT
    A.I_WORKFLOW_REQUEST_ID AS REQUEST_ID,
    B.C_TITLE               AS REQUEST_TITLE,
    A.E_WORKFLOW_ACTION__ORIGINATING AS ACTION_TYPE,
    A.C_NODE_NAME,
    B.C_CREATED_BY          AS SUBMITTED_BY,
    C.C_FULL_NAME           AS SUBMITTER_NAME,
    TRUNC(B.D_SUBMITTED_ON) AS SUBMIT_DATE,
    B.E_WORKFLOW_STATUS__CURRENT AS STATUS
FROM RM_DB.RM_WF_REQUEST_ITEM A,
     RM_DB.RM_WF_REQUEST B,
     RM_DB.RM_USER C
WHERE A.I_WORKFLOW_REQUEST_ID = B.I_WORKFLOW_REQUEST_ID
  AND B.C_CREATED_BY = C.C_USER_NAME
  AND TRUNC(B.D_LAST_MODIFIED_ON) BETWEEN SYSDATE - 14 AND SYSDATE
ORDER BY SUBMIT_DATE DESC;
```

## The Audit Trail: Proving What Happened, When

Stakeholders will ask, during or after a migration, whether a given change happened before or after cutover, or whether a specific property was ever set a certain way historically. DRM's transaction history table is the answer, and it's worth pulling a clean extract before the legacy system is decommissioned, since this history doesn't automatically follow you into EDM.

```sql
SELECT
    I_TRANSACTION_ID,
    D_TIMESTAMP        AS TRANSACTION_DATE,
    C_USER_NAME         AS USER_ID,
    C_ACTION            AS ACTIVITY,
    C_VERSION_ABBREV    AS VERSION,
    C_HIERARCHY_ABBREV  AS HIERARCHY,
    C_NODE_DESCR        AS NODE_DESCRIPTION
FROM RM_DB.RM_TRANSACTION_HISTORY
WHERE D_TIMESTAMP BETWEEN :start_date AND :end_date
  AND C_ACTION IN ('Update Property Definition', 'Update Node Property Value')
  AND C_USER_NAME NOT LIKE '@@PROCESS'
ORDER BY D_TIMESTAMP ASC;
```

Export the full history, not just a recent window, and archive it somewhere durable before you decommission the legacy instance. Once that database is gone, this is gone with it.

## Putting It Together: A Migration Discovery Checklist

Strip away the SQL and what you actually have is a five-part discovery checklist, and I'd run it in roughly this order:

1. **Inventory the metadata** — every node type, every property, every category, every hierarchy and its current node count. This becomes your EDM dimension and node type design input.
2. **Map every integration** — every export, what it feeds, and whether that downstream system is staying, going, or needs a bridge. This is the single most common source of "surprise" outages in a DRM-to-EDM cutover.
3. **Export the full security model** — every access group, every user, every role, mapped to actual hierarchy and node access. This becomes your EDM access group design input, and your user provisioning list.
4. **Document the workflow business logic** — every workflow model, task, and validation rule. Each one represents a business requirement someone decided was worth enforcing; decide deliberately whether each one is rebuilt, simplified, or retired in EDM.
5. **Close out open work and freeze the audit trail** — get every in-flight request to a terminal state, and archive transaction history before the legacy database disappears.

None of this is exotic SQL. It's mostly inner joins across `RM_DB`'s core tables. But running it systematically, before you touch EDM configuration, turns a migration from "we think we know what's in here" into "we have a complete, query-verified inventory of everything in here" — and that difference is usually what separates a clean cutover from a multi-month string of post-go-live surprises.

If you're planning a DRM-to-EDM migration and want to build this out further — automating the extraction into a structured handoff document, or turning it into a repeatable pre-migration audit script — that's a natural next step from here, and one I'd genuinely recommend over trying to do this discovery manually through the GUI.
