// Algorithmia.
const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
// IBM Watson.
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const watsonApiKey = require('../credentials/watson-nlu.json').apikey
// Sentence Boundary Detection.
const sentenceBoundaryDetection = require('sbd')

const robots = {
  state: require('./state')
}

const nlu = new NaturalLanguageUnderstandingV1({
  authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

const robot = async function () {
  const content = robots.state.load()

  await fetchContentFromWikipedia(content)
  sanitizeContent(content)
  breakContentIntoSentences(content)
  limiteMaximumSentences(content)
  await fetchKeywordsOfAllSentences(content)

  robots.state.save(content)

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
        keywords: [],
        images: []
      })
    })
  }

  function limiteMaximumSentences (content) {
    content.sentences = content.sentences.slice(0, content.maximumSentences)
  }

  async function fetchKeywordsOfAllSentences (content) {
    for (const sentence of content.sentences) {
      sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    }
  }

  function fetchWatsonAndReturnKeywords (sentence) {
    return new Promise((resolve, reject) => {
      // Use relevant keywords to search images.
      nlu.analyze({
        html: sentence,
        features: {
          concepts: {},
          keywords: {}
        }
      })
        .then(response => {
          const keywords = response.result.keywords.map(keyword => {
            return keyword.text
          });

          resolve(keywords)
        })
    })
  }
}

module.exports = robot