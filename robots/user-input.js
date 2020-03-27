const readline = require('readline-sync')
const robots = {
  state: require('./state')
}

const robot = function () {
  const content = {
    maximumSentences: 7
  }

  content.searchTerm = askAndReturnSearchTerm()
  content.searchPrefix = askAndReturnSearchPrefix(content.searchTerm)
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
}

module.exports = robot