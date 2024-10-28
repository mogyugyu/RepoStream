import { send } from "../discord/send.ts";
import { repoForumMap } from "../index.ts";
import type { RepositoryWebhooks, WebhookPush } from "../types/github.ts";
import {
	isIgnored,
	makeAuthorField,
	parseGitHubMarkdown,
	stringifyMarkdown,
} from "./utils.ts";

export async function relayPushEvent({
	payload: { repository, sender, forced, commits, compare, ref },
}: {
	payload: WebhookPush;
}) {
	if (repository.owner === null || isIgnored(repository)) {
		return;
	}
	if (commits.length === 0) {
		return;
	}

	await send({
		// HACK: 型に背きます、ごめんなさい
		post: await repoForumMap.getOrCreatePost(repository as RepositoryWebhooks),
		content: {
			title: `${commits.length} new commit${commits.length === 1 ? "" : "s"} in ${ref.replace(
				"refs/heads/",
				"",
			)}`,
			url: compare,
			description: stringifyMarkdown(
				parseGitHubMarkdown(
					commits
						.map(({ id, url, message, author }) => {
							const summary = message.split("\n")[0] ?? "";

							return `[\`${id.slice(0, 7)}\`](${url}) ${
								summary.length > 50 ? `${summary.slice(0, 50)}...` : summary
							} - ${author.name}`;
						})
						.join("\n"),
					repository.full_name,
				),
			),
			color: 0x7fffd4,
			fields: [{ name: "Forced", value: forced ? "Yes" : "No" }],
			...makeAuthorField(sender),
		},
	});
}
