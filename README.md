# AHE LAB

Expression Archive Institute

AHE LAB is a static, JSON-driven archive site for documenting, classifying, and searching expression records.

Archive First.

## Tech Stack

- HTML
- CSS
- Vanilla JavaScript
- JSON
- GitHub Pages

No external libraries are required.

## Directory Structure

```text
.
├── index.html
├── database.html
├── work.html
├── tag.html
├── circle.html
├── character.html
├── ranking.html
├── stats.html
├── sitemap.html
├── about.html
├── 404.html
├── admin/
│   ├── import.html
│   └── import.js
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── data/
│   ├── ahe-records.json
│   └── sample.json
├── schema/
│   └── ahe-record.schema.json
├── template.json
├── robots.txt
├── rss.xml
└── sitemap.xml
```

## Data Source

`data/ahe-records.json` is the single source of truth for archive records.

Adding one valid record automatically updates:

- Home
- Database
- Work
- Tag
- Circle
- Character
- Ranking
- Stats
- Sitemap
- RSS

## Adding a New Work

1. Open `data/sample.json`.
2. Copy the object.
3. Replace every placeholder value with production data.
4. Append the completed object to the array in `data/ahe-records.json`.
5. Confirm the new `id` is unique and sequential.
6. Run local checks before publishing.

`template.json` is kept as a compact legacy template. `data/sample.json` is the recommended input sample for day-to-day operation.

After one valid record is added to `data/ahe-records.json`, the browser-generated pages update automatically:

- Home
- Database
- Ranking
- Stats
- Work
- Tag
- Circle
- Character
- Sitemap page (`sitemap.html`)

The static `sitemap.xml` and `rss.xml` files are committed snapshots. Regenerate or update them during release work when search-engine feeds must include new records.

## New Record Checklist

Use `data/sample.json` as the template for every new record.

Before editing:

- Confirm the work belongs in AHE LAB's archive scope.
- Confirm the next available ID by checking the last `id` in `data/ahe-records.json`.
- Check existing tags, circle names, and character names before creating new wording.

Required fields:

- `id`
- `title`
- `medium`
- `year`
- `publishedAt`
- `score`
- `intensity`
- `status`
- `tags`
- `note`
- `circle`
- `characters`

Recommended fields:

- `thumbnail.label`
- `thumbnail.accent`
- `thumbnail.background`
- `performers`
- `maker`
- `label`
- `release`
- `runtime`
- `archiveNote`
- `reviewerNote`
- `verification`
- `metadata`
- `scoreDetails`
- `rating`
- `communityReviews`
- `tagCategories`

ID numbering rules:

- Use `AHE-0001` style IDs.
- Use four digits after `AHE-`.
- Assign the next unused number.
- Do not rename an existing ID after publication, because URLs use `work.html?id=...`.
- Do not reuse deleted or rejected IDs.

Naming rules:

- Keep JSON field names exactly as shown in `data/sample.json`.
- Use English labels for stable archive terms when possible.
- Use one spelling consistently across all records.
- Avoid decorative punctuation, emoji, and temporary notes in public fields.
- Keep `title` readable as a public archive title.

Tag rules:

- Use lowercase kebab-case, for example `panel-study`.
- Use singular tags unless an existing plural tag is already established.
- Reuse existing tags before creating a near-duplicate.
- Add only tags that help search, classification, or research comparison.
- Do not use spaces, uppercase letters, or punctuation other than hyphens.
- Keep each record's `tags` array unique.

Character notation:

- Write character names as display names, for example `Mio Archive`.
- Use the same spelling every time the same character appears.
- Add multiple characters as separate array values.
- Do not combine multiple characters in one string.
- Keep each record's `characters` array unique.

Circle notation:

- Write one circle name in `circle`.
- Use the public display name, for example `Archive Unit 01`.
- Reuse the exact existing circle name for repeat works.
- Do not add aliases, notes, or multiple circles in the same field.

Final checklist before commit:

- The record is valid JSON.
- The new object is inside the top-level array in `data/ahe-records.json`.
- There is a comma between records, but not after the final record.
- Required fields are present and non-empty.
- `id` is unique.
- `publishedAt` uses `YYYY-MM-DD`.
- `score` is an integer from `0` to `100`.
- `rating` values are integers from `0` to `10` when present.
- If all 10 `rating` items are entered, their total should match `score`.
- If `communityReviews` exists, Work pages use review averages as the public community score.
- `intensity` is `Low`, `Medium`, or `High`.
- `status` is `Draft`, `Researching`, `Cataloged`, or `Reviewed`.
- Tags, circle, and characters match the naming rules above.
- Local validation commands pass.

## Input Rules

Use `schema/ahe-record.schema.json` as the source of truth for validation.

General rules:

- Add only one JSON object per work.
- Keep `data/ahe-records.json` as a single top-level array.
- Do not add comments to JSON files.
- Use double quotes for all JSON strings.
- Keep field names exactly as defined by the schema.
- Do not add fields that are not listed in the schema.
- Use stable names for `tags`, `circle`, and `characters`; spelling changes create new generated pages.
- Prefer lowercase kebab-case for tags, for example `panel-study`.
- Keep circle and character names human-readable, for example `Archive Unit 01`.
- Keep notes concise and classification-focused.

