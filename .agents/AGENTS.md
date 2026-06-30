# Workspace Rules
 
## Validation & Audit Execution Rule
 
- **Omit by default**: The automated validation scripts (e.g. `validate-swiss-deck.mjs`, `validate_botanical_swiss_deck.mjs`, `readability_audit.mjs`, `color_hierarchy_audit.mjs`) and manual screenshot checks are omitted by default during slide modification tasks.
- **Conditional Trigger**: Only run automated validation and manual screenshot checks when the user explicitly requests/emphasizes turning on the automatic audit/review mode ("自动审查模式").
