import type { Rule } from 'eslint'
import type { AST } from 'vue-eslint-parser'
import type { FileInfo } from '../laioutr/layout'

import { classify } from '../laioutr/layout'
import { readBaseline } from './baseline'

/** Listeners for the nodes of a Vue `<template>`, keyed by selector like script listeners. */
export type TemplateListener = Record<string, (node: never) => void>

interface VueParserServices {
  defineTemplateBodyVisitor?: (templateListener: TemplateListener, scriptListener?: Rule.RuleListener) => Rule.RuleListener
}

export interface RuleSetup {
  context: Rule.RuleContext
  /** The linted file. */
  file: FileInfo
  /** Reports a violation; the baseline decides at the end of the file whether it shows. */
  report: (descriptor: Rule.ReportDescriptor) => void
  /** Also visits the `<template>` of a Vue file, after the script. */
  visitTemplate: (listener: TemplateListener) => void
}

export interface LarrylintRule {
  meta: Rule.RuleMetaData
  /** Whether the rule looks at a file. Tests and files outside `src/` are always skipped. */
  applies: (file: FileInfo) => boolean
  /** Returns the script listeners. `Program:exit` runs once the whole file, template included, is visited. */
  create: (setup: RuleSetup) => Rule.RuleListener
}

/**
 * Defines a larrylint rule. Reports only reach ESLint at the end of the file, once the file has
 * more violations of the rule than its baseline allows, like ESLint's own bulk suppressions.
 *
 * @param rule The rule.
 *
 * @returns The ESLint rule.
 */
export function defineRule(rule: LarrylintRule): Rule.RuleModule {
  return {
    meta: rule.meta,

    create(context) {
      const file = classify(context.filename)

      if (!file || file.test || !rule.applies(file)) {
        return {}
      }

      const reports: Rule.ReportDescriptor[] = []
      let template: TemplateListener | undefined

      const { 'Program:exit': programExit, ...script } = rule.create({
        context,
        file,
        report: (descriptor) => {
          reports.push(descriptor)
        },
        visitTemplate: (listener) => {
          template = listener
        },
      })

      const program = context.sourceCode.ast as Rule.Node & AST.ESLintProgram

      const finish = () => {
        programExit?.(program as never)

        const settings = context.settings.larrylint as { baseline?: boolean } | undefined
        const allowed = settings?.baseline === false ? 0 : readBaseline(file.root)[file.path]?.[context.id] ?? 0

        if (reports.length > allowed) {
          for (const descriptor of reports) {
            context.report(descriptor)
          }
        }
      }

      const services = context.sourceCode.parserServices as VueParserServices | undefined

      // vue-eslint-parser visits the template after the script's `Program:exit`, so finish on its root instead.
      if (template && program.templateBody && services?.defineTemplateBodyVisitor) {
        const { 'VElement:exit': elementExit, ...listener } = template

        return services.defineTemplateBodyVisitor({
          ...listener,
          'VElement:exit': (node: AST.VElement) => {
            elementExit?.(node as never)

            if (node === program.templateBody) {
              finish()
            }
          },
        }, script)
      }

      return { ...script, 'Program:exit': finish }
    },
  }
}
