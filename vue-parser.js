const fs = require('fs')
const SAXParser = require('parse5-sax-parser')
const Readable = require('stream').Readable

const SELF_CLOSING_TAGS = [
	'area',
	'base',
	'br',
	'col',
	'command',
	'embed',
	'hr',
	'img',
	'input',
	'keygen',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]

const parseVueFile = (filename) => {
  return new Promise((resolve) => {
    const readStream = fs.createReadStream(filename, {
      encoding: 'utf8'
    })

    const parser = new SAXParser({
      sourceCodeLocationInfo: true
    })

    let depth = 0

    const sectionLocations = {
      template: null,
      script: null
    }

    // Get the location of the `template` and `script` tags, which should be top-level
    parser.on('startTag', token => {

      let name = token.tagName
      let location = token.sourceCodeLocation
      let selfClosing = token.selfClosing

      if (depth === 0) {
        if (name === 'template' || name === 'script') {
          sectionLocations[name] = {
            start: location.endOffset,
            line: location.startLine
          }
        }
      }

      if (!(selfClosing || SELF_CLOSING_TAGS.indexOf(name) > -1)) {
        depth++
      }
    })

    parser.on('endTag', token => {

      let name = token.tagName
      let location = token.sourceCodeLocation

      depth--

      if (depth === 0) {
        if (name === 'template' || name === 'script') {
          sectionLocations[name].end = location.startOffset
        }
      }
    })

    readStream.on('open', () => {
      readStream.pipe(parser)
    })

    readStream.on('end', () => {
      const content = fs.readFileSync(filename, {
        encoding: 'utf8'
      })

      // Get the contents of the `template` and `script` sections, if present.
      // We're assuming that the content is inline, not referenced by an `src` attribute.
      // https://vue-loader.vuejs.org/en/start/spec.html
      let template = null
      let script = null

      const snippets = []

      if (sectionLocations.template) {
        template = content.substr(
          sectionLocations.template.start,
          sectionLocations.template.end - sectionLocations.template.start
        )
      }

      if (sectionLocations.script) {
        snippets.push({
          filename,
          code: content.substr(
            sectionLocations.script.start,
            sectionLocations.script.end - sectionLocations.script.start
          ),
          line: sectionLocations.script.line
        })
      }

      // Parse the template looking for JS expressions
      const templateParser = new SAXParser({
        sourceCodeLocationInfo: true
      })

      // Look for JS expressions in tag attributes
      templateParser.on('startTag', token => {

        let attrs = token.attrs
        let location = token.sourceCodeLocation

        for (let i = 0; i < attrs.length; i++) {
          // We're only looking for data bindings, events and directives
          let name = attrs[i].name

          if (name.match(/^(:|@|v-)/)) {
            snippets.push({
              filename,
              code: attrs[i].value,
              line: location.attrs[name].startLine
            })
          }
        }
      })

      // Look for interpolations in text contents.
      // We're assuming {{}} as delimiters for interpolations.
      // These delimiters could change using Vue's `delimiters` option.
      // https://vuejs.org/v2/api/#delimiters
      templateParser.on('text', token => {

        let text = token.text
        let location = token.sourceCodeLocation

        let exprMatch
        let lineOffset = 0

        while (exprMatch = text.match(/{{([\s\S]*?)}}/)) {
          const prevLines = text.substr(0, exprMatch.index).split(/\r\n|\r|\n/).length
          const matchedLines = exprMatch[1].split(/\r\n|\r|\n/).length

          lineOffset += prevLines - 1

          snippets.push({
            code: exprMatch[1],
            line: location.startLine + lineOffset
          })

          text = text.substr(exprMatch.index + exprMatch[0].length)

          lineOffset += matchedLines - 1
        }
      })

      const s = new Readable

      s.on('end', () => {
        resolve(snippets)
      })

      s.push(template)
      s.push(null)

      s.pipe(templateParser)
    })
  })
}

module.exports = {
  parseVueFile
}