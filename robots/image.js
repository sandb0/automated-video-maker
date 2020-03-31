const googleapis = require('googleapis').google
const googleSearchCredentials = require('../credentials/google-search.json')
const imageDownloader = require('image-downloader')

const state = require('./state')

const customSearch = googleapis.customsearch('v1')

const robot = async function () {
  console.log('> [image-robot] Starting...')

  const content = state.load()

  await fetchImagesOfAllSentences(content)
  await downloadAllImages(content)

  console.log('\n\n\n')

  state.save(content)

  async function fetchImagesOfAllSentences (content) {
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      let query = ''

      if (sentenceIndex === 0) {
        query = `${content.searchTerm}`
      } else {
        query = `${content.searchTerm} ${content.sentences[sentenceIndex].keywords[0]}`
      }

      console.log(`> [image-robot] Querying Google Images with "${query}"`)

      content.sentences[sentenceIndex].images = await fetchGoogleAndReturnImagesURLs(query)

      const length = content.sentences[sentenceIndex].keywords.length

      for (let i = 0; i < length; i++) {
        if (content.sentences[sentenceIndex].images.length === 0) {
          query = `${content.searchTerm} ${content.sentences[sentenceIndex].keywords[i]}`
          content.sentences[sentenceIndex].images = await fetchGoogleAndReturnImagesURLs(query)
        } else {
          break;
        }
      }

      content.sentences[sentenceIndex].googleSearchQuery = query
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
            throw new Error('Image already downloaded')
          }

          await downloadAndSave(imageURL, `${sentenceIndex}-original.png`)
          content.downloadedImages.push(imageURL)
          console.log(`> [image-robot] [${sentenceIndex}][${imageIndex}] Image successfully downloaded: ${imageURL}`)

          break;
        } catch (error) {
          console.log(`> [image-robot] [${sentenceIndex}][${imageIndex}] Error: ${imageURL}`)
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