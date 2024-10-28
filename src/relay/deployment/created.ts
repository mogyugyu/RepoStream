import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type { WebhookDeploymentCreated } from "../../types/github.ts";
import { isIgnored, makeAuthorField } from "../utils.ts";

export async function relayDeployCreatedEvent({
	payload: { deployment, repository, sender },
}: {
	payload: WebhookDeploymentCreated;
}) {
	if (isIgnored(repository)) {
		return;
	}

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: "Deploy started",
			fields: [{ name: "environment", value: deployment.environment }],
			color: 0x99ccff,
			timestamp: new Date(deployment.created_at).toISOString(),
			...makeAuthorField(sender),
		},
	});
}
