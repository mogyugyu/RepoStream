import { Collection } from "@discordjs/collection";
import type { APIGuildForumChannel, Snowflake } from "@discordjs/core";

export const forumCollection = new Collection<
	Snowflake,
	APIGuildForumChannel
>();
