const googleapis = require('googleapis').google
const googleSearchCredentials = require('../credentials/google-search.json')
const imageDownloader = require('image-downloader')
const gm = require('gm').subClass({ imageMagick: true })

const state = require('./state')

const customSearch = googleapis.customsearch('v1')

const robot = async function () {
  const content = state.load()

  await fetchImagesOfAllSentences(content)
  await downloadAllImages(content)
  await convertAllImages(content)
  await writeCaptionInAllImages(content)
  await createYouTubeThumbnail()

  state.save(content)

  async function fetchImagesOfAllSentences (content) {
    for (const sentence of content.sentences) {
      let query = `${content.searchTerm} ${sentence.keywords[0]}`

      sentence.images = await fetchGoogleAndReturnImagesURLs(query)

      const length = sentence.keywords.length

      for (let i = 0; i < length; i++) {
        if (sentence.images.length === 0) {
          query = `${content.searchTerm} ${sentence.keywords[i]}`
          sentence.images = await fetchGoogleAndReturnImagesURLs(query)
        } else {
          break;
        }
      }

      sentence.googleSearchQuery = query
    }
  }

  async function fetchGoogleAndReturnImagesURLs (query) {
    const response = await customSearch.cse.list({
      auth: googleSearchCredentials.apiKey,
      cx: googleSearchCredentials.searchEngineId,
      q: query,
      searchType: 'image',
      num: 2
    })

    let imagesURLs = []

    if (response.data && response.data.items !== undefined) {
      imagesURLs = response.data.items.map(item => {
        return item.link
      })
    }

    return imagesURLs
  }

  async function downloadAllImages (content) {
    content.downloadedImages = []

    const sentences = content.sentences

    for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
      const images = content.sentences[sentenceIndex].images

      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        const imageURL = images[imageIndex]

        try {
          if (content.downloadedImages.includes(imageURL)) {
            throw new Error('Imagem já foi baixada.')
          }

          await downloadAndSave(imageURL, `${sentenceIndex}-original.png`)
          content.downloadedImages.push(imageURL)

          break;
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  function downloadAndSave (url, fileName) {
    return imageDownloader.image({
      url,
      dest: `./content/${fileName}`
    })
  }

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

          console.log(`> Image converted: ${inputFile}`)
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
      const outputFile = `./content/${sentenceIndex}-caption.png`

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

          console.log(`> Caption created: ${outputFile}`)
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

          console.log('> Creating YouTube thumbnail.')
          resolve()
        })
    })
  }
}

module.exports = robot