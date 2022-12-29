import { execSync } from "child_process";
import { mkdirSync, readFileSync, rmSync } from "fs";
import path from "path";
import * as R from "ramda";
import { simpleGit } from "simple-git";
import { getCommitList } from "./getCommitList";

const { repositories, emails, remote } = JSON.parse(
	readFileSync("./repos.json").toString(),
);

if (!Array.isArray(repositories) || !Array.isArray(emails)) {
	console.error(
		"Expecting a './repos.json' with an array 'repositories' and 'emails'. See 'repos.example.json'",
	);
	process.exit(-1);
}

(async () => {
	const allCommits = [];
	for (const repoUrl of repositories) {
		allCommits.push(...(await getCommitList(repoUrl, emails)));
	}

	const sortedCommits = R.sortBy(
		({ date }) => new Date(date).getTime(),
		allCommits,
	);

	// Useful to show what we've found, try dropping of the author filter and logging it.
	// console.log(R.uniq(allCommits.map(({ email }) => email)));

	const TEST_REPO = path.join(__dirname, "./test-git-repo");
	// delete if it exists
	try {
		rmSync(TEST_REPO, { recursive: true });
	} catch {
		// we don't mind if it was already missing
	}

	mkdirSync(TEST_REPO);

	const git = simpleGit({
		baseDir: TEST_REPO,
	});

	await git.init();

	if (!!remote) {
		await git.addRemote("origin", remote);
	}

	console.log('Starting to commit to "./test-git-repo"');

	process.chdir(TEST_REPO);

	for (const commit of sortedCommits) {
		const gitCommand = `GIT_AUTHOR_DATE="${commit.date}" GIT_COMMITTER_DATE="${commit.date}" git commit --allow-empty --no-gpg-sign -m "Another commit"`;

		execSync(gitCommand, { encoding: "utf8" });

		process.stdout.write(".");
	}

	console.log();
	console.log(
		`Added ${sortedCommits.length} contributions found in ${repositories.length} repositories`,
	);
})();