Required fields:

- `id`: `AHE-0001` format
- `title`
- `medium`
- `year`
- `publishedAt`: `YYYY-MM-DD`
- `score`: integer from 0 to 100
- `intensity`: `Low`, `Medium`, or `High`
- `status`: `Draft`, `Researching`, `Cataloged`, or `Reviewed`
- `tags`: non-empty array
- `note`
- `circle`
- `characters`: non-empty array

Optional field:

- `thumbnail`
  - `label`
  - `accent`
  - `background`

Field rules:

- `id`: Use the next unused ID, such as `AHE-0021`. Never reuse an ID.
- `title`: Use the public archive title for the work.
- `medium`: Use a short category such as `Illustration`, `Manga`, `Web`, `Video`, `Game`, or `Research`.
- `year`: Use the original release or publication year.
- `publishedAt`: Use `YYYY-MM-DD`.
- `score`: Use an integer from `0` to `100`.
- `intensity`: Use only `Low`, `Medium`, or `High`.
- `status`: Use only `Draft`, `Researching`, `Cataloged`, or `Reviewed`.
- `tags`: Add at least one tag. Avoid duplicates within the same record.
- `note`: Explain why the work is classified in the archive.
- `circle`: Use one circle name per record.
- `characters`: Add at least one character name. Avoid duplicates within the same record.
- `performers`: Use display names for performers. When a performer is also the indexed character, keep the spelling aligned with `characters`.
- `maker`: Use the public maker name.
- `label`: Use the public label name when it differs from or supplements `maker`.
- `release`: Use `YYYY-MM-DD`. Keep it aligned with `publishedAt` when both represent the same date.
- `runtime`: Use a compact display value such as `120 min` or `02:00:00`.
- `archiveNote`: Store the research archive note shown on work pages.
- `reviewerNote`: Store reviewer-specific observations or verification context.
- `verification`: Store the current verification label, for example `Full Verified`.
- `metadata`: Store stable identifiers such as `productId`, `maker`, `label`, `runtime`, and `verification`.
- `scoreDetails`: Store named integer sub-scores from `0` to `100`.
- `rating`: Store legacy or curator-side AHE LAB Rating Standard v1.0 item scores from `0` to `10`.
- `communityReviews`: Store visitor and curator reviews used for the public community score.
- `tagCategories`: Group tags by category while keeping the flat `tags` array for search compatibility.
- `thumbnail.label`: Keep this short, usually the record number such as `#0021`.
- `thumbnail.accent` and `thumbnail.background`: Use six-digit hex colors.

## AHE LAB Rating Standard v1.0

AHE LAB officially uses the following 10-item rating standard.

Each item is scored from `0` to `10`. The sum of all 10 items is the AHE SCORE from `0` to `100`.

- `eyeFocus`: 寄り目・白目
- `tongueOut`: 舌出し
- `drool`: よだれ
- `doublePeace`: ダブルピース
- `tearsPien`: 涙・ぴえん
- `pleasure`: 愉悦・快感
- `despairFear`: 絶望・恐怖
- `loyaltySubmission`: 忠誠・服従
- `expressionDuration`: 表情維持時間
- `workConcept`: 作品コンセプト

Rating rules:

- Enter each value as an integer from `0` to `10`.
- Do not use decimals or text values.
- Leave an item absent only when it has not been evaluated.
- Work pages display absent items as `未評価`.
- When all 10 items are entered in a review, that review's AHE Score is their total.
- Work pages treat `communityReviews` as the public score source.
- Keep the top-level `rating` object for backward compatibility; do not use it as a Community Review by itself.
- Curator reviews belong in `communityReviews` with `role` set to `Curator Review`.

## Admin Import Helper

Use `admin/import.html` to validate and preview a pasted JSON record in the browser.

The helper checks:

- Required fields
- ID format
- Duplicate ID
- Score range
- Tag array
- Character array
- Date format

It does not write files directly. Copy the merged JSON output into `data/ahe-records.json`.

## Validation

Run these checks before committing:

```bash
node --check assets/js/app.js
node --check admin/import.js
python3 -m json.tool data/ahe-records.json
python3 -m json.tool schema/ahe-record.schema.json
python3 -m json.tool data/sample.json
python3 -m json.tool template.json
python3 -m http.server 4173
```

Then verify pages in the browser:

- `index.html`
- `database.html`
- `work.html?id=AHE-0001`
- `tag.html`
- `circle.html`
- `character.html`
- `ranking.html`
- `stats.html`
- `sitemap.html`
- `admin/import.html`

## Naming Rules

- HTML pages use lowercase names.
- CSS lives in `assets/css/style.css`.
- Site JavaScript lives in `assets/js/app.js`.
- Admin-only JavaScript lives beside the admin page.
- Record IDs use `AHE-0001` format.
- Query pages use `?id=` for works and `?name=` for tags, circles, and characters.

## Philosophy

Archive First.

The project prioritizes durable records, clear classification, and maintainable static publishing.
