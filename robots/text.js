const algorithmia = require('algorithmia')
const sentenceBoundaryDetection = require('sbd')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey

const robot = async function (content) {
  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)

  async function fetchContentFromWikipedia (content) {
    const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
    const wikipediaParserAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
    const wikipediaResponse = await wikipediaParserAlgorithm.pipe({articleName: content.searchTerm, lang: 'pt'})
    const wikipediaContent = wikipediaResponse.get()

    content.sourceContentRaw = wikipediaContent.content
  }

  function sanitizeContent (content) {
    const contentIntoLines = content.sourceContentRaw.split('\n')
    const withoutBlankLines = removeBlankLines(contentIntoLines)
    const withoutMarkdown = removeMarkdown(withoutBlankLines)
    const withoutDates = removeDates(withoutMarkdown.join(' '))

    content.sourceContentSanitized = withoutDates
    
    function removeBlankLines (text) {
      return text.filter(line => {
        if (line.trim().length === 0) {
          return false
        }

        return true
      })
    }

    function removeMarkdown (text) {
      return text.filter(line => {
        if (line.trim().startsWith('=')) {
          return false
        }

        return true
      })
    }

    function removeDates(text) {
      return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
    }
  }

  function breakContentIntoSentences (content) {
    content.sentences = []

    const sentences = sentenceBoundaryDetection
      .sentences(content.sourceContentSanitized)

    sentences.forEach(sentence => {
      content.sentences.push({
        text: sentence,
        keyworks: [],
        images: []
      })
    })
  }
}

module.exports = robot