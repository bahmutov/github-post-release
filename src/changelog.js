const R = require('ramda')
const leavePublic = require('new-public-commits').leavePublic
const newPublicCommits = require('new-public-commits').newPublicCommits
const { stripIndent } = require('common-tags')
const la = require('lazy-ass')
const is = require('check-more-types')
const simple = require('simple-commit-message')

const isCommit = is.schema({
  id: is.commitId,
  subject: is.unemptyString,
  type: is.unemptyString,
  scope: is.unemptyString
})

function groupCommits (commits) {
  const parsed = commits
    .map(c => {
      const p = simple.parse(c.message)
      if (p) {
        p.id = c.id
      }
      return p
    })
    .filter(is.defined)
  const grouped = R.groupBy(R.prop('type'), parsed)
  return grouped
}

const shortCommit = s => s.substr(0, 8)

function commitString (commit) {
  la(isCommit(commit), 'invalid commit format', commit)
  return (
    '* ' +
    commit.subject +
    ' ([' +
    shortCommit(commit.id) +
    '](#' +
    commit.id +
    '))'
  )
}

function commitSubjectList (commits) {
  return commits.map(commitString).join('\n')
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
