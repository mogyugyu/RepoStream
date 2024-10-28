import { createServer } from "node:http";
import {
	Client,
	GatewayDispatchEvents,
	GatewayIntentBits,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";
import { WebSocketManager } from "@discordjs/ws";
import { Webhooks, createNodeMiddleware } from "@octokit/webhooks";
import { AsyncQueue } from "@sapphire/async-queue";
import { parse as tomlParse } from "smol-toml";
import {
	onChannelCreate,
	onChannelDelete,
	onChannelUpdate,
	onGuildCreate,
	onThreadDelete,
	onThreadUpdate,
} from "./discord/events.ts";
import { RepoForumMap } from "./discord/repoForum.ts";
import {
	relayBranchOrTagCreateEvent,
	relayBranchOrTagDeleteEvent,
} from "./relay/branchOrTag.ts";
import { relayDeployCreatedEvent } from "./relay/deployment/created.ts";
import { relayDeployStatusChangeEvent } from "./relay/deployment/status.ts";
import { relayForkEvent } from "./relay/fork.ts";
import { relayIssueCommentEvent } from "./relay/issues/comments.ts";
import { relayIssueOpenAndCloseEvent } from "./relay/issues/openAndClose.ts";
import {
	relayOrgMemberInvitedEvent,
	relayOrgMemberJoinEvent,
	relayOrgMemberLeftEvent,
} from "./relay/organization.ts";
import { relayPrOpenAndCloseEvent } from "./relay/pullRequest/openAndClose.ts";
import { relayPrReviewSubmitEvent } from "./relay/pullRequest/review.ts";
import { relayPushEvent } from "./relay/push.ts";
import { relayReleasePublishedEvent } from "./relay/release.ts";
import { relayRepoCreateEvent } from "./relay/repository/create.ts";
import { relayRepoStatusChangedEvent } from "./relay/repository/status.ts";
import { relayRepoTransferredEvent } from "./relay/repository/transferred.ts";
import { configParser } from "./valibot.ts";

export const queue = new AsyncQueue();

const tokenPath = process.env.REPOSTREAM_TOKEN_PATH ?? "./repostream-token.txt";
const secretPath =
	process.env.REPOSTREAM_SECRET_PATH ?? "./repostream-secret.txt";
const configPath = process.env.REPOSTREAM_CONFIG_PATH ?? "./repostreamrc.toml";

const token = (await Bun.file(tokenPath).text()).trim();
const secret = (await Bun.file(secretPath).text()).trim();
export const config = configParser(
	tomlParse(await Bun.file(configPath).text()),
);
export const repoForumMap = new RepoForumMap();

// Create REST and WebSocket managers directly
const rest = new REST({ version: "10" }).setToken(token);

const gateway = new WebSocketManager({
	token: token,
	intents: GatewayIntentBits.Guilds,
	rest,
});

// Create a client to emit relevant events.
export const client = new Client({ rest, gateway });

// Listen for the ready event
client.once(GatewayDispatchEvents.Ready, ({ data: readyData }) => {
	console.info(
		`Ready! - ${readyData.user.username}#${readyData.user.discriminator}`,
	);
});

client.on(GatewayDispatchEvents.GuildCreate, onGuildCreate);
client.on(GatewayDispatchEvents.ChannelCreate, onChannelCreate);
client.on(GatewayDispatchEvents.ChannelUpdate, onChannelUpdate);
client.on(GatewayDispatchEvents.ChannelDelete, onChannelDelete);
client.on(GatewayDispatchEvents.ThreadUpdate, onThreadUpdate);
client.on(GatewayDispatchEvents.ThreadDelete, onThreadDelete);

function shutdown() {
	(gateway.destroy() as Promise<void>).then(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start the WebSocket connection.
gateway.connect();

const webhooks = new Webhooks({
	secret,
});

webhooks.on("create", relayBranchOrTagCreateEvent);
webhooks.on("delete", relayBranchOrTagDeleteEvent);
webhooks.on("deployment.created", relayDeployCreatedEvent);
webhooks.on("deployment_status.created", relayDeployStatusChangeEvent);
webhooks.on("fork", relayForkEvent);

// --sourcemap error
webhooks.on("issue_comment.created", relayIssueCommentEvent);
webhooks.on("issues.opened", relayIssueOpenAndCloseEvent);
webhooks.on("issues.closed", relayIssueOpenAndCloseEvent);
webhooks.on("issues.reopened", relayIssueOpenAndCloseEvent);
webhooks.on("pull_request.opened", relayPrOpenAndCloseEvent);
webhooks.on("pull_request.closed", relayPrOpenAndCloseEvent);
webhooks.on("pull_request.reopened", relayPrOpenAndCloseEvent);
webhooks.on("pull_request_review.submitted", relayPrReviewSubmitEvent);
webhooks.on("push", relayPushEvent);

webhooks.on("organization.member_invited", relayOrgMemberInvitedEvent);
webhooks.on("organization.member_added", relayOrgMemberJoinEvent);
webhooks.on("organization.member_removed", relayOrgMemberLeftEvent);

// --sourcemap error
webhooks.on("release.published", relayReleasePublishedEvent);

webhooks.on("repository.created", relayRepoCreateEvent);
webhooks.on("repository.deleted", relayRepoStatusChangedEvent);
webhooks.on("repository.renamed", relayRepoStatusChangedEvent);
webhooks.on("repository.transferred", relayRepoTransferredEvent);
webhooks.on("repository.archived", relayRepoStatusChangedEvent);
webhooks.on("repository.unarchived", relayRepoStatusChangedEvent);
webhooks.on("repository.privatized", relayRepoStatusChangedEvent);
webhooks.on("repository.publicized", relayRepoStatusChangedEvent);

createServer(createNodeMiddleware(webhooks)).listen(3000);
