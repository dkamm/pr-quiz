import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'
import { withRetry } from '../utils/retry.js'

const Choices = z.object({
  a: z.string(),
  b: z.string(),
  c: z.string(),
  d: z.string()
})

const MultipleChoiceQuestion = z.object({
  question: z.string(),
  choices: Choices,
  answer: z.string()
})

const Quiz = z.object({
  questions: z.array(MultipleChoiceQuestion)
})

class QuizMaker {
  constructor(model, client, systemPrompt) {
    this.model = model
    this.client = client
    this.systemPrompt = systemPrompt
  }

  async generateQuizForPullRequest(pullRequest) {
    return withRetry(
      async () => {
        const prompt = `${pullRequest.toXML()}\n\nGenerate 3-5 multiple choice questions that test understanding of this pull request.`

        const completion = await this.client.chat.completions.parse({
          model: this.model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            { role: 'user', content: prompt }
          ],
          response_format: zodResponseFormat(Quiz, 'quiz')
        })

        const message = completion.choices[0]?.message

        if (message?.parsed) {
          return {
            quiz: message.parsed,
            usage: completion.usage
          }
        } else {
          throw new Error('Failed to generate questions')
        }
      },
      {
        maxRetries: 3,
        baseDelay: 1000
      }
    )
  }
}

export default QuizMaker
