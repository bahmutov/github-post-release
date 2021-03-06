const debug = require('debug')('github-post-release')
const R = require('ramda')
const commitCloses = require('commit-closes')
const pluralize = require('pluralize')
const tags = require('common-tags')
const la = require('lazy-ass')
const is = require('check-more-types')

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

  const closedIssues = R.flatten(commits.map(findIssues).filter(hasIssues))
  debug('semantic commits close the following issues')
  debug(closedIssues)
  const uniqueIssues = R.uniq(closedIssues)
  debug('unique closed issues', uniqueIssues)
  return uniqueIssues
}

function formReleaseUrl (user, repo, tag) {
  return `https://github.com/${user}/${repo}/releases/tag/${tag}`
}

function formReleaseText (repo, tag) {
  return `${repo}/releases/tag/${tag}`
}

function formNpmMessage (owner, repo, name, version) {
  la(arguments.length === 4, 'invalid arguments', arguments)

  const vTag = `v${version}`
  const releaseText = formReleaseText(repo, vTag)
  const releaseUrl = formReleaseUrl(owner, repo, vTag)
  const nextUpdateUrl = 'https://github.com/bahmutov/next-update'
  const message = tags.stripIndent`
    Version \`${version}\` has been published to NPM. The full release note can be found at [${releaseText}](${releaseUrl}).

    **Tip:** safely upgrade dependency ${name} in your project using [next-update](${nextUpdateUrl})
  `
  return message
}

function formDeployMessage (owner, repo, name, version) {
  la(arguments.length === 4, 'invalid arguments', arguments)

  const vTag = `v${version}`
  const releaseText = formReleaseText(repo, vTag)
  const releaseUrl = formReleaseUrl(owner, repo, vTag)
  const message = tags.stripIndent`
    Version \`${version}\` has been deployed. The full release note can be found at [${releaseText}](${releaseUrl}).
  `
  return message
}

const isValidType = is.oneOf(['npm', 'publish', 'deploy'])

function formMessage (type, owner, repo, name, version) {
  la(isValidType(type), 'invalid message type', type)
  const form = {
    npm: formNpmMessage,
    publish: formNpmMessage,
    deploy: formDeployMessage
  }
  const action = form[type]
  la(is.fn(action), 'cannot find action for type', type)
  return action(owner, repo, name, version)
}

module.exports = {
  commitsToIssues: commitsToIssues,
  formReleaseUrl: formReleaseUrl,
  formReleaseText: formReleaseText,
  formMessage: formMessage
}
