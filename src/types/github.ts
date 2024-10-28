import type { components } from "@octokit/openapi-webhooks-types";

export type WebhooksLabel = components["schemas"]["webhooks_label"];
export type RepositoryWebhooks = components["schemas"]["repository-webhooks"];
export type OrganizationSimpleWebhooks =
	components["schemas"]["organization-simple-webhooks"];

export type WebhookDeploymentCreated =
	components["schemas"]["webhook-deployment-created"];
export type WebhookDeploymentStatusCreated =
	components["schemas"]["webhook-deployment-status-created"];

export type WebhookIssueCommentCreated =
	components["schemas"]["webhook-issue-comment-created"];
export type WebhookIssuesClosed =
	components["schemas"]["webhook-issues-closed"];
export type WebhookIssuesOpened =
	components["schemas"]["webhook-issues-opened"];
export type WebhookIssuesReopened =
	components["schemas"]["webhook-issues-reopened"];

export type WebhookPullRequestClosed =
	components["schemas"]["webhook-pull-request-closed"];
export type WebhookPullRequestOpened =
	components["schemas"]["webhook-pull-request-opened"];
export type WebhookPullRequestReopened =
	components["schemas"]["webhook-pull-request-reopened"];
export type WebhookPullRequestReviewSubmitted =
	components["schemas"]["webhook-pull-request-review-submitted"];

export type WebhookRepositoryCreated =
	components["schemas"]["webhook-repository-created"];
export type WebhookRepositoryArchived =
	components["schemas"]["webhook-repository-archived"];
export type WebhookRepositoryDeleted =
	components["schemas"]["webhook-repository-deleted"];
export type WebhookRepositoryPrivatized =
	components["schemas"]["webhook-repository-privatized"];
export type WebhookRepositoryPublicized =
	components["schemas"]["webhook-repository-publicized"];
export type WebhookRepositoryRenamed =
	components["schemas"]["webhook-repository-renamed"];
export type WebhookRepositoryUnarchived =
	components["schemas"]["webhook-repository-unarchived"];
export type WebhookRepositoryTransferred =
	components["schemas"]["webhook-repository-transferred"];

export type WebhookCreate = components["schemas"]["webhook-create"];
export type WebhookDelete = components["schemas"]["webhook-delete"];

export type WebhookFork = components["schemas"]["webhook-fork"];

export type WebhookOrganizationMemberInvited =
	components["schemas"]["webhook-organization-member-invited"];
export type WebhookOrganizationMemberAdded =
	components["schemas"]["webhook-organization-member-added"];
export type WebhookOrganizationMemberRemoved =
	components["schemas"]["webhook-organization-member-removed"];

export type WebhookPush = components["schemas"]["webhook-push"];

export type WebhookReleasePublished =
	components["schemas"]["webhook-release-published"];
