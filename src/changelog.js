const R = require('ramda')
const leavePublic = require('new-public-commits').leavePublic
const newPublicCommits = require('new-public-commits').newPublicCommits
const { stripIndent } = require('common-tags')
const la = require('lazy-ass')
const is = require('check-more-types')

function commitsToString (commits) {
  const filtered = leavePublic(commits)
  const messages = R.map(R.prop('message'))(filtered)
  return messages.join('\n')
}

function getDateString () {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

function versionAndCommitsToLog (version, commits) {
  const date = getDateString()
  const head = stripIndent`
    <a name="${version}"></a>
    # ${version} (${date})
  `
  const commitsLog = commitsToString(commits)
  return head + '\n' + commitsLog
}

function formChangelog (version) {
  la(is.unemptyString(version), 'missing release version')
  return newPublicCommits().then(commits =>
    versionAndCommitsToLog(version, commits)
  )
}

module.exports = { formChangelog, versionAndCommitsToLog, commitsToString }
