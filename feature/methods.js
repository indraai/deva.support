// Support Deva Feature Methods
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.  
// Owner Signature Required For Lawful Use.  
// Distributed under VLA:45323842993175615300 LICENSE.md
// Thursday, November 26, 2026 - 10:15:20 AM PST

export default {
	/**************
	method: support
	params: packet
	describe: The global support feature that installs with every agent
	***************/
	support(packet) {
		return new Promise((resolve, reject) => {
			const support = this.support();
			const agent = this.agent();

			const global = [];
			const {restricted} = support.global
			for (let key in support.global) {
				if (key === 'restricted') continue; // continue if key restricted.
				
				const item = support.global[key];
				if (item && typeof item === 'object') {
					const blockId = item.id || key;
					global.push(`::begin:global:${key}:${blockId}`);
					for (let x in item) {
						const val = restricted.find(r => r === x.toLowerCase()) ? '*******' : item[x];
						global.push(`${x}: ${val}`);
					}
					global.push(`::end:global:${key}:${blockId}`);
				} else {
					const val = restricted.find(r => r === key.toLowerCase()) ? '*******' : item;
					global.push(`${key}: ${val}`);
				}
			}

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
				`::end:client:${support.client_id}`,
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
				return this.err(err, packet, reject);
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
		const allowed = ['contexts', 'features', 'zones', 'actions', 'states', 'intents', 'beliefs'];
		const requested = (params[1] || q.text || allowed[1]).trim().toLowerCase();
		const item = allowed.find(key => key === requested);
		const {key} = this.agent();

		this.action('method', `${key}:list:${id.uid}`);

		return new Promise((resolve, reject) => {
			try {
				
				if (!item) {
					const itm_msg = `Invalid list item: ${requested || '(none)'}`;
					return resolve({
						text: itm_msg,
						html: `<p>${itm_msg}</p>`,
						data: false,
					});
				}
								
				const items = this[item]();
				
				const _items = [
					`::begin:${key}:${item}:${id.uid}`,
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
				}).catch(err => {
					return this.err(err, packet, reject);
				})
			} catch (err) {
				return this.err(err, packet, reject);
			}
		});
	},
	
	/**************
	method: status
	params: packet
	describe: Return the current status of the Deva.
	***************/
	status(packet) {
		this.zone('support');
		this.feature('status');
		this.action('status');
		this.state('resolve', 'status');
		return Promise.resolve(this.status());
	},
	
	/**************
	method: info
	params: packet
	describe: Return the current info for the deva.
	***************/
	info(packet) {
		this.zone('support', `info:${packet.id.uid}`);
		this.feature('info', packet.id.uid);
		this.action('info', packet.id.uid);
		this.state('get', `info:${packet.id.uid}`);
		return Promise.resolve({
			text: 'See data',
			html: '<p>See data</p>',
			data: this.info(),
		});
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
				return this.err(e, packet, reject);
			}
		});
	},
	
	/**************
	method: help
	params: packet
	describe: The Help method returns the help file for the Deva.
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
			}).catch(err => {
				return this.err(err, packet, reject);
			});
		});
	}
}
