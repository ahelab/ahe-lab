const previewRecords = [
  {
    id: "AHE-0001",
    title: "Double Peace Expression Study",
    medium: "Illustration",
    year: 2012,
    publishedAt: "2012-04-12",
    score: 92,
    intensity: "High",
    status: "Cataloged",
    tags: ["double-peace", "classic", "illustration", "high-intensity"],
    note: "初期インターネット文化で広く参照される構図を分類した基礎レコード。"
  },
  {
    id: "AHE-0004",
    title: "Expression Taxonomy Draft",
    medium: "Research",
    year: 2026,
    publishedAt: "2026-06-08",
    score: 88,
    intensity: "Medium",
    status: "Draft",
    tags: ["taxonomy", "research", "archive-first", "classification"],
    note: "AHE LABの分類体系を検証するための研究ノート型レコード。"
  },
  {
    id: "AHE-0016",
    title: "Score Calibration Reference",
    medium: "Research",
    year: 2025,
    publishedAt: "2025-12-01",
    score: 91,
    intensity: "High",
    status: "Reviewed",
    tags: ["research", "score", "calibration", "high-intensity"],
    note: "AHE SCOREを主観評価だけにしないための基準点。"
  },
  {
    id: "AHE-0020",
    title: "Database Launch Sample Set",
    medium: "Dataset",
    year: 2026,
    publishedAt: "2026-06-14",
    score: 93,
    intensity: "Medium",
    status: "Cataloged",
    tags: ["dataset", "database", "mvp", "archive-first"],
    note: "Phase2 Databaseページ公開用の20件目サンプルレコード。"
  }
];

const homeState = {
  query: "",
  activeTag: "all",
  sortBy: "score"
};

const databaseState = {
  query: "",
  activeTag: "all",
  sortBy: "newest",
  records: []
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function getRecordSearchText(record) {
  return normalize([
    record.id,
    record.title,
    record.medium,
    record.year,
    record.publishedAt,
    record.score,
    record.intensity,
    record.status,
    record.note,
    ...record.tags
  ].join(" "));
}

function sortRecords(records, sortBy) {
  return [...records].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    }

    if (sortBy === "year") {
      return b.year - a.year;
    }

    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }

    return b.score - a.score;
  });
}

function filterRecords(records, state) {
  const query = normalize(state.query);

  return records.filter((record) => {
    const matchesSearch = !query || getRecordSearchText(record).includes(query);
    const matchesTag = state.activeTag === "all" || record.tags.includes(state.activeTag);

    return matchesSearch && matchesTag;
  });
}

function getAllTags(records) {
  return ["all", ...new Set(records.flatMap((record) => record.tags))].sort();
}

function renderRecordCard(record, variant = "preview") {
  const tagMarkup = record.tags
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");

  const detailMarkup = variant === "database"
    ? `
      <dl class="record-details">
        <div><dt>Published</dt><dd>${escapeHtml(record.publishedAt)}</dd></div>
        <div><dt>Intensity</dt><dd>${escapeHtml(record.intensity)}</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(record.status)}</dd></div>
      </dl>
    `
    : "";

  return `
    <article class="record-card ${variant === "database" ? "database-card" : ""}">
      <div class="record-poster">
        <span class="record-code">${escapeHtml(record.id)}</span>
        <span class="record-score" aria-label="AHE SCORE ${escapeHtml(record.score)}">${escapeHtml(record.score)}</span>
      </div>
      <div class="record-body">
        <p class="record-meta">${escapeHtml(record.medium)} / ${escapeHtml(record.year)}</p>
        <h3>${escapeHtml(record.title)}</h3>
        <p class="record-note">${escapeHtml(record.note)}</p>
        ${detailMarkup}
        <div class="record-tags">
          ${tagMarkup}
        </div>
      </div>
    </article>
  `;
}

