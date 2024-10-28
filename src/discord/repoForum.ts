import { Collection } from "@discordjs/collection";
import moize from "moize/mjs/index.mjs";
import type {
	OrganizationSimpleWebhooks,
	RepositoryWebhooks,
} from "../types/github.ts";
import { getOrCreateOrgPost, getOrCreatePost } from "./getOrCreate.ts";

class RepoForum {
	public memoizedGetOrCreateOrgPost;
	public memoizedGetOrCreatePost;

	constructor() {
		this.memoizedGetOrCreateOrgPost = moize.infinite(getOrCreateOrgPost, {
			isDeepEqual: true,
			isPromise: true,
		});
		this.memoizedGetOrCreatePost = moize.infinite(getOrCreatePost, {
			isDeepEqual: true,
			isPromise: true,
			maxArgs: 1,
		});
	}
}

/**
 * key: ownerName
 * value: RepoForum
 */
export class RepoForumMap extends Collection<string, RepoForum> {
	setRepoForum(name: string) {
		const repoForum = new RepoForum();
		this.set(name, repoForum);
		return repoForum;
	}
	getOrCreatePost(repository: RepositoryWebhooks) {
		const ownerName = repository.owner.login;

		const repoForum = this.get(ownerName) ?? this.setRepoForum(ownerName);
		return repoForum.memoizedGetOrCreatePost(
			{ ownerName, repoName: repository.name },
			repository,
		);
	}
	getOrCreateOrgPost(org: OrganizationSimpleWebhooks) {
		const orgName = org.login;

		const repoForum = this.get(orgName) ?? this.setRepoForum(orgName);
		return repoForum.memoizedGetOrCreateOrgPost({ orgName });
	}
}
