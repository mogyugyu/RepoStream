import type { APIEmbedField } from "@discordjs/core";
import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type {
	WebhookPullRequestClosed,
	WebhookPullRequestOpened,
	WebhookPullRequestReopened,
} from "../../types/github.ts";
import {
	toAssigneesField,
	toLabelsField,
	toMilestoneField,
} from "../issues/utils.ts";
import {
	githubToMention,
	isIgnored,
	makeAuthorField,
	parseGitHubMarkdown,
	stringifyMarkdown,
} from "../utils.ts";
import { modifyRenovateComment, removeDependabotFooter } from "./utils.ts";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: <explanation>
export async function relayPrOpenAndCloseEvent({
	payload: { repository, sender, pull_request, action },
}: {
	payload:
		| WebhookPullRequestClosed
		| WebhookPullRequestOpened
		| WebhookPullRequestReopened;
}) {
	if (isIgnored(repository)) {
		return;
	}

	let color: number | undefined;
	const fields: APIEmbedField[] = [
		{
			name: "Additions",
			value: `${pull_request.additions} Line${pull_request.additions === 1 ? "" : "s"}`,
			inline: true,
		},
		{
			name: "Deletions",
			value: `${pull_request.deletions} Line${pull_request.deletions === 1 ? "" : "s"}`,
			inline: true,
		},
		{
			name: "Changed Files",
			value: `${pull_request.changed_files} File${pull_request.changed_files === 1 ? "" : "s"}`,
			inline: true,
		},
	];

	if (action === "closed") {
		color = pull_request.merged ? 0x8957e5 : 0xda3633;
		fields.push({
			name: "Merged",
			value: pull_request.merged ? "Yes" : "No",
			inline: true,
		});
	} else {
		color = pull_request.draft ? 0x6e7681 : 0x238636;
		fields.push({
			name: "Draft",
			value: pull_request.draft ? "Yes" : "No",
			inline: true,
		});
	}
	if (pull_request.labels.length > 0) {
		fields.push(toLabelsField(pull_request.labels));
	}
	if (pull_request.milestone) {
		fields.push(toMilestoneField(pull_request.milestone));
	}
	if (pull_request.assignees != null && pull_request.assignees.length > 0) {
		fields.push(toAssigneesField(pull_request.assignees));
	}
	if (
		pull_request.requested_reviewers != null &&
		pull_request.requested_reviewers.length > 0
	) {
		fields.push({
			name: "Reviewers",
			value: pull_request.requested_reviewers.map(githubToMention).join(", "),
		});
	}

	const title = (ctx: string): string => {
		const noModified = `${pull_request.draft ? "Draft " : ""} PR #${pull_request.number} ${
			pull_request.merged ? "merged" : action
		}: \`${ctx}\``;
		if (noModified.length <= 256) {
			return noModified;
		}

		return title(`${ctx.substring(0, 256 - title("").length - 3)}...`);
	};

	let description = pull_request.body
		? parseGitHubMarkdown(pull_request.body, repository.full_name)
		: undefined;
	if (description) {
		// TODO: support self hosted apps
		if (pull_request.user.login === "dependabot[bot]") {
			description = removeDependabotFooter(description);
		}
		if (pull_request.user.login === "renovate[bot]") {
			description = modifyRenovateComment(description);
		}
	}

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: title(pull_request.title.replace(/`/g, "\\`")),
			description: description ? stringifyMarkdown(description) : undefined,
			url: pull_request.html_url,
			color,
			fields,
			...makeAuthorField(sender),
		},
	});
}
