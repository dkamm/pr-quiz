import picomatch from 'picomatch'
import PullRequest from './PullRequest.js'

async function fetchPullRequest(
  octokit,
  owner,
  repo,
  pullNumber,
  excludeFilePatterns = []
) {
  // Fetch the pull request
  const prResponse = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber
  })
  const pr = prResponse.data

  // Fetch the files in the pull request
  const filesResponse = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber
  })
  const excludeMatcher = picomatch(excludeFilePatterns, { dot: true })
  const files = filesResponse.data.filter(
    (file) => !excludeMatcher(file.filename)
  )

  // Fetch the comments in the pull request
  const commentsResponse = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: pullNumber
  })
  const comments = commentsResponse.data

  // Fetch the reviews in the pull request
  const reviewsResponse = await octokit.rest.pulls.listReviews({
    owner,
    repo,
    pull_number: pullNumber
  })
  const reviews = reviewsResponse.data

  return new PullRequest(pr, files, comments, reviews)
}

export default fetchPullRequest
