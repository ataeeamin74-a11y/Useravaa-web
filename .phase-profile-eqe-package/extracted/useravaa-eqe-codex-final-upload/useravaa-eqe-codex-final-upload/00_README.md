# Experience Question Engine Handoff v2 — No Admin Review

تصمیم نهایی محصولی:
- این فیچر در فلو ادمین نمی‌افتد.
- مسئولیت محتوای پاسخ با خود Provider است.
- ادمین در MVP هیچ نقشی در approve، reject، hide یا review پاسخ‌ها ندارد.
- پاسخ بعد از تأیید نهایی Provider، داخل پروفایل منتشر می‌شود.
- این فیچر همچنان Profile Enrichment Mechanism است، نه social feature.

قانون اجرا:
- هیچ feed، like، comment، share، social graph، public activity یا صفحه عمومی جدا برای پاسخ‌ها ساخته نشود.
- پاسخ‌ها فقط داخل پروفایل Provider نمایش داده می‌شوند.
- حداکثر ۳ پاسخ در پروفایل نمایش داده شود.
- کنار فیلد پاسخ و قبل از انتشار، متن مسئولیت و محرمانگی به Provider نمایش داده شود.


## Codex Entry Point

Start from:

1. `CODEX_FINAL_INSTRUCTIONS.md`
2. `EXPERIENCE_QUESTION_PLACEMENT_SPEC.md`
3. `NO_ADMIN_RULE_LOCK.json`

These three files override any older admin-review wording if found elsewhere.
