'use strict'

const bluebird = require('bluebird')
const url = require('url')
const GitHubApi = require('github')
const parseGithubUrl = require('parse-github-repo-url')
const debug = require('debug')('github-post-release')
const newPublicCommits = require('new-public-commits').newPublicCommits
const R = require('ramda')
const pluralize = require('pluralize')
const join = require('path').join
const utils = require('./utils')
const formChangelog = require('./changelog').formChangelog

// :: -> [issue numbers]
function getClosedIssues () {
  return newPublicCommits().then(utils.commitsToIssues)
}

function getGitHub (githubUrl, token) {
  if (!token) {
    throw new Error('Missing gh token')
  }
  const githubConfig = githubUrl ? url.parse(githubUrl) : {}

  let protocol = (githubConfig.protocol || '').split(':')[0] || null
  if (protocol === 'git+https') {
    debug('switching github protocol from %s to https', protocol)
    protocol = 'https'
  }

  let host = githubConfig.hostname
  if (host === 'github.com') {
    // https://github.com/mikedeboer/node-github/issues/544
    debug('using api.github.com host')
    host = 'api.github.com'
  }

  const config = {
    version: '3.0.0',
    port: githubConfig.port,
    protocol,
    host
  }
  debug('github config')
  debug(config)

  const github = new GitHubApi(config)

  github.authenticate({
    type: 'token',
    token: token
  })

  const createComment = bluebird.promisify(github.issues.createComment)
  return createComment
}

function getGitHubToken () {
  return process.env.GH_TOKEN
}

function commentOnIssues (repoUrl, message, debugMode, issues) {
  if (!issues) {
    return Promise.resolve()
  }
  if (R.isEmpty(issues)) {
    debug('no issues to comment on')
    return Promise.resolve()
  }

  const createComment = debugMode
    ? R.identity
    : getGitHub(repoUrl, getGitHubToken())
  const parsed = parseGithubUrl(repoUrl)
  const owner = parsed[0]
  const repo = parsed[1]
  debug(
    'commenting on %d %s: %j',
    issues.length,
    pluralize('issues', issues.length),
    issues
  )

  const onPosted = number => () => {
    console.log('posted comment for issue', number)
  }

  const onFailed = number => err => {
    console.error('Could not comment on issue', number)
    console.error(err)
  }

  const commentPromises = issues.map(number =>
    createComment({ owner, repo, number, body: message })
      .then(onPosted(number))
      .catch(onFailed(number))
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
  debug('debug mode?', config.debug)

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
    debug('generate changelog for release version %s', pkg.version)
    return formChangelog(pkg.version)
  }

  const owner = parsedRepo[0]
  const repo = parsedRepo[1]
  const message = utils.formMessage(owner, repo, pkg.name, pkg.version)

  getClosedIssues()
    .then(R.partial(commentOnIssues, [repoUrl, message, config.debug]))
    .catch(commentingFailed)
    .then(generateChangeLog)
    .then(onSuccess, onFailure)
}

module.exports = githubPostRelease

if (!module.parent) {
  console.log('demo run')
  const pkg = require(join(__dirname, '..', 'package.json'))
  const generateNotes = R.path(['release', 'generateNotes'])(pkg)
  const config = R.is(Object, generateNotes) ? generateNotes : {}
  githubPostRelease(config, { pkg: pkg }, (err, changelog) => {
    console.log('finished with')
    console.log('err?', err)
    console.log('changelog\n' + changelog)
  })
}
