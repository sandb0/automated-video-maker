const robots = {
  userInput: require('./robots/user-input'),
  text: require('./robots/text'),
  state: require('./robots/state')
}

const orchestrator = (async function () {
  robots.userInput()
  await robots.text()

  const content = robots.state.load()
  console.dir(content, { depth: null })
})()
