import { execSync } from "child_process";
import { basename } from "path";
import { chdir, cwd, exit } from "process";
import { error } from "./common";

export interface Commit {
	hash: string;
	authorEmail: string;
	date: string;
	repoName: string;
}

export const getCommitList = ({
	repoPath,
	possibleBranchNames,
	authorEmails,
}: {
	repoPath: string;
	possibleBranchNames: string[];
	authorEmails: string[];
}): Commit[] => {
	const repoName = basename(repoPath);

	chdir(repoPath);

	console.info(`- looking for commits in '${cwd()}'`);

	const branchName = possibleBranchNames.find((possibleBrancheName) => {
		try {
			execSync(
				`git rev-parse --verify ${possibleBrancheName} > /dev/null 2>&1`,
			);

			return true;
		} catch {
			return false;
		}
	});

	if (!branchName) {
		console.error(`  - ${error} can't find default branch name.`);
		exit(1);
	}

	const filterFlags = authorEmails
		.map((authorEmail) => `--author="${authorEmail}"`)
		.join(" ");

	const revListOutput = execSync(
		`git rev-list ${filterFlags} --format="format:%H %ae %cI" ${branchName}`,
		{ encoding: "utf8" },
	);

	const commits = revListOutput
		.split("\n")
		.filter((s) => !s.startsWith("commit ") && s.trim().length > 0)
		.map((s) => s.split(" "))
		.map(([hash, authorEmail, date]) => ({
			hash,
			authorEmail,
			date,
			repoName,
		}));

	console.info(`  - found ${commits.length} commits`);

	return commits;
};
