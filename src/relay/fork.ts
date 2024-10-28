import { send } from "../discord/send.ts";
import { repoForumMap } from "../index.ts";
import type { WebhookFork } from "../types/github.ts";
import { isIgnored, makeAuthorField } from "./utils.ts";

export async function relayForkEvent({
	payload: { repository, forkee, sender },
}: { payload: WebhookFork }) {
	if (isIgnored(repository)) {
		return;
	}

	const title = (ctx: string): string => {
		const noModified = `Fork created: \`${ctx}\``;
		if (noModified.length <= 256) {
			return noModified;
		}

		return title(`${ctx.substring(0, 256 - title("").length - 3)}...`);
	};

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: title(forkee.name),
			url: forkee.html_url,
			color: 0x339999,
			timestamp: new Date(forkee.created_at).toISOString(),
			...makeAuthorField(sender),
		},
	});
}