function initializeHomePreview() {
  const grid = document.querySelector("#record-grid");
  const searchInput = document.querySelector("#archive-search");
  const clearSearch = document.querySelector("#clear-search");
  const tagCloud = document.querySelector("#tag-cloud");
  const resultCount = document.querySelector("#result-count");
  const entryCount = document.querySelector("#entry-count");
  const tagCount = document.querySelector("#tag-count");
  const sortRecordsInput = document.querySelector("#sort-records");

  if (!grid || !searchInput || !tagCloud) {
    return;
  }

  function renderHomeRecords() {
    const filteredRecords = sortRecords(filterRecords(previewRecords, homeState), homeState.sortBy);

    resultCount.textContent = `${filteredRecords.length} records`;
    grid.innerHTML = filteredRecords.length
      ? filteredRecords.map((record) => renderRecordCard(record)).join("")
      : '<p class="empty-state">No records found. Try another search or tag.</p>';
  }

  function renderHomeTags() {
    const tags = getAllTags(previewRecords);

    tagCloud.innerHTML = tags.map((tag) => `
      <button class="tag-button${tag === homeState.activeTag ? " is-active" : ""}" type="button" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)}
      </button>
    `).join("");

    tagCount.textContent = tags.length - 1;
  }

  entryCount.textContent = previewRecords.length;

  searchInput.addEventListener("input", (event) => {
    homeState.query = event.target.value;
    renderHomeRecords();
  });

  clearSearch.addEventListener("click", () => {
    homeState.query = "";
    searchInput.value = "";
    renderHomeRecords();
  });

  sortRecordsInput.addEventListener("change", (event) => {
    homeState.sortBy = event.target.value;
    renderHomeRecords();
  });

  tagCloud.addEventListener("click", (event) => {
    const tagButton = event.target.closest("[data-tag]");

    if (!tagButton) {
      return;
    }

    homeState.activeTag = tagButton.dataset.tag;
    renderHomeTags();
    renderHomeRecords();
  });

  renderHomeTags();
  renderHomeRecords();
}

async function loadDatabaseRecords() {
  const response = await fetch("data/ahe-records.json");

  if (!response.ok) {
    throw new Error("Unable to load database records.");
  }

  return response.json();
}

function initializeDatabasePage() {
  const grid = document.querySelector("#db-record-grid");
  const searchInput = document.querySelector("#db-search");
  const clearSearch = document.querySelector("#db-clear-search");
  const tagCloud = document.querySelector("#db-tag-cloud");
  const resultCount = document.querySelector("#db-result-count");
  const totalCount = document.querySelector("#db-total-count");
  const averageScore = document.querySelector("#db-average-score");
  const activeFilter = document.querySelector("#db-active-filter");
  const sortRecordsInput = document.querySelector("#db-sort-records");

  if (!grid || !searchInput || !tagCloud) {
    return;
  }

  function renderDatabaseRecords() {
    const filteredRecords = sortRecords(filterRecords(databaseState.records, databaseState), databaseState.sortBy);

    resultCount.textContent = `${filteredRecords.length} records`;
    activeFilter.textContent = databaseState.activeTag === "all" ? "All" : databaseState.activeTag;
    grid.innerHTML = filteredRecords.length
      ? filteredRecords.map((record) => renderRecordCard(record, "database")).join("")
      : '<p class="empty-state">No records found. Try another search or tag.</p>';
  }

  function renderDatabaseTags() {
    const tags = getAllTags(databaseState.records);

    tagCloud.innerHTML = tags.map((tag) => `
      <button class="tag-button${tag === databaseState.activeTag ? " is-active" : ""}" type="button" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)}
      </button>
    `).join("");
  }

  function renderMetrics() {
    const totalScore = databaseState.records.reduce((sum, record) => sum + record.score, 0);
    const average = Math.round(totalScore / databaseState.records.length);

    totalCount.textContent = databaseState.records.length;
    averageScore.textContent = average;
  }

  loadDatabaseRecords()
    .then((records) => {
      databaseState.records = records;
      renderMetrics();
      renderDatabaseTags();
      renderDatabaseRecords();
    })
    .catch(() => {
      grid.innerHTML = '<p class="empty-state">Database records could not be loaded.</p>';
    });

  searchInput.addEventListener("input", (event) => {
    databaseState.query = event.target.value;
    renderDatabaseRecords();
  });

  clearSearch.addEventListener("click", () => {
    databaseState.query = "";
    searchInput.value = "";
    renderDatabaseRecords();
  });

  sortRecordsInput.addEventListener("change", (event) => {
    databaseState.sortBy = event.target.value;
    renderDatabaseRecords();
  });

  tagCloud.addEventListener("click", (event) => {
    const tagButton = event.target.closest("[data-tag]");

    if (!tagButton) {
      return;
    }

    databaseState.activeTag = tagButton.dataset.tag;
    renderDatabaseTags();
    renderDatabaseRecords();
  });
}

initializeHomePreview();
initializeDatabasePage();
