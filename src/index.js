'use strict'

var bluebird = require('bluebird')
var url = require('url')
var GitHubApi = require('github')
var parseGithubUrl = require('parse-github-repo-url')
var debug = require('debug')('github-post-release')
const newPublicCommits = require('new-public-commits').newPublicCommits
const commitCloses = require('commit-closes')
const {uniq, partial} = require('ramda')
const pluralize = require('pluralize')

module.exports = githubNotifier

function commitToIsses (commit) {
  return commitCloses(commit.message, commit.body)
}

function hasIssues (issues) {
  return issues.length > 0
}

function issuesToCommits (commits) {
  debug('have %d semantic commits', commits.length)
  if (!commits.length) {
    return []
  }

  const closedIssues = commits.map(commitToIsses)
    .filter(hasIssues)
  debug('semantic commits close the following issues')
  debug(closedIssues)
  const uniqueIssues = uniq(closedIssues)
  debug('unique closed issues', uniqueIssues)
  return uniqueIssues
}

// :: -> [issue numbers]
function getClosedIssues () {
  return newPublicCommits()
    .then(issuesToCommits)
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

  var createComment = bluebird.promisify(github.issues.createComment)
  return createComment
}

function commentOnIssues (repoUrl, createComment, message, issues) {
  if (!issues) {
    return Promise.resolve()
  }
  if (!issues.lenth) {
    return Promise.resolve()
  }

  const parsed = parseGithubUrl(repoUrl)
  const user = parsed[0]
  const repo = parsed[1]
  debug('commenting on %d %s: %j',
    issues.length, pluralize('issues', issues.length), issues)

  const commentPromises = issues.map(number =>
    createComment({user, repo, number, message})
    .catch(err => {
      console.error('Could not comment on issue', number)
      console.error(err)
    })
  )

  return bluebird.all(commentPromises)
}

function githubNotifier (pluginConfig, config, callback) {
  // debug('plugin config', pluginConfig)
  // debug('pkg', config.pkg)

  const repoUrl = config.pkg.repository.url
  const createComment = getGitHub(repoUrl, process.env.GH_TOKEN)
  const message = `Version ${config.pkg.version} has been published.`

  const onSuccess = () => {
    debug('✅  all done, with message: %s', message)
    callback()
  }

  const onFailure = (err) => {
    console.error('🔥  failed with error')
    console.error(err)
    callback(err)
  }

  getClosedIssues()
    .then(partial(commentOnIssues, [repoUrl, createComment, message]))
    .then(onSuccess, onFailure)

  // newCommits()
  //   .then(function (commits) {
  //     debug('have %d semantic commits', commits.length)
  //     if (!commits.length) {
  //       console.log('no commits')
  //       return callback()
  //     }

  //     const closedIssues = commits.map(commitToIsses)
  //       .filter(hasIssues)
  //     console.log('semantic commits close the following issues')
  //     console.log(closedIssues)
  //     const uniqueIssues = uniq(closedIssues)
  //     console.log('unique closed issues', uniqueIssues)
  //     if (!uniqueIssues.length) {
  //       return callback()
  //     }

  //     // should it be pkg or repo url?
  //       var parsedGithubUrl = parseGithubUrl(config.pkg.repository.url);
  //       commitParser(commits)
  //         .pipe(through.obj(function (commit, enc, cb) {
  //           debug('notifying for commit %j', commit);
  //           var commentPromises = _.map(commit.references, function (reference) {
  //             debug('commit involves issue reference %j', reference);
  //             var msg = {
  //               user: parsedGithubUrl[0],
  //               repo: parsedGithubUrl[1],
  //               number: reference.issue,
  //               message: 'Version ' + config.pkg.version + ' has been published.',
  //             };

  //             // return createComment(msg);
  //             return bluebird.resolve()
  //           });

  //           bluebird.all(commentPromises)
  //             .then(function () {
  //               debug('all done')
  //               cb(null, commit);
  //             })
  //             .catch(function (err) {
  //               cb(err);
  //             });
  //         }))
  //         .on('error', function () {
  //           callback(false);
  //         })
  //         .on('finish', function () {
  //           callback(true);
  //         });
  //   }).catch(console.error)

  debug('parsing repo url %s', config.pkg.repository.url)
  debug('for published version %s', config.pkg.version)
}
