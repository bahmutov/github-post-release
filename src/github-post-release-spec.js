'use strict'

const la = require('lazy-ass')
const is = require('check-more-types')
const join = require('path').join
const R = require('ramda')

/* global describe, it */
const githubPostRelease = require('.')
const pkg = require(join(__dirname, '..', 'package.json'))

describe('github-post-release', () => {
  it('is a function', () => {
    la(is.fn(githubPostRelease))
  })

  it('forms changelog', done => {
    const config = {
      debug: true
    }
    const json = R.clone(pkg)
    json.version = '1000.0.0'

    githubPostRelease(config, { pkg: json }, (err, log) => {
      la(!err, 'there was an error', err)
      la(is.unemptyString(log), 'missing log', log)
      console.log(log)
      done()
    })
  })
})
