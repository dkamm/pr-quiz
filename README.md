# PR Quiz - Make sure you understand your AI agent's code!

[![GitHub Super-Linter](https://github.com/dkamm/pr-quiz/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/dkamm/pr-quiz/actions/workflows/ci.yml/badge.svg)

## Intro

As AI SWE agents generate more code, the temptation for humans to just rubber
stamp it will grow stronger. This could lead to an increase in all types of
problems like bugs, security vulnerabilities or opportunities for unaligned
agents to sneak in malicious code.

PR Quiz serves as one line of defense against this by prompting human reviewers to
test their understanding of the code they "reviewed" before merging.

## Getting started

1. Make sure you have an OpenAI API Key and an ngrok auth token (free tier
   works).\*
2. Add the OpenAI API Key and ngrok auth token as action secrets to your
   repository (`settings -> secrets -> actions` in the UI)
3. Add the following `quiz.yml` to your `.github/workflows` directory

```yaml
# quiz.yml

name: PR Quiz

on:
  pull_request_review:
    types: [submitted]

permissions:
  contents: read
  pull-requests: read

jobs:
  quiz:
    name: PR Quiz
    runs-on: ubuntu-latest
    environment: pr-quiz
    # Only trigger on approvals to save tokens
    if: github.event.review.state == 'approved'

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Serve Quiz
        id: serve-quiz
        uses: dkamm/pr-quiz@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          ngrok-authtoken: ${{ secrets.NGROK_AUTHTOKEN }}
          minimum-lines-changed: 10
```

\*The PR Quiz action creates a temporary webserver inside the GitHub Actions
runner and uses ngrok to create a public tunnel to it

## Inputs

| Name                  | Description                                                                                                                           | Default Value                                                                                                                    | Required |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------- |
| github-token          | GitHub token for API access                                                                                                           | -                                                                                                                                | Yes      |
| ngrok-authtoken       | The ngrok authtoken to use for the server hosting the quiz.                                                                           | -                                                                                                                                | Yes      |
| openai-api-key        | OpenAI API key for API access                                                                                                         | -                                                                                                                                | Yes      |
| model                 | The model to use for generating the quiz. It must be a model that supports structured outputs.                                        | `gpt-4o`                                                                                                                         | No       |
| minimum-lines-changed | The minimum number of lines changed required to create a quiz. This is to prevent quizzes from being created for small pull requests. | `100`                                                                                                                            | No       |
| time-limit-minutes    | The time limit to complete the quiz in minutes. This prevents the action from running indefinitely.                                   | `10`                                                                                                                             | No       |
| exclude-file-patterns | A list of file patterns to exclude from the quiz as a JSON-ified string.                                                              | `'["**/*-lock.json", "**/*-lock.yaml", "**/*.lock", "**/*.map", "**/*.pb.*", "**/*_pb2.py", "**/*.generated.*", "**/*.auto.*"]'` | No       |
| system-prompt         | Optional override for the system prompt. Be sure the specify that multiple choice questions must be returned.                         | See [here](https://github.com/dkamm/pr-quiz/blob/main/src/quiz/DefaultSystemPrompt.js) for the default system prompt           | No       |

## Privacy & Security

Because this action runs a temporary webserver inside the GitHub Actions runner,
your code isn't sent to any third party other than the model provider. This
action can be easily modified to work with self-hosted models as well.
