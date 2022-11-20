import * as tmp from "tmp";
import { readFileSync } from "fs";
import { exec } from "child_process";

import { onExit } from "./onExit";

// we need to add some sanitization to these inputs...
export const getCommitList = async (
  repo: string,
  authorEmails: string[] = []
) => {
  // TODO: check the repo before assuming it's just main. Could
  // be set to master or trunk. How can we detect this?
  const repoMainBranch = "main";

  const filterFlags = authorEmails.map((e) => `--author="${e}"`).join(" ");

  const outputFile = tmp.fileSync();
  const childProcess = exec(
    `cd ${repo} && git rev-list ${filterFlags} --format="format:%ae %cI" ${repoMainBranch} > ${outputFile.name}`
  );

  try {
    await onExit(childProcess);
  } catch (error) {
    console.error(`Error while trying to open repo "${repo}"`);
    return [];
  }

  const revListOutput = readFileSync(outputFile.name).toString();

  return revListOutput
    .split("\n")
    .filter((s) => !s.startsWith("commit ") && s.trim().length > 0)
    .map((s) => s.split(" "))
    .map(([email, date]) => ({ email, date }))
    .reverse(); // sorting them in ascending order
};
