# 🦙 larrylint

[![Github Actions][github-actions-src]][github-actions-href]
[![NPM version][npm-version-src]][npm-version-href]
[![NPM last update][npm-last-update-src]][npm-last-update-href]
[![License][license-src]][license-href]

Opinionated structure rules for [Laioutr](https://laioutr.com) apps: an ESLint preset for your editor and a CLI for CI.

Laioutr apps are Nuxt modules with a lot of moving parts: sections and blocks, orchestr handlers, middleware, API clients, server routes. larrylint keeps them where they belong and stops the imports that make a codebase drift, like app code pulling in server code, handlers importing each other, or one business domain reaching into another.

## Usage

Check the Laioutr app in the current folder. No install and no config needed:

```sh
npx larrylint
```

Set it up for good. This installs larrylint, adds its rules to your `eslint.config`, and records existing violations in a baseline so only new code has to follow the rules:

```sh
npx larrylint init
```

After that, `eslint .` and your editor report larrylint's rules next to your own.

## Rules

| Rule                           | What it checks                                                                                                                                                                                                                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `larrylint/layers`             | App code doesn't import server code and vice versa; shared code imports neither. Runtime code doesn't import build-time code. Nothing imports orchestr handlers. Handlers and server utils don't import from `server/client/`, and only handlers and media libraries import middleware. Utils are the bottom layer. Domains stay apart. |
| `larrylint/orchestr-files`     | Laioutr loads every file in `orchestr/` as a server plugin, so only handler files belong there, in a domain folder, exporting nothing but their handler.                                                                                                                                                                              |
| `larrylint/definitions`        | `defineSection()` lives in `app/sections/Section*.vue`, `defineBlock()` in `app/blocks/Block*.vue`, with a `component` name that matches the file and no top-level schema fields named `style`, `class`, `key`, `ref`, `is`, `slot`, `refFor` or `refKey`, which Vue swallows before they reach the component.                                                                                                                                                                                    |
| `larrylint/button-type`        | No `type` on the ui-kit button: it always renders its `button-type` prop, so `type="submit"` silently renders a dead button. Autofixable.                                                                                                                                                                                             |

Type imports are fine across most layers, since they don't end up in the bundle.

## Layout

larrylint expects the layout of Laioutr's [app starter](https://github.com/laioutr/app-starter):

```
src/
├── module.ts                  # build time
└── runtime/
    ├── app/
    │   ├── sections/          # Section*.vue with defineSection()
    │   ├── blocks/            # Block*.vue with defineBlock()
    │   ├── components/
    │   ├── composables/
    │   ├── overrides/         # replacements for upstream components
    │   ├── plugins/
    │   └── utils/
    ├── server/
    │   ├── orchestr/
    │   │   ├── <domain>/      # *.query.ts, *.resolver.ts, *.link.ts, *.action.ts, *.template.ts, *.page-index.ts
    │   │   └── plugins/
    │   ├── middleware/        # orchestr middleware and the builders handlers use
    │   ├── client/            # API clients, nothing else
    │   ├── api/               # server routes
    │   ├── plugins/           # Nitro plugins
    │   ├── media-library/
    │   └── utils/
    │       └── <domain>/
    └── shared/                # code for both the app and the server
```

A domain is a folder in `server/orchestr/`, together with the `server/utils/` folder of the same name. Other folders in `server/utils/`, like `tracking/`, hold shared helpers that every domain may use.

## Baseline

On an existing codebase, `larrylint init` records all current violations in `larrylint-baseline.json`, counted per file and rule. A file stays quiet as long as it has no more violations of a rule than recorded. Once it gets more, all of them show again, like ESLint's bulk suppressions. The baseline applies in your editor, in `eslint .` and in the CLI.

After fixing old violations, shrink the baseline:

```sh
npx larrylint --baseline
```

## Configuration

Most apps need none. To let every domain import a domain, add it to `sharedDomains` in your `package.json`:

```json
{
  "larrylint": {
    "sharedDomains": ["product"]
  }
}
```

Or in a `larrylint.config.ts`:

```ts
import { defineLarrylintConfig } from 'larrylint'

export default defineLarrylintConfig({
  sharedDomains: ['product'],
})
```

## ESLint

`larrylint init` adds the rules to your `eslint.config` for you. To do it by hand with `@nuxt/eslint-config` or `@antfu/eslint-config`:

```js
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import larrylint from 'larrylint'

export default createConfigForNuxt().append(larrylint())
```

With a plain array, like `@laioutr/eslint-config`:

```js
import config from '@laioutr/eslint-config/nuxt-module'
import larrylint from 'larrylint'

export default [...config, ...(await larrylint())]
```

The preset only brings rules, no parsers or style rules, so it runs on top of whatever your config already uses.

## CLI

```sh
larrylint [--cwd <folder>] [--fix] [--baseline]
larrylint init [--cwd <folder>]
```

- `--fix` fixes what can be fixed automatically.
- `--baseline` records the current violations in `larrylint-baseline.json`.

The CLI only runs larrylint's rules, independent of your ESLint setup, and exits with code 1 on new violations.

## License

Published under the [MIT License](https://github.com/bussmann-io/larrylint/tree/main/LICENSE).

[github-actions-src]: https://github.com/bussmann-io/larrylint/actions/workflows/test.yml/badge.svg
[github-actions-href]: https://github.com/bussmann-io/larrylint/actions

[npm-version-src]: https://img.shields.io/npm/v/larrylint/latest.svg?style=flat&colorA=18181B&colorB=31C553
[npm-version-href]: https://npmjs.com/package/larrylint

[npm-last-update-src]: https://img.shields.io/npm/last-update/larrylint.svg?style=flat&colorA=18181B&colorB=31C553
[npm-last-update-href]: https://npmjs.com/package/larrylint

[license-src]: https://img.shields.io/github/license/bussmann-io/larrylint.svg?style=flat&colorA=18181B&colorB=31C553
[license-href]: https://github.com/bussmann-io/larrylint/tree/main/LICENSE
