# `own-contribution-graph`

Say your company doesn't use Github, but you still want to continue your
contribution graph on your Github account.

This tool will scan local repositories, and create a new repository with a
series of empty commits that replicate your contributions seen in the local
repositories.

## Usage

Configure `repos.json` to suit, see `repos.example.json`

Run `ts-node index.ts` to generate your dummy repo.

Push this repo to Github, or anywhere else.

## TODO

- [ ] Support repos with branches other than `main`
- [ ] Output the commit graph as HTML so it can be published on personal websites
