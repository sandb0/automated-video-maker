const gm = require('gm').subClass({ imageMagick: true })
const childProcessSpawn = require('child_process').spawn
const path = require('path')

const rootPath = path.resolve(__dirname, '..')

const state = require('./state')

const robot = async function () {
  console.log('> [video-robot] Starting...')

  const content = state.load()

  await convertAllImages(content)
  await writeCaptionInAllImages(content)
  await createYouTubeThumbnail()
  await createAfterEffectsScript(content)
  await renderVideoWithAfterEffects()

  console.log('\n\n\n')

  state.save(content)

  async function convertAllImages (content) {
    const sentences = content.sentences

    for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
      await convertImage(sentenceIndex)
    }
  }

  async function convertImage (sentenceIndex) {
    return new Promise((resolve, reject) => {
      const inputFile = `./content/${sentenceIndex}-original.png[0]`
      const outputFile = `./content/${sentenceIndex}-converted.png`
      const width = 1920
      const height = 1080

      gm()
        .in(inputFile)
        .out('(')
          .out('-clone')
          .out('0')

          .out('-background', 'white')
          .out('-blur', '0x9')
          .out('-resize', `${width}x${height}^`)
        .out(')')
        .out('(')
          .out('-clone')
          .out('0')

          .out('-background', 'white')
          .out('-resize', `${width}x${height}`)
        .out(')')
        .out('-delete', '0')
        .out('-gravity', 'center')
        .out('-compose', 'over')
        .out('-composite')
        .out('-extent', `${width}x${height}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error)
          }

          console.log(`> [video-robot] Image converted: ${outputFile}`)
          resolve()
        })
    })
  }

  async function writeCaptionInAllImages (content) {
    const sentences = content.sentences

    for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
      await writeCaptionInImage(sentenceIndex, content.sentences[sentenceIndex].text)
    }
  }

  function writeCaptionInImage (sentenceIndex, sentenceText) {
    return new Promise((resolve, reject) => {
      const outputFile = `./content/${sentenceIndex}-sentence.png`

      const templateSettings = {
        0: {
          size: '1920x400',
          gravity: 'center'
        },
        1: {
          size: '1920x1080',
          gravity: 'center'
        },
        2: {
          size: '800x1080',
          gravity: 'west'
        },
        3: {
          size: '1920x400',
          gravity: 'center'
        },
        4: {
          size: '1920x1080',
          gravity: 'center'
        },
        5: {
          size: '800x1080',
          gravity: 'west'
        },
        6: {
          size: '1920x400',
          gravity: 'center'
        },
      }

      gm()
        .out('-size', templateSettings[sentenceIndex].size)
        .out('-gravity', templateSettings[sentenceIndex].gravity)
        .out('-background', 'transparent')
        .out('-fill', 'white')
        .out('-kerning', '-1')
        .out(`caption:${sentenceText}`)
        .write(outputFile, (error) => {
          if (error) {
            return reject(error)
          }

          console.log(`> [video-robot] Sentence created: ${outputFile}`)
          resolve()
        })
    })
  }

  function createYouTubeThumbnail () {
    return new Promise((resolve, reject) => {
      gm()
        .in('./content/0-converted.png')
        .write('./content/youtube-thumbnail.jpg', (error) => {
          if (error) {
            return reject(error)
          }

          console.log('> [video-robot] YouTube thumbnail created.')
          resolve()
        })
    })
  }
  
  async function createAfterEffectsScript (content) {
	await state.saveToScript(content)
  }
  
  async function renderVideoWithAfterEffects () {
	  return new Promise((resolve, reject) => {
		const aerenderFilePath = 'C:\\Program Files\\Adobe\\Adobe After Effects 2020\\Support Files\\aerender.exe'
		const templateFilePath = `${rootPath}/templates/1/template.aep`
		const destinationFilePath = `${rootPath}/content/output.mov`
		
		console.log('> [video-robot] Starting After Effects')
		
		const params = [
			'-comp', 'main',
			'-project', templateFilePath,
			'-output', destinationFilePath
		]
		const aerender = new childProcessSpawn(aerenderFilePath, params)
		
		aerender.stdout.on('data', (data) => {
			process.stdout.write(data)
		})
		
		aerender.on('close', () => {
			console.log('> [video-robot] After Effects Done.')
			resolve()
		})
	  })
  }
}

module.exports = robot