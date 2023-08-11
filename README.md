# `own-contribution-graph`

Say your company doesn't use GitHub, but you still want to continue your contribution graph on your GitHub account.

This tool will scan local repositories, and create a new repository with a series of empty commits that replicate your contributions seen in the local repositories.

## Usage

Create a configuration file in JSON:

```json
{
	"sourceRepositories": {
		"paths": [
			"<path-to-repo>",
			"<path-to-directory-containing-multiple-repos>/*"
		],
		"possibleBranchNames": ["origin/master", "origin/main"],
		"authorEmails": ["<email>"]
	},
	"contributionsRepository": {
		"path": "<repo-path>",
		"remote": "origin git@github.com:<username>/<repository>.git",
		"includeRepositoryNameInCommits": true
	}
}
```

Notes:

- `sourceRepositories`:
  - `paths` contains the paths of the local repositories to scan; a path can be:
    - directly a path to a Git repository,
    - or a path to a directory containing multiple Git repositories, in this case, the path must end with `/*`.
  - `possibleBranchNames` contains the branch names that will be looked for in the local repositories; once a branch is found, commits will be looked for in it.
  - `authorEmails` contains a list of email addresses; the tool will retrieve commits made by these emails addresses.
- `contributionsRepository`:
  - `path` contains the path to the contribution repository; it needs to not exist the first time the tool is run.
  - `remote` (optional) contains the name and URL of a remote to add to the repo; this will allow you to easily run `git push`, potentially with `--force`, afterwards
  - `includeRepositoryNameInCommits` (optional), if `true`, the name of the repository will be included in commit messages.

Run `owncontributiongraph` and provide it with the path to the config file:

```
owncontributiongraph --config=<json-config-file-path>
```

Push this repo to GitHub, or anywhere else.

On subsequent runs, only new commits will be added to the contribution repository.
