const DATA_PATH = "data/ahe-records.json";

// Shared state for the database page filters.
const databaseState = {
  query: "",
  activeTag: "all",
  selectedTags: [],
  tagMode: "and",
  scoreMin: "",
  scoreMax: "",
  circle: "",
  character: "",
  sortBy: "newest",
  records: []
};

const FAVORITE_KEY = "ahe-lab-favorites";
const RATING_STANDARD_ITEMS = [
  { key: "eyeFocus", label: "寄り目・白目" },
  { key: "tongueOut", label: "舌出し" },
  { key: "drool", label: "よだれ" },
  { key: "doublePeace", label: "ダブルピース" },
  { key: "tearsPien", label: "涙・ぴえん" },
  { key: "pleasure", label: "愉悦・快感" },
  { key: "despairFear", label: "絶望・恐怖", aliases: ["fearDespair"] },
  { key: "loyaltySubmission", label: "忠誠・服従", aliases: ["submission"] },
  { key: "expressionDuration", label: "表情維持時間", aliases: ["duration"] },
  { key: "workConcept", label: "作品コンセプト", aliases: ["concept"] }
];

// Text helpers keep generated HTML safe and URLs consistent.
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

function getCurrentRelativeUrl() {
  return `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`;
}

function setTagAttribute(selector, attribute, value) {
  const tag = document.querySelector(selector);

  if (tag) {
    tag.setAttribute(attribute, value);
  }
}

function setMeta(title, description, canonical = getCurrentRelativeUrl()) {
  document.title = title;
  const metaDescription = document.querySelector('meta[name="description"]');

  if (metaDescription) {
    metaDescription.setAttribute("content", description);
  }

  setTagAttribute('meta[property="og:title"]', "content", title);
  setTagAttribute('meta[property="og:description"]', "content", description);
  setTagAttribute('meta[property="og:url"]', "content", canonical);
  setTagAttribute('meta[name="twitter:title"]', "content", title);
  setTagAttribute('meta[name="twitter:description"]', "content", description);
  setTagAttribute('link[rel="canonical"]', "href", canonical);
}

