const records = [
  {
    id: "AHE-0001",
    title: "Double Peace Expression Study",
    medium: "Illustration",
    year: 2012,
    score: 92,
    tags: ["double-peace", "classic", "illustration", "high-intensity"],
    note: "初期インターネット文化で広く参照される構図を分類した基礎レコード。"
  },
  {
    id: "AHE-0002",
    title: "Lens Gaze Archive Sample",
    medium: "Manga",
    year: 2016,
    score: 84,
    tags: ["gaze", "manga", "symbolic", "panel-study"],
    note: "視線方向とコマ配置が表現の強度に与える影響を記録。"
  },
  {
    id: "AHE-0003",
    title: "Digital Meme Circulation Note",
    medium: "Web",
    year: 2020,
    score: 78,
    tags: ["web", "meme", "derivative", "researching"],
    note: "SNS上での二次流通とタグ変化を追跡するためのMVPサンプル。"
  },
  {
    id: "AHE-0004",
    title: "Expression Taxonomy Draft",
    medium: "Research",
    year: 2026,
    score: 88,
    tags: ["taxonomy", "research", "archive-first", "classification"],
    note: "AHE LABの分類体系を検証するための研究ノート型レコード。"
  }
];

const state = {
  query: "",
  activeTag: "all",
  sortBy: "score"
};

const grid = document.querySelector("#record-grid");
const searchInput = document.querySelector("#archive-search");
const clearSearch = document.querySelector("#clear-search");
const tagCloud = document.querySelector("#tag-cloud");
const resultCount = document.querySelector("#result-count");
const entryCount = document.querySelector("#entry-count");
const tagCount = document.querySelector("#tag-count");
const sortRecords = document.querySelector("#sort-records");

// Keep archive data searchable without adding a backend during the MVP phase.
function getFilteredRecords() {
  const normalizedQuery = state.query.trim().toLowerCase();

  return records
    .filter((record) => {
      const haystack = [
        record.title,
        record.medium,
        record.year,
        record.score,
        record.note,
        ...record.tags
      ].join(" ").toLowerCase();

      const matchesSearch = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesTag = state.activeTag === "all" || record.tags.includes(state.activeTag);

      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (state.sortBy === "year") {
        return b.year - a.year;
      }

      if (state.sortBy === "title") {
        return a.title.localeCompare(b.title);
      }

      return b.score - a.score;
    });
}

function renderRecords() {
  const filteredRecords = getFilteredRecords();

  resultCount.textContent = `${filteredRecords.length} records`;

  if (filteredRecords.length === 0) {
    grid.innerHTML = '<p class="empty-state">No records found. Try another search or tag.</p>';
    return;
  }

  grid.innerHTML = filteredRecords.map((record) => `
    <article class="record-card">
      <div class="record-poster">
        <span class="record-code">${record.id}</span>
        <span class="record-score">${record.score}</span>
      </div>
      <div class="record-body">
        <p class="record-meta">${record.medium} / ${record.year}</p>
        <h3>${record.title}</h3>
        <p class="record-note">${record.note}</p>
        <div class="record-tags">
          ${record.tags.map((tag) => `<span>${tag}</span>`).join("")}
        </div>
      </div>
    </article>
  `).join("");
}

function renderTags() {
  const tags = ["all", ...new Set(records.flatMap((record) => record.tags))].sort();

  tagCloud.innerHTML = tags.map((tag) => `
    <button class="tag-button${tag === state.activeTag ? " is-active" : ""}" type="button" data-tag="${tag}">
      ${tag}
    </button>
  `).join("");

  tagCount.textContent = tags.length - 1;
}

function updateDashboardCounts() {
  entryCount.textContent = records.length;
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderRecords();
});

clearSearch.addEventListener("click", () => {
  state.query = "";
  searchInput.value = "";
  renderRecords();
});

sortRecords.addEventListener("change", (event) => {
  state.sortBy = event.target.value;
  renderRecords();
});

tagCloud.addEventListener("click", (event) => {
  const tagButton = event.target.closest("[data-tag]");

  if (!tagButton) {
    return;
  }

  state.activeTag = tagButton.dataset.tag;
  renderTags();
  renderRecords();
});

updateDashboardCounts();
renderTags();
renderRecords();
