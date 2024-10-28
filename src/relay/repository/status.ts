import { renamePost } from "../../discord/rename.ts";
import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type {
	WebhookRepositoryArchived,
	WebhookRepositoryDeleted,
	WebhookRepositoryPrivatized,
	WebhookRepositoryPublicized,
	WebhookRepositoryRenamed,
	WebhookRepositoryUnarchived,
} from "../../types/github.ts";
import { isIgnored, makeAuthorField } from "../utils.ts";

export async function relayRepoStatusChangedEvent({
	payload,
}: {
	payload:
		| WebhookRepositoryArchived
		| WebhookRepositoryDeleted
		| WebhookRepositoryPrivatized
		| WebhookRepositoryPublicized
		| WebhookRepositoryRenamed
		| WebhookRepositoryUnarchived;
}) {
	if (isIgnored(payload.repository)) {
		return;
	}

	let color: number | undefined;
	if (payload.action === "deleted") {
		color = 0xff6666;
	}
	if (payload.action === "privatized") {
		color = 0xcc9966;
	}
	if (payload.action === "publicized") {
		color = 0x00ffcc;
	}
	if (payload.action === "renamed") {
		color = 0xffcc66;
	}
	if (payload.action === "archived") {
		color = 0x660099;
	}
	if (payload.action === "unarchived") {
		color = 0x6600ff;
	}

	if (payload.action === "renamed") {
		renamePost(payload);
	}

	await send({
		post: await repoForumMap.getOrCreatePost(payload.repository),
		content: {
			title: `Repository ${payload.action}`,
			color,
			...makeAuthorField(payload.sender),
		},
	});
}
