import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type { WebhookRepositoryCreated } from "../../types/github.ts";
import { isIgnored, makeAuthorField } from "../utils.ts";

export async function relayRepoCreateEvent({
	payload: { repository, sender },
}: {
	payload: WebhookRepositoryCreated;
}) {
	if (isIgnored(repository)) {
		return;
	}

	const title = (ctx: string): string => {
		const noModified = `New repository created: \`${ctx}\``;
		if (noModified.length <= 256) {
			return noModified;
		}

		return title(`${ctx.substring(0, 256 - title("").length - 3)}...`);
	};

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: title(repository.name),
			url: repository.html_url,
			description: repository.description ?? undefined,
			color: 0xffff99,
			fields: [
				{
					name: "Public",
					value: repository.private ? "No" : "Yes",
					inline: true,
				},
				{ name: "Fork", value: repository.fork ? "Yes" : "No", inline: true },
			],
			...makeAuthorField(sender),
		},
	});
}
