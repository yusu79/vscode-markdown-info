const yaml = require("js-yaml");

function parseFrontmatter(source) {
    const lines = source.split("\n");
    if (lines[0].replace(/^\uFEFF/, "").trimEnd() !== "---") return;

    let closingLine = 1;
    while (closingLine < lines.length && lines[closingLine].trimEnd() !== "---") {
        closingLine++;
    }
    if (closingLine === lines.length) return;

    try {
        const value = yaml.load(lines.slice(1, closingLine).join("\n"));
        if (value && typeof value === "object" && !Array.isArray(value)) return value;
    } catch (error) {
        // VS Code handles invalid frontmatter in its own renderer.
        return;
    }
}

function extendMarkdownItWithFrontmatter(md) {
    md.core.ruler.before("block", "markdown_info_frontmatter", state => {
        if (state.env.frontmatter !== undefined) return;
        const frontmatter = parseFrontmatter(state.src);
        if (frontmatter) state.env.frontmatter = frontmatter;
    });
    return md;
}

module.exports = {parseFrontmatter, extendMarkdownItWithFrontmatter};
