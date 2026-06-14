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

1. Open `template.json`.
2. Copy the object.
3. Fill in the required fields.
4. Append it to the array in `data/ahe-records.json`.
5. Confirm the new `id` is unique.
6. Run local checks before publishing.

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
