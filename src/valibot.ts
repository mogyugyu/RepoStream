import {
	type InferOutput,
	array,
	hexColor,
	nullable,
	number,
	optional,
	parser,
	pipe,
	record,
	strictObject,
	string,
} from "valibot";
export const Config = strictObject({
	orgColor: pipe(string(), hexColor()),
	guildId: string(),
	categoryId: nullable(string()),
	developers: optional(
		record(
			string(),
			strictObject({
				githubId: number(),
				discordId: string(),
			}),
		),
	),
	orgConfigs: optional(
		record(
			string(),
			strictObject({
				orgColor: optional(pipe(string(), hexColor())),
				ignoreRepositories: optional(array(string())),
			}),
		),
	),
});
export type ConfigData = InferOutput<typeof Config>;
export const configParser = parser(Config);
