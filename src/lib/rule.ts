import type { Rule } from 'eslint'
import type { AST } from 'vue-eslint-parser'
import type { FileInfo } from '../laioutr/layout'

import { classify } from '../laioutr/layout'
import { readBaseline } from './baseline'

export type TemplateListener = Record<string, (node: never) => void>

interface VueParserServices {
  defineTemplateBodyVisitor?: (templateListener: TemplateListener, scriptListener?: Rule.RuleListener) => Rule.RuleListener
}

export interface RuleSetup {
  /** The ESLint rule context. */
  context: Rule.RuleContext
  /** The linted file. */
  file: FileInfo
  /** Reports a violation; the baseline decides at the end of the file whether it shows. */
  report: (descriptor: Rule.ReportDescriptor) => void
  /** Also visits the `<template>` of a Vue file, after the script. */
  visitTemplate: (listener: TemplateListener) => void
}

export interface LarrylintRule {
  /** The metadata for the rule, like its name, description and type. */
  meta: Rule.RuleMetaData
  /** Whether the rule checks a file; tests and files outside `src/` are always skipped. */
  applies: (file: FileInfo) => boolean
  /** Creates the script listeners; `Program:exit` runs after the template. */
  create: (setup: RuleSetup) => Rule.RuleListener
}

/**
 * Defines a larrylint rule whose reports go through the baseline at the end of the file.
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
