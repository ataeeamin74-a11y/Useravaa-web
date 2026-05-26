# User Flow Document

## Provider Weekly Flow
1. Provider وارد پروفایل/داشبورد خود می‌شود.
2. سیستم بررسی می‌کند آیا برای هفته جاری سؤال active دارد یا نه.
3. اگر ندارد، سیستم از templateهای eligible و unused یک سؤال تولید می‌کند.
4. کارت «پرسش این هفته» نمایش داده می‌شود.
5. Provider یکی از سه action را انتخاب می‌کند:
   - پاسخ می‌دهم
   - سؤال دیگری بده
   - فعلاً نه

## Provider Answer and Publish Flow
1. Provider روی «پاسخ می‌دهم» کلیک می‌کند.
2. فیلد پاسخ باز می‌شود.
3. Provider پاسخ کوتاه می‌نویسد.
4. validation اجرا می‌شود.
5. Provider متن مسئولیت محتوا را تأیید می‌کند.
6. Provider پاسخ را منتشر می‌کند.
7. پاسخ با status=published داخل پروفایل نمایش داده می‌شود.
8. Provider می‌تواند پاسخ منتشرشده خودش را retract کند.

## Requester Profile Reading Flow
1. Requester پروفایل Provider را می‌بیند.
2. اگر Provider پاسخ published داشته باشد، بخش «از تجربه من» نمایش داده می‌شود.
3. حداکثر ۳ سؤال و پاسخ نمایش داده می‌شود.
4. هیچ action اجتماعی روی پاسخ وجود ندارد.
