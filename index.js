// Copyright (c)2023 Quinn Michaels
// Support Deva
// Support Deva manages the support eatures of deva.world.
const fs = require('fs');
const path = require('path');
const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  describe: package.description,
  version: package.version,
  url: package.homepage,
  git: package.repository.url,
  bugs: package.bugs.url,
  author: package.author,
  license: package.license,
  copyright: package.copyright,
};

const data_path = path.join(__dirname, 'data.json');
const {agent,vars} = require(data_path).DATA;

const Deva = require('@indra.ai/deva');
const SUPPORT = new Deva({
  info,
  agent: {
    id: agent.id,
    key: agent.key,
    prompt: agent.prompt,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input, route=false) {
      // with the parse method we are going to take the input with a
      // values object to provide the personalization
      let output = input;
      if (route) for (let x in route) {
        const key = `::${x}::`;
        const value = route[x];
        output = output.replace(key, value);
      }
      return output.trim();
    },
    process(input) {
      return input.trim();
    }
  },
  vars,
  listeners: {},
  modules: {},
  deva: {},
  func: {
    sup_question(packet) {return;},
    sup_answer(packet) {return;},
  },
  methods: {
    /**************
    method: issue
    params: packet
    describe: create a new issue for the main deva.world through github agent.
    ***************/
    issue(packet) {
      const agent = this.agent();
      return new Promise((resolve, reject) => {
        this.question(`#github issue:${agent.key} ${packet.q.text}`).then(issue => {
          return resolve({
            text: issue.a.text,
            html: issue.a.html,
            data: issue.a.data,
          })
        }).catch(err => {
          return this.error(err, packet, reject);
        });
      });
    },

    /**************
    method: uid
    params: packet
    describe: Return a system id to the user from the :name:.
    ***************/
    uid(packet) {
      this.contect('uid');
      return Promise.resolve(this.uid());
    },
    /**************
    method: status
    params: packet
    describe: Return the current status of the :name:.
    ***************/
    status(packet) {
      this.context('status');
      return Promise.resolve(this.status());
    },
    /**************
    method: help
    params: packet
    describe: The Help method returns the information on how to use the :name:.
    ***************/
    help(packet) {
      this.context('help');
      return new Promise((resolve, reject) => {
        this.help(packet.q.text, __dirname).then(help => {
          return this.question(`#feecting parse ${help}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        }).catch(reject);
      });
    }
  },
  onDone(data) {
    this.listen('devacore:question', this.func.sup_question);
    this.listen('devacore:answer', this.func.sup_answer);
    return Promise.resolve(data);
  },
});
module.exports = SUPPORT
