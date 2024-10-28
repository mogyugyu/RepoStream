import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type { WebhookPullRequestReviewSubmitted } from "../../types/github.ts";
import {
	isIgnored,
	makeAuthorField,
	parseGitHubMarkdown,
	stringifyMarkdown,
} from "../utils.ts";

export async function relayPrReviewSubmitEvent({
	payload: { repository, pull_request, action, sender, review },
}: {
	payload: WebhookPullRequestReviewSubmitted;
}) {
	if (isIgnored(repository)) {
		return;
	}

	const title = (ctx: string): string => {
		const noModified = `PR #${pull_request.number} review ${action}: \`${ctx}\``;
		if (noModified.length <= 256) {
			return noModified;
		}

		return title(`${ctx.substring(0, 256 - title("").length - 3)}...`);
	};

	let color: number | undefined;
	if (review.state === "changes_requested") {
		color = 0xf85149;
	}
	if (review.state === "approved") {
		color = 0x99ff33;
	}
	if (review.state === "commented") {
		color = 0x99cc99;
	}

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: title(pull_request.title.replace(/`/g, "\\`")),
			url: pull_request.html_url,
			description: review.body
				? stringifyMarkdown(
						parseGitHubMarkdown(review.body, repository.full_name),
					)
				: undefined,
			color,
			fields: [
				{
					name: "State",
					value:
						`${review.state.charAt(0).toUpperCase()}${review.state.slice(1)}`
							.split("_")
							.join(" "),
				},
			],
			...makeAuthorField(sender),
		},
	});
}
