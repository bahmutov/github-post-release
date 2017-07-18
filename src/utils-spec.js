'use strict'

/* global describe, it */
const snapshot = require('snap-shot')

describe('utils', () => {
  describe('utils.', () => {
    const utils = require('./utils')

    it('forms url', () => {
      snapshot(
        utils.formReleaseUrl('bahmutov', 'github-post-release', 'v1.4.0')
      )
    })
  })

  describe('formReleaseText', () => {
    const utils = require('./utils')

    it('forms release text', () => {
      snapshot(utils.formReleaseText('github-post-release', 'v1.4.0'))
    })
  })

  describe('formMessage', () => {
    const utils = require('./utils')

    it('forms full message', () => {
      snapshot(utils.formMessage('user', 'repo', 'my-module-name', '1.4.0'))
    })
  })

  describe('commitsToIssues', () => {
    const utils = require('./utils')

    it('finds fixed issue in 1 commit', () => {
      const commits = [
        {
          id: 'b0be94741486803ab26bb0397d8992e45bed1acd',
          message: 'fix(ggit): bring ggit fix #2',
          body: ''
        }
      ]
      const issues = utils.commitsToIssues(commits)
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
      const issues = utils.commitsToIssues(commits)
      snapshot(issues)
    })
  })
})
