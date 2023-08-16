import { execSync } from "child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	statSync,
	writeFileSync,
} from "fs";
import { chdir, exit, stdout } from "process";
import R from "ramda";
import { Config } from ".";
import { bgGreen, error, fgWhite, reset } from "./common";
import { Commit, getCommitList } from "./getCommitList";

const readmeFileName = "README.md";
const safetyFileName = "CONTRIBUTIONS-REPOSITORY--CAN-BE-DELETED";

export const replicateContributions = ({
	sourceRepositories,
	contributionsRepository,
}: Config) => {
	const sourcePaths = getSourcePaths(sourceRepositories.paths);

	const allCommits = sourcePaths.flatMap((repoPath) =>
		getCommitList({
			repoPath,
			possibleBranchNames: sourceRepositories.possibleBranchNames,
			authorEmails: sourceRepositories.authorEmails,
		}),
	);

	const sortedCommits = R.sortBy(
		({ date }) => new Date(date).getTime(),
		allCommits,
	);

	const numberOfRepos = sourcePaths.length;
	const numberOfCommits = allCommits.length;
	const numberOfReposWithCommits = R.uniq(
		allCommits.map(({ repoName }) => repoName),
	).length;

	const resultSummary = `analysed ${numberOfRepos} ${
		numberOfRepos === 1 ? "repository" : "repositories"
	} and found ${numberOfCommits} ${
		numberOfCommits === 1 ? "commit" : "commits"
	} in ${numberOfReposWithCommits} ${
		numberOfReposWithCommits === 1 ? "repository" : "repositories"
	}`;

	console.info(`\n${bgGreen}${fgWhite}${resultSummary}${reset}\n`);

	prepareRepo(contributionsRepository);

	createContributionCommits(contributionsRepository, sortedCommits);

	writeFileSync(
		`${contributionsRepository.path}/${readmeFileName}`,
		`[own-contribution-graph](https://github.com/Georift/own-contribution-graph) ${resultSummary}.\n`,
	);

	if (execSync("git diff", { encoding: "utf8" })) {
		execSync(`git add ${readmeFileName}`);
		execSync("git commit -m 'Update readme'");
	}

	console.info(`\n\n${bgGreen}${fgWhite}success${reset}\n`);
};

/**
 * Return all regular paths and expand directory paths (ending with `/*`) to a list of git repository paths
 */
const getSourcePaths = (paths: string[]) =>
	paths.flatMap((path) => {
		if (path.endsWith("/*")) {
			const dirPath = path.slice(0, -2);

			if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
				console.error(`${error} path '${path}' is invalid.`);
				exit(1);
			}

			return readdirSync(dirPath)
				.map((element) => `${dirPath}/${element}`)
				.filter(
					(elementPath) =>
						statSync(elementPath).isDirectory() &&
						readdirSync(elementPath).includes(".git"),
				);
		} else {
			return path;
		}
	});

/**
 * `chdir` to the contribution repository, creating one if it doesn't exist yet
 *
 * Note: we used to delete the contribution repository and recreate it from scratch at
 * every runs, but we noticed that GitHub was adding contributions instead of replacing them:
 * a contribution on one day way counted in the contribution graph everytime the repository
 * was recreated, so the graph ended up showing ten contributions on this day, instead of one;
 * to fix that, we now only add new/missing contributions to the contribution repository
 */
const prepareRepo = ({ path, remote }: Config["contributionsRepository"]) => {
	if (!existsSync(path)) {
		console.info(`Creating new contribution repository in '${path}'`);

		mkdirSync(path);
		chdir(path);
		execSync("git init 2> /dev/null");

		if (remote) {
			execSync(`git remote add ${remote}`);
		}

		writeFileSync(`${path}/${safetyFileName}`, "");
		writeFileSync(`${path}/${readmeFileName}`, "");
		execSync(`git add ${safetyFileName} ${readmeFileName}`);
		execSync("git commit -m 'Initial commit'");

		return;
	}

	if (
		!statSync(path).isDirectory() ||
		!R.equals(readdirSync(path), [".git", safetyFileName, readmeFileName])
	) {
		console.error(`${error} repository '${path}' is invalid.`);
		exit(1);
	}

	chdir(path);

	if (execSync("git diff", { encoding: "utf8" })) {
		console.error(
			`${error} repository '${path}' is invalid or has unstaged changes.`,
		);
		exit(1);
	}

	console.info(`Found existing contribution repository in '${path}'`);
};

/**
 * Add missing contribution commits to the contribution repository
 *
 * Note: in the future, we could implement the detection and removal of existing contribution commits
 * that do not exist anymore in their original repositories; it doesn't seem very important though
 */
const createContributionCommits = (
	{ includeRepositoryNameInCommits }: Config["contributionsRepository"],
	commits: Commit[],
) => {
	const existingCommitsOutput = execSync(`git log --format="format:%b"`, {
		encoding: "utf8",
	});

	const existingCommits = existingCommitsOutput
		.split("\n")
		.filter((commitMessage) => commitMessage.match(/^[0-9a-f]{40}$/));

	if (existingCommits.length) {
		console.info(
			`Found ${existingCommits.length} already existing contribution commits`,
		);
	}

	const newCommits = commits.filter(
		(commit) => !existingCommits.includes(commit.hash),
	);

	if (!newCommits.length) {
		console.info(`No new contribution commits to be created.`);
		return;
	}

	console.info(`Creating ${newCommits.length} contribution commits:`);

	newCommits.forEach((commit) => {
		const gitCommand = `GIT_AUTHOR_DATE="${commit.date}" GIT_COMMITTER_DATE="${
			commit.date
		}" git commit --allow-empty --no-gpg-sign -m "Commit${
			includeRepositoryNameInCommits ? ` in '${commit.repoName}'` : ""
		}" -m ${commit.hash}`;

		execSync(gitCommand);

		stdout.write(".");
	});
};
