import { client, repoForumMap } from "../index.ts";
import type { WebhookRepositoryRenamed } from "../types/github.ts";
import { getPost } from "./getOrCreate.ts";

// TODO: webhook-organization-renamed
export const renameForum = () => {
	return;
};

export const renamePost = async (payload: WebhookRepositoryRenamed) => {
	const ownerName = payload.repository.owner.login;
	const repoName = payload.changes.repository.name.from;
	const post = await getPost({
		ownerName,
		repoName,
	});
	if (post === undefined) {
		return;
	}

	await client.api.channels.edit(post.id, {
		name: payload.repository.name,
	});
	// FIXME
	repoForumMap.delete(ownerName);
};
