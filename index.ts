import path from "path";
import { rmSync, mkdirSync, readFileSync } from "fs";
import { simpleGit } from "simple-git";
import { getCommitList } from "./getCommitList";
import * as R from "ramda";

const { repositories, emails, remote } = JSON.parse(
  readFileSync("./repos.json").toString()
);

if (!Array.isArray(repositories) || !Array.isArray(emails)) {
  console.error(
    "Expecting a './repos.json' with an array 'repositories' and 'emails'. See 'repos.example.json'"
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
    allCommits
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

  for (const commit of sortedCommits) {
    await git.commit("Another commit", {
      "--allow-empty": null,
      "--date": commit.date,
    });
    process.stdout.write(".");
  }

  console.log();
  console.log(
    `Added ${sortedCommits.length} contributions found in ${repositories.length} repositories`
  );
})();
