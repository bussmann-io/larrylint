import { defineRule } from '../../lib/rule'
import { FILE_START } from '../../utils/ast/location'

export default defineRule({
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require runtime files to live in the folders of the Laioutr app layout.',
    },
    schema: [],
    messages: {
      unknown: 'larrylint doesn\'t know {{folder}}, so no rule checks what\'s in it. Move the file into one of the folders of the Laioutr app layout.',
    },
  },

  applies: file => (file.side === 'app' || file.side === 'server') && file.kind === 'other',

  create: ({ file, report }) => ({
    Program: () => {
      const [side, folder] = file.path.slice(file.path.indexOf('/runtime/') + '/runtime/'.length).split('/')

      report({ loc: FILE_START, messageId: 'unknown', data: { folder: `${side}/${folder}/` } })
    },
  }),
})
