import type { Root } from "mdast";
import { SKIP, visit } from "unist-util-visit";

export function removeDependabotFooter(mdast: Root): Root {
	visit(mdast, "paragraph", (node, index, parent) => {
		const firstChild = node.children[0];
		if (
			!(
				firstChild?.type === "text" &&
				firstChild.value ===
					"Dependabot will resolve any conflicts with this PR as long as you don't alter it yourself. You can also trigger a rebase manually by commenting "
			)
		) {
			return;
		}

		if (parent && typeof index === "number") {
			parent.children.splice(index);
		}
		return [SKIP, index];
	});

	return mdast;
}

export function modifyRenovateComment(mdast: Root): Root {
	// Remove renovate header here
	visit(mdast, "paragraph", (node, index, parent) => {
		const firstChild = node.children[0];
		if (
			!(
				firstChild?.type === "link" &&
				firstChild.url === "https://renovatebot.com"
			)
		) {
			return;
		}

		if (parent && typeof index === "number") {
			parent.children.splice(index, 1);
		}
		return [SKIP, index];
	});

	// Parse dependencies updated table and modify for better view in Discord
	visit(mdast, "table", (node) => {
		const tableHeader = node.children[0]?.children.map(({ children }) =>
			children[0]?.type === "text" ? children[0].value : null,
		);

		const renovateHeader = [
			"Package",
			"Change",
			"Age",
			"Adoption",
			"Passing",
			"Confidence",
		];
		if (tableHeader?.every((h, i) => h === renovateHeader[i])) {
			const packages = node.children.slice(1).flatMap((row) => {
				const cells = row.children.map(({ children }) => children);
				return [
					cells.shift(),
					{ type: "text", value: ": " },
					...cells,
					{ type: "text", value: "\n" },
				]
					.filter((n) => n)
					.flat();
			});

			// @ts-expect-error 2322
			node.type = "paragraph";
			// @ts-expect-error 2322
			node.children = packages;

			return;
		}

		const renovateHeaderTwo = ["Package", "Update", "Change"];
		if (tableHeader?.every((h, i) => h === renovateHeaderTwo[i])) {
			const packages = node.children.slice(1).flatMap((row) => {
				const cells = row.children.map(({ children }) => children);
				const name = cells.shift();
				cells.shift();
				return [
					name,
					{ type: "text", value: ": " },
					...cells,
					{ type: "text", value: "\n" },
				]
					.filter((n) => n)
					.flat();
			});

			// @ts-expect-error 2322
			node.type = "paragraph";
			// @ts-expect-error 2322
			node.children = packages;

			return;
		}
	});

	// Remove renovate footer here
	visit(mdast, "heading", (node, index, parent) => {
		const firstChild = node.children[0];
		if (
			!(firstChild?.type === "text" && firstChild.value === "Configuration")
		) {
			return;
		}

		if (parent && typeof index === "number") {
			parent.children.splice(index);
		}
		return [SKIP, index];
	});

	return mdast;
}
