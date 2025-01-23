module.exports = {
  /**************
  method: support
  params: packet
  describe: The global support feature that installs with every agent
  ***************/
  support(packet) {
    this.context('feature');
    const support = this.support();
    const data = {};
    return new Promise((resolve, reject) => {
      this.question(`#docs raw feature/support`).then(doc => {
        data.doc = doc.a.data;
        const info = [
          `## Settings`,
          `::begin:support:${support.id}`,
          `client: ${support.client_name}`,
          `concerns: ${support.concerns.join(', ')}`,
          `::end:support:${this.hash(support)}`,
        ].join('\n');
        const text = doc.a.text.replace(/::info::/g, info)
        return this.question(`#feecting parse ${text}`)
      }).then(feecting => {
        return resolve({
          text: feecting.a.text,
          html: feecting.a.html,
          data: support
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
    const agent = this.agent();
    return Promise.resolve(this.status());
  },
  /**************
  method: info
  params: packet
  describe: Return the current info for the deva.
  ***************/
  info(packet) {
    return Promise.resolve(this.info);
  },
  /**************
  method: help
  params: packet
  describe: The Help method returns the information on how to use the Log Buddy.
  ***************/
  help(packet) {
    this.feature('support', 'help');
    this.zone('help');
    this.action('help');
    this.state('help');
    this.context('help');
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
