import {
	type APIGuildForumChannel,
	type APIThreadChannel,
	ChannelFlags,
	ChannelType,
	ForumLayoutType,
	SortOrderType,
	ThreadAutoArchiveDuration,
} from "@discordjs/core";
import moize from "moize/mjs/index.mjs";
import { client, config, queue } from "../index.ts";
import type { RepositoryWebhooks } from "../types/github.ts";
import { forumCollection } from "./caches.ts";

const getOrCreateForum = async ({
	name,
}: { name: string }): Promise<APIGuildForumChannel> => {
	const channels = await client.api.guilds.getChannels(config.guildId);
	const channel =
		config.categoryId == null
			? (channels.find(
					(ch) =>
						ch.name === name &&
						ch.type === ChannelType.GuildForum &&
						ch.parent_id == null,
				) as APIGuildForumChannel | undefined)
			: (channels.find(
					(ch) =>
						ch.name === name &&
						ch.type === ChannelType.GuildForum &&
						ch.parent_id === config.categoryId,
				) as APIGuildForumChannel | undefined);
	if (channel !== undefined) {
		return channel;
	}
	return (await client.api.guilds.createChannel(config.guildId, {
		name: name,
		type: ChannelType.GuildForum,
		topic: `https://github.com/${name}`,
		// biome-ignore lint/style/useNamingConvention: <explanation>
		parent_id: config.categoryId,
		// biome-ignore lint/style/useNamingConvention: <explanation>
		default_auto_archive_duration: ThreadAutoArchiveDuration.OneWeek,
		// biome-ignore lint/style/useNamingConvention: <explanation>
		default_sort_order: SortOrderType.LatestActivity,
		// biome-ignore lint/style/useNamingConvention: <explanation>
		default_forum_layout: ForumLayoutType.ListView,
	})) as APIGuildForumChannel;
};

export const memoizedGetOrCreateForum = moize.infinite(getOrCreateForum, {
	isDeepEqual: true,
	isPromise: true,
});

/**
 * don't memoize
 */
const getPosts = async ({
	ownerName,
}: { ownerName: string }): Promise<{
	forum: APIGuildForumChannel;
	posts: APIThreadChannel[];
}> => {
	const forum =
		forumCollection.find((forum) => forum.name === ownerName) ??
		(await memoizedGetOrCreateForum({ name: ownerName }));

	const activePosts = (
		await client.api.guilds.getActiveThreads(config.guildId)
	).threads.filter(
		(thread) =>
			thread.type === ChannelType.PublicThread && thread.parent_id === forum.id,
	) as APIThreadChannel[];
	const archivedPosts = (
		await client.api.channels.getArchivedThreads(forum.id, "public")
	).threads as APIThreadChannel[];
	return { forum: forum, posts: activePosts.concat(archivedPosts) };
};

export const getOrCreateOrgPost = async ({ orgName }: { orgName: string }) => {
	await queue.wait();
	try {
		const { forum, posts } = await getPosts({ ownerName: orgName });
		const post = posts.find(({ name }) => name === `${orgName} Organization`);
		if (post !== undefined) {
			return post;
		}

		return client.api.channels
			.createForumThread(forum.id, {
				name: `${orgName} Organization`,
				message: {
					embeds: [
						{
							title: `${orgName} Organization`,
							url: `https://github.com/${orgName}`,
							description: `Update of ${orgName} Organization`,
							color: Number.parseInt(config.orgColor.slice(1), 16),
						},
					],
				},
			})
			.then(
				(post) =>
					client.api.channels.edit(post.id, {
						flags: ChannelFlags.Pinned,
					}) as unknown as APIThreadChannel,
			);
	} finally {
		queue.shift();
	}
};

export const getOrCreatePost = async (
	{
		ownerName,
		repoName,
	}: {
		ownerName: string;
		repoName: string;
	},
	repo: RepositoryWebhooks,
) => {
	await queue.wait();
	try {
		const { forum, posts } = await getPosts({ ownerName });
		const post = posts.find(({ name }) => name === repoName);
		if (post !== undefined) {
			return post;
		}

		return client.api.channels.createForumThread(forum.id, {
			name: repoName,
			message: {
				embeds: [
					{
						title: repo.name.substring(0, 256),
						url: repo.html_url,
						description: repo.description?.substring(0, 4096) ?? undefined,
						color: Number.parseInt(config.orgColor.slice(1), 16),
						fields: [
							{
								name: "Public",
								value: repo.private ? "No" : "Yes",
								inline: true,
							},
							{ name: "Fork", value: repo.fork ? "Yes" : "No", inline: true },
						],
					},
				],
			},
		});
	} finally {
		queue.shift();
	}
};

export const getPost = async ({
	ownerName,
	repoName,
}: {
	ownerName: string;
	repoName: string;
}) => {
	await queue.wait();
	try {
		const { posts } = await getPosts({ ownerName });
		const post = posts.find(({ name }) => name === repoName);
		return post;
	} finally {
		queue.shift();
	}
};
