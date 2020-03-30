const state = require('./state')

const robot = async function () {
	const content = state.load()

	await authenticateWithOAuth()
	await uploadVideo()
	await uploadThumbnail()
	
	async function authenticateWithOAuth () {
		await startWebServer()
		
		function startWebServer () {
			
		}
	}
	
	async function uploadVideo() { }
	
	async function uploadVideo() { }

	state.save(content)
}

module.exports = robot