import type { APIEmbed, APIThreadChannel } from "@discordjs/core";
import { client } from "../index.ts";

export const send = ({
	post,
	content,
}: { post: APIThreadChannel; content: APIEmbed }) => {
	return client.api.channels.createMessage(post.id, { embeds: [content] });
};
