// Copyright (c)2023 Quinn Michaels
// Support Deva
// Support Deva manages the support eatures of deva.world.
const package = require('./package.json');
const info = {
  id: package.id,
  name: package.name,
  describe: package.description,
  version: package.version,
  url: package.homepage,
  dir: __dirname,
  git: package.repository.url,
  bugs: package.bugs.url,
  author: package.author,
  license: package.license,
  copyright: package.copyright,
};

const {agent,vars} = require('./data.json').DATA;

const Deva = require('@indra.ai/deva');
const SUPPORT = new Deva({
  info,
  agent,
  vars,
  utils: {
    translate(input) {return input.trim();},
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
    process(input) {return input.trim();}
  },
  listeners: {},
  modules: {},
  deva: {},
  func: {
    sup_question(packet) {return;},
    sup_answer(packet) {return;},
  },
  methods: {},
  onDone(data) {
    this.listen('devacore:question', this.func.sup_question);
    this.listen('devacore:answer', this.func.sup_answer);
    return Promise.resolve(data);
  },
});
module.exports = SUPPORT
