const robots = {
  state: require('./robots/state'),
  input: require('./robots/input'),
  text: require('./robots/text'),
  image: require('./robots/image'),
  video: require('./robots/video'),
  youtube: require('./robots/youtube')
}

const orchestrator = (async function () {
  robots.input()
  await robots.text()
  await robots.image()
  //await robots.video()
  //await robots.youtube()

  const content = robots.state.load()
  //console.dir(content, { depth: null })
})()
