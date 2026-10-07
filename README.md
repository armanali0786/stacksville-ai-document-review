# AI Document Review

Review UI for AI-generated findings on a vendor contract. Findings are highlighted in the document, and you can accept, dismiss or add a note to each one.

Live demo: https://stacksville-ai-document-review.netlify.app/

![Review workspace](screenshots/review.png)

## Running it

Node 20.19+ or 22.12+.

```bash
npm install
npm run dev     # http://localhost:5173
npm test
npm run build
```

Data is loaded through a small mock service with 600 ms delay so the loading state shows. You can also try:

- `?scenario=messy` – broken findings (bad offsets, missing paragraphs, duplicate IDs, odd severity/confidence values)
- `?scenario=empty` – no findings
- `?scenario=error` – failed load with retry

## Structure

```
src/
  data/        mock loader + normalize (cleans the raw JSON)
  utils/       anchor matching, filters, summary, diff (pure functions, tested)
  hooks/       review state, selection, keyboard shortcuts
  components/  UI
```

Review state is a map of `findingId -> { status, comment }` kept in `useReviewState` and saved to localStorage. Selection and filters are plain React state. Counts and the visible list are derived with `useMemo`. No state library, it didn't feel needed at this size.

## Design decisions

- **Anchor matching.** If the offsets match the quote, highlight them. If not, search for the quote (same paragraph first, then the whole document) and mark the finding as relocated. If the quote isn't found, nothing is highlighted and the finding is listed above the document as "Text not found". f-20 in the sample data has wrong offsets and gets relocated this way.
- **Overlaps.** Each paragraph is split at every range boundary into flat pieces, so there are no nested `<mark>`s. Clicking an overlapping piece cycles through its findings.
- **Details expand inside the card** instead of a separate third panel, which would squeeze the document.
- **Auto-advance** to the next pending finding after accept/dismiss, with an undo toast in case you didn't mean it.
- **Sorted by severity by default** so the riskiest items come first. Document order is available in the sort dropdown.
- **Messy data** is cleaned once in `normalize.ts`, so components can trust the types. Unknown severity becomes medium, confidence given as 0–100 is converted to 0–1, and a missing anchor counts as whole-document.
- **Diff is hand-written** (word-level LCS). The texts are short, so a library wasn't worth it.
- No UI or annotation library, just React, TypeScript, CSS and lucide icons.

Keyboard: `J`/`K` next/previous, `A` accept, `D` dismiss, `U` undo, `Esc` close, `?` help.

## What I cut and what's next

- **Applying suggested edits to the text.** Changing the text shifts the offsets of every other finding (f-04 and f-05 even overlap), so this needs proper tracked changes. I skipped it.
- **Exporting the review**, and the LLM follow-up questions.
- With more time: component/e2e tests (only the logic is unit-tested now), memoizing paragraphs or virtualizing for long documents, and fuzzier quote matching.
