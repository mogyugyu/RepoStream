import { send } from "../discord/send.ts";
import { repoForumMap } from "../index.ts";
import type {
	WebhookOrganizationMemberAdded,
	WebhookOrganizationMemberInvited,
	WebhookOrganizationMemberRemoved,
} from "../types/github.ts";
import { makeAuthorField } from "./utils.ts";

export async function relayOrgMemberInvitedEvent({
	payload: { invitation, sender, organization },
}: {
	payload: WebhookOrganizationMemberInvited;
}) {
	await send({
		post: await repoForumMap.getOrCreateOrgPost(organization),
		content: {
			title: `New member invited: \`${invitation.login}\``.substring(0, 256),
			color: 0x9933cc,
			...makeAuthorField(sender),
		},
	});
}

export async function relayOrgMemberJoinEvent({
	payload: { sender, membership, organization },
}: {
	payload: WebhookOrganizationMemberAdded;
}) {
	await send({
		post: await repoForumMap.getOrCreateOrgPost(organization),
		content: {
			title: `New member joined: \`${membership.user?.login}\``.substring(
				0,
				256,
			),
			color: 0x993399,
			fields: [
				{ name: "id", value: `${membership.user?.id}` },
				{ name: "role", value: `${membership.role}` },
			],
			...makeAuthorField(sender),
		},
	});
}

export async function relayOrgMemberLeftEvent({
	payload: { sender, membership, organization },
}: {
	payload: WebhookOrganizationMemberRemoved;
}) {
	await send({
		post: await repoForumMap.getOrCreateOrgPost(organization),
		content: {
			title: `Member left/kicked: \`${membership.user?.login}\``.substring(
				0,
				256,
			),
			color: 0x993366,
			...makeAuthorField(sender),
		},
	});
}
