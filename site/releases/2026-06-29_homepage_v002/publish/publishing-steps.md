# Squarespace publishing steps

Release: `2026-06-29_homepage_v002`

1. Back up the current Squarespace page content and Custom CSS.
2. Open the target Squarespace 7.1 page editor for `/`.
3. Add or replace one Code Block with `publish/code-block.html`.
4. Open Design → Custom CSS and paste `publish/custom-css.css`.
5. If `publish/footer-injection.html` exists, paste it into the page footer injection area only after review.
6. Preview desktop and mobile before saving.
7. Publish only after manual confirmation.
8. Roll back by republishing a prior complete release package; do not reverse a partial diff.

No private or undocumented Squarespace page-write endpoint is used.
