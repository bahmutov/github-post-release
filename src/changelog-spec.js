'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')

/* global describe, it */
const { commitsToString, versionAndCommitsToLog } = require('./changelog')

const commits = [
  {
    message: 'feat(streams): output stdout and stderr, fixes #1, #2'
  },
  {
    message: 'initial (6f272d6)'
  },
  {
    message: 'limit builds on CI to Node 6 (dfe6bd5)'
  }
]

describe('commits to changelog', () => {
  it('is a function', () => {
    la(is.fn(commitsToString))
  })

  it('forms changelog', () => {
    const log = commitsToString(commits)
    console.log(log)
  })
})

describe('full changelog message', () => {
  const version = '1.0.2'

  it('version and public commits', () => {
    const log = versionAndCommitsToLog(version, commits)
    console.log(log)
  })
})
