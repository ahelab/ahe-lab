const DATA_PATH = "../data/ahe-records.json";
const TEMPLATE_PATH = "../template.json";

const requiredFields = [
  "id",
  "title",
  "medium",
  "year",
  "publishedAt",
  "score",
  "intensity",
  "status",
  "tags",
  "note",
  "circle",
  "characters"
];

const input = document.querySelector("#import-json");
const result = document.querySelector("#import-result");
const preview = document.querySelector("#import-preview");
const mergedOutput = document.querySelector("#merged-json");
const validateButton = document.querySelector("#validate-import");
const templateButton = document.querySelector("#load-template");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }

  return response.json();
}

function validateRecord(record, existingRecords) {
  const errors = [];

  requiredFields.forEach((field) => {
    if (!(field in record)) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  if (!/^AHE-[0-9]{4}$/.test(record.id || "")) {
    errors.push("id must match AHE-0000 format.");
  }

  if (existingRecords.some((existingRecord) => existingRecord.id === record.id)) {
    errors.push(`Duplicate id: ${record.id}`);
  }

  if (!Number.isInteger(record.score) || record.score < 0 || record.score > 100) {
    errors.push("score must be an integer from 0 to 100.");
  }

  if (!Array.isArray(record.tags) || record.tags.length === 0) {
    errors.push("tags must be a non-empty array.");
  }

  if (!Array.isArray(record.characters) || record.characters.length === 0) {
    errors.push("characters must be a non-empty array.");
  }

  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(record.publishedAt || "")) {
    errors.push("publishedAt must use YYYY-MM-DD format.");
  }

  return errors;
}

function renderPreview(record) {
  preview.innerHTML = `
    <article class="record-card database-card">
      <div class="record-poster" style="--thumb-accent:${escapeHtml(record.thumbnail?.accent || "#7C5CFF")}; --thumb-bg:${escapeHtml(record.thumbnail?.background || "#111115")};">
        <span class="record-code">${escapeHtml(record.thumbnail?.label || record.id)}</span>
        <span class="record-thumb-title">${escapeHtml(record.medium)}</span>
        <span class="record-score">${escapeHtml(record.score)}</span>
      </div>
      <div class="record-body">
        <p class="record-meta">${escapeHtml(record.medium)} / ${escapeHtml(record.year)}</p>
        <h3>${escapeHtml(record.title)}</h3>
        <p class="record-circle">${escapeHtml(record.circle)}</p>
        <p class="record-note">${escapeHtml(record.note)}</p>
      </div>
    </article>
  `;
}

validateButton.addEventListener("click", async () => {
  try {
    const existingRecords = await loadJson(DATA_PATH);
    const record = JSON.parse(input.value);
    const errors = validateRecord(record, existingRecords);

    if (errors.length) {
      result.innerHTML = `<strong>Invalid</strong><ul>${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join("")}</ul>`;
      preview.innerHTML = "";
      mergedOutput.value = "";
      return;
    }

    const mergedRecords = [...existingRecords, record];
    result.innerHTML = `<strong>Valid</strong><p>${escapeHtml(record.id)} can be added.</p>`;
    renderPreview(record);
    mergedOutput.value = JSON.stringify(mergedRecords, null, 2);
  } catch (error) {
    result.innerHTML = `<strong>Error</strong><p>${escapeHtml(error.message)}</p>`;
    preview.innerHTML = "";
    mergedOutput.value = "";
  }
});

templateButton.addEventListener("click", async () => {
  const template = await loadJson(TEMPLATE_PATH);
  input.value = JSON.stringify(template, null, 2);
});