// JSON-LD is generated at runtime so query-based pages can expose page-specific metadata.
function setJsonLd(data) {
  let script = document.querySelector("#json-ld");

  if (!script) {
    script = document.createElement("script");
    script.id = "json-ld";
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

// Data accessors and aggregation helpers. All pages derive from data/ahe-records.json.
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

// Favorites are intentionally local-only; no server or account is required.
function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITE_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function setFavorites(ids) {
  localStorage.setItem(FAVORITE_KEY, JSON.stringify([...new Set(ids)]));
}

function isFavorite(id) {
  return getFavorites().includes(id);
}

function toggleFavorite(id) {
  const favorites = getFavorites();
  const nextFavorites = favorites.includes(id)
    ? favorites.filter((favoriteId) => favoriteId !== id)
    : [...favorites, id];

  setFavorites(nextFavorites);
  return nextFavorites.includes(id);
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

function getPopularTags(records, limit = 8) {
  return getPopularValues(records.flatMap((record) => record.tags), limit);
}

function getPopularCircles(records, limit = 8) {
  return getPopularValues(records.map((record) => record.circle), limit);
}

function getPopularCharacters(records, limit = 8) {
  return getPopularValues(records.flatMap((record) => record.characters), limit);
}

function getPopularValues(values, limit = 8) {
  const counts = values.reduce((accumulator, value) => {
    accumulator[value] = (accumulator[value] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function getLatestRecord(records) {
  return sortRecords(records, "newest")[0];
}

function getRelatedRecords(records, currentRecord, limit = 6) {
  return records
    .filter((record) => record.id !== currentRecord.id)
    .map((record) => {
      const sharedTags = record.tags.filter((tag) => currentRecord.tags.includes(tag)).length;
      const sharedCharacters = record.characters.filter((character) => currentRecord.characters.includes(character)).length;
      const sharedCircle = record.circle === currentRecord.circle ? 1 : 0;

      return {
        record,
        weight: sharedTags * 3 + sharedCharacters * 4 + sharedCircle * 5
      };
    })
    .filter((item) => item.weight > 0)
    .sort((a, b) => b.weight - a.weight || b.record.score - a.record.score)
    .slice(0, limit)
    .map((item) => item.record);
}

function getRecordCommunityScore(record) {
  return getCommunityScore(getCommunityReviews(record));
}

function getRecordReviewCount(record) {
  return getCommunityReviews(record).length;
}

function getAverageCommunityScore(records) {
  const scores = records.map(getRecordCommunityScore).filter((score) => score !== null);

  return scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
}

function sortByCommunityScore(records) {
  return [...records].sort((a, b) => (getRecordCommunityScore(b) ?? -1) - (getRecordCommunityScore(a) ?? -1));
}

function getRecordTimeline(records) {
  const counts = records.reduce((accumulator, record) => {
    const year = record.year || new Date(record.publishedAt).getFullYear() || "Unknown";
    accumulator[year] = (accumulator[year] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts).sort((a, b) => Number(b[0]) - Number(a[0]));
}

// Sorting and filtering are shared by Home preview, Database, and generated listing pages.
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
  const selectedTags = state.selectedTags || [];
  const scoreMin = state.scoreMin === "" || state.scoreMin == null ? 0 : Number(state.scoreMin);
  const scoreMax = state.scoreMax === "" || state.scoreMax == null ? 100 : Number(state.scoreMax);
  const selectedCircle = normalize(state.circle);
  const selectedCharacter = normalize(state.character);

  return records.filter((record) => {
    const matchesSearch = !query || getRecordSearchText(record).includes(query);
    const matchesLegacyTag = state.activeTag === "all" || record.tags.includes(state.activeTag);
    const matchesTags = selectedTags.length === 0
      || (state.tagMode === "or"
        ? selectedTags.some((tag) => record.tags.includes(tag))
        : selectedTags.every((tag) => record.tags.includes(tag)));
    const matchesScore = record.score >= scoreMin && record.score <= scoreMax;
    const matchesCircle = !selectedCircle || normalize(record.circle).includes(selectedCircle);
    const matchesCharacter = !selectedCharacter || record.characters.some((character) => normalize(character).includes(selectedCharacter));

    return matchesSearch && matchesLegacyTag && matchesTags && matchesScore && matchesCircle && matchesCharacter;
  });
}

async function loadRecords() {
  const response = await fetch(DATA_PATH);

  if (!response.ok) {
    throw new Error("Unable to load archive records.");
  }

  return response.json();
}

// Header and footer are rendered once per page to avoid duplicating layout HTML.
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
          <a href="database.html" ${activePage === "database" ? 'aria-current="page"' : ""}>Database</a>
          <a href="character.html" ${activePage === "character" ? 'aria-current="page"' : ""}>Characters</a>
          <a href="circle.html" ${activePage === "circle" ? 'aria-current="page"' : ""}>Circles</a>
          <a href="tag.html" ${activePage === "tag" ? 'aria-current="page"' : ""}>Tags</a>
          <a href="about.html#research">Research</a>
          <a href="ranking.html" ${activePage === "ranking" ? 'aria-current="page"' : ""}>Ranking</a>
          <a href="about.html" ${activePage === "about" ? 'aria-current="page"' : ""}>About</a>
          <a href="https://github.com/ahelab/ahe-lab" target="_blank" rel="noopener">Github</a>
          <a href="https://x.com/" target="_blank" rel="noopener">X</a>
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
          <a href="character.html">Characters</a>
          <a href="circle.html">Circles</a>
          <a href="tag.html">Tags</a>
          <a href="about.html#research">Research</a>
          <a href="ranking.html">Ranking</a>
          <a href="about.html">About</a>
          <a href="stats.html">Stats</a>
          <a href="sitemap.html">Sitemap</a>
        </div>
      </footer>
    `;
  }
}

// Reusable render helpers for generated archive cards and navigation.
function renderBreadcrumb(items) {
  return `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="index.html">Home</a>
      ${items.map((item) => item.href
        ? `<span>/</span><a href="${item.href}">${escapeHtml(item.label)}</a>`
        : `<span>/</span><strong>${escapeHtml(item.label)}</strong>`
      ).join("")}
    </nav>
  `;
}

function renderBackButton(href = "database.html", label = "Back") {
  return `<a class="back-link" href="${href}">← ${escapeHtml(label)}</a>`;
}

function renderEntityLinks(values, page) {
  return values.map((value) => `
    <a href="${page}.html?name=${encodeParam(value)}">${escapeHtml(value)}</a>
  `).join("");
}

function renderCountedLinks(values, page) {
  if (values.length === 0) {
    return '<p class="empty-state">No connected records yet.</p>';
  }

  return `
    <div class="entity-link-list">
      ${values.map((value) => `
        <a href="${page}.html?name=${encodeParam(value.name)}">
          <strong>${escapeHtml(value.name)}</strong>
          <span>${escapeHtml(value.count)} works</span>
        </a>
      `).join("")}
    </div>
  `;
}

function renderTagLinks(tags) {
  return tags.map((tag) => `
    <a href="tag.html?name=${encodeParam(tag)}">${escapeHtml(tag)}</a>
  `).join("");
}

function renderRecordCard(record, variant = "database") {
  const thumbnail = record.thumbnail || {
    label: record.id,
    accent: "#7C5CFF",
    background: "#111115"
  };
  const performers = getRecordPerformers(record);
  const communityScore = getRecordCommunityScore(record);
  const reviewCount = getRecordReviewCount(record);
  const release = getRecordRelease(record);
  const detailMarkup = variant === "database"
    ? `
      <dl class="record-details">
        <div><dt>Release</dt><dd>${escapeHtml(release)}</dd></div>
        <div><dt>Reviews</dt><dd>${escapeHtml(reviewCount)}</dd></div>
        <div><dt>Circle</dt><dd><a href="circle.html?name=${encodeParam(record.circle)}">${escapeHtml(record.circle)}</a></dd></div>
      </dl>
    `
    : "";

  return `
    <article class="record-card ${variant === "database" ? "database-card" : ""}">
      <a class="record-poster record-link" href="work.html?id=${encodeParam(record.id)}" aria-label="Open ${escapeHtml(record.title)}" style="--thumb-accent:${escapeHtml(thumbnail.accent)}; --thumb-bg:${escapeHtml(thumbnail.background)};">
        <span class="record-code">${escapeHtml(thumbnail.label || record.id)}</span>
        <span class="record-thumb-title">${escapeHtml(record.medium)}</span>
        <span class="record-score" aria-label="Community Score ${communityScore === null ? "not rated" : escapeHtml(communityScore)}">${communityScore === null ? "NR" : escapeHtml(communityScore)}</span>
      </a>
      <div class="record-body">
        <p class="record-meta">${escapeHtml(record.medium)} / ${escapeHtml(record.year)} / ${escapeHtml(release)}</p>
        <h3><a href="work.html?id=${encodeParam(record.id)}">${escapeHtml(record.title)}</a></h3>
        <p class="record-circle"><a href="circle.html?name=${encodeParam(record.circle)}">${escapeHtml(record.circle)}</a></p>
        <p class="record-statline">
          <strong>Community Score ${communityScore === null ? "No score" : `${escapeHtml(communityScore)}/100`}</strong>
          <span>${escapeHtml(reviewCount)} review${reviewCount === 1 ? "" : "s"}</span>
        </p>
        <p class="record-note">${escapeHtml(record.note)}</p>
        ${detailMarkup}
        <div class="entity-links" aria-label="Performers">
          ${renderEntityLinks(performers, "character")}
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

function getRecordPerformers(record) {
  return record.performers || record.characters;
}

function getRecordMaker(record) {
  return record.maker || record.metadata?.maker || record.circle;
}

function getRecordRelease(record) {
  return record.release || record.publishedAt;
}

function getRecordRuntime(record) {
  return record.runtime || record.metadata?.runtime || "Unrecorded";
}

function getRecordArchiveNote(record) {
  return record.archiveNote || record.note;
}

function renderMetaItem(label, value, href = "") {
  const displayValue = value == null || value === "" ? "Unrecorded" : value;

  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${href ? `<a href="${href}">${escapeHtml(displayValue)}</a>` : escapeHtml(displayValue)}</dd>
    </div>
  `;
}

function renderScoreDetails(record) {
  const entries = Object.entries(record.scoreDetails || {});
  const rows = entries.length > 0 ? entries : [["overall", record.score]];

  return rows.map(([label, value]) => `
    <div>
      <dt>${escapeHtml(label.replaceAll("-", " "))}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `).join("");
}

function getRatingValue(record, key) {
  const value = record.rating?.[key];

  return Number.isInteger(value) && value >= 0 && value <= 10 ? value : null;
}

function getRatingTotal(record) {
  const values = RATING_STANDARD_ITEMS.map((item) => getRatingValue(record, item.key));
  const hasCompleteRating = values.every((value) => value !== null);

  return hasCompleteRating
    ? values.reduce((sum, value) => sum + value, 0)
    : record.score;
}

function renderRatingStandard(record) {
  return `
    <div class="rating-standard-grid">
      ${RATING_STANDARD_ITEMS.map((item) => {
        const value = getRatingValue(record, item.key);

        return `
          <div class="rating-standard-item">
            <span>${escapeHtml(item.label)}</span>
            <strong>${value === null ? "未評価" : `${escapeHtml(value)}/10`}</strong>
          </div>
        `;
      }).join("")}
    </div>
    <div class="rating-standard-total">
      <span>AHE SCORE</span>
      <strong>${escapeHtml(getRatingTotal(record))}/100</strong>
    </div>
  `;
}

function getCommunityReviews(record) {
  return Array.isArray(record.communityReviews) ? record.communityReviews : [];
}

function getReviewRatingValue(review, item) {
  const rating = review.rating || {};
  const value = rating[item.key] ?? (item.aliases || []).map((alias) => rating[alias]).find((aliasValue) => aliasValue != null);

  return Number.isInteger(value) && value >= 0 && value <= 10 ? value : null;
}

function getReviewScore(review) {
  const values = RATING_STANDARD_ITEMS.map((item) => getReviewRatingValue(review, item));

  return values.every((value) => value !== null)
    ? values.reduce((sum, value) => sum + value, 0)
    : null;
}

function getCommunityScore(reviews) {
  const scores = reviews.map(getReviewScore).filter((score) => score !== null);

  return scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
}

function getCategoryAverage(reviews, item) {
  const values = reviews.map((review) => getReviewRatingValue(review, item)).filter((value) => value !== null);

  return values.length
    ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
    : null;
}

function renderMeter(value, max = 10) {
  const percent = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));

  return `
    <span class="rating-meter" aria-hidden="true">
      <span style="width: ${percent}%"></span>
    </span>
  `;
}

function renderScoreSummary(record) {
  const reviews = getCommunityReviews(record);
  const communityScore = getCommunityScore(reviews);

  if (communityScore === null) {
    return `
      <section class="detail-section score-summary" aria-labelledby="score-summary-title">
        <h2 id="score-summary-title">AHE Score</h2>
        <p class="empty-state">No community score yet</p>
      </section>
    `;
  }

  return `
    <section class="detail-section score-summary" aria-labelledby="score-summary-title">
      <h2 id="score-summary-title">AHE Score</h2>
      <div class="community-score-value">${escapeHtml(communityScore)}/100</div>
      <p>Based on ${escapeHtml(reviews.length)} community review${reviews.length === 1 ? "" : "s"}</p>
    </section>
  `;
}

function renderRatingBreakdown(record) {
  const reviews = getCommunityReviews(record);
  const scores = reviews.map(getReviewScore).filter((score) => score !== null);
  const buckets = [
    { label: "90-100", min: 90, max: 100 },
    { label: "80-89", min: 80, max: 89 },
    { label: "70-79", min: 70, max: 79 },
    { label: "60-69", min: 60, max: 69 },
    { label: "Below 60", min: 0, max: 59 }
  ];

  return `
    <section class="detail-section" aria-labelledby="rating-breakdown-title">
      <h2 id="rating-breakdown-title">Rating Breakdown</h2>
      <div class="review-breakdown">
        ${buckets.map((bucket) => {
          const count = scores.filter((score) => score >= bucket.min && score <= bucket.max).length;
          const percent = scores.length ? Math.round((count / scores.length) * 100) : 0;

          return `
            <div class="breakdown-row">
              <span>${escapeHtml(bucket.label)}</span>
              ${renderMeter(percent, 100)}
              <strong>${escapeHtml(percent)}%</strong>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderCategoryAverage(record) {
  const reviews = getCommunityReviews(record);

  if (reviews.length === 0) {
    return `
      <section class="detail-section" aria-labelledby="category-average-title">
        <h2 id="category-average-title">Category Average</h2>
        <p class="empty-state">No community ratings yet</p>
      </section>
    `;
  }

  return `
    <section class="detail-section" aria-labelledby="category-average-title">
      <h2 id="category-average-title">Category Average</h2>
      <p class="section-note">AHE LAB Rating Standard v1.0</p>
      <div class="category-average-grid">
        ${RATING_STANDARD_ITEMS.map((item) => {
          const average = getCategoryAverage(reviews, item);

          return `
            <div class="category-average-item">
              <span>${escapeHtml(item.label)}</span>
              <div>
                ${renderMeter(average)}
                <strong>${average === null ? "未評価" : `${escapeHtml(average)}/10`}</strong>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderReviewRatingList(review) {
  return `
    <dl class="review-rating-list">
      ${RATING_STANDARD_ITEMS.map((item) => {
        const value = getReviewRatingValue(review, item);

        return `
          <div>
            <dt>${escapeHtml(item.label)}</dt>
            <dd>${value === null ? "未評価" : `${escapeHtml(value)}/10`}</dd>
          </div>
        `;
      }).join("")}
    </dl>
  `;
}

function renderExternalLinks(record) {
  const links = Array.isArray(record.externalLinks) ? record.externalLinks : [];
  const placeholderLinks = ["FANZA", "DMM", "Official"];

  return `
    <section class="detail-section" aria-labelledby="external-links-title">
      <h2 id="external-links-title">External Links</h2>
      <div class="external-link-grid">
        ${links.length > 0 ? links.map((link) => `
          <a href="${escapeHtml(link.url)}" rel="noopener" target="_blank">
            <strong>${escapeHtml(link.label)}</strong>
            <span>${escapeHtml(link.note || "External reference")}</span>
          </a>
        `).join("") : placeholderLinks.map((label) => `
          <span>
            <strong>${escapeHtml(label)}</strong>
            <small>Not recorded yet</small>
          </span>
        `).join("")}
      </div>
    </section>
  `;
}

function renderExternalLinkPills(record) {
  const links = Array.isArray(record.externalLinks) ? record.externalLinks : [];
  const placeholderLinks = ["FANZA", "DMM", "Official"];

  return `
    <div class="work-external-inline" aria-label="External links">
      <span>External Links</span>
      ${links.length > 0 ? links.map((link) => `
        <a href="${escapeHtml(link.url)}" rel="noopener" target="_blank">${escapeHtml(link.label)}</a>
      `).join("") : placeholderLinks.map((label) => `<b>${escapeHtml(label)}</b>`).join("")}
    </div>
  `;
}

function renderCommunityReviews(record) {
  const reviews = getCommunityReviews(record);

  return `
    <section class="detail-section" aria-labelledby="community-reviews-title">
      <h2 id="community-reviews-title">Community Reviews</h2>
      ${reviews.length === 0 ? '<p class="empty-state">No community reviews yet</p>' : reviews.map((review) => {
        const score = getReviewScore(review);

        return `
          <article class="community-review">
            <header>
              <div>
                <h3>${escapeHtml(review.nickname)}</h3>
                <p>${escapeHtml(review.role || "Community Review")}</p>
              </div>
              <time datetime="${escapeHtml(review.createdAt)}">${escapeHtml(review.createdAt)}</time>
            </header>
            <p class="review-score">AHE Score: ${score === null ? "未評価" : `${escapeHtml(score)}/100`}</p>
            ${renderReviewRatingList(review)}
            <div class="review-comment">
              <h4>Comment</h4>
              <p>${escapeHtml(review.comment || "No comment recorded.")}</p>
            </div>
            <p class="helpful-count">Helpful ${escapeHtml(review.helpfulCount || 0)}</p>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function renderOfficialArchiveNote(record) {
  const metadata = record.metadata || {};

  return `
    <section class="detail-section note-grid" aria-labelledby="archive-note-title">
      <h2 id="archive-note-title">Official Archive Note</h2>
      <article>
        <h3>Verification</h3>
        <p>${escapeHtml(record.verification || metadata.verification || record.status)}</p>
      </article>
      <article>
        <h3>Archive Note</h3>
        <p>${escapeHtml(record.archiveNote || record.note)}</p>
      </article>
      <article>
        <h3>Source Note</h3>
        <p>${escapeHtml(record.sourceNote || metadata.sourceNote || "No source note recorded.")}</p>
      </article>
      <article>
        <h3>Curator Note</h3>
        <p>${escapeHtml(record.curatorNote || record.reviewerNote || "No curator note recorded.")}</p>
      </article>
    </section>
  `;
}

function renderTimeline(records) {
  const timeline = getRecordTimeline(records);

  if (timeline.length === 0) {
    return '<p class="empty-state">No timeline data yet.</p>';
  }

  return `
    <ol class="timeline-list">
      ${timeline.map(([year, count]) => `
        <li>
          <strong>${escapeHtml(year)}</strong>
          <span>${escapeHtml(count)} work${count === 1 ? "" : "s"}</span>
        </li>
      `).join("")}
    </ol>
  `;
}

function renderCompactWorkList(records) {
  if (records.length === 0) {
    return '<p class="empty-state">No connected works yet.</p>';
  }

  return `
    <div class="compact-work-list">
      ${records.map((record) => {
        const communityScore = getRecordCommunityScore(record);

        return `
          <a href="work.html?id=${encodeParam(record.id)}">
            <strong>${escapeHtml(record.title)}</strong>
            <span>${communityScore === null ? "No score" : `${escapeHtml(communityScore)}/100`} / ${escapeHtml(getRecordRelease(record))}</span>
          </a>
        `;
      }).join("")}
    </div>
  `;
}

function renderRecentReviewFeed(records, limit = 4) {
  const reviews = records.flatMap((record) => getCommunityReviews(record).map((review) => ({
    record,
    review,
    score: getReviewScore(review)
  }))).sort((a, b) => new Date(b.review.createdAt) - new Date(a.review.createdAt)).slice(0, limit);

  if (reviews.length === 0) {
    return '<p class="empty-state">No community reviews yet.</p>';
  }

  return `
    <div class="review-feed">
      ${reviews.map((item) => `
        <a href="work.html?id=${encodeParam(item.record.id)}">
          <strong>${escapeHtml(item.record.title)}</strong>
          <span>${escapeHtml(item.review.nickname)} / ${item.score === null ? "未評価" : `${escapeHtml(item.score)}/100`} / ${escapeHtml(item.review.createdAt)}</span>
        </a>
      `).join("")}
    </div>
  `;
}

function renderEntityMetrics(records) {
  const average = getAverageCommunityScore(records);
  const reviewTotal = records.reduce((sum, record) => sum + getRecordReviewCount(record), 0);

  return `
    <div class="entity-metrics" aria-label="Entity metrics">
      <article>
        <span>${escapeHtml(records.length)}</span>
        <p>Works</p>
      </article>
      <article>
        <span>${average === null ? "NR" : escapeHtml(average)}</span>
        <p>Average Community Score</p>
      </article>
      <article>
        <span>${escapeHtml(reviewTotal)}</span>
        <p>Community Reviews</p>
      </article>
    </div>
  `;
}

function renderWorkGraphSection(records, record, relatedRecords) {
  const performers = getRecordPerformers(record);
  const relatedPerformerRecords = records.filter((item) => item.id !== record.id
    && getRecordPerformers(item).some((performer) => performers.includes(performer)));
  const relatedTagValues = getPopularValues(
    relatedRecords.flatMap((item) => item.tags).filter((tag) => !record.tags.includes(tag)),
    8
  );
  const relatedPerformerValues = getPopularValues(
    relatedPerformerRecords.flatMap((item) => getRecordPerformers(item)).filter((performer) => !performers.includes(performer)),
    8
  );

  return `
    <section class="detail-section knowledge-graph-section" aria-labelledby="knowledge-graph-title">
      <h2 id="knowledge-graph-title">Knowledge Graph</h2>
      <p class="section-note">この作品から演者、サークル、タグ、関連作品へ辿るための接続点です。</p>
      <div class="graph-grid">
        <article>
          <h3>Related Works</h3>
          ${renderCompactWorkList(relatedRecords)}
        </article>
        <article>
          <h3>Performer Network</h3>
          ${renderCountedLinks(relatedPerformerValues, "character")}
        </article>
        <article>
          <h3>Related Tags</h3>
          ${renderCountedLinks(relatedTagValues, "tag")}
        </article>
        <article>
          <h3>Circle</h3>
          ${renderCountedLinks([{ name: record.circle, count: records.filter((item) => item.circle === record.circle).length }], "circle")}
        </article>
      </div>
    </section>
  `;
}

function getNeighborRecordsByTags(records, matchedRecords) {
  const matchedIds = new Set(matchedRecords.map((record) => record.id));
  const matchedTags = new Set(matchedRecords.flatMap((record) => record.tags));

  return records.filter((record) => !matchedIds.has(record.id) && record.tags.some((tag) => matchedTags.has(tag)));
}

function renderEntityGraphPage(records, type, name, matchedRecords) {
  const titleMap = {
    tag: "Tag",
    circle: "Circle",
    character: "Performer"
  };
  const neighborRecords = getNeighborRecordsByTags(records, matchedRecords);
  const relatedTags = getPopularValues(
    matchedRecords.flatMap((record) => record.tags).filter((tag) => type !== "tag" || tag !== name),
    10
  );
  const relatedCircles = getPopularValues(
    matchedRecords.map((record) => record.circle).filter((circle) => type !== "circle" || circle !== name),
    8
  );
  const relatedPerformers = getPopularValues(
    matchedRecords.flatMap((record) => getRecordPerformers(record)).filter((performer) => type !== "character" || performer !== name),
    8
  );
  const fallbackRelatedCircles = relatedCircles.length > 0 ? relatedCircles : getPopularValues(
    neighborRecords.map((record) => record.circle).filter((circle) => type !== "circle" || circle !== name),
    8
  );
  const fallbackRelatedPerformers = relatedPerformers.length > 0 ? relatedPerformers : getPopularValues(
    neighborRecords.flatMap((record) => getRecordPerformers(record)).filter((performer) => type !== "character" || performer !== name),
    8
  );
  const highestRated = sortByCommunityScore(matchedRecords).slice(0, 5);
  const representativeWorks = sortRecords(matchedRecords, "newest").slice(0, 5);
  const indexHref = `${type}.html`;
  const definition = type === "tag"
    ? "Definition placeholder. 今後、分類基準・代表的な演出・隣接タグを記録する領域です。"
    : "このエンティティに接続された作品群から、頻出分類と関連する文化的文脈を自動生成します。";

  return `
    <section class="listing-page entity-page" aria-labelledby="listing-title">
      ${renderBackButton("database.html", "Back to Database")}
      ${renderBreadcrumb([{ label: titleMap[type], href: indexHref }, { label: name }])}
      <header class="entity-hero">
        <div>
          <p class="eyebrow">${escapeHtml(titleMap[type])} / Knowledge Graph Node</p>
          <h1 id="listing-title">${escapeHtml(name)}</h1>
          <p>${escapeHtml(definition)}</p>
        </div>
        ${renderEntityMetrics(matchedRecords)}
      </header>

      <div class="graph-grid entity-graph-grid">
        <article>
          <h2>Works</h2>
          ${renderCompactWorkList(representativeWorks)}
        </article>
        <article>
          <h2>Highest Rated Works</h2>
          ${renderCompactWorkList(highestRated)}
        </article>
        <article>
          <h2>Frequently Used Tags</h2>
          ${renderCountedLinks(relatedTags, "tag")}
        </article>
        <article>
          <h2>${type === "circle" ? "Main Performers" : "Related Performers"}</h2>
          ${renderCountedLinks(fallbackRelatedPerformers, "character")}
        </article>
        <article>
          <h2>${type === "tag" ? "Related Circles" : "Related Circles"}</h2>
          ${renderCountedLinks(fallbackRelatedCircles, "circle")}
        </article>
        <article>
          <h2>Timeline</h2>
          ${renderTimeline(matchedRecords)}
        </article>
      </div>

      <section class="detail-section" aria-labelledby="entity-all-works-title">
        <h2 id="entity-all-works-title">All Connected Works</h2>
        <div class="database-grid">
          ${renderRecordGrid(sortRecords(matchedRecords, "newest"))}
        </div>
      </section>
    </section>
  `;
}

function renderMetadataRows(record) {
  const metadata = record.metadata || {};
  const baseRows = [
    ["Record ID", record.id],
    ["Product ID", metadata.productId],
    ["Label", record.label || metadata.label],
    ["Verification", record.verification || metadata.verification],
    ["Medium", record.medium],
    ["Year", record.year],
    ["Status", record.status]
  ];
  const reservedKeys = new Set(["productId", "label", "verification", "maker", "runtime"]);
  const customRows = Object.entries(metadata)
    .filter(([key]) => !reservedKeys.has(key))
    .map(([key, value]) => [key, value]);

  return [...baseRows, ...customRows]
    .filter(([, value]) => value != null && value !== "")
    .map(([label, value]) => renderMetaItem(label, value))
    .join("");
}

function renderCategorizedTags(record) {
  const categories = record.tagCategories || { general: record.tags };

  return Object.entries(categories).map(([category, tags]) => `
    <section class="tag-category" aria-label="${escapeHtml(category)} tags">
      <h3>${escapeHtml(category.replaceAll("-", " "))}</h3>
      <div class="record-tags">${renderTagLinks(tags)}</div>
    </section>
  `).join("");
}

// Page renderers.
function renderHomePreview(records) {
  const previewRecords = sortRecords(records, "score").slice(0, 4);
  const latestRecords = sortRecords(records, "newest").slice(0, 3);
  const randomRecord = records[Math.floor((new Date().getDate() - 1) % records.length)];
  const grid = document.querySelector("#record-grid");
  const latestGrid = document.querySelector("#home-latest-grid");
  const popularTags = document.querySelector("#home-popular-tags");
  const popularCircles = document.querySelector("#home-popular-circles");
  const popularPerformers = document.querySelector("#home-popular-performers");
  const recentReviews = document.querySelector("#home-recent-reviews");
  const randomWork = document.querySelector("#home-random-work");
  const searchInput = document.querySelector("#archive-search");
  const clearSearch = document.querySelector("#clear-search");
  const tagCloud = document.querySelector("#tag-cloud");
  const resultCount = document.querySelector("#result-count");
  const entryCount = document.querySelector("#entry-count");
  const tagCount = document.querySelector("#tag-count");
  const circleCount = document.querySelector("#circle-count");
  const characterCount = document.querySelector("#character-count");
  const latestAddedDate = document.querySelector("#latest-added-date");
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
  circleCount.textContent = getAllCircles(records).length;
  characterCount.textContent = getAllCharacters(records).length;
  latestAddedDate.textContent = getLatestRecord(records).publishedAt;
  latestGrid.innerHTML = renderRecordGrid(latestRecords);
  popularTags.innerHTML = getPopularTags(records).map((tag) => `
    <a class="tag-button" href="tag.html?name=${encodeParam(tag.name)}">${escapeHtml(tag.name)} <span>${tag.count}</span></a>
  `).join("");
  popularCircles.innerHTML = getPopularCircles(records).map((circle) => `
    <a class="tag-button" href="circle.html?name=${encodeParam(circle.name)}">${escapeHtml(circle.name)} <span>${circle.count}</span></a>
  `).join("");
  popularPerformers.innerHTML = getPopularCharacters(records).map((performer) => `
    <a class="tag-button" href="character.html?name=${encodeParam(performer.name)}">${escapeHtml(performer.name)} <span>${performer.count}</span></a>
  `).join("");
  recentReviews.innerHTML = renderRecentReviewFeed(records);
  randomWork.innerHTML = renderRecordCard(randomRecord, "preview");
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
  setJsonLd({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "AHE LAB Database",
    "description": "Searchable JSON-powered archive records.",
    "numberOfItems": records.length
  });

  const app = document.querySelector("#app");
  const average = Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length);

  app.innerHTML = `
    <section class="database-hero" aria-labelledby="database-page-title">
      <div>
        ${renderBreadcrumb([{ label: "Database" }])}
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

          <div class="advanced-search" aria-label="Advanced search filters">
            <label>
              <span>Tag Mode</span>
              <select id="db-tag-mode">
                <option value="and">AND</option>
                <option value="or">OR</option>
              </select>
            </label>
            <label>
              <span>Score Min</span>
              <input id="db-score-min" type="number" min="0" max="100" placeholder="0">
            </label>
            <label>
              <span>Score Max</span>
              <input id="db-score-max" type="number" min="0" max="100" placeholder="100">
            </label>
            <label>
              <span>Circle</span>
              <input id="db-circle-filter" type="search" placeholder="Circle name">
            </label>
            <label>
              <span>Character</span>
              <input id="db-character-filter" type="search" placeholder="Character name">
            </label>
          </div>

          <p class="selected-filter-line" id="db-selected-tags">Selected tags: all</p>

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
  const tagModeInput = document.querySelector("#db-tag-mode");
  const scoreMinInput = document.querySelector("#db-score-min");
  const scoreMaxInput = document.querySelector("#db-score-max");
  const circleFilterInput = document.querySelector("#db-circle-filter");
  const characterFilterInput = document.querySelector("#db-character-filter");
  const selectedTagsLine = document.querySelector("#db-selected-tags");

  function renderDatabaseRecords() {
    const filteredRecords = sortRecords(filterRecords(databaseState.records, databaseState), databaseState.sortBy);

    resultCount.textContent = `${filteredRecords.length} records`;
    activeFilter.textContent = databaseState.selectedTags.length ? databaseState.selectedTags.join(", ") : "All";
    selectedTagsLine.textContent = `Selected tags: ${databaseState.selectedTags.length ? databaseState.selectedTags.join(", ") : "all"}`;
    grid.innerHTML = renderRecordGrid(filteredRecords);
  }

  function renderDatabaseTags() {
    const tags = getAllTags(databaseState.records);

    tagCloud.innerHTML = tags.map((tag) => `
      <button class="tag-button${databaseState.selectedTags.includes(tag) || (tag === "all" && databaseState.selectedTags.length === 0) ? " is-active" : ""}" type="button" data-tag="${escapeHtml(tag)}">
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

  tagModeInput.addEventListener("change", (event) => {
    databaseState.tagMode = event.target.value;
    renderDatabaseRecords();
  });

  [scoreMinInput, scoreMaxInput, circleFilterInput, characterFilterInput].forEach((input) => {
    input.addEventListener("input", () => {
      databaseState.scoreMin = scoreMinInput.value;
      databaseState.scoreMax = scoreMaxInput.value;
      databaseState.circle = circleFilterInput.value;
      databaseState.character = characterFilterInput.value;
      renderDatabaseRecords();
    });
  });

  tagCloud.addEventListener("click", (event) => {
    const tagButton = event.target.closest("[data-tag]");

    if (!tagButton) {
      return;
    }

    const tag = tagButton.dataset.tag;

    if (tag === "all") {
      databaseState.selectedTags = [];
      databaseState.activeTag = "all";
    } else if (databaseState.selectedTags.includes(tag)) {
      databaseState.selectedTags = databaseState.selectedTags.filter((selectedTag) => selectedTag !== tag);
    } else {
      databaseState.selectedTags = [...databaseState.selectedTags, tag];
    }

    renderDatabaseTags();
    renderDatabaseRecords();
  });
}

function renderWorkPage(records) {
  const id = getQueryParam("id");
  const record = records.find((item) => item.id === id);
  const app = document.querySelector("#app");
  const relatedRecords = record ? getRelatedRecords(records, record) : [];
  const orderedRecords = sortRecords(records, "newest");
  const currentIndex = orderedRecords.findIndex((item) => item.id === id);
  const previousRecord = orderedRecords[currentIndex - 1];
  const nextRecord = orderedRecords[currentIndex + 1];
  const performers = record ? getRecordPerformers(record) : [];
  const maker = record ? getRecordMaker(record) : "";
  const release = record ? getRecordRelease(record) : "";
  const archiveNote = record ? getRecordArchiveNote(record) : "";
  const metadata = record?.metadata || {};
  const productId = metadata.productId || "Unrecorded";
  const communityReviews = record ? getCommunityReviews(record) : [];
  const communityScore = getCommunityScore(communityReviews);
  const thumbnail = record.thumbnail || {
    label: record.id,
    accent: "#7C5CFF",
    background: "#111115"
  };

  if (!record) {
    setMeta("Work Not Found | AHE LAB", "The requested AHE LAB work record was not found.");
    app.innerHTML = renderNotFound("Work not found", "Databaseから作品を選択してください。", "database.html");
    return;
  }

  setMeta(
    `${record.title} | AHE LAB`,
    `${record.title} community-reviewed archive record for ${maker}.`
  );
  setJsonLd({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "identifier": record.id,
    "name": record.title,
    "datePublished": release,
    "genre": record.tags,
    "creator": maker,
    "character": record.characters,
    "actor": performers,
    "aggregateRating": communityScore === null ? undefined : {
      "@type": "AggregateRating",
      "ratingValue": communityScore,
      "bestRating": 100,
      "worstRating": 0,
      "ratingCount": communityReviews.length
    }
  });

  app.innerHTML = `
    <article class="detail-page" aria-labelledby="work-title">
      ${renderBackButton("database.html", "Back to Database")}
      ${renderBreadcrumb([{ label: "Database", href: "database.html" }, { label: record.title }])}
      <header class="work-overview" aria-labelledby="work-title">
        <div class="work-cover-placeholder" style="--thumb-accent:${escapeHtml(thumbnail.accent)}; --thumb-bg:${escapeHtml(thumbnail.background)};">
          <span>${escapeHtml(thumbnail.label || record.id)}</span>
          <small>Cover Image</small>
        </div>
        <div class="work-overview-body">
          <p class="eyebrow">Community Archive / ${escapeHtml(record.id)}</p>
          <h1 id="work-title">${escapeHtml(record.title)}</h1>
          <div class="work-community-score">
            <span>Community Score</span>
            <strong>${communityScore === null ? "No community score yet" : `${escapeHtml(communityScore)}/100`}</strong>
            ${communityScore === null ? "" : `<small>Based on ${escapeHtml(communityReviews.length)} community review${communityReviews.length === 1 ? "" : "s"}</small>`}
          </div>
          <div class="record-tags work-header-tags">${renderTagLinks(record.tags)}</div>
          <dl class="work-header-meta">
            ${renderMetaItem("Product ID", productId)}
            <div>
              <dt>Performer</dt>
              <dd>${renderEntityLinks(performers, "character") || "Unrecorded"}</dd>
            </div>
            ${renderMetaItem("Maker / Circle", maker, `circle.html?name=${encodeParam(record.circle)}`)}
            ${renderMetaItem("Release", release)}
            ${renderMetaItem("Runtime", getRecordRuntime(record))}
            ${renderMetaItem("Verification", record.verification || metadata.verification || record.status)}
          </dl>
          ${renderExternalLinkPills(record)}
          <button class="favorite-button" id="favorite-button" type="button" data-id="${escapeHtml(record.id)}">
            ${isFavorite(record.id) ? "Remove Favorite" : "Add Favorite"}
          </button>
        </div>
      </header>

      <nav class="work-nav" aria-label="Previous and next works">
        ${previousRecord ? `<a href="work.html?id=${encodeParam(previousRecord.id)}">← ${escapeHtml(previousRecord.title)}</a>` : "<span></span>"}
        ${nextRecord ? `<a href="work.html?id=${encodeParam(nextRecord.id)}">${escapeHtml(nextRecord.title)} →</a>` : "<span></span>"}
      </nav>

      <section class="detail-section work-overview-note" aria-labelledby="overview-title">
        <h2 id="overview-title">Overview</h2>
        <p>${escapeHtml(archiveNote)}</p>
      </section>

      ${renderScoreSummary(record)}
      ${renderRatingBreakdown(record)}
      ${renderWorkGraphSection(records, record, relatedRecords)}

      <section class="detail-section review-cta" aria-labelledby="review-cta-title">
        <h2 id="review-cta-title">Write a Community Review</h2>
        <p>AHE LABは訪問者のレビューによってスコアが育つアーカイブです。この作品を分析して、評価を投稿してください。</p>
        <button id="write-review-button" type="button">Write Review</button>
        <p class="review-cta-message" id="review-cta-message" role="status" aria-live="polite"></p>
      </section>

      ${renderCommunityReviews(record)}
      ${renderOfficialArchiveNote(record)}
      ${renderExternalLinks(record)}
    </article>
  `;

  document.querySelector("#favorite-button").addEventListener("click", (event) => {
    const favorite = toggleFavorite(event.currentTarget.dataset.id);
    event.currentTarget.textContent = favorite ? "Remove Favorite" : "Add Favorite";
  });

  document.querySelector("#write-review-button").addEventListener("click", () => {
    document.querySelector("#review-cta-message").textContent = "Review submission is not available yet.";
  });
}

function renderListingPage(records, type) {
  const name = getQueryParam("name");
  const app = document.querySelector("#app");
  databaseState.records = records;
  const titleMap = {
    tag: "Tag",
    circle: "Circle",
    character: "Performer"
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

    return getRecordPerformers(record).includes(name);
  });

  setMeta(
    `${name} | AHE LAB ${titleMap[type]}`,
    `AHE LAB ${type} page for ${name}, generated from the archive JSON data source.`
  );

  app.innerHTML = renderEntityGraphPage(records, type, name, matchedRecords);
}

function renderIndexPage(type, values) {
  const titleMap = {
    tag: "Tags",
    circle: "Circles",
    character: "Characters"
  };
  const records = databaseState.records || [];
  const countFor = (value) => records.filter((record) => {
    if (type === "tag") {
      return record.tags.includes(value);
    }

    if (type === "circle") {
      return record.circle === value;
    }

    return record.characters.includes(value);
  }).length;
  const sortedValues = [...values].sort((a, b) => countFor(b) - countFor(a) || a.localeCompare(b));

  return `
    <section class="listing-page" aria-labelledby="index-title">
      ${renderBackButton("database.html", "Back to Database")}
      ${renderBreadcrumb([{ label: titleMap[type] }])}
      <header class="detail-hero compact">
        <p class="eyebrow">Index</p>
        <h1 id="index-title">${escapeHtml(titleMap[type])}</h1>
        <p>JSONに登録された分類値を件数つきの人気順で表示します。</p>
      </header>
      <div class="index-grid">
        ${sortedValues.map((value) => `
          <a href="${type}.html?name=${encodeParam(value)}">
            <strong>${escapeHtml(value)}</strong>
            <span>${countFor(value)} works</span>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRankingPage(records) {
  setMeta(
    "Ranking | AHE LAB",
    "AHE SCORE, latest records, and title rankings generated from the AHE LAB JSON archive.",
    "ranking.html"
  );

  const app = document.querySelector("#app");
  const byScore = sortRecords(records, "score").slice(0, 10);
  const byNewest = sortRecords(records, "newest").slice(0, 10);
  const byTitle = sortRecords(records, "title").slice(0, 10);

  app.innerHTML = `
    <section class="listing-page ranking-page" aria-labelledby="ranking-title">
      ${renderBackButton("index.html", "Back to Home")}
      ${renderBreadcrumb([{ label: "Ranking" }])}
      <header class="detail-hero compact">
        <p class="eyebrow">Ranking</p>
        <h1 id="ranking-title">Archive Ranking</h1>
        <p>AHE SCORE順、新着順、タイトル順の3軸でJSONデータを自動ランキング化します。</p>
      </header>

      <div class="ranking-grid">
        ${renderRankingList("AHE SCORE Ranking", byScore, (record) => record.score)}
        ${renderRankingList("Latest Ranking", byNewest, (record) => record.publishedAt)}
        ${renderRankingList("Title Ranking", byTitle, (record) => record.title.slice(0, 1).toUpperCase())}
      </div>
    </section>
  `;
}

function renderRankingList(title, records, metric) {
  return `
    <section class="ranking-list" aria-label="${escapeHtml(title)}">
      <h2>${escapeHtml(title)}</h2>
      <ol>
        ${records.map((record) => `
          <li>
            <a href="work.html?id=${encodeParam(record.id)}">
              <strong>${escapeHtml(record.title)}</strong>
              <span>${escapeHtml(metric(record))}</span>
            </a>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function renderStatsPage(records) {
  setMeta(
    "Stats | AHE LAB",
    "AHE LAB archive totals, average AHE SCORE, and top tag rankings generated from JSON.",
    "stats.html"
  );

  const app = document.querySelector("#app");
  const averageScore = Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length);
  const topTags = getPopularTags(records, 12);
  const topCircles = getPopularCircles(records, 10);
  const topCharacters = getPopularCharacters(records, 10);
  const yearlyCounts = getYearlyCounts(records);
  const maxYearCount = Math.max(...yearlyCounts.map((item) => item.count));
  setJsonLd({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "AHE LAB Archive Stats",
    "description": "Aggregated statistics generated from the AHE LAB JSON archive.",
    "measurementTechnique": "Static JSON aggregation",
    "variableMeasured": ["works", "tags", "circles", "characters", "average AHE SCORE"]
  });

  app.innerHTML = `
    <section class="listing-page stats-page" aria-labelledby="stats-title">
      ${renderBackButton("index.html", "Back to Home")}
      ${renderBreadcrumb([{ label: "Stats" }])}
      <header class="detail-hero compact">
        <p class="eyebrow">Stats</p>
        <h1 id="stats-title">Archive Stats</h1>
        <p>JSONデータから総数、平均AHE SCORE、上位タグランキングを自動集計します。</p>
      </header>

      <div class="stats-grid">
        ${renderStatCard("Works", records.length)}
        ${renderStatCard("Tags", getAllTags(records).length - 1)}
        ${renderStatCard("Circles", getAllCircles(records).length)}
        ${renderStatCard("Characters", getAllCharacters(records).length)}
        ${renderStatCard("Average AHE SCORE", averageScore)}
      </div>

      <section class="ranking-list stats-tags" aria-labelledby="top-tags-title">
        <h2 id="top-tags-title">Top Tag Ranking</h2>
        <ol>
          ${topTags.map((tag) => `
            <li>
              <a href="tag.html?name=${encodeParam(tag.name)}">
                <strong>${escapeHtml(tag.name)}</strong>
                <span>${tag.count} works</span>
              </a>
            </li>
          `).join("")}
        </ol>
      </section>

      <div class="ranking-grid stats-rankings">
        ${renderValueRanking("Circle Ranking", topCircles, "circle")}
        ${renderValueRanking("Character Ranking", topCharacters, "character")}
      </div>

      <section class="trend-panel" aria-labelledby="trend-title">
        <h2 id="trend-title">Works Added Trend</h2>
        <div class="trend-chart">
          ${yearlyCounts.map((item) => `
            <div class="trend-row">
              <span>${item.year}</span>
              <div><b style="width:${Math.max(8, Math.round((item.count / maxYearCount) * 100))}%"></b></div>
              <strong>${item.count}</strong>
            </div>
          `).join("")}
        </div>
      </section>
    </section>
  `;
}

function renderValueRanking(title, values, type) {
  return `
    <section class="ranking-list" aria-label="${escapeHtml(title)}">
      <h2>${escapeHtml(title)}</h2>
      <ol>
        ${values.map((item) => `
          <li>
            <a href="${type}.html?name=${encodeParam(item.name)}">
              <strong>${escapeHtml(item.name)}</strong>
              <span>${item.count} works</span>
            </a>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function getYearlyCounts(records) {
  const counts = records.reduce((accumulator, record) => {
    accumulator[record.year] = (accumulator[record.year] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => Number(a.year) - Number(b.year));
}

function renderStatCard(label, value) {
  return `
    <article>
      <span>${escapeHtml(value)}</span>
      <p>${escapeHtml(label)}</p>
    </article>
  `;
}

function getGeneratedUrls(records) {
  return [
    "index.html",
    "database.html",
    "ranking.html",
    "stats.html",
    "about.html",
    "tag.html",
    "circle.html",
    "character.html",
    "sitemap.html",
    "admin/import.html",
    "rss.xml",
    "404.html",
    ...records.map((record) => `work.html?id=${encodeParam(record.id)}`),
    ...getAllTags(records).filter((tag) => tag !== "all").map((tag) => `tag.html?name=${encodeParam(tag)}`),
    ...getAllCircles(records).map((circle) => `circle.html?name=${encodeParam(circle)}`),
    ...getAllCharacters(records).map((character) => `character.html?name=${encodeParam(character)}`)
  ];
}

function renderSitemapPage(records) {
  setMeta(
    "Sitemap | AHE LAB",
    "JSON-generated sitemap for AHE LAB database, work, tag, circle, character, ranking, and stats pages.",
    "sitemap.html"
  );

  const app = document.querySelector("#app");
  const urls = getGeneratedUrls(records);
  setJsonLd({
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    "name": "AHE LAB generated sitemap",
    "url": urls
  });

  app.innerHTML = `
    <section class="listing-page sitemap-page" aria-labelledby="sitemap-title">
      ${renderBackButton("index.html", "Back to Home")}
      ${renderBreadcrumb([{ label: "Sitemap" }])}
      <header class="detail-hero compact">
        <p class="eyebrow">Sitemap</p>
        <h1 id="sitemap-title">Generated Sitemap</h1>
        <p>JSONに1件追加すると、作品・タグ・サークル・キャラクターのリンクが自動更新されます。</p>
      </header>

      <div class="index-grid sitemap-grid">
        ${urls.map((url) => `
          <a href="${url}">
            <strong>${escapeHtml(url)}</strong>
            <span>Open page</span>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderAboutPage() {
  setMeta(
    "About | AHE LAB",
    "Mission, vision, project roadmap, and contribution notes for AHE LAB.",
    "about.html"
  );

  const app = document.querySelector("#app");

  app.innerHTML = `
    <section class="listing-page about-page" aria-labelledby="about-page-title">
      ${renderBackButton("index.html", "Back to Home")}
      ${renderBreadcrumb([{ label: "About" }])}
      <header class="detail-hero compact">
        <p class="eyebrow">About</p>
        <h1 id="about-page-title">Expression Archive Institute</h1>
        <p>AHE LABは、表現文化を記録・分類・検索可能にする静的データベースプロジェクトです。</p>
      </header>

      <div class="about-grid expanded">
        <article><h2>Mission</h2><p>アヘ顔文化を文化資料として記録し、検索可能なアーカイブとして未来に残します。</p></article>
        <article><h2>Vision</h2><p>IMDbのような一覧性と、研究機関のような分類精度を両立する公開データベースを目指します。</p></article>
        <article id="research"><h2>Research</h2><p>HTML、CSS、Vanilla JavaScript、JSONだけで、GitHub Pages上に維持しやすい研究アーカイブを構築します。</p></article>
        <article><h2>Roadmap</h2><p>MVP、Database、JSON駆動ページ、公開品質改善、データ拡充、検索精度改善の順に進めます。</p></article>
        <article><h2>Contribute</h2><p>新規レコードはJSONへ1件追加するだけで、Database、詳細、タグ、サークル、キャラクターへ反映されます。</p></article>
        <article><h2>GitHub</h2><p>相対パス制約を維持するため、公開サイト内ではリポジトリ情報をREADMEから参照します。</p><a class="text-link" href="README.md">Open README</a></article>
      </div>
    </section>
  `;
}

function render404Page() {
  setMeta("404 | AHE LAB", "The requested AHE LAB archive page could not be found.", "404.html");
  const app = document.querySelector("#app");
  app.innerHTML = `
    <section class="listing-page">
      ${renderBackButton("index.html", "Back to Home")}
      ${renderBreadcrumb([{ label: "404" }])}
      <div class="empty-state">
        <h1>404</h1>
        <p>ページが見つかりませんでした。</p>
        <a class="button primary" href="index.html">Back</a>
      </div>
    </section>
  `;
}

function renderNotFound(title, message, href = "database.html") {
  return `
    <section class="listing-page">
      <div class="empty-state">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <a class="button primary" href="${href}">Back</a>
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

// App bootstrap: choose the renderer based on body[data-page].
document.addEventListener("DOMContentLoaded", async () => {
  const page = document.body.dataset.page || "home";
  renderLayout(page);

  if (page === "about") {
    renderAboutPage();
    return;
  }

  if (page === "not-found") {
    render404Page();
    return;
  }

  try {
    const records = await loadRecords();
    databaseState.records = records;

    if (page === "home") {
      renderHomePreview(records);
      return;
    }

    if (page === "database") {
      renderDatabasePage(records);
      return;
    }

    if (page === "ranking") {
      renderRankingPage(records);
      return;
    }

    if (page === "stats") {
      renderStatsPage(records);
      return;
    }

    if (page === "sitemap") {
      renderSitemapPage(records);
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
