"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitList = void 0;
const child_process_1 = require("child_process");
// we need to add some sanitization to these inputs...
const getCommitList = (repo, authorEmails = []) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: check the repo before assuming it's just main. Could
    // be set to master or trunk. How can we detect this?
    const repoMainBranch = "master";
    const filterFlags = authorEmails.map((e) => `--author="${e}"`).join(" ");
    // const outputFile = tmp.fileSync();
    // const childProcess = exec(
    //   `cd ${repo} && git rev-list ${filterFlags} --format="format:%ae %cI" ${repoMainBranch} > ${outputFile.name}`
    // );
    // try {
    //   await onExit(childProcess);
    // } catch (error) {
    //   console.error(`Error while trying to open repo "${repo}"`);
    //   return [];
    // }
    // const revListOutput = readFileSync(outputFile.name).toString();
    // ↑ Compare the above and the below solution for speed when lots of repos
    const revListOutput = (0, child_process_1.execSync)(`cd ${repo} && git rev-list ${filterFlags} --format="format:%ae %cI" ${repoMainBranch}`, { encoding: "utf8" });
    return revListOutput
        .split("\n")
        .filter((s) => !s.startsWith("commit ") && s.trim().length > 0)
        .map((s) => s.split(" "))
        .map(([email, date]) => ({ email, date }))
        .reverse(); // sorting them in ascending order
});
exports.getCommitList = getCommitList;
//# sourceMappingURL=getCommitList.js.map