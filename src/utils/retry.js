/**
 * Executes a function with exponential backoff retry logic
 * @param {Function} fn - The async function to execute
 * @param {Object} options - Retry configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {Function} options.shouldRetry - Optional function to determine if retry should occur (default: retry on any error)
 * @returns {Promise<any>} - The result of the function execution
 */
export async function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000, shouldRetry = () => true } = options

  let retryCount = 0

  while (true) {
    try {
      return await fn()
    } catch (error) {
      if (retryCount === maxRetries || !shouldRetry(error)) {
        throw new Error(
          `Operation failed after ${retryCount} retries: ${error.message}`
        )
      }

      const delay = baseDelay * Math.pow(2, retryCount)
      await new Promise((resolve) => setTimeout(resolve, delay))
      retryCount++
    }
  }
}
