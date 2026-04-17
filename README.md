# Markdown to HTML Converter - Project Documentation

## Overview
A client-side Markdown to HTML converter specifically optimized for **Google Docs compatibility**. The tool converts Markdown text to formatted HTML that can be copied and pasted directly into Google Docs while preserving styling.

All processing is done locally in the browser — no data is sent to any server, and the tool works fully offline.

Created by Dany Thivierge, April 2026
---

## Features

### Toolbar (always visible)
| Button | Action |
|---|---|
| ⬇ Paste from Clipboard | Load Markdown text directly from clipboard |
| ⬆ Copy Formatted Content | Copy rich-text HTML to clipboard (paste into Google Docs / Word) |
| Clear | Remove all content from both panels |

### More Menu (⋮ More)
**File**
- 📂 Load File — Open a `.md`, `.markdown`, or `.txt` file from disk
- 💾 Save as HTML — Download a complete standalone HTML file
- 📄 Save as PDF — Opens a clean PDF-ready print window; select "Save as PDF" in the browser print dialog (`Ctrl+P`). 100% local — no external libraries or APIs
-  Print / PDF — Open the browser print dialog directly

**Formatting**
- ☐ Heading Underlines — Toggle H1/H2 underline borders (off by default for Google Docs paste)
- ☐ Section Dividers — Toggle `---` horizontal rule visibility

**Find**
- 🔍 Find — Open the Find bar (`Ctrl+F`)
- 🔍 Find & Replace — Open the Find & Replace bar (`Ctrl+H`)

**Display**
- 🌙 Dark Mode — Toggle dark theme (persists across sessions)

### Find & Replace Bar
- Live highlight-as-you-type — all matches highlighted yellow in the editor, active match in orange
- Highlights appear in both the Markdown editor **and** the Preview pane simultaneously
- Navigate matches with ↑ / ↓ arrow buttons or `Enter` / `Shift+Enter`
- Replace current match or replace all occurrences
- Close with `Escape` or the ✕ button

### Editor
- **Real-time preview** — Preview updates as you type
- **Line numbers** — Accurate visual line count (accounts for word-wrap)
- **Status bar** — Live word count, character count, estimated read time
- **Drag & drop** — Drag a `.md` / `.txt` file onto the editor to load it
- **Auto-save** — Draft persists in `localStorage` across page reloads
- **Resizable split pane** — Drag `⋮` handle to resize left/right panels; double-click to reset 50/50
- **Synchronized scroll** — Markdown editor and Preview pane scroll together proportionally

### Right Panel
- **Preview tab** — Styled Markdown preview (GitHub-flavored)
- **HTML Code tab** — Raw HTML output (read-only)

### Language Support
- Full bilingual interface: **English / French**
- Toggle with the `FR` / `EN` button in the header
- Language preference persists via `localStorage`

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+S` / `Cmd+S` | Save as HTML |
| `Ctrl+P` / `Cmd+P` | Save as PDF |
| `Ctrl+K` / `Cmd+K` | Clear all content |
| `Ctrl+F` / `Cmd+F` | Open Find bar |
| `Ctrl+H` / `Cmd+H` | Open Find & Replace bar |
| `Enter` (in Find) | Find next |
| `Shift+Enter` (in Find) | Find previous |
| `Escape` | Close Find bar |

---

## Key Design Decisions

### 1. Google Docs Compatibility First
The primary design goal is to generate HTML that preserves formatting when pasted into Google Docs. This required several specific decisions:

#### Table Header Handling
- **Problem**: Google Docs treats `<th>` tags as "Heading 2" style, adding unwanted formatting
- **Solution**: Convert all `<th>` to `<td><strong>` and `<thead>` to `<tbody>`

#### Code Block Rendering
- **Problem**: Google Docs adds a "None" dropdown when pasting `<pre>` elements; `<div>` backgrounds are stripped
- **Solution**: Convert code blocks to single-cell `<table>` elements — tables transfer background color and borders reliably
- **Critical**: Use `Array.from()` when iterating NodeList to avoid skipping elements during DOM replacement

#### Blockquote Rendering
- **Problem**: `border-left` on `<blockquote>` doesn't transfer to Google Docs
- **Solution**: Convert to a two-cell `<table>` — left cell is a narrow colored bar, right cell holds the content

#### Inline Styling Strategy
- Google Docs ignores CSS classes, `<style>` tags, and linked stylesheets
- Every element receives full inline `style` attributes

### 2. Table Styling (Google Docs Optimized)
Three properties cause excess spacing in Google Docs:
- `margin: 16px 0` on `<table>` → adds bulk above/below
- `padding: 6px 12px` on `<td>` → stacks on top of Google Docs' own cell padding
- `line-height: 1.4` on `<td>` → stacks on top of Google Docs' own line height

**Tuned values**: `margin: 0`, `padding: 2px 4px`, no `line-height` on cells.

### 3. Find Highlight Overlay (Technical)
The editor uses a transparent `<div>` overlay positioned exactly on top of the `<textarea>` to render highlight boxes. Key implementation details:

- The overlay's **width is set via JavaScript** to `textarea.clientWidth` (which excludes the scrollbar). Using `right: 0` in CSS would make the overlay wider than the textarea's text area, causing text to wrap at different column widths → accumulating position offset on long documents.
- Newlines are handled by `white-space: pre-wrap` CSS — **not** converted to `<br>` tags (which would double-render newlines and shift highlights down).
- Overlay scroll is kept in sync with the textarea on every `scroll` event and after every render.
- `syncOverlayWidth()` is also called inside a `ResizeObserver` so it recalculates if the pane is resized.

---

## Technical Implementation

### Markdown Parser
- **Library**: marked.js (local copy — `marked.min.js`, no CDN required)
- **Configuration**: `breaks: true`, `gfm: true`, `smartLists: true`, `smartypants: true`

### DOM Manipulation Approach
1. Convert Markdown → HTML using marked.js
2. Load HTML into a temporary `<div>` for manipulation
3. Query and modify elements, adding full inline styles
4. Extract final HTML string for preview and output

**Critical Pattern**:
```javascript
// WRONG — skips elements when replacing in a live NodeList
tempDiv.querySelectorAll('pre').forEach(pre => {
    pre.parentNode.replaceChild(newElement, pre);
});

