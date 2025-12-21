export default {
  /**************
  method: support
  params: packet
  describe: The global support feature that installs with every agent
  ***************/
  support(packet) {
    this.context('feature');
    return new Promise((resolve, reject) => {
      const support = this.support();
      const agent = this.agent();
      const global = [];
      support.global.forEach((item,index) => {
        global.push(`::begin:global:${item.key}:${item.id}`);
        for (let x in item) {
          global.push(`${x}: ${item[x]}`);
        }
        global.push(`::end:global:${item.key}:${this.lib.hash(item)}`);
      });
      const concerns = [];
      support.concerns.forEach((item, index) => {
        concerns.push(`${index + 1}. ${item}`);
      })
      
      const info = [
        '::BEGIN:SUPPORT',
        '### Client',
        `::begin:client:${support.client_id}`,
        `id: ${support.client_id}`,
        `client: ${support.client_name}`,
        '**concerns**',
        concerns.join('\n'),
        `::end:client:${this.lib.hash(support)}`,
        '### Global',
        global.join('\n'),
        '::END:SUPPORT',
      ].join('\n');
      this.question(`${this.askChr}feecting parse ${info}`).then(feecting => {
        return resolve({
          text: feecting.a.text,
          html: feecting.a.html,
          data: support.concerns,
        });
      }).catch(err => {
        return this.error(err, packet, reject);
      })
    });
  },

  /**************
  name: list
  describe: Get a listing of items from the Deva Core Contexts, Features, Actions, States.
  params: item
  **************/
  list(packet) {
    const {id, q} = packet;
    const {params} = q.meta;
    const item = params[1];
    const {key} = this.agent();

    this.context('features', `${key}:${item}:${id.uid}`);
    this.action('method', `${key}:features:${id.uid}`);

    return new Promise((resolve, reject) => {
      try {
        const items = this[item]();
        
        const _items = [
          '→',
          `::begin:${key}:${id.uid}`,
        ];
        for (let item in items.value) {
          _items.push(`• ${item}: ${items.value[item]}`);
        }
        
        _items.push(`::end:${key}:${item}:${id.uid}`);
  
        this.question(`${this.askChr}feecting parse ${_items.join('\n')}`).then(parsed => {
          return resolve({
            text:parsed.a.text,
            html:parsed.a.html,
            data:parsed.a.data,
          });
        }).catch(reject => {
          return this.err(e, packet, reject);
        })
      } catch (e) {
        return this.err(e, packet, reject);
      }
    });
  },	

  async features(packet) {
    const {key} = this.agent();
    this.context('features', `${key}:${packet.id.uid}`);
    this.action('method', `${key}:features:${packet.id.uid}`);
    return this.func.lists('features');	
  },
  
  async zones(packet) {
    const {key} = this.agent();
    this.context('zones', `${key}:${packet.id.uid}`);
    this.action('method', `${key}:zones:${packet.id.uid}`);
    return this.func.lists('zones');	
  },

  async actions(packet) {
    const {key} = this.agent();
    this.context('actions', `${key}:${packet.id.uid}`);
    this.action('method', `${key}:actions:${packet.id.uid}`);
    return this.func.lists('actions');	
  },

  async contexts(packet) {
    const {key} = this.agent();
    this.context('contexts', `${key}:${packet.id.uid}`);
    this.action('method', `${key}:contexts:${packet.id.uid}`);
    return this.func.lists('contexts');	
  },
  
  /**************
  method: status
  params: packet
  describe: Return the current status of the Log Buddy.
  ***************/
  status(packet) {
    this.zone('support');
    this.feature('status');
    this.action('status');
    this.state('resolve', 'status');
    this.context('status');
    return Promise.resolve(this.status());
  },
  /**************
  method: info
  params: packet
  describe: Return the current info for the deva.
  ***************/
  info(packet) {
    this.zone('support');
    this.feature('info');
    this.action('info');
    this.state('get', 'info');
    this.context('info');
    return Promise.resolve(this.info());
  },
  
  /**************
  method: devas
  params: packet
  describe: List the devas loaded for the current deva.
  ***************/  
  devas(packet) {
    const agent = this.agent();
    return new Promise((resolve, reject) => {
      try {
        const devas = [
          `::BEGIN:DEVAS:${packet.id.uid}`,
          '::begin:menu'
        ];
        for (let deva in this.devas) {
          const d = this.devas[deva];
          const {prompt, key, profile} = d.agent();
          devas.push(`button[${prompt.emoji} ${profile.name}]:${this.askChr}${key} help`);
        }
        devas.push('::end:menu');
        devas.push('::begin:hidden');
        devas.push('#color = {{profile.color}}');
        devas.push('#bgcolor = {{profile.bgcolor}}');
        devas.push('#bg = {{profile.background}}');
        devas.push('copyright: {{profile.copyright}}');
        devas.push('::end:hidden');          
        devas.push(`::END:DEVAS:${packet.id.uid}`);
  
        this.question(`${this.askChr}feecting parse ${devas.join('\n')}`).then(parsed => {
          return resolve({
            text:parsed.a.text,
            html:parsed.a.html,
            data:parsed.a.data,
          });
        }).catch(err => {
          return this.err(err, packet, reject);
        });
      } catch (e) {
        return this.error(e, packet, reject);
      }
    });
  },
  
  /**************
  method: help
  params: packet
  describe: The Help method returns the information on how to use the Log Buddy.
  ***************/
  help(packet) {
    const {dir} = this.info();
    return new Promise((resolve, reject) => {
      this.help(packet.q.text, dir).then(help => {
        return this.question(`${this.askChr}feecting parse ${help}`);
      }).then(parsed => {
        this.action('help');
        return resolve({
          text: parsed.a.text,
          html: parsed.a.html,
          data: parsed.a.data,
        });
      }).catch(reject);
    });
  }
}
