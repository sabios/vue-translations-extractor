const fs = require('fs')
const path = require('path')
const gettext = require('gettext-extractor')
const GettextExtractor = gettext.GettextExtractor
const JsExtractors = gettext.JsExtractors
const HtmlExtractors = gettext.HtmlExtractors

const init = (srcFolders, outputFile) => {
  const extractor = new GettextExtractor()

  const parserJS = extractor
    .createJsParser([
      // Place all the possible expressions to extract here:
      JsExtractors.callExpression(['$t', '[this].$t', 'i18n.t'], {
        arguments: {
          text: 0
        }
      })
    ])

  const parserHTML = extractor
    .createHtmlParser([
      // Place all the possible expressions to extract here:
      HtmlExtractors.elementAttribute('[v-translate]', 'v-translate'),
    ])

  for (let src of srcFolders) {
    parserJS.parseFilesGlob(`${src}/**/*.js`)
    parserHTML.parseFilesGlob(`${src}/**/*.html`)
    parserHTML.parseFilesGlob(`${src}/**/*.vue`)
  }

  extractor.syncTemplatePot = function() {
    let outputFolder = path.dirname(outputFile)
  
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder)
    }
    fs.writeFileSync(outputFile, '')
  
    this.savePotFile(outputFile)
    this.printStats()
  }

  return { extractor, parserJS, parserHTML }
}


module.exports = {
  init
}

