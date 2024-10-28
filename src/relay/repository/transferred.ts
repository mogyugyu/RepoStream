import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type { WebhookRepositoryTransferred } from "../../types/github.ts";
import { isIgnored, makeAuthorField } from "../utils.ts";

export async function relayRepoTransferredEvent({
	payload: { repository, changes, sender },
}: {
	payload: WebhookRepositoryTransferred;
}) {
	if (isIgnored(repository)) {
		return;
	}

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: "Repository transferred",
			url: repository.html_url,
			description: repository.description ?? undefined,
			color: 0x999900,
			fields: [
				{
					name: "Public",
					value: repository.private ? "No" : "Yes",
					inline: true,
				},
				{ name: "Fork", value: repository.fork ? "Yes" : "No", inline: true },
				{
					name: "Old Owner",
					value: changes.owner.from.user
						? `[${changes.owner.from.user.login}](${changes.owner.from.user.html_url})`
						: "unknown",
				},
			],
			...makeAuthorField(sender),
		},
	});
}
