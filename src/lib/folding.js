const INFO_OPEN_PATTERN = /^[ \t]{0,3}:{3,}(?:note|message)[ \t]+(?:info|warn(?:ing)?|alert|question)(?=[ \t{]|$)/;
const INFO_CLOSE_PATTERN = /^[ \t]{0,3}:{3,}[ \t]*$/;
const FENCE_OPEN_PATTERN = /^[ \t]{0,3}(`{3,}|~{3,})/;

function findInfoFoldingRanges(document) {
	const ranges = [];
	const starts = [];
	let fence;

	for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber += 1) {
		const line = document.lineAt(lineNumber).text;

		if (fence) {
			const closingFence = line.match(/^[ \t]{0,3}(`+|~+)[ \t]*$/);
			if (
				closingFence &&
				closingFence[1][0] === fence.character &&
				closingFence[1].length >= fence.length
			) {
				fence = undefined;
			}
			continue;
		}

		const openingFence = line.match(FENCE_OPEN_PATTERN);
		if (openingFence) {
			fence = {
				character: openingFence[1][0],
				length: openingFence[1].length
			};
			continue;
		}

		if (INFO_OPEN_PATTERN.test(line)) {
			starts.push(lineNumber);
			continue;
		}

		if (INFO_CLOSE_PATTERN.test(line) && starts.length > 0) {
			const start = starts.pop();
			if (start < lineNumber) {
				ranges.push({start, end: lineNumber});
			}
		}
	}

	return ranges.sort((left, right) => left.start - right.start || right.end - left.end);
}

module.exports = {findInfoFoldingRanges};
