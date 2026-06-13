# AHE LAB

> Expression Archive Institute

アヘ顔文化をアーカイブする研究所。

---

## Mission

AHE LABは、アヘ顔という表現を
記録・分類・検索可能なデータベースとして
未来に残すことを目的としたプロジェクトです。

私たちはアヘ顔を、
一つの表現であり、一つの文化であると考えています。

---

## Vision

IMDbが映画を記録し、

MyAnimeListがアニメを記録するように、

AHE LABはアヘ顔文化を記録します。

---

## MVP

- 作品データベース
- タグ検索
- 表現分類
- AHE SCORE

---

## Roadmap

- [x] Brand Identity
- [x] Logo
- [x] X Account
- [x] GitHub Repository
- [ ] MVP Development
- [ ] 50 Works Archive
- [ ] Public Release

---

## Philosophy

Archive First.

---

## 新しい作品の追加方法

AHE LABは `data/ahe-records.json` を唯一の作品データソースとして扱います。
新しい作品を追加するときは、`template.json` をコピーして必要項目を埋め、
`data/ahe-records.json` の配列末尾に1件追加してください。

### 必須項目

- `id`: `AHE-0001` 形式の一意なID
- `title`: 作品タイトル
- `medium`: 媒体
- `year`: 年
- `publishedAt`: `YYYY-MM-DD` 形式の日付
- `score`: 0から100のAHE SCORE
- `intensity`: `Low` / `Medium` / `High`
- `status`: `Draft` / `Researching` / `Cataloged` / `Reviewed`
- `tags`: 1件以上のタグ配列
- `note`: 研究メモ
- `circle`: サークル名
- `characters`: 1件以上のキャラクター配列

### 任意項目

- `thumbnail`: カード用の表示メタデータ
  - `label`
  - `accent`
  - `background`

### バリデーション

構造の基準は `schema/ahe-record.schema.json` に定義しています。
追加前に以下を確認してください。

- JSONとして構文エラーがない
- `id` が重複していない
- 必須項目がすべて入っている
- `score` が0から100の整数になっている
- `publishedAt` が `YYYY-MM-DD` 形式になっている

### 反映されるページ

`data/ahe-records.json` に1件追加すると、以下が自動更新されます。

- Home
- Database
- Work
- Tag
- Circle
- Character
- Ranking
- Stats
- Sitemap

```

---

# そしてGitHubをもっと活用しよう

上のタブに

```
Code

Issues

Pull requests

Actions

Projects
```

があるよね。

これが全部使える。

---

## 今日やること

### ① Issues

「Issues」をクリック。

そして

```
New Issue
```

を押す。

---

### Issue #1

```
Title

Create MVP Homepage

Body

- Hero Section
- Search Bar
- Latest Works
- Footer
```

---

### Issue #2

```
Database Design

- Works
- Actress
- Tags
- Score
```

---

### Issue #3

```
Logo Refinement
```

---

# 学長が一番おすすめしたい機能

GitHubは

**「やることリスト」ではなく研究ノートになる。**

例えば

```
Research

#001
アヘ顔ダブルピースの初出

Status
Researching

References
...

Notes
...
```

これをIssueで管理できる。

---

# さらに思いついた

AHE LABは

```
📚 DATABASE

🔬 RESEARCH

📖 TIMELINE

🏷 TAGS
```

の4本柱にした方がブランドが強い。

単なるまとめサイトじゃない。

---

# 最後に

私はREADMEの最初に、この一文を置きたい。

```markdown
# AHE LAB

Expression Archive Institute

アヘ顔文化をアーカイブする研究所。

Archive First.
```

**Archive First.（まず記録する。）**

この一言が、AHE LABの哲学になる。

収益より先に、文化を記録する。

その姿勢が結果的にブランドになり、他のまとめサイトにはない価値を生む。

そしてGitHubの履歴を見るたびに、

> 2026年6月8日、README一枚から始まった。

という記録がずっと残り続ける。
