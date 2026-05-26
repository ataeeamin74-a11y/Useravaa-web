# RTL Rules

- Set `dir="rtl"` on Persian UI containers and document root.
- Main product navigation order in RTL header:
  1. Brand on the right.
  2. Main nav centered: کشف تجربه‌ها، گفت‌وگوها، پروفایل.
  3. Utilities on the left: راهنما، اعلان‌ها، کیف پول.
- Text alignment defaults to right for Persian text.
- Mixed English/Persian fields:
  - Email, phone, IBAN and API/debug identifiers use `dir="ltr"` inputs.
  - Product/job English terms inside Persian sentences should not flip punctuation.
- Numeric display:
  - UI-visible numbers use Persian digits.
  - Stored numeric values remain integers.
- Price display:
  - Unit is تومان.
  - Use thousands separators.
  - Free help displays رایگان.
- Date/time display:
  - UI uses Shamsi/Jalali date labels.
  - Time labels use Persian digits and 24-hour format.
- Icons:
  - Directional arrows must mirror in RTL.
  - Non-directional icons such as notification, wallet and profile do not mirror.
- Form behavior:
  - Select labels and option lists align right.
  - IBAN, email and phone inputs remain LTR even inside RTL forms.
- Validation:
  - Error messages appear under the field aligned right.
