import fs from 'fs'
import { join, resolve } from 'path'
import { minify } from 'terser'

const JS_EXTENSION = '.js'

function getAllFiles (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles ?? []

  files.forEach(function (file) {
    if (fs.statSync(join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(join(dirPath, file), arrayOfFiles)
    } else {
      arrayOfFiles.push(resolve(dirPath, file))
    }
  })

  return arrayOfFiles.filter(path => path.endsWith(JS_EXTENSION))
}

(function () {
  const [dir] = process.argv.slice(2)
  const filePaths = getAllFiles(dir)
  const options = { compress: { ecma: 2015 } }
  filePaths.forEach(async (filePath) => {
    const minifiedData = await (minify(fs.readFileSync(filePath).toString(), options))
    fs.writeFileSync(
      filePath,
      minifiedData.code
    )
  })
})()
