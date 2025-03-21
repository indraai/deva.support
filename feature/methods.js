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
