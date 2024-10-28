import { send } from "../discord/send.ts";
import { repoForumMap } from "../index.ts";
import type { WebhookReleasePublished } from "../types/github.ts";
import {
	isIgnored,
	makeAuthorField,
	parseGitHubMarkdown,
	stringifyMarkdown,
} from "./utils.ts";

export async function relayReleasePublishedEvent({
	payload: { release, repository, sender },
}: {
	payload: WebhookReleasePublished;
}) {
	if (isIgnored(repository)) {
		return;
	}

	const title = (ctx: string): string => {
		const noModified = `New release published: \`${ctx}\``;
		if (noModified.length <= 256) {
			return noModified;
		}

		return title(`${ctx.substring(0, 256 - title("").length - 3)}...`);
	};

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: title(release.name?.replace(/`/g, "\\`") ?? ""),
			url: release.html_url,
			description: stringifyMarkdown(
				parseGitHubMarkdown(release.body ?? "", repository.full_name),
			),
			color: 0x00ffcc,
			timestamp: new Date(release.published_at ?? "").toISOString(),
			fields: [
				{
					name: "Pre-release",
					value: release.prerelease ? "Yes" : "No",
					inline: true,
				},
			],
			...makeAuthorField(sender),
		},
	});
}
