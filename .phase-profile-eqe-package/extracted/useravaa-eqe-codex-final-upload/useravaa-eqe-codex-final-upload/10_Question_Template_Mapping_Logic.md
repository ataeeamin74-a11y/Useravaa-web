# Question Template Mapping Logic

See `templates.json` for full 50-template catalog.

Mapping steps:
1. Map profile fields to placeholders.
2. Filter active templates by requiredFields.
3. Remove templates already used by Provider.
4. Select one eligible unused template.
5. Render placeholders.
