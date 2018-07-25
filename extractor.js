const gettext = require('gettext-extractor')
const GettextExtractor = gettext.GettextExtractor
const JsExtractors = gettext.JsExtractors
const HtmlExtractors = gettext.HtmlExtractors

const init = (srcFolders) => {
  const extractor = new GettextExtractor()
  const parserJS = extractor
    .createJsParser([
      // Place all the possible expressions to extract here:
      JsExtractors.callExpression(['$t', '[this].$t', 'i18n.t', 'translate'], {
        arguments: {
          text: 0
        }
      })
    ])
    .parseFilesGlob(`(${srcFolders.join('|')})/**/*.js`)

  const parserHTML = extractor
    .createHtmlParser([
      // Place all the possible expressions to extract here:
      HtmlExtractors.elementAttribute('[v-translate]', 'v-translate'),
    ])
    .parseFilesGlob(`src/**/*.html`)
    .parseFilesGlob(`src/**/*.vue`)

  return { extractor, parserJS, parserHTML }
}

module.exports = {
  init
}

