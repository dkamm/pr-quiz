// See: https://rollupjs.org/introduction/

import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import json from '@rollup/plugin-json'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Plugin to copy views and public directories
function copyWebAssets() {
  return {
    name: 'copy-web-assets',
    writeBundle() {
      // Copy views directory
      const srcViewsDir = join(__dirname, 'src/web/views')
      const distViewsDir = join(__dirname, 'dist/views')

      mkdirSync(distViewsDir, { recursive: true })

      const viewFiles = readdirSync(srcViewsDir)
      viewFiles.forEach((file) => {
        copyFileSync(join(srcViewsDir, file), join(distViewsDir, file))
      })

      // Copy public directory
      const srcPublicDir = join(__dirname, 'src/web/public')
      const distPublicDir = join(__dirname, 'dist/public')

      try {
        mkdirSync(distPublicDir, { recursive: true })
        const publicFiles = readdirSync(srcPublicDir)
        publicFiles.forEach((file) => {
          const srcPath = join(srcPublicDir, file)
          const distPath = join(distPublicDir, file)
          if (statSync(srcPath).isFile()) {
            copyFileSync(srcPath, distPath)
          }
        })
      } catch (e) {
        // Public directory might not exist, that's ok
      }

      console.log('✅ Copied web assets to dist/')
    }
  }
}

const config = {
  input: 'src/index.js',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
    sourcemap: true
  },
  external: [
    '@ngrok/ngrok',
    'express',
    'ejs'
    //'@actions/core',
    //'@actions/github',
    //'@octokit/rest',
    //'openai'
  ],
  plugins: [
    json(),
    commonjs(),
    nodeResolve({ preferBuiltins: true }),
    copyWebAssets() // Copy the template files
  ]
}

export default config
