# Contributing

Please _read_ before contributing to Merchant Center Application Kit in order to get familiar with the guidelines for contributing to the project.

## Core Ideas

The [Merchant Center](https://mc.commercetools.com) is a _Multi Single-Page-Application_ where effectively multiple applications are running within the same domain, giving it a look and feel of being one big application. In fact, sections of the Merchant Center such as Dashboard, Orders, Products, etc are all different applications.
You can read more about the architecture here (_coming soon_).

With that in mind, developing a Merchant Center Application requires a set of tools and components that should be used across the different applications, as they share some common logic. This repository contains all the minimal packages that are necessary to do that. Some of them do not need to be used directly but are instead required by other packages. Let's have a deeper look.

## Folder Structure

This repository is managed as a monorepo, meaning it contains multiple (sub)packages located in the [`packages`](./packages) directory.

```
packages/
  actions-global/
  application-components/
  application-shell/
  application-shell-connectors/
  assets/
  babel-preset-mc-app/
  browser-history/
  constants/
  create-mc-app/
  eslint-config-mc-app/
  i18n/
  jest-preset-mc-app/
  jest-stylelint-runner/
  l10n/
  mc-dev-authentication/
  mc-html-template/
  mc-http-server/
  mc-scripts/
  notifications/
  permissions/
  react-notifications/
  sdk/
  sentry/
  url-utils/
```

### Overview of main packages

Below a short description of the most import packages:

#### [application-components](./packages/application-components)

This package contains React components for developing Merchant Center applications, similarly to what the `@commercetools-frontend/ui-kit` implements.

#### [application-shell](./packages/application-shell)

This package is the most **important** one and contains the core logic of a Merchant Center application (login, intl, base layout, etc). To develop an application, you need to render the `<ApplicationShell>` component first (_see package documentation_).
The package also initializes different things such as intl, apollo, routing, etc.

#### [application-shell-connectors](./packages/application-shell-connectors)

This package is a complementary package of the `application-shell` and contains "connector" components that use the new React Context API. The main purpose of those "connectors" is to make it easier for the consumer to access data in any place of the application.

#### [assets](./packages/assets)

This package contains static assets, such as SVG images.

#### [constants](./packages/constants)

This package contains a set of useful constant variables.

#### [constants](./packages/create-mc-app)

This package contains a CLI to bootstrap a starter application based on a predefined template.

#### [eslint-config-mc-app](./packages/eslint-config-mc-app)

This package contains a set of linting rules useful to use as a preset of your `eslint` config.

#### [i18n](./packages/i18n)

This package contains React components for accessing internationalization data such as intl messages (of the application kit packages), moment locales, etc.

#### [jest-preset-mc-app](./packages/jest-preset-mc-app)

This package contains a preset configuration for Jest, focused on necessary tools and transformers for a Merchant Center application code.

#### [l10n](./packages/l10n)

This package contains React components for accessing localization data such as country, currency, language, time zone, etc.

#### [mc-http-server](./packages/mc-http-server)

This package runs a small HTTP server to serve the `index.html`, with some additional extra like CSP headers, etc. The server is meant to be used to run the application in **production** mode.

#### [mc-scripts](./packages/mc-scripts)

If you're familiar with `react-scripts`, this CLI works very similarly except that it is configured to work for developing Merchant Center Applications.

#### [permissions](./packages/permissions)

This package contains React components to apply permissions in your application code (e.g. prevent access to a view if the user does not have the correct scopes, etc).

#### [react-notifications](./packages/react-notifications)

This package contains React components to render notification (e.g. error message, success message, etc).

#### [sdk](./packages/sdk)

This package contains React components to perform requests in a declarative way. Underneath it uses our [js-sdk](https://commercetools.github.io/nodejs/sdk/) to perform the network requests.

## Getting started

1. Clone the repository
2. Run `yarn` in the root folder

Once it's done, you can run `yarn start` or `yarn test` (`yarn test:watch`) to develop the packages.

## Developing locally

To develop locally, you can use the `playground` application to test the changes in some of the packages. Make sure to `yarn build` the packages before starting the `playground` app because the app consumes the packages as normal "transpiled" dependencies.

You can also run the build in watch mode `yarn build:bundles:watch` alongside with `yarn playground:start` to rebundle and rebuild the application on each change.

## Cutting a Release

By default, all releases go to the `next` distribution channel and should be considered **prereleases**. This gives us a chance to test out a release before marking it **stable** in the `latest` distribution channel.

#### Draft release notes in the Changelog

1. Make sure that each merged PR that should be mentioned in the release changelog is labelled with one of the [labels](https://github.com/commercetools/merchant-center-application-kit/labels) named `Type: ...` to indicate what kind of change it is.
2. Create a changelog entry for the release

- Copy `.env.template` and name it `.env`
- You'll need an [access token for the GitHub API](https://help.github.com/articles/creating-an-access-token-for-command-line-use/). Save it to the environment variable: `GITHUB_AUTH`
- Run `yarn changelog`. The command will find all the labeled pull requests merged since the last release and group them by the label and affected packages, and create a change log entry with all the changes and links to PRs and their authors. Copy and paste it to `CHANGELOG.md`.
- The list of committers does not need to be included.
- Check if some Pull Requests are referenced by different label types and decide if you want to keep only one entry or have it listed multiple times.
- Add a four-space indented paragraph after each non-trivial list item, explaining what changed and why. For each breaking change also write who it affects and instructions for migrating existing code.
- Maybe add some newlines here and there. Preview the result on GitHub to get a feel for it. Changelog generator output is a bit too terse for my taste, so try to make it visually pleasing and well grouped.

3. (_Optional_) Include "_Migrating from ..._" instructions for the previous release in case you deem it necessary.
4. Commit the changelog (usually by opening a new Pull Request).

#### Release the packages

1. Make sure the `CHANGELOG.md` has been updated.
2. Check that your npm account has access to the `@commercetools-frontend` organization and that you are logged in with the `npm` CLI.
3. Run `yarn release`: the packages will be bundled with Rollup first, then Lerna will prompt you to select the version that you would like to release (minor, major, pre-release, etc.).
4. Wait a bit until Lerna bumps the versions, creates a commit and a tag and finally publishes the packages to npm (to the `next` distribution channel).
5. After publishing, create a GitHub Release with the same text as the `CHANGELOG.md` entry. See previous Releases for inspiration.

#### Moving the `latest` dist-tag to a release:

After testing the `next` release on a production project, if the version is **stable** it can be finally movede to the `latest` distribution channel.

```bash
$ yarn release:from-next-to-latest
```

The command will promote the version published on `next` to the `latest` npm dist-tag, for each package.

## Canary releases

On `master` branch, we automatically publish **canary** releases from CI to the `canary` distribution channel, _after_ the build runs successfully.

Canary releases are useful to test early changes that should not be released yet to `next` or `latest`. They are automatically triggered and released after a Pull Request merged into `master`, unless the commit message contains `[skip publish]`.

Note that canary releases **will not create git tags and version bump commits**.

## GraphQL files and linting

In order to be able to validate GraphQL queries and mutations, defined as `.graphql` files, we use the [eslint-plugin-graphql](https://github.com/apollographql/eslint-plugin-graphql), which requires **introspection schemas** from the different GraphQL APIs being used.

To download the remote schemas simply run `yarn get-schemas`. The configuration of each schema is defined in the `.graphqlconfig.yml` file, in the root directory. Running this script will download the schemas in the `schemas/*.json` files.

> NOTE that you need your user `mcAccessToken` to be defined as an environment variable `MC_ACCESS_TOKEN` in `.env` file. This will be used by the introspection queries to be able to download the schemas from the MC API. Additionally, you also need to specify one of your `CTP_PROJECT_KEY` where you have access to.

Since the MC uses multiple GraphQL APIs, we need to differentiate which queries use which schema. To do so, prefix the file extension with one of the GraphQL targets:

- **mc**: instead of `.graphql` use `*.mc.graphql` (_graphql target: `mc`_)
- **settings**: instead of `.graphql` use `*.settings.graphql` (_graphql target: `settings`_)
- **ctp**: instead of `.graphql` use `*.ctp.graphql` (_graphql target: `ctp`_)
- **proxy**: instead of `.graphql` use `*.proxy.graphql` (_API in the MC frontend apps_)

The regex to match the files to each project schema are defiend in the `.graphqlconfig.yml` file.
