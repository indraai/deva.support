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
    describe: agent.describe,
    prompt: agent.prompt,
    voice: agent.voice,
    profile: agent.profile,
    translate(input) {
      return input.trim();
    },
    parse(input) {
      return input.trim();
    }
  },
  vars,
  listeners: {},
  modules: {},
  deva: {},
  func: {
    sup_question(packet) {
      const agent = this.agent();
      const support = this.support();
      support.personal.questions.push(packet);
    },
    sup_answer(packet) {
      const agent = this.agent();
      const support = this.support();
      support.personal.answers.push(packet);
    },
    async template(packet) {
      const agent = this.agent();
      const header = await this.question(this.vars.template.header.call);
      const footer = await this.question(this.vars.template.footer.call);
      return [
        `${this.vars.template.header.begin}:${header.id}`,
        header.a.text,
        `${this.vars.template.header.end}:${this.hash(header.a.text)}`,
        '',
        `${this.vars.template.content.begin}:${packet.id}`,
        '',
        this.vars.routes[this.vars.chat].greeting,
        '',
        packet.q.text,
        '',
        this.vars.template.content.sig,
        '',
        `${this.vars.template.content.end}:${this.hash(packet.q.text)}`,
        '',
        `${this.vars.template.footer.begin}${footer.id}`,
        footer.a.text,
        `${this.vars.template.footer.end}:${this.hash(footer.a.text)}`,
      ].join('\n');
    },
    async chat(packet) {
      if (packet.q.meta.params[1]) this.vars.chat = packet.q.meta.params[1];
      const route = this.vars.routes[this.vars.chat].cmd;
      const question = await this.func.template(packet);

      return new Promise((resolve, reject) => {
        if (!packet.q.text) return reject(this._messages.notext);
        this.question(`${route} ${question}`).then(answer => {
          return this.question(`#feecting parse ${answer.a.text}`);
        }).then(parsed => {
          return resolve({
            text: parsed.a.text,
            html: parsed.a.html,
            data: parsed.a.data,
          });
        }).catch(err => {
          return this.error(err, packet, reject);
        });
      });
    }
  },
  methods: {
    /**************
    func: chat
    params: packet
    describe: The chat relay interface to talk with the @api and @ui
    ***************/
    chat(packet) {
      return this.func.chat(packet);
    },
    /**************
    method: uid
    params: packet
    describe: Return a system id to the user from the :name:.
    ***************/
    uid(packet) {
      return Promise.resolve({text:this.uid()});
    },

    /**************
    method: status
    params: packet
    describe: Return the current status of the :name:.
    ***************/
    status(packet) {
      return this.status();
    },

    /**************
    method: help
    params: packet
    describe: The Help method returns the information on how to use the :name:.
    ***************/
    help(packet) {
      return new Promise((resolve, reject) => {
        this.lib.help(packet.q.text, __dirname).then(help => {
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
    this.listen('devacore:question', packet => {
      if (packet.q.text.includes(this.vars.trigger)) return this.func.sup_question(packet);
    });
    this.listen('devacore:answer', packet => {
      if (packet.a.text.includes(this.vars.trigger)) return this.func.sup_answer(packet);
    });
    return Promise.resolve(data);
  },
});
module.exports = SUPPORT
