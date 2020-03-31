const express = require('express')
const google = require('googleapis').google
const youtube = google.youtube({ version: 'v3' })
const OAuth2 = google.auth.OAuth2
const fs = require('fs')

const state = require('./state')

const robot = async function () {
	console.log('> [youtube-robot] Starting...')

	const content = state.load()

	await authenticateWithOAuth()
	const videoInformation = await uploadVideo(content)
	await uploadThumbnail(videoInformation)

	console.log('\n\n\n')
	
	async function authenticateWithOAuth () {
		const webServer = await startWebServer()
		const oAuth2Client = await createOAuthClient()
		requestUserConsent(oAuth2Client)
		const authorizationToken = await waitForGoogleCallback(webServer)
		await requestGoogleForAccessTokens(oAuth2Client, authorizationToken)
		await setGlobalGoogleAuthentication(oAuth2Client)
		await stopWebServer(webServer)
		
		async function startWebServer () {
			return new Promise((resolve, reject) => {
				const port = 5000
				const app = express()
				
				const server = app.listen(port, () => {
					console.log(`> [youtube-robot] Web server listening on http://localhost:${port}`)
					
					resolve({app, server})
				})
			})
		}
		
		async function createOAuthClient () {
			const credentials = require('../credentials/google-youtube.json')
			
			const OAuth2Client = new OAuth2(
				credentials.web.client_id,
				credentials.web.client_secret,
				credentials.web.javascript_origins[0]
			)
			
			return OAuth2Client
		}
		
		function requestUserConsent (oAuth2Client) {
			const consentURL = oAuth2Client.generateAuthUrl({
				access_type: 'offline',
				scope: ['https://www.googleapis.com/auth/youtube']
			})
			
			console.log(`> [youtube-robot] Please give your consent: ${consentURL}`)
		}
		
		async function waitForGoogleCallback (webServer) {
			return new Promise((resolve, reject) => {
				console.log('> [youtube-robot] Wait for user consent...')
				
				webServer.app.get('/', (request, response) => {
					const authCode = request.query.code
					console.log(`> [youtube-robot] Consent given: ${authCode}`)
					
					response.send('<h1>Thank you!</h1><p>Now you can close this tab.</p>')
					resolve(authCode)
				})
			})
		}
		
		async function requestGoogleForAccessTokens (oAuth2Client, authorizationToken) {
			return new Promise((resolve, reject) => {
				oAuth2Client.getToken(authorizationToken, (error, tokens) => {
					if (error) {
						return reject(error)
					}
					
					console.log('> [youtube-robot] Access token received: ')
					//console.log(tokens)
					oAuth2Client.setCredentials(tokens)
					resolve()
				})
			})
		}
		
		function setGlobalGoogleAuthentication (oAuth2Client) {
			google.options({ auth: oAuth2Client })
		}
		
		async function stopWebServer (webServer) {
			return new Promise((resolve, reject) => {
				webServer.server.close(() => {
					console.log('Server closed.')
					resolve()
				})
			})
		}
	}
	
	async function uploadVideo (content) {
		const videoFilePath = './content/main.mp4'
		const videoFileSize = fs.statSync(videoFilePath).size
		const videoTitle = `${content.searchPrefix} ${content.searchTerm}`
		const videoTags = [content.searchTerm, ...content.sentences[0].keywords]
		const videoDescription = content.sentences.map((sentence) => {
			return sentence.text
		}).join('\n\n')
		
		const requestParameters = {
			part: 'snippet, status',
			requestBody: {
				snippet: {
					title: videoTitle,
					description: videoDescription,
					tags: videoTags
				},
				status: {
					privacyStatus: 'unlisted'
				}
			},
			media: {
				body: fs.createReadStream(videoFilePath)
			}
		}
		
		console.log('> [youtube-robot] Starting to upload the video to YouTube')

		const youtubeResponse = await youtube.videos.insert(requestParameters, {
			onUploadProgress
		})
		
		console.log(`> [youtube-robot] Video avaiable at: https://youtu.be/${youtubeResponse.data.id}`)
		return youtubeResponse.data
		
		function onUploadProgress (event) {
			const progress = Math.round((event.bytesRead / videoFileSize) * 100)
			console.log(`> [youtube-robot] Progress: ${progress}% complete`)
		}
	}
	
	async function uploadThumbnail (videoInformation) {
		const videoId = videoInformation.id
		const videoThumbnailFilePath = './content/youtube-thumbnail.jpg'
		
		const requestParameters = {
			videoId,
			media: {
				mimeType: 'image/jpeg',
				body: fs.createReadStream(videoThumbnailFilePath)
			}
		}
		
		const youtubeResponse = await youtube.thumbnails.set(requestParameters)
		
		console.log(`> [youtube] Video thumbnail uploaded.`)
	}

	state.save(content)
}

module.exports = robot