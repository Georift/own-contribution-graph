#!/usr/bin/env node
"use strict";
// Run `npm start` to start the program, or hit F5 in VS Code to debug it (see `.vscode/launch.json`)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const R = __importStar(require("ramda"));
const simple_git_1 = require("simple-git");
const getCommitList_1 = require("./getCommitList");
const { repositories, emails, remote } = JSON.parse((0, fs_1.readFileSync)("./repos.json").toString());
if (!Array.isArray(repositories) || !Array.isArray(emails)) {
    console.error("Expecting a './repos.json' with an array 'repositories' and 'emails'. See 'repos.example.json'");
    process.exit(-1);
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const allCommits = [];
    for (const repoUrl of repositories) {
        allCommits.push(...(yield (0, getCommitList_1.getCommitList)(repoUrl, emails)));
    }
    const sortedCommits = R.sortBy(({ date }) => new Date(date).getTime(), allCommits);
    // Useful to show what we've found, try dropping of the author filter and logging it.
    // console.log(R.uniq(allCommits.map(({ email }) => email)));
    const TEST_REPO = path_1.default.join(__dirname, "./test-git-repo");
    // delete if it exists
    try {
        (0, fs_1.rmSync)(TEST_REPO, { recursive: true });
    }
    catch (_a) {
        // we don't mind if it was already missing
    }
    (0, fs_1.mkdirSync)(TEST_REPO);
    const git = (0, simple_git_1.simpleGit)({
        baseDir: TEST_REPO,
    });
    yield git.init();
    if (!!remote) {
        yield git.addRemote("origin", remote);
    }
    console.log('Starting to commit to "./test-git-repo"');
    process.chdir(TEST_REPO);
    for (const commit of sortedCommits) {
        const gitCommand = `GIT_AUTHOR_DATE="${commit.date}" GIT_COMMITTER_DATE="${commit.date}" git commit --allow-empty --no-gpg-sign -m "Another commit"`;
        (0, child_process_1.execSync)(gitCommand, { encoding: "utf8" });
        process.stdout.write(".");
    }
    console.log();
    console.log(`Added ${sortedCommits.length} contributions found in ${repositories.length} repositories`);
}))();
//# sourceMappingURL=index.js.map