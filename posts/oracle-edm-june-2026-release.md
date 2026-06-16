---
title: "Oracle EDM June 2026 Release: What's New"
date: "2026-06-16"
excerpt: "The June 2026 update for Oracle Enterprise Data Management brings 9 noteworthy enhancements — from external validations and granular metadata migration to smarter expressions and improved UI. Here's a deep dive into everything that shipped."
---

# Oracle EDM June 2026 Release: What's New

The June 2026 (26.06) update for Oracle Enterprise Data Management Cloud is out, and it's a strong release. There are 9 enhancements across governance, data quality, expressions, migration, and the UI — several of which will meaningfully change how teams work day to day.

Here's a full breakdown of everything that shipped.

---

## 1. Granular Templates for Metadata Migration

This is the headline feature of the release for anyone managing multiple EDM environments.

Until now, migrating metadata meant exporting entire applications or dimensions — an all-or-nothing approach that made incremental deployments cumbersome. Granular templates change that. You can now select individual metadata artifacts and export them into a JSON template file, then import just those artifacts into a target environment.

**Supported artifact types:**
- Custom Validations
- Extracts and Extract Packages
- Global Connections
- Lookup Sets
- Policies
- Properties
- Subscriptions

This is a significant quality-of-life improvement for teams with Dev → Test → Prod pipelines. Instead of coordinating full environment refreshes to push a new custom validation or extract, you can now migrate exactly what changed. Expect this to reduce deployment risk and make change management considerably easier.

---

## 2. External Custom Validations and Global Connections

This is the most architecturally significant feature in the June release.

External custom validations allow EDM to call an external REST API endpoint when validating request items. The request item data is passed in the payload, and the external system responds with validation warnings or errors — which are then surfaced directly in the EDM request workflow.

**Why this matters:** EDM validations have traditionally been limited to data and logic within EDM itself. Now you can enforce business rules that live in external systems.

The canonical example from Oracle's docs: *a dimension member can only be deleted if it has no transactions or balances in a downstream business application.* That kind of cross-system validation was previously impossible to enforce natively in EDM — you'd rely on manual checks or post-load reconciliation. Now you can gate it at the request level.

To use this feature, your external system needs to expose a REST API endpoint conforming to Oracle's specification. Global connections are configured per endpoint.

---

## 3. Download Match and Deduplicate Results to File

The Match and Deduplicate workflow now includes a download button for result sets.

When you run a match or deduplication job and review results, you can now export those results to a file. Each row in the download includes:
- Matching node names
- Property values
- Match status
- Match rule(s) applied
- Match score

**Practical use:** large deduplication runs often produce hundreds or thousands of results that are difficult to work through in the UI. Being able to export and analyze in Excel — or share with a data steward for review — is a straightforward but genuinely useful addition for data quality workflows.

---

## 4. Filter Compared Properties to Differences Only

A small but sharp UX improvement for anyone doing viewpoint comparisons.

When using the Side By Side layout in Align mode to compare two viewpoints, the Properties pane now has a Filter button that, when toggled on, shows only the properties that differ between the two viewpoints. Previously, you'd see all shared properties — including the ones that match — which created noise when evaluating differences.

For large hierarchies with many properties, this filter makes comparisons significantly faster to work through.

---

## 5. Viewpoint Download to File in Visualized Request State

You can now download a viewpoint that contains visualized request items to an Excel file, with color-coded rows matching the UI visualization.

The color coding reflects the type of change on each node:
- Added, inserted, moved, removed, reordered nodes
- Deleted nodes
- Property value updates

**Why this is useful:** reviewing hierarchy changes in a request is much clearer when you can see the before/after context of surrounding nodes. Previously that context was lost when downloading. Now stakeholders can review a pending request in Excel with the same visual context they'd see in the EDM UI — making offline review and sign-off more reliable.

A "Request Visualization" option in the Download Viewpoint dialog enables this behavior.

---

## 6. Data Chain Columns for System Event Audit

The System Event Audit screen has four new columns:
- **Application**
- **Dimension**
- **Node Type**
- **Hierarchy Set**

These columns are populated for events on data chain objects, with particular usefulness after granular template imports (see feature #1 above). After importing artifacts, you can now quickly see which application, dimension, node type, and hierarchy set were affected by each audited event — without having to cross-reference other screens.

A natural complement to the granular templates feature.

---

## 7. Distinct and Sort Methods for String Lists in Expressions

Two new methods are now available for String List collections in EDM expressions:

- **Distinct** — removes duplicate values from a string list
- **Sort** — orders values in ascending or descending order

String list objects can be a List data type property, or objects returned from node collection or string value methods.

**When you'll use this:** derived properties and property transformations that combine multiple string lists can now automatically deduplicate and sort the result. This avoids messy concatenated values with repeated entries and makes derived property outputs cleaner and more predictable.

---

## 8. Find Method and List Property Support for Descendants Collection in Expressions

Two additions to how you can work with Descendants collections in expressions:

**Find method:** search a node's descendants based on a predicate (criteria you define). If multiple descendants match, the first one is returned. This unlocks conditional logic based on what exists in a node's subtree — useful for derived property calculations and custom validations that depend on child or descendant attributes.

**List property support:** List data type properties can now be evaluated when working with methods of the Descendants collection. Previously, list properties were excluded from descendant evaluation, which limited what expressions could do with hierarchical data.

Together these make EDM's expression engine meaningfully more powerful for complex hierarchy-aware logic.

---

## 9. Viewpoint Chart Display Improvements

A handful of UX improvements to the chart display for viewpoints:

- **Child node placement:** when adding a child node in chart view, the new child now appears below the centered parent — rather than becoming the centered node itself. This makes adding multiple children to the same parent much less disorienting.
- **Centered node appearance:** the centered node is now wider, making it easier to identify at a glance.
- **Reduced whitespace:** less whitespace throughout the chart means less scrolling to see the same amount of hierarchy.

Not a major functional change, but if you use chart display regularly, the workflow for adding multiple siblings is noticeably smoother.

---

## Summary

| Feature | Category |
|---|---|
| Granular Templates for Metadata Migration | Migration |
| External Custom Validations and Global Connections | Governance |
| Download Match and Deduplicate Results | Data Quality |
| Filter Compared Properties to Differences Only | UI / UX |
| Viewpoint Download in Visualized Request State | UI / UX |
| Data Chain Columns for System Event Audit | Audit |
| Distinct and Sort for String Lists in Expressions | Expressions |
| Find Method and List Property for Descendants | Expressions |
| Viewpoint Chart Display Improvements | UI / UX |

The external custom validations and granular templates are the two features with the most impact on how EDM is architected and operated — both worth exploring in your non-production environment before the next release cycle.
