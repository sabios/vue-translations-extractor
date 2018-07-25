const fs = require('fs')
const path = require('path')
const queue = require('queue')
const glob = require('multi-glob').glob
const VueParser = require('./vue-parser')
const Extractor = require('./extractor')

const argv = require('yargs')
  .alias('output', 'o')
  .describe('output', 'The output file. It should be your template.pot')
  .alias('src', 's')
  .describe('src', 'The source folder for vue/html/js files')
  .demand(['src', 'output'])
  .argv

const outputFile = argv.output
let srcFolders = !Array.isArray(argv.src) ? [argv.src] : argv.src

const { extractor, parserJS, parserHTML } = Extractor.init(srcFolders)

const getVueSrcFiles = () => srcFolders.map(src => `${src}/**/*.vue`)

const q = queue({
  concurrency: 1
})

const parseString = (parser, snippet, filename) => {
  parser.parseString(snippet.code, filename, {
    lineNumberStart: snippet.line
  })
}

const syncTemplatePot = () => {
  let outputFolder = path.dirname(outputFile)

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder)
  }
  fs.writeFileSync(outputFile, '')

  extractor.savePotFile(outputFile)
  extractor.printStats()
}

glob(getVueSrcFiles(), (err, files) => {
  if (!err) {
    files.map((filename) => {
      q.push(async (cb) => {
        const snippets = await VueParser.parseVueFile(filename)

        for (let i = 0; i < snippets.length; i++) {
          parseString(parserJS, snippets[i], filename)
          parseString(parserHTML, snippets[i], filename)
        }

        cb()
      })
    })

    q.start((err) => {
      if (!err) {
        syncTemplatePot()
      } else {
        console.error(err)
      }
    })
  } else {
    console.error(err)
  }
})
