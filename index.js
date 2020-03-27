const robots = {
  userInput: require('./robots/user-input'),
  text: require('./robots/text')
}

const orchestrator = (async function () {
  /**
   * Estado:
   * Termo da busca, sentenças encontradas, URL das imagens, etc.
   */
  const content = {}

  robots.userInput(content)
  await robots.text(content)
})()
