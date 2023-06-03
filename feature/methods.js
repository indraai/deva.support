module.exports = {
  /**************
  method: support
  params: packet
  describe: The global support feature that installs with every agent
  ***************/
  support(packet) {
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
}
