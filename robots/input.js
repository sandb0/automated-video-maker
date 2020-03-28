const readline = require('readline-sync')
const robots = {
  state: require('./state')
}

const robot = function () {
  const content = {
    maximumSentences: 1,
    maximumKeywords: 1
  }

  content.searchTerm = askAndReturnSearchTerm()
  content.searchPrefix = askAndReturnSearchPrefix(content.searchTerm)
  content.maximumSentences = askAndReturnMaximumSentences(content.maximumSentences)
  content.maximumKeywords = askAndReturnMaximumKeywords(content.maximumKeywords)
  
  robots.state.save(content)

  function askAndReturnSearchTerm () {
    const searchTerm = readline.question('Type a Wikipedia search term: ')
  
    return searchTerm
  }
  
  function askAndReturnSearchPrefix (searchTerm) {
    const searchPrefixes = ['Who is', 'What is', 'The history of']
  
    const selectedSearchPrefixIndex = readline.keyInSelect(
      searchPrefixes,
      `Choose an option for "${searchTerm}": `
    )
    const selectedSearchPrefix = searchPrefixes[selectedSearchPrefixIndex]
  
    return selectedSearchPrefix
  }

  function askAndReturnMaximumSentences (defaultMaximumSentences) {
    let maximumSentences = readline.question(`How many sentences? (${defaultMaximumSentences}): `)
    
    if (maximumSentences <= 0) {
      maximumSentences = defaultMaximumSentences
    }

    return maximumSentences
  }

  function askAndReturnMaximumKeywords (defaultMaximumKeywords) {
    let maximumKeywords = readline.question(`How many keywords? (${defaultMaximumKeywords}): `)
  
    if (maximumKeywords <= 0) {
      maximumKeywords = defaultMaximumKeywords
    }

    return maximumKeywords
  }
}

module.exports = robot