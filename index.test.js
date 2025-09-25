"use strict";
// Copyright ©2025 Quinn A Michaels; All rights reserved. 
// Legal Signature Required For Lawful Use.
// Distributed under VLA:47847759280011485514 LICENSE.md
// Support Deva test file

const {expect} = require('chai')
const :key: = require('./index.js');

describe(SupportDeva.me.name, () => {
  beforeEach(() => {
    return SupportDeva.init()
  });
  it('Check the DEVA Object', () => {
    expect(SupportDeva).to.be.an('object');
    expect(SupportDeva).to.have.property('agent');
    expect(SupportDeva).to.have.property('vars');
    expect(SupportDeva).to.have.property('listeners');
    expect(SupportDeva).to.have.property('methods');
    expect(SupportDeva).to.have.property('modules');
  });
})
