import { execSync } from "child_process";
import {
	existsSync,
	mkdirSync,
	readdirSync,
	rmSync,
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
	} — found ${numberOfCommits} ${
		numberOfCommits === 1 ? "commit" : "commits"
	} in ${numberOfReposWithCommits} ${
		numberOfReposWithCommits === 1 ? "repository" : "repositories"
	}`;

	console.info(`\n${bgGreen}${fgWhite}${resultSummary}${reset}\n`);

	initRepoAndJumpIn(contributionsRepository);

	createInitialCommit(contributionsRepository.path, resultSummary);

	createContributionCommits(contributionsRepository, sortedCommits);

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

const initRepoAndJumpIn = ({
	path,
	remote,
}: Config["contributionsRepository"]) => {
	if (
		existsSync(path) &&
		(!statSync(path).isDirectory() ||
			!R.equals(readdirSync(path), [".git", safetyFileName, readmeFileName]))
	) {
		console.error(
			`${error} repository '${path}' appears to have been touched; delete it manually or set another path.`,
		);
		exit(1);
	}

	if (existsSync(path)) {
		rmSync(path, { recursive: true });
	}

	mkdirSync(path);

	chdir(path);

	execSync("git init 2> /dev/null");

	if (remote) {
		execSync(`git remote add ${remote}`);
	}
};

const createInitialCommit = (path: string, resultSummary: string) => {
	writeFileSync(`${path}/${safetyFileName}`, "");

	writeFileSync(
		`${path}/${readmeFileName}`,
		`[own-contribution-graph](https://github.com/Georift/own-contribution-graph) ${resultSummary}.\n`,
	);

	execSync(`git add ${safetyFileName} ${readmeFileName}`);

	execSync("git commit -m 'Initial commit'");
};

const createContributionCommits = (
	{ path, includeRepositoryNameInCommits }: Config["contributionsRepository"],
	commits: Commit[],
) => {
	console.info(`Creating commits in '${path}':`);

	commits.forEach((commit) => {
		const gitCommand = `GIT_AUTHOR_DATE="${commit.date}" GIT_COMMITTER_DATE="${
			commit.date
		}" git commit --allow-empty --no-gpg-sign -m "Commit${
			includeRepositoryNameInCommits ? ` in '${commit.repoName}'` : ""
		}"`;

		execSync(gitCommand);

		stdout.write(".");
	});
};
