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
│   └── ahe-records.json
├── schema/
│   └── ahe-record.schema.json
├── sample.json
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

1. Open `sample.json`.
2. Copy the object.
3. Replace every placeholder value with production data.
4. Append the completed object to the array in `data/ahe-records.json`.
5. Confirm the new `id` is unique and sequential.
6. Run local checks before publishing.

`template.json` is kept as a compact legacy template. `sample.json` is the recommended input sample for day-to-day operation.

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
- `thumbnail.label`: Keep this short, usually the record number such as `#0021`.
- `thumbnail.accent` and `thumbnail.background`: Use six-digit hex colors.

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
python3 -m json.tool sample.json
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
