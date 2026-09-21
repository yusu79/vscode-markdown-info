# Changelog

[English](#changelog) | [日本語](#日本語)

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-09-21

### Added

- Configure box styles, classes, HTML attributes, titles, and CSS embedding through VS Code settings, YAML front matter, or opening-line attributes.
- Color-code `info`, `warn`, `alert`, and `question` boxes in the Markdown editor.
- Fold `note` and `message` boxes from their opening line to the matching closing marker, including nested boxes.

### Changed

- Omit box titles by default when no title is specified.
- Rename the preview styles to `bordered`, `solid`, and `pastel`, and load their stylesheets from the `markdown-it-info` package.
- Use the npm-published `markdown-it-info` package instead of a local dependency.
- Consolidate the English and Japanese documentation into one README with HTML conversion and WordPress usage examples.

### Fixed

- Prevent headings inside boxes from causing VS Code folding range and document symbol errors.
- Prevent duplicate or misplaced icons when CSS is embedded.

### Security

- Update `js-yaml` to a release that resolves the production dependency audit findings.

## [1.1.0]

### Changed

- Update the README.

## [1.0.0]

### Added

- Initial release.

## 日本語

[English](#changelog) | [日本語](#日本語)

すべての重要な変更をこのファイルに記録します。
フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) に基づき、バージョニングは [Semantic Versioning](https://semver.org/lang/ja/) を採用しています。

## [1.2.0] - 2026-09-21

### 追加

- VS Code設定、YAMLフロントマター、開始行の属性から、ボックスのスタイル、class、HTML属性、タイトル、CSS埋め込みを設定できるようにしました。
- Markdownエディター上で`info`、`warn`、`alert`、`question`のボックスをタイプ別に色分けするようにしました。
- `note`と`message`の開始行から対応する終了行まで、入れ子を含めて折り畳めるようにしました。

### 変更

- タイトルを指定していないボックスでは、初期状態でタイトルを省略するようにしました。
- プレビュースタイルを`bordered`、`solid`、`pastel`へ改名し、スタイルシートを`markdown-it-info`パッケージから読み込むようにしました。
- ローカル依存ではなく、npmへ公開された`markdown-it-info`パッケージを使用するようにしました。
- 英語と日本語の説明を1つのREADMEへ統合し、HTML変換とWordPressでの活用例を追加しました。

### 修正

- ボックス内の見出しによって、VS Codeのfolding rangeとdocument symbolでエラーが発生しないようにしました。
- CSS埋め込み時にアイコンが重複または位置ずれしないようにしました。

### セキュリティ

- 本番依存の監査結果を解消したバージョンへ`js-yaml`を更新しました。

## [1.1.0]

### 変更

- READMEを更新しました。

## [1.0.0]

### 追加

- 最初のリリース。
