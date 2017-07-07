'use strict'

const bluebird = require('bluebird')
const url = require('url')
const GitHubApi = require('github')
const parseGithubUrl = require('parse-github-repo-url')
const debug = require('debug')('github-post-release')
const newPublicCommits = require('new-public-commits').newPublicCommits
const { partial, identity, is, path } = require('ramda')
const pluralize = require('pluralize')
const join = require('path').join
const streamToPromise = require('stream-to-promise')
const changelog = require('conventional-changelog')
const { commitsToIssues } = require('./utils')

// :: -> [issue numbers]
function getClosedIssues () {
  return newPublicCommits().then(commitsToIssues)
}

function getGitHub (githubUrl, token) {
  if (!token) {
    throw new Error('Missing gh token')
  }
  var githubConfig = githubUrl ? url.parse(githubUrl) : {}

  var github = new GitHubApi({
    version: '3.0.0',
    port: githubConfig.port,
    protocol: (githubConfig.protocol || '').split(':')[0] || null,
    host: githubConfig.hostname
  })

  github.authenticate({
    type: 'oauth',
    token: token
  })

  const createComment = bluebird.promisify(github.issues.createComment)
  return createComment
}

function getGitHubToken () {
  return process.env.GH_TOKEN
}

function commentOnIssues (repoUrl, message, debug, issues) {
  if (!issues) {
    return Promise.resolve()
  }
  if (!issues.lenth) {
    return Promise.resolve()
  }

  const createComment = debug ? identity : getGitHub(repoUrl, getGitHubToken())
  const parsed = parseGithubUrl(repoUrl)
  const user = parsed[0]
  const repo = parsed[1]
  debug(
    'commenting on %d %s: %j',
    issues.length,
    pluralize('issues', issues.length),
    issues
  )

  const commentPromises = issues.map(number =>
    createComment({ user, repo, number, message }).catch(err => {
      console.error('Could not comment on issue', number)
      console.error(err)
    })
  )

  return bluebird.all(commentPromises)
}

// should call "callback" function with (err, changelog)
function githubPostRelease (pluginConfig, config, callback) {
  // debug('custom plugin config', pluginConfig)
  // debug('config parameter', config)
  const pkg = config.pkg
  const repoUrl = pkg.repository.url
  const parsedRepo = parseGithubUrl(repoUrl)

  debug('published version %s', pkg.version)
  debug('repo url %s', repoUrl)

  const onSuccess = changelog => {
    debug('✅  all done, with message: %s', message)
    debug('changelog:')
    debug(changelog)
    callback(null, changelog)
  }

  const onFailure = err => {
    console.error('🔥  failed with error')
    console.error(err)
    callback(err)
  }

  const commentingFailed = err => {
    console.error('😟  commenting on related issues failed')
    console.error(err)
  }

  const generateChangeLog = () => {
    debug('generate changelog')
    return streamToPromise(
      changelog({
        version: pkg.version,
        repository: parsedRepo,
        fail: false
      })
    ).then(buffer => buffer.toString())
  }

  const message = `Version ${pkg.version} has been published.`
  getClosedIssues()
    .then(partial(commentOnIssues, [repoUrl, message, config.debug]))
    .catch(commentingFailed)
    .then(generateChangeLog)
    .then(onSuccess, onFailure)
}

module.exports = githubPostRelease

if (!module.parent) {
  console.log('demo run')
  const pkg = require(join(__dirname, '..', 'package.json'))
  const generateNotes = path(['release', 'generateNotes'])(pkg)
  const config = is(Object, generateNotes) ? generateNotes : {}
  githubPostRelease(config, { pkg }, (err, changelog) => {
    console.log('finished with')
    console.log('err?', err)
    console.log('changelog\n' + changelog)
  })
}
