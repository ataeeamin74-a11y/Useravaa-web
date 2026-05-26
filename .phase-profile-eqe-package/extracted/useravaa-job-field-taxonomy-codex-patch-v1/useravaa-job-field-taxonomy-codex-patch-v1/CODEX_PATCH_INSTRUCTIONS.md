# Codex Patch — Job Title Free Text + Fixed Job Field Taxonomy

## Purpose

Apply this patch to Useravaa profile, timeline, discovery filters, Experience Question Engine, API contracts, validation, seed data and UI copy.

## Final Product Decision

### 1. Job Title / عنوان شغلی

`عنوان شغلی` must be entered manually by the user as free text.

Examples:
- مدیر محصول
- تحلیلگر داده
- طراح محصول
- مدیر تجربه مشتری
- مدیرعامل

Do not convert job title into a fixed dropdown.

### 2. Job Field / حوزه شغلی

`حوزه شغلی` must always be selected only from the fixed taxonomy below.

This applies everywhere:
- build/edit profile
- experience timeline item
- profile display
- public profile
- discovery filters
- search/filter
- Question Engine eligibility
- seed data
- API validation
- database enum/reference table
- copy keys
- tests

## Fixed Job Field Taxonomy

1. محصول و تجربه کاربر
2. طراحی گرافیک و هویت بصری
3. فنی و مهندسی نرم‌افزار
4. علوم داده و هوش مصنوعی
5. مارکتینگ و برند
6. تحلیل و توسعه کسب‌وکار
7. عملیات
8. تجربه مشتری
9. پشتیبانی مشتریان
10. فروش و بازرگانی
11. استراتژی و مدل کسب‌وکار
12. مالی، حقوقی و سرمایه‌گذاری
13. منابع انسانی و فرهنگ سازمانی
14. مدیریت، رهبری و کارآفرینی

## Required Changes

1. Standardize naming:
   - Use `jobTitle` for manual title.
   - Use `jobField` for the fixed field/category taxonomy.
   - If company industry/category is needed, call it `companyIndustry`, not `companyField`.

2. In timeline items:
   - `jobTitle`: free text, required.
   - `jobField`: enum/fixed list, required.
   - `companyName`: free text/searchable, required.
   - `companyCountry`: required.
   - `companyIndustry`: optional unless already required elsewhere.

3. In Question Engine:
   - `{current_role}` comes from current timeline item `jobTitle`.
   - `{job_category}` maps to `jobField`.
   - Eligibility for job category templates requires at least one valid `jobField`.
   - Do not let arbitrary job field values enter template rendering.

4. In Discovery:
   - Job field filters must use only this fixed list.
   - Do not show old categories such as:
     - محصول
     - هوش تجاری
     - تحلیل داده
     - طراحی محصول
     - رشد
     - مهندسی
   unless they are mapped into the new taxonomy.

5. In forms:
   - `عنوان شغلی`: text input.
   - `حوزه شغلی`: select/multi-select from fixed list only.

6. In backend:
   - reject any jobField not in the fixed taxonomy.
   - do not reject free-text jobTitle except normal length/required validation.

7. Update tests.

## Must Not Do

- Do not make job title a dropdown.
- Do not allow arbitrary job field/category text.
- Do not keep old inconsistent job-category labels.
- Do not confuse company industry with job field.
