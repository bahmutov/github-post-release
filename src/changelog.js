const R = require('ramda')
const leavePublic = require('new-public-commits').leavePublic
const newPublicCommits = require('new-public-commits').newPublicCommits
const { stripIndent } = require('common-tags')
const la = require('lazy-ass')
const is = require('check-more-types')
const simple = require('simple-commit-message')

const toMessages = R.map(R.prop('message'))

function groupCommits (commits) {
  const parsed = toMessages(commits).map(simple.parse).filter(is.defined)
  const grouped = R.groupBy(R.prop('type'), parsed)
  return grouped
}

function commitSubjectList (commits) {
  return commits.map(R.prop('subject')).map(s => '* ' + s).join('\n')
}

function commitsToString (commits) {
  const filtered = leavePublic(commits)
  const grouped = groupCommits(filtered)
  let msg = ''

  if (is.array(grouped.major)) {
    msg +=
      '## Breaking major changes 🔥\n' + commitSubjectList(grouped.major) + '\n'
  }
  if (is.array(grouped.feat)) {
    msg += '## New features 👍\n' + commitSubjectList(grouped.feat) + '\n'
  }
  if (is.array(grouped.fix)) {
    msg += '## Bug fixes ✅\n' + commitSubjectList(grouped.fix) + '\n'
  }
  return msg
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

module.exports = {
  formChangelog,
  versionAndCommitsToLog,
  commitsToString,
  groupCommits
}