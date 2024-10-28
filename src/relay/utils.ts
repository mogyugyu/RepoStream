import type { APIEmbed } from "@discordjs/core";
import type { components } from "@octokit/openapi-webhooks-types";
import type { Link, Root, Text } from "mdast";
import { definitions } from "mdast-util-definitions";
import rehypeRaw from "rehype-raw";
import rehypeRemark from "rehype-remark";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkGitHub from "remark-github";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkSqueezeParagraphs from "remark-squeeze-paragraphs";
import remarkStringify from "remark-stringify";
import remarkStripBadges from "remark-strip-badges";
import { unified } from "unified";
import { SKIP, visit } from "unist-util-visit";
import { config } from "../index.ts";
import type { RepositoryWebhooks, WebhookPush } from "../types/github.ts";
import { getOrgConfigs } from "../utils.ts";

export const isIgnored = (
	repository: RepositoryWebhooks | WebhookPush["repository"],
): boolean => {
	if (repository.owner === null) {
		return false;
	}
	return (
		getOrgConfigs()
			?.get(repository.owner.login)
			?.ignoreRepositories?.includes(repository.name) ?? false
	);
};

export const githubToMention = ({
	id,
	login,
}: { id: number; login: string }) => {
	const developers = config.developers;
	const lookup =
		developers === undefined
			? undefined
			: Object.values(developers).find(({ githubId }) => githubId === id)
					?.discordId;
	return lookup ? `<@${lookup}>` : `\`${login}\``;
};

export function makeAuthorField(
	user: components["schemas"]["simple-user-webhooks"] | undefined,
): Pick<APIEmbed, "author"> | undefined {
	return user
		? {
				author: {
					name: user.login,
					// biome-ignore lint/style/useNamingConvention: <explanation>
					icon_url: user.avatar_url,
					url: user.html_url,
				},
			}
		: undefined;
}

const badges = [
	/^https?:\/\/dependabot-badges\.githubapp\.com/,
	/^https?:\/\/badges\.renovateapi\.com/,
] as const;

