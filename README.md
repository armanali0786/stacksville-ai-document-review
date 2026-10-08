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

**Anchor matching.** If the offsets match the quote, I highlight them. If not, I search for the quote (same paragraph first, then the rest of the document) and mark the finding as relocated. If the quote isn't found anywhere, nothing is highlighted and the finding is listed above the document as "Text not found". I went with trusting the quote over the offsets, because the quote is what the agent actually meant. The other option was to just drop findings with bad offsets, but then the reviewer never sees them. f-20 in the sample data is relocated this way.

**Overlaps.** Each paragraph is cut at every start/end point into flat pieces, and each piece knows which findings cover it, so there are no nested `<mark>`s. Clicking an overlapping piece cycles through its findings. I looked at nesting marks and at the CSS Highlight API, but nesting breaks when ranges only partly overlap, and the Highlight API doesn't give you something you can click or tab to.

**Details open inside the card.** I considered a third column for details, but it squeezes the document, which is the thing you're reading.

**Auto-advance.** After accept or dismiss, the next pending finding opens, with an undo toast in case it was a mistake. It follows the current filters, so filtering to High walks through only the high ones.

**Severity first.** The default sort is most severe first, since that's what a reviewer wants to deal with first. I started with document order, which is still in the sort menu.

**Section map for "where are the problems".** I planned a strip of markers next to the scrollbar, but that needs measuring the page layout. A small map of sections coloured by their worst open finding was simpler and works with the keyboard.

**Messy data** is cleaned once in `normalize.ts`, so the components can trust the types. Unknown severity becomes medium (low might hide a risk, high would inflate it), confidence given as 0–100 is converted to 0–1, and a missing anchor counts as whole-document.

**No libraries for the core parts.** No state library: there are only three bits of state, so hooks were enough. The word diff is a small hand-written LCS, because the texts are short. Apart from React and TypeScript there's only lucide for icons.

Keyboard: `J`/`K` next/previous, `A` accept, `D` dismiss, `U` undo, `Esc` close, `?` help.

## What I prioritized

The link between findings and the text, in both directions, and getting it right when the data is wrong (bad offsets, overlaps, the cross-paragraph f-02). After that, making the review loop quick with mouse or keyboard, and keeping it usable with a screen reader. I'd rather have that core solid than more features.

## What I cut and what's next

- Applying suggested edits to the text. Changing the text shifts the offsets of every other finding (f-04 and f-05 even overlap), so it needs proper tracked changes. I'd rather not fake it.
- Exporting the review, and asking an LLM follow-up questions.
- With more time: component and e2e tests (only the logic is unit-tested now), memoizing paragraphs or virtualizing for long documents, and fuzzier quote matching.
