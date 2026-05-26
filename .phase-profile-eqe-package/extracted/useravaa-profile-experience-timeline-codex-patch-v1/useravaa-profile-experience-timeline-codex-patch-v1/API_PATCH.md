# API Patch — Experience Timeline

## Add to Experience Profile Draft/Update Request

```json
{
  "timelineItems": [
    {
      "jobTitle": "مدیر محصول",
      "orgLevel": "مدیر میانی",
      "companyName": "اسنپ",
      "companyField": "حمل‌ونقل آنلاین",
      "companyCountry": "ایران",
      "startYear": ۱۴۰۱,
      "startMonth": ۱,
      "endYear": null,
      "endMonth": null,
      "isCurrent": true,
      "description": "اختیاری"
    }
  ]
}
```

## Endpoints

### GET /api/profiles/me/timeline

Returns current user's structured experience timeline.

### PUT /api/profiles/me/timeline

Replaces/updates timeline items.

Validation:
- at least one item required
- jobTitle required
- orgLevel required
- companyName required
- companyField required
- companyCountry required
- startYear required
- endYear required when isCurrent=false
- end date must be after start date
- warn if claimed experience years >= 5 and timeline coverage < 5 years

### GET /api/profiles/{profileId}

Public profile may include a summarized timeline if UI requires it.

For Experience Question Engine, backend must use timeline-derived fields even if public profile does not show full timeline.
