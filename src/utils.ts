import { Collection } from "@discordjs/collection";
import { config } from "./index.ts";

export const getOrgConfigs = () => {
	if (config.orgConfigs == null) {
		return;
	}
	return new Collection(Object.entries(config.orgConfigs));
};
