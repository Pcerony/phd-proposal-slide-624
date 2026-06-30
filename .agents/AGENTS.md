# Workspace Rules
 
## Validation & Audit Execution Rule
 
- **Omit by default**: The automated validation scripts (e.g. `validate-swiss-deck.mjs`, `validate_botanical_swiss_deck.mjs`, `readability_audit.mjs`, `color_hierarchy_audit.mjs`) and manual screenshot checks are omitted by default during slide modification tasks.
- **Conditional Trigger**: Only run automated validation and manual screenshot checks when the user explicitly requests/emphasizes turning on the automatic audit/review mode ("自动审查模式").

## Slide Design & Layout Preferences (User Preferences)

- **Tight Spacing & Single Line**: Avoid large, loose gaps between components. Prefer keeping texts, addresses, or related tags on a single line rather than wrapping, to save vertical space.
- **Strict Boundaries**: Layout dimensions must never exceed the card or container bounds. If overflowing, prioritize adjusting the layout or deleting redundant elements rather than extending bounds.
- **Visual Hierarchy & De-emphasis**: Supplementary information, hints, or footnotes must be de-emphasized by using small text sizes ("小字") and lowering opacity (e.g., 50%).
- **Emphasis**: Critical nodes (e.g., time, key metrics) should be highlighted using larger font sizes and accent colors.
- **Cross-Slide Consistency**: Ensure consistent styling with preceding or analogous slides (e.g., matching side-title or hypothesis blocks) without being explicitly told.
- **Animated Linkage (串联设计)**: When presenting sequences, workflows, or methodologies, use a connected design where an output/result component from a previous slide seamlessly animates/transitions into the input of the next slide. Avoid isolated, disconnected structural designs.
