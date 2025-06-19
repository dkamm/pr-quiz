import express from 'express'
import session from 'express-session'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { marked } from 'marked'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function checkAnswers(answers, questions) {
  return questions.every(
    (question, index) => answers[index.toString()] === question.answer
  )
}

function createApp(onShutdown, quiz, pullRequestUrl, onCorrect, onIncorrect) {
  const app = express()

  // Session middleware for storing quiz answers
  app.use(
    session({
      secret: crypto.randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
    })
  )

  // Middleware for parsing urlencoded form data
  app.use(express.urlencoded({ extended: true }))

  // Serve static files from src/web/public
  app.use(express.static(path.join(__dirname, 'public')))

  // Set up views directory
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')

  app.get('/', (req, res) => {
    res.render('quiz', {
      quiz: quiz,
      marked: marked,
      answers: req.session.answers
    })
  })

  app.post('/submit', (req, res) => {
    const answers = req.body

    // Store answers in session
    req.session.answers = answers

    // Check if answers are correct
    if (checkAnswers(answers, quiz.questions)) {
      res.render('correct', { pullRequestUrl })
      if (onCorrect) {
        onCorrect()
      }
      // Wait some time before shutting down to allow the user to see the correct answer
      new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
        onShutdown()
      })
    } else {
      res.render('incorrect')
      if (onIncorrect) {
        onIncorrect()
      }
    }
  })

  return app
}

export default createApp
