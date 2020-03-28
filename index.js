const robots = {
  state: require('./robots/state'),
  input: require('./robots/input'),
  text: require('./robots/text'),
  image: require('./robots/image')
}

const orchestrator = (async function () {
  robots.input()
  await robots.text()
  await robots.image()

  const content = robots.state.load()
  //console.dir(content, { depth: null })
})()
