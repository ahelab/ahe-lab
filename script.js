const DATA_PATH = "data/ahe-records.json";

const databaseState = {
  query: "",
  activeTag: "all",
  sortBy: "newest",
  records: []
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function encodeParam(value) {
  return encodeURIComponent(value);
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setMeta(title, description) {
  document.title = title;
  const metaDescription = document.querySelector('meta[name="description"]');

  if (metaDescription) {
    metaDescription.setAttribute("content", description);
  }
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
    record.circle,
    record.note,
    ...record.characters,
    ...record.tags
  ].join(" "));
}

function getAllTags(records) {
  return ["all", ...new Set(records.flatMap((record) => record.tags))].sort();
}

function getAllCircles(records) {
  return [...new Set(records.map((record) => record.circle))].sort();
}

function getAllCharacters(records) {
  return [...new Set(records.flatMap((record) => record.characters))].sort();
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

async function loadRecords() {
  const response = await fetch(DATA_PATH);

  if (!response.ok) {
    throw new Error("Unable to load archive records.");
  }

  return response.json();
}

function renderLayout(activePage) {
  const header = document.querySelector("#site-header");
  const footer = document.querySelector("#site-footer");

  if (header) {
    header.innerHTML = `
      <header class="site-header">
        <a class="brand" href="index.html" aria-label="AHE LAB home">
          <span class="brand-mark">A</span>
          <span>
            <strong>AHE LAB</strong>
            <small>Expression Archive Institute</small>
          </span>
        </a>

        <nav class="site-nav" aria-label="Primary navigation">
          <a href="index.html" ${activePage === "home" ? 'aria-current="page"' : ""}>Home</a>
          <a href="database.html" ${activePage === "database" ? 'aria-current="page"' : ""}>Database</a>
          <a href="tag.html?name=archive-first" ${activePage === "tag" ? 'aria-current="page"' : ""}>Tags</a>
          <a href="circle.html?name=Archive%20Unit%2001" ${activePage === "circle" ? 'aria-current="page"' : ""}>Circles</a>
          <a href="character.html?name=Mio%20Archive" ${activePage === "character" ? 'aria-current="page"' : ""}>Characters</a>
          <a href="index.html#about">About</a>
        </nav>
      </header>
    `;
  }

  if (footer) {
    footer.innerHTML = `
      <footer class="site-footer">
        <p>© 2026 AHE LAB. Expression Archive Institute.</p>
        <div>
          <a href="database.html">Database</a>
          <a href="tag.html">Tags</a>
          <a href="circle.html">Circles</a>
          <a href="character.html">Characters</a>
        </div>
      </footer>
    `;
  }
}

function renderEntityLinks(values, page) {
  return values.map((value) => `
    <a href="${page}.html?name=${encodeParam(value)}">${escapeHtml(value)}</a>
  `).join("");
}

function renderTagLinks(tags) {
  return tags.map((tag) => `
    <a href="tag.html?name=${encodeParam(tag)}">${escapeHtml(tag)}</a>
  `).join("");
}

function renderRecordCard(record, variant = "database") {
  const detailMarkup = variant === "database"
    ? `
      <dl class="record-details">
        <div><dt>Published</dt><dd>${escapeHtml(record.publishedAt)}</dd></div>
        <div><dt>Circle</dt><dd><a href="circle.html?name=${encodeParam(record.circle)}">${escapeHtml(record.circle)}</a></dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(record.status)}</dd></div>
      </dl>
    `
    : "";

  return `
    <article class="record-card ${variant === "database" ? "database-card" : ""}">
      <a class="record-poster record-link" href="work.html?id=${encodeParam(record.id)}" aria-label="Open ${escapeHtml(record.title)}">
        <span class="record-code">${escapeHtml(record.id)}</span>
        <span class="record-score" aria-label="AHE SCORE ${escapeHtml(record.score)}">${escapeHtml(record.score)}</span>
      </a>
      <div class="record-body">
        <p class="record-meta">${escapeHtml(record.medium)} / ${escapeHtml(record.year)}</p>
        <h3><a href="work.html?id=${encodeParam(record.id)}">${escapeHtml(record.title)}</a></h3>
        <p class="record-note">${escapeHtml(record.note)}</p>
        ${detailMarkup}
        <div class="entity-links" aria-label="Characters">
          ${renderEntityLinks(record.characters, "character")}
        </div>
        <div class="record-tags">
          ${renderTagLinks(record.tags)}
        </div>
      </div>
    </article>
  `;
}

function renderRecordGrid(records) {
  if (records.length === 0) {
    return '<p class="empty-state">No records found. Try another search or classification.</p>';
  }

  return records.map((record) => renderRecordCard(record, "database")).join("");
}

function renderHomePreview(records) {
  const previewRecords = sortRecords(records, "score").slice(0, 4);
  const grid = document.querySelector("#record-grid");
  const searchInput = document.querySelector("#archive-search");
  const clearSearch = document.querySelector("#clear-search");
  const tagCloud = document.querySelector("#tag-cloud");
  const resultCount = document.querySelector("#result-count");
  const entryCount = document.querySelector("#entry-count");
  const tagCount = document.querySelector("#tag-count");
  const sortRecordsInput = document.querySelector("#sort-records");
  const homeState = {
    query: "",
    activeTag: "all",
    sortBy: "score"
  };

  function renderHomeRecords() {
    const filteredRecords = sortRecords(filterRecords(previewRecords, homeState), homeState.sortBy);

    resultCount.textContent = `${filteredRecords.length} records`;
    grid.innerHTML = renderRecordGrid(filteredRecords);
  }

  function renderHomeTags() {
    const tags = getAllTags(previewRecords);

    tagCloud.innerHTML = tags.map((tag) => `
      <button class="tag-button${tag === homeState.activeTag ? " is-active" : ""}" type="button" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)}
      </button>
    `).join("");

    tagCount.textContent = getAllTags(records).length - 1;
  }

  if (!grid || !searchInput || !tagCloud) {
    return;
  }

  entryCount.textContent = records.length;
  renderHomeTags();
  renderHomeRecords();

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
}

function renderDatabasePage(records) {
  setMeta(
    "Database | AHE LAB",
    "Search the AHE LAB static database by title, tag, circle, character, and AHE SCORE."
  );

  const app = document.querySelector("#app");
  const average = Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length);

  app.innerHTML = `
    <section class="database-hero" aria-labelledby="database-page-title">
      <div>
        <p class="eyebrow">Phase 3 / JSON Source Database</p>
        <h1 id="database-page-title">Expression Records</h1>
        <p>
          JSONを唯一のデータソースとして、作品詳細、タグ、サークル、キャラクター分類まで
          自動生成する静的データベースです。
        </p>
      </div>

      <div class="database-metrics" aria-label="Database metrics">
        <article><span id="db-total-count">${records.length}</span><p>Total Records</p></article>
        <article><span id="db-average-score">${average}</span><p>Average Score</p></article>
        <article><span id="db-active-filter">All</span><p>Active Tag</p></article>
      </div>
    </section>

    <section class="database-workspace" aria-labelledby="database-controls-title">
      <aside class="database-sidebar" id="database-tags">
        <div class="sidebar-heading">
          <p class="eyebrow">Tags</p>
          <h2 id="database-controls-title">Filter</h2>
        </div>
        <div class="tag-cloud database-tag-cloud" id="db-tag-cloud" aria-label="Filter records by tag"></div>
      </aside>

      <section class="database-results" aria-labelledby="database-results-title">
        <div class="database-control-panel">
          <div>
            <p class="eyebrow">Search</p>
            <h2 id="database-results-title">Archive Browser</h2>
          </div>

          <form class="search-bar database-search" role="search">
            <label class="visually-hidden" for="db-search">Search database</label>
            <input id="db-search" type="search" placeholder="Search title, circle, character, tag, note..." autocomplete="off">
            <button type="reset" id="db-clear-search">Clear</button>
          </form>

          <div class="database-toolbar database-page-toolbar" aria-live="polite">
            <span id="db-result-count">0 records</span>
            <label>
              <span class="visually-hidden">Sort records</span>
              <select id="db-sort-records" aria-label="Sort records">
                <option value="newest">新着</option>
                <option value="score">AHE SCORE</option>
                <option value="title">タイトル</option>
              </select>
            </label>
          </div>
        </div>

        <div class="database-grid" id="db-record-grid"></div>
      </section>
    </section>
  `;

  databaseState.records = records;

  const grid = document.querySelector("#db-record-grid");
  const searchInput = document.querySelector("#db-search");
  const clearSearch = document.querySelector("#db-clear-search");
  const tagCloud = document.querySelector("#db-tag-cloud");
  const resultCount = document.querySelector("#db-result-count");
  const activeFilter = document.querySelector("#db-active-filter");
  const sortRecordsInput = document.querySelector("#db-sort-records");

  function renderDatabaseRecords() {
    const filteredRecords = sortRecords(filterRecords(databaseState.records, databaseState), databaseState.sortBy);

    resultCount.textContent = `${filteredRecords.length} records`;
    activeFilter.textContent = databaseState.activeTag === "all" ? "All" : databaseState.activeTag;
    grid.innerHTML = renderRecordGrid(filteredRecords);
  }

  function renderDatabaseTags() {
    const tags = getAllTags(databaseState.records);

    tagCloud.innerHTML = tags.map((tag) => `
      <button class="tag-button${tag === databaseState.activeTag ? " is-active" : ""}" type="button" data-tag="${escapeHtml(tag)}">
        ${escapeHtml(tag)}
      </button>
    `).join("");
  }

  renderDatabaseTags();
  renderDatabaseRecords();

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

function renderWorkPage(records) {
  const id = getQueryParam("id");
  const record = records.find((item) => item.id === id);
  const app = document.querySelector("#app");

  if (!record) {
    setMeta("Work Not Found | AHE LAB", "The requested AHE LAB work record was not found.");
    app.innerHTML = renderNotFound("Work not found", "Databaseから作品を選択してください。");
    return;
  }

  setMeta(
    `${record.title} | AHE LAB`,
    `${record.title} record with AHE SCORE ${record.score}, circle ${record.circle}, and archive classification tags.`
  );

  app.innerHTML = `
    <article class="detail-page" aria-labelledby="work-title">
      <header class="detail-hero">
        <p class="eyebrow">Work Detail / ${escapeHtml(record.id)}</p>
        <h1 id="work-title">${escapeHtml(record.title)}</h1>
        <p>${escapeHtml(record.note)}</p>
      </header>

      <section class="detail-layout" aria-label="Work metadata">
        <div class="detail-score">
          <span>${escapeHtml(record.score)}</span>
          <p>AHE SCORE</p>
        </div>

        <dl class="detail-meta">
          <div><dt>Medium</dt><dd>${escapeHtml(record.medium)}</dd></div>
          <div><dt>Year</dt><dd>${escapeHtml(record.year)}</dd></div>
          <div><dt>Published</dt><dd>${escapeHtml(record.publishedAt)}</dd></div>
          <div><dt>Intensity</dt><dd>${escapeHtml(record.intensity)}</dd></div>
          <div><dt>Status</dt><dd>${escapeHtml(record.status)}</dd></div>
          <div><dt>Circle</dt><dd><a href="circle.html?name=${encodeParam(record.circle)}">${escapeHtml(record.circle)}</a></dd></div>
        </dl>
      </section>

      <section class="detail-section" aria-labelledby="characters-title">
        <h2 id="characters-title">Characters</h2>
        <div class="entity-links">${renderEntityLinks(record.characters, "character")}</div>
      </section>

      <section class="detail-section" aria-labelledby="tags-title">
        <h2 id="tags-title">Tags</h2>
        <div class="record-tags">${renderTagLinks(record.tags)}</div>
      </section>
    </article>
  `;
}

function renderListingPage(records, type) {
  const name = getQueryParam("name");
  const app = document.querySelector("#app");
  const titleMap = {
    tag: "Tag",
    circle: "Circle",
    character: "Character"
  };
  const allValues = {
    tag: getAllTags(records).filter((tag) => tag !== "all"),
    circle: getAllCircles(records),
    character: getAllCharacters(records)
  };

  if (!name) {
    setMeta(`${titleMap[type]} Index | AHE LAB`, `Browse AHE LAB ${type} classifications generated from JSON.`);
    app.innerHTML = renderIndexPage(type, allValues[type]);
    return;
  }

  const matchedRecords = records.filter((record) => {
    if (type === "tag") {
      return record.tags.includes(name);
    }

    if (type === "circle") {
      return record.circle === name;
    }

    return record.characters.includes(name);
  });

  setMeta(
    `${name} | AHE LAB ${titleMap[type]}`,
    `AHE LAB ${type} page for ${name}, generated from the archive JSON data source.`
  );

  app.innerHTML = `
    <section class="listing-page" aria-labelledby="listing-title">
      <header class="detail-hero compact">
        <p class="eyebrow">${escapeHtml(titleMap[type])} / ${matchedRecords.length} Records</p>
        <h1 id="listing-title">${escapeHtml(name)}</h1>
        <p>JSONデータ内の分類値から自動生成された一覧ページです。</p>
      </header>

      <div class="database-grid">
        ${renderRecordGrid(sortRecords(matchedRecords, "newest"))}
      </div>
    </section>
  `;
}

function renderIndexPage(type, values) {
  const titleMap = {
    tag: "Tags",
    circle: "Circles",
    character: "Characters"
  };

  return `
    <section class="listing-page" aria-labelledby="index-title">
      <header class="detail-hero compact">
        <p class="eyebrow">Index</p>
        <h1 id="index-title">${escapeHtml(titleMap[type])}</h1>
        <p>JSONに登録された分類値の一覧です。</p>
      </header>
      <div class="index-grid">
        ${values.map((value) => `
          <a href="${type}.html?name=${encodeParam(value)}">
            <strong>${escapeHtml(value)}</strong>
            <span>Open ${escapeHtml(type)} page</span>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderNotFound(title, message) {
  return `
    <section class="listing-page">
      <div class="empty-state">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <a class="button primary" href="database.html">Back to Database</a>
      </div>
    </section>
  `;
}

function renderError() {
  const app = document.querySelector("#app");

  if (app) {
    app.innerHTML = renderNotFound("Database unavailable", "JSONデータを読み込めませんでした。");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page || "home";
  renderLayout(page);

  try {
    const records = await loadRecords();

    if (page === "home") {
      renderHomePreview(records);
      return;
    }

    if (page === "database") {
      renderDatabasePage(records);
      return;
    }

    if (page === "work") {
      renderWorkPage(records);
      return;
    }

    if (["tag", "circle", "character"].includes(page)) {
      renderListingPage(records, page);
    }
  } catch (error) {
    renderError();
  }
});
