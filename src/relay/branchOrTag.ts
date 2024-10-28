import type { EmitterWebhookEventName } from "@octokit/webhooks";
import { send } from "../discord/send.ts";
import { repoForumMap } from "../index.ts";
import type { WebhookCreate, WebhookDelete } from "../types/github.ts";
import { isIgnored, makeAuthorField } from "./utils.ts";

export async function relayBranchOrTagCreateEvent({
	payload: { repository, sender, ref_type, ref },
}: {
	name: EmitterWebhookEventName;
	payload: WebhookCreate;
}) {
	if (isIgnored(repository)) {
		return;
	}

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: `New ${ref_type} created: ${ref}`,
			color: 0xccffff,
			url: `${repository.html_url}/tree/${ref}`,
			...makeAuthorField(sender),
		},
	});
}

export async function relayBranchOrTagDeleteEvent({
	payload: { repository, sender, ref_type, ref },
}: {
	name: EmitterWebhookEventName;
	payload: WebhookDelete;
}) {
	if (isIgnored(repository)) {
		return;
	}

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: `${ref_type.charAt(0).toUpperCase()}${ref_type.slice(1)} deleted: ${ref}`,
			color: 0xcc3300,
			...makeAuthorField(sender),
		},
	});
}
