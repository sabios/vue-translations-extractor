const glob = require("multi-glob").glob
const queue = require('queue')
const Extractor = require('./extractor')
const VueParser = require('./vue-parser')

const argv = require('yargs')
  .alias('output', 'o')
  .describe('output', 'The output file. It should be your template.pot')
  .alias('src', 's')
  .describe('src', 'The source folder for vue/html/js files')
  .demand(['src', 'output'])
  .argv

const outputFile = argv.output
const srcFolders = !Array.isArray(argv.src) ? [argv.src] : argv.src

const { extractor, parserJS, parserHTML } = Extractor.init(srcFolders, outputFile)

const q = queue({
  concurrency: 1
})

const getVueFilesPatterns = () => srcFolders.map(src => `${src}/**/*.vue`)

glob(getVueFilesPatterns(), (err, files) => {
  if (!err) {
    files.map((filename) => {
      q.push((cb) => {
        // console.log("parsing " + filename)
        VueParser.parseVueFile(filename).then((snippets) => {
          for (let i = 0; i < snippets.length; i++) {
            parserJS.parseString(snippets[i].code, filename, {
              lineNumberStart: snippets[i].line
            })
            parserHTML.parseString(snippets[i].code, filename, {
              lineNumberStart: snippets[i].line
            })
          }

          cb()
        })
      })
    })

    q.start((err) => {
      if (!err) {
        extractor.syncTemplatePot()
      }
    })
  }
})