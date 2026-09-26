#!/usr/bin/env node
import { defineCommand, runMain } from 'citty'
import { description, version } from '../../package.json'
import { cwdArgs } from './utils/args'

const main = defineCommand({
  meta: {
    name: 'larrylint',
    version,
    description,
  },

  args: cwdArgs,

  subCommands: {
    check: () => import('./commands/check').then(m => m.default),
    init: () => import('./commands/init').then(m => m.default),
  },

  default: 'check',
})

runMain(main)
