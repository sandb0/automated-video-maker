const fs = require('fs')
const contentFilePath = './content.json'
const scriptFilePath = './content/after-effects-script.js'

const robot = function () {
  function save (content) {
    const contentString = JSON.stringify(content)

    return fs.writeFileSync(contentFilePath, contentString)
  }
  
  function saveToScript (content) {
	const contentString = JSON.stringify(content)
	const scriptString = `var content = ${contentString}`
	
    return fs.writeFileSync(scriptFilePath, scriptString)
  }

  function load () {
    const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
    const contentJSON = JSON.parse(fileBuffer)

    return contentJSON
  }

  return {
    save,
	saveToScript,
    load
  }
}

module.exports = robot()