# 🦙 larrylint

[![Github Actions][github-actions-src]][github-actions-href]
[![NPM version][npm-version-src]][npm-version-href]
[![NPM last update][npm-last-update-src]][npm-last-update-href]
[![License][license-src]][license-href]

Opinionated rules for [Laioutr](https://laioutr.com) apps: an ESLint preset for your editor and a CLI for CI.

Laioutr apps are Nuxt modules with a lot of moving parts: sections and blocks, orchestr handlers, middleware, API clients, server routes. larrylint keeps them where they belong and stops the imports that make a codebase drift, like app code pulling in server code, handlers importing each other, or one business domain reaching into another. It also catches the mistakes that only show up in Studio or in production, like schema fields that never reach the component, links Studio can't follow, or cookies the page cache hands to every visitor.

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

`ui-kit-tags` and `token-namespaces` read the app's installed `@laioutr-core/ui-kit`, `@laioutr-core/ui` and `@laioutr-core/canonical-types`, so install the app's dependencies first. larrylint stops with an error when one of them is missing.

## Rules

### Structure

| Rule | Description |
| --- | --- |
| `larrylint/layers` | App, server and shared code stay apart, and runtime code doesn't import build-time code, or `node:` modules outside the server. Nothing imports orchestr handlers, only handlers and media libraries import middleware, and API clients stay out of handlers and server utils. Utils are the bottom layer, followed by composables, components and sections. Domains stay apart. |
| `larrylint/known-folders` | Runtime files live in the folders of the [layout](#layout), where the other rules know what to check. |
| `larrylint/heavy-imports` | Sections, blocks and plugins load the packages in `heavyPackages` with `import()`. Laioutr registers them globally, so a static import lands in the chunk every page loads. |
| `larrylint/config-keys` | Runtime config keys like `'@laioutr-app/shopware'` are the app itself or one of its dependencies, otherwise the config is missing at runtime. |
| `larrylint/public-config` | The module doesn't copy its options into `runtimeConfig.public`, which reaches the browser with every token among them. |

Type imports are fine across most layers, since they don't end up in the bundle.

### Orchestr

| Rule | Description |
| --- | --- |
| `larrylint/orchestr-files` | Laioutr loads every file in `orchestr/` as a server plugin, so only handler files belong there. |
| `larrylint/orchestr-cookies` | Handlers and middleware don't set cookies or redirect, since the page cache replays the response to every visitor. |
| `larrylint/handler-domains` | Handlers live in a domain folder, e.g. `orchestr/<domain>/`. |
| `larrylint/handler-exports` | Handler files export their handler as default and nothing else. |
| `larrylint/handler-context` | Handlers take config and clients from the middleware context and the request from their arguments, not from `useRuntimeConfig()` or `useEvent()`. |
| `larrylint/resolver-undefined` | Component resolvers resolve fields to empty values like `''`, not `undefined` or `null`, which Studio shows as "...". |
| `larrylint/resolver-passthrough` | Component resolvers use `passthrough.get()`: `require()` fails the whole resolver when another query didn't set the value. |
| `larrylint/action-errors` | Actions return client errors as a status in their output. A thrown 4xx arrives as a failed action, since the action transport drops status codes. |
| `larrylint/middleware-files` | `server/middleware/` only holds orchestr and Nitro middleware; helpers go to `server/utils/`. |
| `larrylint/initware-throws` | `extendRequest()` doesn't throw, directly or through a function it calls: it runs before every query, so a throw takes down every page. |
| `larrylint/orchestr-meta` | `defineOrchestr.meta({ app })` is the package name, which traces use to tell which app's middleware ran. |
| `larrylint/token-namespaces` | Your own tokens stay out of the namespaces of Laioutr's canonical types, like `ecommerce/`, where registration order decides which handler wins. |
| `larrylint/token-nullable` | Entity component tokens have no nullable top-level fields, which Studio can't bind. |

### Sections and blocks

| Rule | Description |
| --- | --- |
| `larrylint/definition-folder` | `defineSection()` lives in `app/sections/` and `defineBlock()` in `app/blocks/`, and every `.vue` there has one. |
| `larrylint/definition-prefix` | Sections are named `Section*.vue`, blocks `Block*.vue`. |
| `larrylint/component-name` | The `component` of a definition matches its file name. |
| `larrylint/definition-description` | Definitions have a `studio.description`, which Studio shows in its section and block picker. |
| `larrylint/root-id` | The root element has no `id`: frontend-core replaces it with its own. |
| `larrylint/single-root` | Sections and blocks render one root element, also through a component they wrap. Otherwise Vue drops the `data-lfc-*` markers frontend-core adds. |
| `larrylint/slot-children` | Nothing counts slot children with `.length`: Studio passes all blocks of a slot as one Fragment. |
| `larrylint/reserved-field-names` | No top-level schema fields named `style`, `class`, `key`, `ref`, `is`, `slot`, `refFor` or `refKey`, which Vue swallows before they reach the component. |
| `larrylint/field-name-case` | Top-level schema fields are camelCase, since they become props. |
| `larrylint/required-fields` | Schema fields have no `required`, which Studio ignores. Give them a `default` instead. |
| `larrylint/schema-groups` | Schema groups are Studio's panels, in the order Content, Design, Rules. |
| `larrylint/unused-fields` | The component reads every schema field it defines, so editors don't get fields that do nothing. |
| `larrylint/dead-fallbacks` | No `??` fallbacks or `undefined` checks on props that are never `undefined`: unset checkbox, select, radio and toggle fields arrive as `false`, unset text fields as `''`. |

### Frontend

| Rule | Description |
| --- | --- |
| `larrylint/button-type` | No `type` on the ui-kit button: it always renders its `button-type` prop, so `type="submit"` silently renders a dead button. Autofixable. |
| `larrylint/ui-kit-tags` | `<l-*>` tags are ui-kit or ui components. Anything else renders nothing. |
| `larrylint/mutation-errors` | An awaited or dropped `mutateAsync()` handles its error. Otherwise a failed mutation replaces the whole section or block with frontend-core's "Retry" state. |
| `larrylint/orchestr-store` | Components read orchestr data through composables, not `useOrchestrStore()`. |
| `larrylint/resolve-result` | Nothing tests the result of `linkResolver.resolve()`, which is never empty: a link it can't resolve comes back as a `#missing-required-params…` string. |
| `larrylint/hand-built-links` | Internal links come from `linkResolver`, not from paths like `` `/hotels/${slug}` ``, which break when a page type's route changes. |
| `larrylint/internal-anchors` | Internal links use `<NuxtLink>`: a plain `<a>` reloads the page and breaks Studio's navigation sync. |

### Canonical types

| Rule | What it checks |
| --- | --- |
| `larrylint/money` | Money amounts are integers in minor units, e.g. `1999` for 19.99, and currencies are ISO 4217 codes like `EUR`. |

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
    │   ├── shared-fields/     # schema fields sections and blocks share
    │   ├── theme/
    │   └── utils/
    ├── server/
    │   ├── orchestr/
    │   │   ├── <domain>/      # *.query.ts, *.resolver.ts, *.link.ts, *.action.ts, *.template.ts, *.page-index.ts
    │   │   └── plugins/
    │   ├── middleware/        # orchestr middleware and the builders handlers use
    │   ├── client/            # API clients, nothing else
    │   ├── api/               # server routes, or routes/
    │   ├── plugins/           # Nitro plugins
    │   ├── media-library/     # or media-libraries/
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

Most apps need none. Two options tune the rules:

- `sharedDomains`: domains every other domain may import, for `layers`.
- `heavyPackages`: packages that sections, blocks and plugins must load with `import()`, for `heavy-imports`.

Set them in your `package.json`:

```json
{
  "larrylint": {
    "sharedDomains": ["product"],
    "heavyPackages": ["leaflet"]
  }
}
```

Or in a `larrylint.config.ts`:

```ts
import { defineLarrylintConfig } from 'larrylint'

export default defineLarrylintConfig({
  sharedDomains: ['product'],
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
