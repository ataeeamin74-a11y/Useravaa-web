# Acceptance Tests Patch

## Job Title

Scenario: Job title is free text  
Given Provider edits timeline  
When they enter "مدیر محصول ارشد" as job title  
Then the form accepts it as free text.

## Job Field

Scenario: Job field must come from taxonomy  
Given Provider edits timeline  
When they select "محصول و تجربه کاربر"  
Then the form accepts the value.

Scenario: Invalid job field rejected  
Given API receives jobField="محصول"  
When request is validated  
Then server rejects it with `jobField.invalid`.

## Discovery

Scenario: Discovery filters use fixed taxonomy  
Given user opens discover filters  
Then حوزه شغلی options are exactly the fixed taxonomy list.

## Question Engine

Scenario: job_category placeholder uses jobField  
Given current timeline item has jobField="علوم داده و هوش مصنوعی"  
When a template uses {job_category}  
Then rendered question uses "علوم داده و هوش مصنوعی".

Scenario: current_role placeholder uses jobTitle  
Given current timeline item has jobTitle="تحلیلگر داده"  
When a template uses {current_role}  
Then rendered question uses "تحلیلگر داده".
