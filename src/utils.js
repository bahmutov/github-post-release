const debug = require('debug')('github-post-release')
const { uniq, flatten } = require('ramda')
const commitCloses = require('commit-closes')
const pluralize = require('pluralize')

function hasIssues (issues) {
  return issues.length > 0
}

function findIssues (commit) {
  return commitCloses(commit.message, commit.body)
}

function commitsToIssues (commits) {
  debug(
    'have %d semantic %s',
    commits.length,
    pluralize('commit', commits.length)
  )
  if (!commits.length) {
    return []
  }
  debug(commits)

  const closedIssues = flatten(commits.map(findIssues).filter(hasIssues))
  debug('semantic commits close the following issues')
  debug(closedIssues)
  const uniqueIssues = uniq(closedIssues)
  debug('unique closed issues', uniqueIssues)
  return uniqueIssues
}

function formReleaseUrl (user, repo, tag) {
  return `https://github.com/${user}/${repo}/releases/tag/${tag}`
}

function formReleaseText (repo, tag) {
  return `${repo}/releases/tag/${tag}`
}

module.exports = {
  commitsToIssues,
  formReleaseUrl,
  formReleaseText
}
