import type { APIEmbedField } from "@discordjs/core";
import type { WebhooksLabel } from "../../types/github.ts";
import { githubToMention } from "../utils.ts";

export function toAssigneesField(
	assignees: ({
		id: number;
		login: string;
	} | null)[],
): APIEmbedField {
	return {
		name: "Assignees",
		value: assignees
			.filter((assignee) => assignee !== null)
			.map(githubToMention)
			.join(", "),
	};
}

export function toMilestoneField(
	// biome-ignore lint/style/useNamingConvention: <explanation>
	milestone: { title: string; html_url: string },
): APIEmbedField {
	return {
		name: "Milestone",
		value: `[${milestone.title}](${milestone.html_url})`,
		inline: true,
	};
}

export function toLabelsField(labels: (WebhooksLabel | null)[]): APIEmbedField {
	return {
		name: "Labels",
		value: labels
			.filter((label) => label !== null)
			.map(({ name }) => `\`${name}\``)
			.join(", "),
		inline: true,
	};
}
