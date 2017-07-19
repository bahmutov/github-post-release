'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const snapshot = require('snap-shot')

/* global describe, it */
const {
  commitsToString,
  versionAndCommitsToLog,
  groupCommits
} = require('./changelog')

const commit = 'aaaabbbbccccddddeeeeffff1111222233334444'
const commits = [
  {
    message: 'feat(streams): output stdout and stderr, fixes #1, #2',
    id: commit
  },
  {
    message: 'initial (6f272d6)',
    id: commit
  },
  {
    message: 'limit builds on CI to Node 6 (dfe6bd5)',
    id: commit
  },
  {
    message: 'fix(doc): updated documentation',
    id: commit
  }
]

describe('commits to changelog', () => {
  it('is a function', () => {
    la(is.fn(commitsToString))
  })

  it('forms changelog', () => {
    const log = commitsToString(commits)
    snapshot(log)
  })
})

describe('full changelog message', () => {
  const version = '1.0.2'

  it('version and public commits', () => {
    const MockDate = require('mockdate')
    MockDate.set('4/20/2000')
    const log = versionAndCommitsToLog(version, commits)
    snapshot(log)
    MockDate.reset()
  })
})

describe('group commits by type', () => {
  it('groups', () => {
    const groups = groupCommits(commits)
    snapshot(groups)
  })
})
