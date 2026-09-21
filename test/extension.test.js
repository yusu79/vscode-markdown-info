const assert = require('assert');
const fs = require('fs');
const path = require('path');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
// const myExtension = require('../extension');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('forwards extension settings to markdown-it-info', () => {
		const configuration = vscode.workspace.getConfiguration('markdown-info');
		const packageConfiguration = require('../package.json').contributes.configuration.properties;
		const {plugins} = require('../src/lib/plugins');
		const options = plugins[0].options;

		assert.deepStrictEqual(packageConfiguration['markdown-info.previewStyles'].enum, ['bordered', 'solid', 'pastel']);
		assert.strictEqual(packageConfiguration['markdown-info.previewStyles'].default, 'bordered');
		assert.strictEqual(options.style, configuration.get('previewStyles'));
		assert.strictEqual(packageConfiguration['markdown-info.defaultTitle'].default, null);
		assert.deepStrictEqual(options.classes, configuration.get('classes'));
		assert.deepStrictEqual(options.attributes, configuration.get('attributes'));
		assert.strictEqual(options.embedCss, configuration.get('embedCss'));
		assert.strictEqual(options.defaultTitle, configuration.get('defaultTitle'));
	});

	test('preview styles resolve to the renamed dependency stylesheets', () => {
		const previewStyles = require('../package.json').contributes['markdown.previewStyles'];
		assert.deepStrictEqual(previewStyles.map(style => path.basename(style)), [
			'bordered-styles.css',
			'solid-styles.css',
			'pastel-styles.css'
		]);
		for (const style of previewStyles) {
			assert.ok(fs.existsSync(path.resolve(__dirname, '..', style)), style);
		}
	});

	test('contributes type-specific highlighting for complete Markdown info boxes', () => {
		const packageJson = require('../package.json');
		const grammarContribution = packageJson.contributes.grammars[0];
		const grammarPath = path.resolve(__dirname, '..', grammarContribution.path);
		const grammar = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
		const tokenRules = packageJson.contributes.configurationDefaults
			['editor.tokenColorCustomizations'].textMateRules;
		const registeredTokenRules = vscode.workspace.getConfiguration('editor')
			.inspect('tokenColorCustomizations').defaultValue.textMateRules;
		const expectedTypes = {
			info: '#66ca1b',
			warn: '#ffb94d',
			alert: '#ff7670',
			question: '#adcefe'
		};

		assert.strictEqual(grammarContribution.scopeName, 'markdown-info.injection');
		assert.deepStrictEqual(grammarContribution.injectTo, ['text.html.markdown', 'source.markdown']);
		assert.match(grammar.injectionSelector, /L:text\.html\.markdown/);
		assert.match(grammar.injectionSelector, /L:source\.markdown/);
		assert.match(grammar.injectionSelector, /-markup\.fenced_code\.block\.markdown/);
		assert.strictEqual(grammar.patterns.length, 4);

		for (const [type, foreground] of Object.entries(expectedTypes)) {
			const scope = `markdown-info.${type}.markdown`;
			const pattern = grammar.patterns.find(item => item.name === scope);
			const tokenRule = tokenRules.find(item => item.scope === scope);
			const registeredTokenRule = registeredTokenRules.find(item => item.scope === scope);

			assert.ok(pattern, scope);
			assert.ok(new RegExp(pattern.begin).test(`:::note ${type} Title`), type);
			assert.ok(new RegExp(pattern.begin).test(`:::message ${type}`), type);
			assert.ok(new RegExp(pattern.end).test(':::'));
			assert.deepStrictEqual(pattern.patterns, [
				{include: '$self'},
				{include: '$base'}
			]);
			assert.deepStrictEqual(tokenRule.settings, {
				foreground
			});
			assert.deepStrictEqual(registeredTokenRule, tokenRule);
		}

		const warnPattern = grammar.patterns.find(item => item.name === 'markdown-info.warn.markdown');
		assert.ok(new RegExp(warnPattern.begin).test(':::note warning'));
		for (const pattern of grammar.patterns) {
			const openingLine = new RegExp(pattern.begin);
			assert.strictEqual(openingLine.test(':::note Custom title'), false);
			assert.strictEqual(openingLine.test('    :::note info'), false);
			assert.strictEqual(openingLine.test('text :::note info'), false);
		}
	});

	test('reads shared and type-specific note settings from YAML frontmatter', () => {
		const {parseFrontmatter} = require('../src/lib/frontmatter');
		const frontmatter = parseFrontmatter([
			'---',
			'markdown:',
			'  note:',
			'    classes: [shared]',
			'    info:',
			'      classes: [info-only]',
			'      style: solid',
			'      embedCss: true',
			'  mojicolor:',
			'    bold: color',
			'---',
			':::note info',
			'Content',
			':::'
		].join('\n'));

		assert.deepStrictEqual(frontmatter.markdown.note.info, {
			classes: ['info-only'],
			style: 'solid',
			embedCss: true
		});
		assert.strictEqual(frontmatter.markdown.mojicolor.bold, 'color');
	});

	test('adds frontmatter to the parse env without replacing existing data', () => {
		const {extendMarkdownItWithFrontmatter} = require('../src/lib/frontmatter');
		let rule;
		extendMarkdownItWithFrontmatter({
			core: {ruler: {before(anchor, name, callback) {
				assert.strictEqual(anchor, 'block');
				assert.strictEqual(name, 'markdown_info_frontmatter');
				rule = callback;
			}}}
		});

		const source = '---\nmarkdown:\n  note:\n    embedCss: true\n---\n:::note info\nBody\n:::';
		const env = {};
		rule({src: source, env});
		assert.strictEqual(env.frontmatter.markdown.note.embedCss, true);

		const existing = {markdown: {note: {style: 'pastel'}}};
		const preservedEnv = {frontmatter: existing};
		rule({src: source, env: preservedEnv});
		assert.strictEqual(preservedEnv.frontmatter, existing);
	});

	test('ignores absent or invalid YAML frontmatter', () => {
		const {parseFrontmatter} = require('../src/lib/frontmatter');
		assert.strictEqual(parseFrontmatter(':::note info\nBody\n:::'), undefined);
		assert.strictEqual(parseFrontmatter('---\nmarkdown: [\n---\nBody'), undefined);
		assert.strictEqual(parseFrontmatter('---\nmarkdown: {}\nBody'), undefined);
	});

	test('applies YAML note style in the VS Code Markdown renderer', async function () {
		this.timeout(20000);
		const source = [
			'---',
			'markdown:',
			'  note:',
			'    info:',
			'      style: solid',
			'      classes: [from-yaml]',
			'      embedCss: true',
			'---',
			':::note info',
			'Body',
			':::'
		].join('\n');
		const html = await vscode.commands.executeCommand('markdown.api.render', source);

		assert.match(html, /class="[^"]*solid-admonition info markdown-it-info-embedded from-yaml"/);
		const plainHtml = await vscode.commands.executeCommand('markdown.api.render', ':::note info\nBody\n:::');
		assert.doesNotMatch(plainHtml, /from-yaml/);
		assert.match(plainHtml, /class="[^"]*bordered-admonition info markdown-it-info-has-content-start"/);
		assert.match(plainHtml, /<p class="[^"]*markdown-it-info-content-start[^"]*"[^>]*>Body<\/p>/);
		assert.doesNotMatch(plainHtml, /bordered-admonition-title/);
	});

	test('applies classes, attributes, and CSS embedding from block attributes', async function () {
		this.timeout(20000);
		const source = [
			':::note info {.wordpress-box #notice role=note data-source="markdown clip" css=true}',
			'Body',
			':::'
		].join('\n');
		const html = await vscode.commands.executeCommand('markdown.api.render', source);

		assert.match(html, /class="[^"]*markdown-it-info-embedded wordpress-box"/);
		assert.match(html, /id="notice"/);
		assert.match(html, /role="note"/);
		assert.match(html, /data-source="markdown clip"/);
		assert.match(html, /<span class="markdown-it-info-icon"/);
		assert.doesNotMatch(html, /css="true"/);
	});

	test('renders one embedded icon and disables reference CSS pseudo-icons', async function () {
		this.timeout(20000);
		const previewStyles = require('../package.json').contributes['markdown.previewStyles'];

		for (const style of ['bordered', 'solid', 'pastel']) {
			const source = [
				'---',
				'markdown:',
				'  note:',
				`    style: ${style}`,
				'    embedCss: true',
				'---',
				':::note info A long title that can wrap onto multiple lines',
				'Body',
				':::',
				'',
				':::note question',
				'## Heading at the start',
				'Body',
				':::'
			].join('\n');
			const html = await vscode.commands.executeCommand('markdown.api.render', source);
			const icons = html.match(/<span class="markdown-it-info-icon"/g) || [];

			assert.strictEqual(icons.length, 2, `${style}: one icon per box`);
			assert.match(html, new RegExp(`${style}-admonition info markdown-it-info-embedded`));
			assert.match(html, new RegExp(`${style}-admonition question markdown-it-info-titleless markdown-it-info-embedded`));
			assert.match(
				html,
				/<div[^>]*class="markdown-it-info-heading markdown-it-info-heading-level-2[^"]*"[^>]*>Heading at the start<\/div>/
			);

			const cssPath = previewStyles.find(item => path.basename(item) === `${style}-styles.css`);
			const css = fs.readFileSync(path.resolve(__dirname, '..', cssPath), 'utf8');
			assert.match(css, new RegExp(
				`\\.${style}-admonition\\.markdown-it-info-titleless\\.markdown-it-info-embedded:before[\\s\\S]*` +
				`\\.${style}-admonition\\.markdown-it-info-embedded>\\.${style}-admonition-title:before[\\s\\S]*` +
				`\\.${style}-admonition\\.markdown-it-info-embedded>\\.markdown-it-info-content-start:before[\\s\\S]*` +
				'content: none;'
			));
		}

		const plainHtml = await vscode.commands.executeCommand(
			'markdown.api.render',
			':::note info Plain title\nBody\n:::'
		);
		assert.doesNotMatch(plainHtml, /<span class="markdown-it-info-icon"/);
	});

	test('provides folding ranges and document symbols around a heading inside a box', async function () {
		this.timeout(20000);
		const document = await vscode.workspace.openTextDocument({
			language: 'markdown',
			content: [
				'## Outside section',
				'',
				':::note info',
				'## Heading inside the box',
				'',
				'Body',
				':::',
				'',
				'## Next outside section'
			].join('\n')
		});
		const ranges = await vscode.commands.executeCommand(
			'vscode.executeFoldingRangeProvider',
			document.uri
		);
		const symbols = await vscode.commands.executeCommand(
			'vscode.executeDocumentSymbolProvider',
			document.uri
		);
		const html = await vscode.commands.executeCommand(
			'markdown.api.render',
			document.getText()
		);

		assert.ok(Array.isArray(ranges));
		assert.ok(Array.isArray(symbols));
		assert.match(
			html,
			/<div[^>]*class="markdown-it-info-heading markdown-it-info-heading-level-2[^"]*"[^>]*>Heading inside the box<\/div>/
		);
		assert.doesNotMatch(html, /<h2[^>]*>Heading inside the box<\/h2>/);
	});

	test('provides folding ranges for nested boxes and ignores markers in code fences', async function () {
		this.timeout(20000);
		const document = await vscode.workspace.openTextDocument({
			language: 'markdown',
			content: [
				':::note info Outer',
				'Body',
				':::message warn Inner',
				'Nested body',
				':::',
				'```markdown',
				':::note alert Not a box',
				':::',
				'```',
				':::'
			].join('\n')
		});
		const ranges = await vscode.commands.executeCommand(
			'vscode.executeFoldingRangeProvider',
			document.uri
		);
		const positions = ranges.map(({start, end}) => ({start, end}));

		assert.deepStrictEqual(
			positions.filter(({start}) => start === 0 || start === 2),
			[
				{start: 0, end: 9},
				{start: 2, end: 4}
			]
		);
		assert.strictEqual(positions.some(({start}) => start === 6), false);
	});

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});
});
