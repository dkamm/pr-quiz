import * as core from '@actions/core'
import * as github from '@actions/github'
import { Octokit } from '@octokit/rest'
import OpenAI from 'openai'
import Server from './web/Server.js'
import createApp from './web/createApp.js'
import QuizMaker from './quiz/QuizMaker.js'
import fetchPullRequest from './pull-request/fetchPullRequest.js'
import DefaultSystemPrompt from './quiz/DefaultSystemPrompt.js'

/**
 * The main function for the action.
 *
 * @returns {Promise<void>} Resolves when the action is complete.
 */
async function run() {
  const context = github.context

  // Have to use process.env because inputs are not passed through to underlying steps for composite actions.
  const config = {
    githubToken: process.env.INPUT_GITHUB_TOKEN,
    openaiApiKey: process.env.INPUT_OPENAI_API_KEY,
    ngrokAuthToken: process.env.INPUT_NGROK_AUTHTOKEN,
    linesChangedThreshold: parseInt(process.env.INPUT_LINES_CHANGED_THRESHOLD),
    model: process.env.INPUT_MODEL,
    timeLimitMinutes: parseInt(process.env.INPUT_TIME_LIMIT_MINUTES),
    excludeFilePatterns: JSON.parse(process.env.INPUT_EXCLUDE_FILE_PATTERNS),
    systemPrompt: process.env.INPUT_SYSTEM_PROMPT || DefaultSystemPrompt
  }

  // Create Github client
  const octokit = new Octokit({ auth: config.githubToken })

  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: config.openaiApiKey
  })

  // Fetch the pull request
  const pullRequest = await fetchPullRequest(
    octokit,
    context.repo.owner,
    context.repo.repo,
    context.payload.pull_request.number,
    config.excludeFilePatterns
  )

  // Check if the pull request is too small to create a quiz
  if (pullRequest.getLinesOfCodeChanged() < config.linesChangedThreshold) {
    core.info(
      `🚫 Pull request is too small to create a quiz (${config.linesChangedThreshold} lines required)`
    )
    return
  } else {
    core.info(
      `🔍 Pull request has ${pullRequest.getLinesOfCodeChanged()} lines of code changed`
    )
  }

  // Create quiz maker
  const quizMaker = new QuizMaker(config.model, openai, config.systemPrompt)

  // Generate quiz for pull request
  core.info('🤖 Generating quiz...')
  const { quiz, usage } =
    await quizMaker.generateQuizForPullRequest(pullRequest)
  core.info(`💰 Token Usage
┌──────────────────┬──────────┐
│ Token Type       │    Count │
├──────────────────┼──────────┤
│ Prompt           │ ${usage.prompt_tokens.toString().padStart(8)} │
│ Completion       │ ${usage.completion_tokens.toString().padStart(8)} │
│ Reasoning        │ ${usage.completion_tokens_details.reasoning_tokens.toString().padStart(8)} │
│ Total            │ ${usage.total_tokens.toString().padStart(8)} │
└──────────────────┴──────────┘`)

  // Create server
  const onCorrect = () => {
    core.info('🎉 Quiz passed!')
  }
  const onIncorrect = () => {
    core.info('🚫 Quiz failed. Try again!')
  }
  const server = new Server({
    port: 3000,
    createApp: (onShutdown) =>
      createApp(onShutdown, quiz, pullRequest.html_url, onCorrect, onIncorrect),
    ngrokAuthToken: config.ngrokAuthToken
  })

  // Start server
  await server.start()

  // Notify user of quiz URL
  core.info(`📝 Quiz created! Take the quiz at ${server.getUrl()}`)

  // Set time limit for the quiz
  setTimeout(
    async () => {
      await server.shutdown()
      // Fail the action if time limit is reached
      core.setFailed('🕒 Failed to complete quiz in time')
      // Need to actually exit the process with an error code to fail the action
      process.exit(1)
    },
    config.timeLimitMinutes * 60 * 1000
  )
}

export default run
