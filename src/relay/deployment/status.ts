import { send } from "../../discord/send.ts";
import { repoForumMap } from "../../index.ts";
import type { WebhookDeploymentStatusCreated } from "../../types/github.ts";
import { isIgnored, makeAuthorField } from "../utils.ts";

export async function relayDeployStatusChangeEvent({
	payload: { repository, deployment, deployment_status, sender },
}: {
	payload: WebhookDeploymentStatusCreated;
}) {
	if (isIgnored(repository)) {
		return;
	}

	if (deployment_status.state === "pending") {
		return;
	}
	if (deployment_status.state === "in_progress") {
		return;
	}

	await send({
		post: await repoForumMap.getOrCreatePost(repository),
		content: {
			title: `Deploy ${deployment_status.state}`,
			fields: [{ name: "environment", value: deployment.environment }],
			color: 0x9933ff,
			timestamp: new Date(deployment.created_at).toISOString(),
			...makeAuthorField(sender),
		},
	});
}
