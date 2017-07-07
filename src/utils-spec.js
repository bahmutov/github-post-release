'use strict'

/* global describe, it */
const snapshot = require('snap-shot')

describe('utils', () => {
  const { commitsToIssues } = require('./utils')

  it('finds fixed issue in 1 commit', () => {
    const commits = [
      {
        id: 'b0be94741486803ab26bb0397d8992e45bed1acd',
        message: 'fix(ggit): bring ggit fix #2',
        body: ''
      }
    ]
    const issues = commitsToIssues(commits)
    snapshot(issues)
  })

  it('finds several closed issues', () => {
    const commits = [
      {
        id: 'b0be94741486803ab26bb0397d8992e45bed1acd',
        message: 'fix(ggit): bring ggit fix #2',
        body: 'and resolves #4'
      },
      {
        id: 'b0be94741486803ab26b50397d8992e45bed1acd',
        message: 'fix(ggit): subject',
        body: 'closed #2, #3'
      }
    ]
    const issues = commitsToIssues(commits)
    snapshot(issues)
  })
})
