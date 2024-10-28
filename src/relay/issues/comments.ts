import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type { WebhookIssueCommentCreated } from "../../types/github.ts";
import {
	isIgnored,
	makeAuthorField,
	parseGitHubMarkdown,
	stringifyMarkdown,
} from "../utils.ts";

export async function relayIssueCommentEvent({
	payload: { repository, sender, issue, comment },
}: {
	payload: WebhookIssueCommentCreated;
}) {
	if (isIgnored(repository)) {
		return;
	}

	const title = (ctx: string): string => {
		const noModified = `New comment on issue #${issue.number}: \`${ctx}\``;
		if (noModified.length <= 256) {
			return noModified;
		}

		return title(`${ctx.substring(0, 256 - title("").length - 3)}...`);
	};

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: title(issue.title.replace(/`/g, "\\`")),
			description: stringifyMarkdown(
				parseGitHubMarkdown(comment.body, repository.full_name),
			),
			url: comment.html_url,
			color: 0x336666,
			timestamp: new Date(comment.created_at).toISOString(),
			...makeAuthorField(sender),
		},
	});
}
