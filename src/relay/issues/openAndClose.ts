import type { APIEmbedField } from "@discordjs/core";
import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type {
	WebhookIssuesClosed,
	WebhookIssuesOpened,
	WebhookIssuesReopened,
} from "../../types/github.ts";
import {
	isIgnored,
	makeAuthorField,
	parseGitHubMarkdown,
	stringifyMarkdown,
} from "../utils.ts";
import { toAssigneesField, toLabelsField, toMilestoneField } from "./utils.ts";

export async function relayIssueOpenAndCloseEvent({
	payload: { repository, sender, issue, action },
}: {
	payload: WebhookIssuesClosed | WebhookIssuesOpened | WebhookIssuesReopened;
}) {
	if (isIgnored(repository)) {
		return;
	}

	const fields: APIEmbedField[] = [];

	if (issue.labels !== undefined && issue.labels.length > 0) {
		fields.push(toLabelsField(issue.labels));
	}
	if (issue.milestone) {
		fields.push(toMilestoneField(issue.milestone));
	}
	if (issue.assignees.length > 0) {
		fields.push(toAssigneesField(issue.assignees));
	}

	const title = (ctx: string): string => {
		const noModified = `Issue #${issue.number} ${action}: \`${ctx}\``;
		if (noModified.length <= 256) {
			return noModified;
		}

		return title(`${ctx.substring(0, 256 - title("").length - 3)}...`);
	};

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: title(issue.title.replace(/`/g, "\\`")),
			description: issue.body
				? stringifyMarkdown(
						parseGitHubMarkdown(issue.body, repository.full_name),
					)
				: undefined,
			url: issue.html_url,
			color: action === "closed" ? 0x6e7681 : 0x238636,
			fields,
			...makeAuthorField(sender),
		},
	});
}
