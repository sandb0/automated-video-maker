const fs = require('fs')
const contentFilePath = './content.json'

const robot = function () {
  function save (content) {
    const contentString = JSON.stringify(content)

    return fs.writeFileSync(contentFilePath, contentString)
  }

  function load () {
    const fileBuffer = fs.readFileSync(contentFilePath, 'utf-8')
    const contentJSON = JSON.parse(fileBuffer)

    return contentJSON
  }

  return {
    save,
    load
  }
}

module.exports = robot()