const readline = require('readline-sync')

const orchestrator = (function () {
  /**
   * Estado:
   * Termo da busca, sentenças encontradas, URL das imagens, etc.
   */
  const content = {}

  content.searchTerm = askAndReturnSearchTerm()
  content.searchPrefix = askAndReturnSearchPrefix(content.searchTerm)

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

  console.log(content)
})()