// CORRECT — static array snapshot avoids skipping
Array.from(tempDiv.querySelectorAll('pre')).forEach(pre => {
    pre.parentNode.replaceChild(newElement, pre);
});
```

### localStorage Keys
| Key | Purpose |
|---|---|
| `mdconverter_draft` | Auto-saved Markdown content |
| `mdconverter_lang` | Language preference (`en` / `fr`) |
| `mdconverter_dark` | Dark mode state (`true` / `false`) |
| `mdconverter_split` | Split pane position (percentage) |

---

## File Structure

```
markdown-converter/
├── index.html          # HTML markup only — no inline styles or scripts
├── styles.css          # All application styles + markdown-body preview styles
├── app.js              # All JavaScript logic (1600+ lines, fully documented)
├── marked.min.js       # Markdown parser — local copy (v4.0+), no CDN dependency
├── README.md           # This documentation
├── th_logo_en.png      # TELUS Health logo (English)
├── th_logo_fr.png      # TELUS Health logo (French)
```

### Optional Libraries (for HTML→Markdown conversion)
The app includes support for Turndown + GFM plugin for converting rich HTML to Markdown:
- `turndown.js` — HTML to Markdown converter (if included for rich paste support)
- `turndown-plugin-gfm.js` — GitHub Flavored Markdown tables plugin (if included)

These are optional and only needed if enabling rich-text paste functionality.

### Architecture (Separation of Concerns)
- **`index.html`** — pure structural markup, zero CSS or JS inline
- **`styles.css`** — single source of truth for all styling (app UI + markdown preview)
- **`app.js`** — single source of truth for all behavior
- No external CDN calls — 100% offline capable

---

## Known Issues & Resolved Items

### ✅ Code Block Google Docs Compatibility — RESOLVED
Converting `<pre>` to single-cell `<table>` elements ensures background color, border, and monospace font transfer reliably to Google Docs.

### ✅ Find Highlight Misalignment — RESOLVED (March 2026)
Highlights in the textarea overlay were drifting on long documents due to scrollbar width mismatch. Fixed by dynamically sizing the overlay to `textarea.clientWidth`.

### ✅ Duplicate Confirmation Dialog — RESOLVED (April 2026)
When drag-dropping files, two confirmation dialogs appeared due to event bubbling from nested drop handlers (`editorWrapper` and `left-panel`). Fixed by adding `e.stopPropagation()` to the inner handler to prevent the event from reaching the parent listener.

### Other Considerations
- External images may not load in Google Docs
- Complex nested lists may require additional spacing adjustments
- Custom Markdown extensions are not supported

---

## Usage Tips

### For Best Google Docs Results
1. Use **⬆ Copy Formatted Content** button (not manual select-and-copy)
2. Paste into Google Docs using `Ctrl+V`
3. If formatting is lost: use **💾 Save as HTML**, open in browser, copy from there and paste into Google Docs

### For Developers
- Test changes by copying actual HTML to Google Docs — preview appearance ≠ Google Docs appearance
- When debugging conversion: `console.log(tempDiv.innerHTML)` to inspect generated HTML
- Remember: Google Docs HTML support is a black box — test every change manually

---

## Maintenance Notes

### If Modifying Table Styling
- Test the first row separately (it's the header)
- Test odd/even row alternation
- Verify `<p>`, `<ul>`, `<li>` inside cells still have `margin: 0; padding: 0`

### If Modifying Code Block Conversion
- ALWAYS use `Array.from()` when replacing elements in a NodeList
- Test with multiple code blocks in one document
- Verify both fenced (` ``` `) and indented code blocks work
- Confirm inline code (`` `backticks` ``) is unaffected

### If Modifying the Find Overlay
- Always call `syncOverlayWidth()` before rendering highlights
- Never convert `\n` to `<br>` in the overlay — use `white-space: pre-wrap`
- Verify scroll sync after highlight renders (setting `innerHTML` resets `scrollTop`)

---

## Credits & Libraries

- **marked.js** — Markdown parsing (v4.0+), local copy
- **styles.css** — Custom stylesheet (replaces the 22KB github-markdown-css library)
- **TELUS Health** — Logo and branding

## Deployment & Sharing

⚠️ **Google Drive doesn't work** — it opens HTML files in text-editor mode, not browser mode.

**For sharing publicly, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)**

Recommended options:
- **GitHub Pages** (free, 5 min setup) ⭐ 
- **Netlify** (free, 3 min setup)
- **Vercel** (free, ultra-fast)

All methods allow you to share a single link with your team/public.

## License & Usage

Internal TELUS Health tool. All modifications should maintain:
- Bilingual support (EN/FR)
- TELUS Health branding
- Privacy-first approach (client-side only, no data transmission)

---

**Last Updated**: April 17, 2026
**Version**: 2.3
**Status**: Production — all known issues resolved. Ready for public release.
