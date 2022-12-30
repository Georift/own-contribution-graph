#!/usr/bin/env ts-node

// Run `npm start` to start the program, or hit F5 in VS Code to debug it (see `.vscode/launch.json`)

import { readFileSync } from "fs";
import Joi from "joi";
import { exit } from "process";
import yargs from "yargs";
import { error } from "./common";
import exampleConfig from "./config.example.json";
import { replicateContributions } from "./replicateContributions";

export interface Config {
	sourceRepositories: {
		paths: string[];
		possibleBranchNames: string[];
		authorEmails: string[];
	};
	contributionsRepository: {
		path: string;
		remote: string;
		includeRepositoryNameInCommits: boolean;
	};
}

const configSchema = Joi.object<Config>({
	sourceRepositories: Joi.object({
		paths: Joi.array().items(Joi.string()).required(),
		possibleBranchNames: Joi.array().items(Joi.string()).required(),
		authorEmails: Joi.array().items(Joi.string()).required(),
	}).required(),
	contributionsRepository: Joi.object({
		path: Joi.string().required(),
		remote: Joi.string(),
		includeRepositoryNameInCommits: Joi.boolean(),
	}).required(),
}).required();

const args = yargs
	.option("config", {
		alias: "c",
		type: "string",
		description: "The path to the JSON configuration file",
		demandOption: true,
	})
	.strict()
	.usage("Usage: $0 --config=<json-config-file-path>")
	.example("config file:", JSON.stringify(exampleConfig, undefined, "  "))
	.help()
	.parseSync();

const config = configSchema.validate(
	JSON.parse(readFileSync(args.config).toString()),
);

if (config.error) {
	console.error(`${error} invalid config file:`);
	console.error(config.error);
	exit(1);
}

replicateContributions(config.value);
