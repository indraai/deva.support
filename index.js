// Copyright (c)2025 Quinn Michaels
// Support Deva
// Support Deva manages the support eatures of deva.world.
import Deva from '@indra.ai/deva';
import pkg from './package.json' with {type:'json'};

import data from './data.json' with {type:'json'};
const {agent,vars} = data.DATA;

// set the __dirname
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';    
const __dirname = dirname(fileURLToPath(import.meta.url));

const info = {
  id: pkg.id,
  name: pkg.name,
  describe: pkg.description,
  version: pkg.version,
  url: pkg.homepage,
  dir: __dirname,
  git: pkg.repository.url,
  bugs: pkg.bugs.url,
  author: pkg.author,
  license: pkg.license,
  copyright: pkg.copyright,
};

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
  onReady(data, resolve) {
    this.prompt('ready');
    return resolve(data);
  },
  onError(err) {
    console.log('ERR', err);
  }
});
export default SUPPORT
