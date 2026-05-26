# Acceptance Tests Patch — Experience Timeline

## Scenario 1: Add current experience

Given Provider is editing profile  
When they add an experience item with isCurrent=true  
Then current_role, current_seniority and current_company can be derived from that item.

## Scenario 2: Add previous experience

Given Provider has one current experience  
When they add a previous experience with endYear  
Then previous_role, previous_seniority and previous_company can be derived.

## Scenario 3: Missing company country

Given Provider adds timeline item  
When companyCountry is empty  
Then form shows validation error.

## Scenario 4: Invalid date range

Given Provider adds timeline item  
When endYear is before startYear  
Then form blocks save.

## Scenario 5: Five-year coverage warning

Given Provider has yearsOfExperience >= 5  
When timeline coverage is less than 5 years  
Then system shows coverage warning.

## Scenario 6: Question eligibility uses timeline

Given Provider has current and previous timeline items  
When Experience Question Engine filters templates  
Then company comparison and seniority comparison templates become eligible.

## Scenario 7: Flat previousCompanies not used as source of truth

Given previousCompanies text exists but timeline is empty  
When Question Engine runs  
Then comparison templates requiring previous_company are not eligible.
