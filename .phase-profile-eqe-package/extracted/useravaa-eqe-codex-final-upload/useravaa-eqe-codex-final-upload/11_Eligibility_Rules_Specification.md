# Eligibility Rules Specification

A template is eligible only if all required fields exist and are non-empty.

Field mapping:
- current_role -> profile.roleTitle
- current_seniority -> profile.orgLevel
- job_category -> profile.categories[]
- previous_company -> profile.previousCompanies[]
- current_company -> profile.currentCompany
- previous_seniority -> profile.previousSeniority
- previous_role -> profile.previousRole

Exclude:
- inactive template
- missing required field
- template already used by Provider
- Provider profile not active
