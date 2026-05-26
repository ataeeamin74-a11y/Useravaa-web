# Codex Patch — Profile Experience Timeline Required

## Purpose

Update Useravaa profile data model and UI so the platform captures a structured work-experience timeline for each Provider.

This patch is required because the Experience Question Engine depends on knowing where the Provider worked, when, in what role, at what organizational level, in which company field/category, and in which country.

## Final Product Decision

A Provider profile must include structured work experience items covering at least the last five years where possible.

Each item must capture:

- start date or start year
- end date/year or current role flag
- job title
- organizational level
- company name
- company field/category
- company location/country

## Why This Is Required

Question templates need fields such as:

- current_role
- current_seniority
- current_company
- previous_company
- previous_role
- previous_seniority
- job_category
- company_country
- company_field
- years in role/company

These cannot be reliably generated from a flat text field like "previousCompanies".

## Required UI Placement

Add a section to Build/Edit Experience Profile:

```text
سوابق تجربه
```

Placement:

```text
/profile/build
→ after basic profile info
→ before pricing
```

The Provider must be able to add multiple experience rows.

## Minimum Data Rule

The form should ask for at least the last 5 years of work experience.

Validation rule:

- If total covered timeline is less than 5 years, show a warning.
- Do not necessarily block submission if Provider has less than 5 years total experience.
- If Provider claims 5+ years of experience, timeline coverage should cover at least 5 years or show a required correction/warning depending on product decision.

## Experience Item Fields

| Field | Type | Required |
|---|---|---:|
| jobTitle | string | yes |
| orgLevel | enum | yes |
| companyName | string | yes |
| companyField | string/enum | yes |
| companyCountry | string/ISO country | yes |
| startYear | integer | yes |
| startMonth | integer nullable | no |
| endYear | integer nullable | required unless isCurrent=true |
| endMonth | integer nullable | no |
| isCurrent | boolean | yes |
| description | string nullable | no |

## Current Role Derivation

The current role for question rendering should be derived from the experience item where:

```text
isCurrent = true
```

If multiple current roles exist, use the one with the latest start date and show data issue warning.

## Previous Role Derivation

Previous role/company/seniority should be derived from the most recent item where:

```text
isCurrent = false
```

sorted by `endYear/endMonth desc`.

## Required Engineering Changes

1. Add `ExperienceTimelineItem` model.
2. Replace flat previousCompanies usage for question eligibility with timeline-derived data.
3. Keep previousCompanies as derived/display data if still needed, but do not use it as source of truth.
4. Add timeline editor UI to `/profile/build`.
5. Add timeline display summary to public profile if product design supports it.
6. Update Experience Question Engine mapping logic.
7. Update validation.
8. Update seed data.
9. Add tests.

## Do Not Do

- Do not ask Provider to write all experience as free text.
- Do not rely on comma-separated company input as source of truth.
- Do not show raw unanswered questions to Requester.
- Do not add Admin flow for Experience Question Engine.
