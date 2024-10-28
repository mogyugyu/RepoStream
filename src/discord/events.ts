import {
	ChannelType,
	type GatewayChannelCreateDispatchData,
	type GatewayChannelDeleteDispatchData,
	type GatewayChannelUpdateDispatchData,
	type GatewayGuildCreateDispatchData,
	type GatewayThreadDeleteDispatchData,
	type GatewayThreadUpdateDispatchData,
	type ToEventProps,
} from "@discordjs/core";
import { config, repoForumMap } from "../index.ts";
import { forumCollection } from "./caches.ts";
import { memoizedGetOrCreateForum } from "./getOrCreate.ts";

export const onGuildCreate = ({
	data,
}: ToEventProps<GatewayGuildCreateDispatchData>) => {
	const forums = data.channels
		.filter((channel) => channel.type === ChannelType.GuildForum)
		.filter(
			(forumChannel) => (forumChannel.parent_id ?? null) === config.categoryId,
		);
	for (const forum of forums) {
		forumCollection.set(forum.id, forum);
	}
};

export const onChannelCreate = ({
	data,
}: ToEventProps<GatewayChannelCreateDispatchData>) => {
	if (
		data.type !== ChannelType.GuildForum ||
		(data.parent_id ?? null) !== config.categoryId
	) {
		return;
	}
	forumCollection.set(data.id, data);
};

export const onChannelUpdate = ({
	data,
}: ToEventProps<GatewayChannelUpdateDispatchData>) => {
	// FIXME
	repoForumMap.delete(forumCollection.get(data.id)?.name ?? "");

	if (
		data.type !== ChannelType.GuildForum ||
		(!forumCollection.has(data.id) &&
			(data.parent_id ?? null) !== config.categoryId)
	) {
		return;
	}
	if ((data.parent_id ?? null) !== config.categoryId) {
		forumCollection.delete(data.id);
		return;
	}
	forumCollection.set(data.id, data);
};

export const onChannelDelete = ({
	data,
}: ToEventProps<GatewayChannelDeleteDispatchData>) => {
	if (data.type !== ChannelType.GuildForum) {
		return;
	}
	memoizedGetOrCreateForum.remove([{ name: data.name }]);
	forumCollection.delete(data.id);
	repoForumMap.delete(data.name);
};

export const onThreadUpdate = ({
	data,
}: ToEventProps<GatewayThreadUpdateDispatchData>) => {
	if (data.parent_id == null) {
		return;
	}
	const forumName = forumCollection.get(data.parent_id)?.name;
	if (forumName === undefined) {
		return;
	}
	// FIXME
	repoForumMap.delete(forumName);
};

export const onThreadDelete = ({
	data,
}: ToEventProps<GatewayThreadDeleteDispatchData>) => {
	const forumName = forumCollection.get(data.parent_id)?.name;
	if (forumName === undefined) {
		return;
	}
	// FIXME
	repoForumMap.delete(forumName);
};
