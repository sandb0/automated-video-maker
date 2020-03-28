const googleapis = require('googleapis').google
const googleSearchCredentials = require('../credentials/google-search.json')
const imageDownloader = require('image-downloader')

const state = require('./state')

const customSearch = googleapis.customsearch('v1')

const robot = async function () {
  const content = state.load()

  await fetchImagesOfAllSentences(content)
  await downloadAllImages(content)

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
}

module.exports = robot