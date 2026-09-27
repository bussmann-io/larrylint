# 🦙 larrylint

[![Github Actions][github-actions-src]][github-actions-href]
[![NPM version][npm-version-src]][npm-version-href]
[![NPM last update][npm-last-update-src]][npm-last-update-href]
[![License][license-src]][license-href]

Opinionated rules for [Laioutr](https://laioutr.com) apps: an ESLint preset for your editor and a CLI for CI.

Laioutr apps are Nuxt modules with a lot of moving parts: sections and blocks, orchestr handlers, middleware, API clients, server routes. larrylint keeps them where they belong and stops the imports that make a codebase drift, like app code pulling in server code or handlers importing each other. It also catches the mistakes that only show up in Studio or in production, like schema fields that never reach the component, fallbacks that never apply, or cookies written after orchestr has sent the headers.

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

`token-namespaces` reads the app's installed `@laioutr-core/canonical-types`, so install the app's dependencies first. larrylint stops with an error when it's missing.

## Rules

### Structure

| Rule | Description |
| --- | --- |
| `larrylint/layers` | App, server and shared code don't import each other, runtime code doesn't import build-time code, and `node:` modules stay on the server. As Laioutr's coding standards ask, handlers get API clients from the orchestr context, nothing imports handler files, and components don't import sections or blocks. |
| `larrylint/heavy-imports` | Sections, blocks and plugins load the packages in `heavyPackages` with `import()`: frontend-core imports every section and block up front, and plugins run on every page, so a static import loads the package on every page. |
| `larrylint/config-keys` | Runtime config keys like `'@laioutr-app/shopware'` are the app itself or one of its dependencies, otherwise the config is missing at runtime. |
| `larrylint/public-config` | The module doesn't copy its whole options object into `runtimeConfig.public`, which would send every secret in it to the browser. |

Type imports are always fine, since they don't end up in the bundle.

### Orchestr

| Rule | Description |
| --- | --- |
| `larrylint/orchestr-files` | Laioutr loads every file in `orchestr/` as a Nitro plugin, so only handler files belong there. |
| `larrylint/orchestr-cookies` | Cookies and headers are only written in `extendRequest()` and action handlers, since query, link and resolver handlers and `use()` middleware can run after the headers are sent. Cookies go through frontend-core's `setManagedCookie()` and `deleteManagedCookie()`, which the Studio preview needs. |
| `larrylint/handler-exports` | Handler files export their handler as default. Without one, the build fails. |
| `larrylint/middleware-files` | `server/middleware/` only holds orchestr and Nitro middleware; helpers go to `server/utils/`. |
| `larrylint/initware-throws` | `extendRequest()` doesn't throw, directly or through a function it calls: it runs before every query, so a throw breaks every page. |
| `larrylint/token-namespaces` | Your own tokens stay out of the namespaces of Laioutr's canonical types, like `ecommerce/`, where a later canonical-types release or another app can take the same id. |

### Sections and blocks

| Rule | Description |
| --- | --- |
| `larrylint/definition-folder` | `defineSection()` and `defineBlock()` live where `module.ts` registers sections and blocks, and every `.vue` registered there has one. Files that `module.ts` wires up by hand, like replacements for upstream sections, can live anywhere. |
| `larrylint/component-name` | The `component` of a definition matches its file name. |
| `larrylint/definition-description` | Definitions have a `studio.description`, which Studio shows in its section picker and AI agents read through Laioutr's MCP server. |
| `larrylint/single-root` | Sections and blocks render one root element, also through a component they wrap. Otherwise Vue drops the `data-lfc-*` attributes Studio needs to select them in the preview. |
| `larrylint/slot-children` | Nothing counts slot children with `.length`: frontend-core passes all blocks of a slot as one Fragment. |
| `larrylint/reserved-field-names` | No top-level schema fields named `key`, `ref`, `ref_for`, `ref_key`, `class` or `style`, which Vue handles itself, and no `slots` on sections, which frontend-core overwrites. |
| `larrylint/field-name-case` | Top-level schema field names have no `-` and don't start with `$`, which Vue renames or rejects as props. |
| `larrylint/required-fields` | Schema fields have no `required`, which Studio ignores. Give them a `default` instead. |
| `larrylint/unused-fields` | The component reads every schema field it defines, directly, through the section it's a block of, or in another field's `if`, so editors don't get fields that do nothing. |
| `larrylint/dead-fallbacks` | No `??` fallbacks that are never used: frontend-core fills unset pickers with their first option, content alignments with the center, checkboxes with `false` and text fields with `''`. |

### Frontend

| Rule | Description |
| --- | --- |
| `larrylint/button-type` | No `type` on the ui-kit buttons: they always render their `button-type` prop, so `type="submit"` silently renders a dead button. Autofixable. |
| `larrylint/mutation-errors` | An awaited or dropped `mutateAsync()` handles its error. Otherwise a failed mutation replaces the whole section or block with an error, or nothing handles it. |
| `larrylint/resolve-result` | Nothing checks the result of `linkResolver.resolve()`: a link it can't resolve comes back as a `#…` fallback, not as an empty value. |
| `larrylint/hand-built-links` | Links to pages come from `linkResolver`, not from paths like `` `/hotels/${slug}` ``: page paths are set per page and language in Studio, and each market adds its own prefix, like `/en`. |
| `larrylint/internal-anchors` | Internal and resolved links use `<NuxtLink>`: a plain `<a>` reloads the page and breaks Studio's navigation sync. |

## Layout

larrylint follows the runtime layout from Laioutr's [coding standards](https://docs.laioutr.com/apps/app-development/coding-standards):

```
src/
├── module.ts                # registers sections, blocks, orchestr handlers and plugins
└── runtime/
    ├── app/                 # client code
    │   ├── components/      # UI components
    │   ├── sections/        # defineSection() components
    │   └── blocks/          # defineBlock() components
    ├── server/              # server code
    │   ├── client/          # API client factories
    │   ├── const/
    │   ├── mappers/
    │   ├── middleware/      # defineOrchestr() with extendRequest()
    │   ├── orchestr/        # *.query.ts, *.resolver.ts, *.link.ts, *.action.ts, *.template.ts, *.page-index.ts
    │   ├── orchestr-helper/ # helper logic for handlers
    │   └── utils/
    └── shared/              # code for both sides, like orchestr tokens
```

Where your sections, blocks and handlers live, larrylint reads from your `module.ts`: the folders and globs you pass to `registerLaioutrApp()`, and the plugins you pass to `addPlugin()`. So other folders work too, like `section/` and `block/` in Laioutr's own ui-app. Without a `module.ts` it can read, larrylint assumes the folders of Laioutr's [app starter](https://github.com/laioutr/app-starter): `app/sections/`, `app/blocks/` and `server/orchestr/`.

Besides that, larrylint only relies on the names `app/components/`, `server/client/` and `server/middleware/`, and on the split into `app/`, `server/` and `shared/`.

## Baseline

On an existing codebase, `larrylint init` records all current violations in `larrylint-baseline.json`, counted per file and rule. A file stays quiet as long as it has no more violations of a rule than recorded. Once it gets more, all of them show again, like ESLint's bulk suppressions. The baseline applies in your editor, in `eslint .` and in the CLI.

After fixing old violations, shrink the baseline:

```sh
npx larrylint --baseline
```

## Configuration

Most apps need none. `heavyPackages` lists the packages that sections, blocks and plugins must load with `import()`, for `heavy-imports`. Set it in your `package.json`:

```json
{
  "larrylint": {
    "heavyPackages": ["leaflet"]
  }
}
```

Or in a `larrylint.config.ts`:

```ts
import { defineLarrylintConfig } from 'larrylint'

export default defineLarrylintConfig({
  heavyPackages: ['leaflet'],
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