export function parseGitHubMarkdown(
	content: string,
	repository?: string,
): Root {
	// Parse GitHub Flavored Markdown (GFM) to mdast
	const preParser = unified()
		.use(remarkParse)
		.use(remarkStripBadges)
		.use(remarkSqueezeParagraphs)
		.use(remarkBreaks)
		.use(remarkGfm);

	if (repository) {
		preParser.use(remarkGitHub, { repository });
	}

	const preParsed = preParser.parse(content);

	// Remove html comment here
	visit(preParsed, "html", (node, index, parent) => {
		if (node.value.startsWith("<!--") && node.value.endsWith("-->")) {
			if (parent && typeof index === "number") {
				parent.children.splice(index, 1);
			}
			return [SKIP, index];
		}
	});

	// Remove dependabot/renovate badge here
	// Code was copied from remark-strip-badges
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
	visit(preParsed, (node, index, parent) => {
		const define = definitions(node);
		let remove = false;

		if (node.type === "link" || node.type === "linkReference") {
			const children = node.children;
			let offset = -1;

			while (++offset < children.length) {
				const child = children[offset];

				if (
					child?.type === "image" &&
					badges.some((badge) => badge.test(child.url))
				) {
					remove = true;
					break;
				}
			}
		} else if (
			node.type === "image" &&
			badges.some((badge) => badge.test(node.url))
		) {
			remove = true;
		} else if (node.type === "imageReference") {
			const def = define(node.identifier);
			if (def && badges.some((badge) => badge.test(def.url))) {
				remove = true;
			}
		}

		if (remove && parent && typeof index === "number") {
			parent.children.splice(index, 1);

			if (index === parent.children.length) {
				let tail = parent.children[index - 1];

				// If the remaining tail is a text.
				while (tail && tail.type === "text") {
					// biome-ignore lint/style/noParameterAssign:
					index--;

					// Remove trailing tabs and spaces.
					tail.value = tail.value.replace(/[ \t]+$/, "");

					// Remove the whole if it was whitespace only.
					if (!tail.value) {
						parent.children.splice(index, 1);
					}

					tail = parent.children[index - 1];
				}
			}

			return [SKIP, index];
		}
	});

	// Change task list behavior, task list will not be rendered as a list
	visit(preParsed, "list", (node) => {
		const replace = node.children
			// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
			.flatMap((child) => {
				if (child.checked === null || child.checked === undefined) {
					return null;
				}

				const grandChild = child.children[0];
				if (grandChild?.type !== "paragraph") {
					return null;
				}

				const grandGrandChild = grandChild.children[0];
				if (!grandGrandChild) {
					return null;
				}

				let result: (Link | Text)[] | Text | null;

				switch (grandGrandChild.type) {
					case "text":
						result = {
							type: "text",
							value: `${child.checked ? "✅" : "🔳"} ${grandGrandChild.value}\n`,
						};
						break;

					case "link":
						result = [
							{ type: "text", value: child.checked ? "✅ " : "🔳 " },
							{ ...grandGrandChild },
						];
						break;

					default:
						result = null;
						break;
				}

				return result;
			})
			.filter((ch): ch is Link | Text => ch !== null);

		if (replace.length === 0) {
			return;
		}
		// @ts-expect-error 2322
		node.type = "paragraph";
		// @ts-expect-error 2322
		node.children = replace.flatMap((r, i, a) => {
			if (i === 0) {
				return r;
			}

			if (r.type === "link" && a[i - 1]?.type === "link") {
				return [{ type: "text", value: "\n" }, r];
			}
			if (r.type === "text" && a[i - 1]?.type === "link") {
				return { ...r, value: `\n${r.value}` };
			}

			return r;
		});
	});

	// Build markdown from mdast, process with html5 tag support and build to markdow for the second time
	const processed = unified()
		.use(remarkParse)
		.use(remarkBreaks)
		.use(remarkGfm)
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeRemark)
		.use(remarkStringify)
		.processSync(
			unified()
				.use(remarkGfm)
				.use(remarkStringify)
				.stringify(preParsed)
				.replaceAll(/\n<br\s*\/>/g, ""),
		);

	// Lastly, parse final markdown
	const postParsed = unified().use(remarkParse).use(remarkGfm).parse(processed);

	// Change break in paragraph to newline(\n)
	visit(postParsed, "paragraph", (node) => {
		node.children = node.children.map((child) => {
			if (child.type !== "break") {
				return child;
			}
			return { type: "text", value: "\n", position: child.position };
		});
	});

	/**
	 * [Workaround]
	 * Normal blockquote rendered on Discord looks ugly,
	 * thus change `>` from every line to multiline blockquote `>>>`
	 */
	visit(postParsed, "blockquote", (node) => {
		const cleanBlockQuote = unified()
			.use(remarkGfm)
			.use(remarkStringify, { bullet: "-", bulletOther: "+", rule: "-" })
			.stringify({ type: "root", children: [node] })
			.split("\n")
			.map((s) => s.replace(/^>/, "").trim())
			.join("\n");

		// A workaround to insert "newline" node so that it looks perfect inside "paragraph" node
		const parsedCleanBlockQuote = unified()
			.use(remarkParse)
			.parse(cleanBlockQuote)
			.children.flatMap((c, i, a) => {
				// biome-ignore lint/performance/noDelete: <explanation>
				delete c.position;
				const newLine = { type: "text", value: "\n" };
				const arr = [c];
				if (a.length - 1 !== i) {
					// @ts-expect-error 2345
					arr.push(newLine);
				}
				if (c.type === "heading") {
					// @ts-expect-error 2345
					arr.push(newLine);
					if (i !== 0 && a[i - 1]?.type !== "heading") {
						// @ts-expect-error 2345
						arr.unshift(newLine);
					}
				}
				return arr;
			});

		// @ts-expect-error 2322
		node.type = "paragraph";
		node.children = [
			// @ts-expect-error 2322
			{ type: "text", value: ">>> ", depth: 2 },
			// @ts-expect-error 2322
			...parsedCleanBlockQuote,
		];
	});

	return postParsed;
}

export function stringifyMarkdown(mdast: Root): string {
	return unified()
		.use(remarkGfm)
		.use(remarkStringify, { bullet: "-", bulletOther: "+", rule: "-" })
		.stringify(mdast)
		.replaceAll("<!---->\n\n", "")
		.replaceAll("\\[", "[")
		.replaceAll("\\>>>", ">>>")
		.replaceAll(/^\+ (.+)$/gm, "- $1")
		.trim();
}
