"use strict";
// Support Deva Test File
// Copyright ©2000-2026 Quinn Michaels; All rights reserved.  
// Owner Signature Required For Lawful Use.  
// Distributed under VLA:45323842993175615300 LICENSE.md
// Thursday, November 26, 2026 - 10:15:20 AM PST

// run with: npm test
import test, {after} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import Deva from '@indra.ai/deva';
import core from '@indra.ai/deva/package.json' with {type:'json'};
import pkg from './package.json' with {type:'json'};
import featureMethods from './feature/methods.js';
import SUPPORT from './index.js';

const DIR = dirname(fileURLToPath(import.meta.url));
const STAGES = ['start', 'enter', 'done', 'ready'];
const TIERS = ['md5', 'sha256', 'sha512'];
const PLACEHOLDER = /::[a-z-]+::|\{\{profile\.[a-z]+\}\}/;
const FEATURE_KEYS = ['support', 'list', 'status', 'info', 'devas', 'help'];
const REMOVED_KEYS = ['features', 'zones', 'actions', 'contexts'];

const digest = (data, algo) => createHash(algo).update(JSON.stringify(data)).digest('base64');

function assertTiers(stamped, label) {
	const base = {};
	for (const [k, v] of Object.entries(stamped)) {
		if (!TIERS.includes(k)) base[k] = v;
	}
	const walk = {...base};
	for (const t of TIERS) {
		assert.equal(typeof stamped[t], 'string', `${label} has ${t}`);
		assert.equal(stamped[t], digest(walk, t), `${label} ${t} covers the data and the tiers before it`);
		walk[t] = stamped[t];
	}
}

// stub client built in code: the core VLA for the core check and the agent VLA for Support Deva.
// methods, when set, is bound at init from features.support.methods by the feature loader.
const client = (agentVLA = pkg.VLA, methods = false) => ({
	id: '00000000000000000000',
	key: 'client',
	VLA: structuredClone(core.VLA),
	prompt: {
		emoji: '🧪',
		text: 'client',
		colors: {
			label: {R: 2, G: 229, B: 77},
			text: {R: 2, G: 229, B: 77},
		},
	},
	profile: {
		id: '00000000000000000000',
		name: 'Test Client',
		describe: 'Test client for Support Deva',
		lang: 'en',
		locale: 'en-US',
		currency: 'USD',
	},
	features: {
		license: {
			concerns: [],
			global: [],
			devas: {
				support: structuredClone(agentVLA),
			},
		},
		support: {
			concerns: ['a support concern'],
			global: [{key: 'smoke', id: 'g1', text: 'ok'}],
			methods: methods || undefined,
		},
	},
});

const packet = (deva, text = 'help', params = []) => ({
	id: deva.uid(),
	q: {text, meta: {params}},
});

function parseAnswer(text = 'parsed', html = '<p>ok</p>', data = {ok: true}) {
	return {a: {text, html, data}};
}

let FEATURE = null;
let featureReady = false;

after(async () => {
	if (SUPPORT._active) await SUPPORT.stop();
	if (FEATURE && FEATURE._active) await FEATURE.stop();
});

test('support builds as a Deva and waits offline before init', async () => {
	assert.ok(SUPPORT instanceof Deva, 'the export is a Deva');
	assert.equal(SUPPORT.agent().key || SUPPORT._agent.key, 'support', 'agent key is support');
	assert.equal(await SUPPORT.stop(), SUPPORT._messages.offline, 'stop before init answers offline');
});

test('support data has no placeholders left', () => {
	assert.doesNotMatch(JSON.stringify(pkg.data), PLACEHOLDER, 'package.json data');
	assert.doesNotMatch(JSON.stringify(pkg.VLA), PLACEHOLDER, 'package.json VLA');
	assert.doesNotMatch(pkg.copyright, PLACEHOLDER, 'package.json copyright');
});

test('func, methods, and listeners start empty, and onReady and onError exist', () => {
	assert.deepEqual(Object.keys(SUPPORT.func), [], 'func starts empty');
	assert.deepEqual(Object.keys(SUPPORT.methods), [], 'methods starts empty');
	assert.deepEqual(Object.keys(SUPPORT.listeners), [], 'listeners starts empty');
	assert.equal(typeof SUPPORT.onReady, 'function', 'onReady');
	assert.equal(typeof SUPPORT.onError, 'function', 'onError');
	assert.notEqual(typeof SUPPORT.onInit, 'function', 'no onInit of its own');
});

test('support comes online and walks to ready', async () => {
	const prompts = [];
	SUPPORT.listen('devacore:prompt', packet => prompts.push(packet.text));
	const data = await SUPPORT.init(client());
	for (const k of STAGES) assert.equal(typeof data[k], 'number', `${k} timestamp`);
	assert.ok(data.start <= data.enter && data.enter <= data.done && data.done <= data.ready, 'stages in order');
	assert.equal(data.value, 'init');
	assert.equal(typeof data.id.uid, 'string', 'uid');
	assertTiers(data, 'init packet');
	assertTiers(data.id, 'init packet id');
	assert.ok(prompts.includes(`${SUPPORT.vars.messages.ready} > VLA:${pkg.VLA.uid}`), 'onReady prompts the ready message');
	assert.ok(SUPPORT._active, 'the Deva is active');
});

test('support info matches the package', () => {
	const info = SUPPORT.info();
	assert.equal(info.name, '@indra.ai/deva.support');
	assert.equal(info.version, pkg.version);
	assert.equal(info.id, pkg.id);
	assert.equal(info.url, pkg.homepage);
	assert.equal(info.git, pkg.repository.url);
	assert.equal(info.VLA.uid, pkg.VLA.uid);
	assertTiers(info, 'info()');
});

test('support agent matches the package', () => {
	const agent = SUPPORT.agent();
	assert.equal(agent.key, 'support');
	assert.equal(agent.id, pkg.id);
	assert.equal(agent.profile.id, pkg.id);
	assert.equal(agent.profile.name, 'Support Deva');
	assert.equal(agent.profile.owner, 'Quinn Michaels');
	assert.equal(agent.profile.creator, 'Quinn Michaels');
	assertTiers(agent, 'agent()');
});

test('support uid carries hash tiers and a fingerprint of its contents', () => {
	const id = SUPPORT.uid();
	assert.equal(typeof id.uid, 'string', 'uid');
	assert.ok(id.uid.length > 0, 'uid is not empty');
	assert.equal(id.license, pkg.VLA.uid, 'license is the package VLA uid');
	assertTiers(id, 'uid()');
	assert.equal(id.fingerprint, digest({
		license: id.license,
		client: id.client,
		agent: id.agent,
		machine: id.machine,
		core_hash: id.core_hash,
	}, 'sha256'), 'fingerprint is the sha256 of license, client, agent, machine, and core_hash');
});

test('support status returns the active-since string', () => {
	const status = SUPPORT.status();
	assert.equal(typeof status, 'string', 'status is a string');
	assert.match(status, /^Support Deva active since /, 'status names the Deva and the start time');
});

test('support utils answer with trimmed text', () => {
	const {translate, parse, process} = SUPPORT.utils;
	for (const util of [translate, parse, process]) assert.equal(util('  hello  '), 'hello');
});

test('support help pages match the files and carry the package license', async () => {
	const main = await SUPPORT.help('main', DIR);
	assert.match(main, /^# \{\{profile\.name\}\}$/m, 'main help heading as in help/main.feecting');
	assert.match(main, /^#bg = \{\{profile\.background\}\}$/m, 'main help uses profile.background');
	const corpus = await SUPPORT.help('corpus', DIR);
	assert.match(corpus, /^# \{\{profile\.name\}\}$/m, 'corpus help heading');
	const license = await SUPPORT.help('main:license', DIR);
	assert.match(license, new RegExp(`^\\s*uid: ${pkg.VLA.uid}$`, 'm'), 'license uid');
	for (const t of TIERS) assert.ok(license.includes(`${t}: ${pkg.VLA[t]}`), `${t} hash in the license help`);
});

test('feature/methods.js exports only the current methods', () => {
	assert.deepEqual(Object.keys(featureMethods), FEATURE_KEYS, 'feature export names');
	for (const key of FEATURE_KEYS) assert.equal(typeof featureMethods[key], 'function', `feature.${key}`);
	for (const key of REMOVED_KEYS) assert.equal(typeof featureMethods[key], 'undefined', `feature.${key} is not exported`);
});

test('support stops through the full chain', async () => {
	const data = await SUPPORT.stop();
	assert.equal(data.key, 'shutdown', 'the chain ends on shutdown');
	assert.equal(data.value, 'support');
	assert.equal(SUPPORT._active, false, 'the Deva is offline after stop');
});

// the feature loader binds client.features.support.methods onto the Deva at init.
// this uses a fresh instance after SUPPORT has stopped so only one support Deva is active on the shared event bus.
test('feature methods from feature/methods.js load at runtime', async () => {
	({default: FEATURE} = await import('./index.js?feature'));
	const data = await FEATURE.init(client(pkg.VLA, featureMethods));
	assert.equal(typeof data.ready, 'number', 'feature instance reaches ready');
	for (const key of FEATURE_KEYS) assert.equal(typeof FEATURE.methods[key], 'function', `the feature loader binds ${key}`);
	for (const key of REMOVED_KEYS) assert.equal(typeof FEATURE.methods[key], 'undefined', `${key} is not bound`);
	featureReady = true;
});

test('methods.support returns the parsed concerns and id end tags', async () => {
	assert.ok(featureReady, 'feature instance is ready');
	const orig = FEATURE.question.bind(FEATURE);
	let asked = '';
	FEATURE.question = async text => {
		asked = String(text);
		return parseAnswer('parsed-support', '<p>support</p>', {ok: true});
	};
	try {
		const out = await FEATURE.methods.support(packet(FEATURE));
		assert.equal(out.text, 'parsed-support');
		assert.equal(out.html, '<p>support</p>');
		assert.deepEqual(out.data, ['a support concern'], 'data is the support concerns');
		assert.ok(asked.includes(`${FEATURE.askChr}feecting parse `), 'asks Feecting to parse the support view');
		assert.ok(asked.includes('::end:global:smoke:g1'), 'global end tag uses item.key and item.id');
		assert.match(asked, /::end:client:[^\n]+/, 'client end tag uses support.client_id');
		assert.match(asked, /::end:global:smoke:g1(?:\n|$)/, 'global end tag is item.id with no hash suffix');
	} finally {
		FEATURE.question = orig;
	}
});

test('methods.support routes a question rejection through this.err', async () => {
	const origQuestion = FEATURE.question.bind(FEATURE);
	const origErr = FEATURE.err.bind(FEATURE);
	const calls = [];
	FEATURE.question = async () => {
		throw new Error('feecting-parse-fail');
	};
	FEATURE.err = (err, pkt, reject) => {
		calls.push({message: err.message, hasPacket: !!pkt, hasReject: typeof reject === 'function'});
		return origErr(err, pkt, reject);
	};
	try {
		await assert.rejects(
			FEATURE.methods.support(packet(FEATURE)),
			err => err.message === 'feecting-parse-fail',
			'support rejects with the question error'
		);
		assert.equal(calls.length, 1, 'this.err is called once');
		assert.equal(calls[0].message, 'feecting-parse-fail');
		assert.equal(calls[0].hasPacket, true, 'this.err receives the packet');
		assert.equal(calls[0].hasReject, true, 'this.err receives reject');
	} finally {
		FEATURE.question = origQuestion;
		FEATURE.err = origErr;
	}
});

test('methods.list returns the parsed listing and keeps params[1] in the end tag', async () => {
	FEATURE.listSource = () => ({value: {alpha: 'one', beta: 'two'}});
	const orig = FEATURE.question.bind(FEATURE);
	let asked = '';
	FEATURE.question = async text => {
		asked = String(text);
		return parseAnswer('parsed-list', '<p>list</p>', {keys: ['alpha', 'beta']});
	};
	const p = packet(FEATURE, 'list', ['list', 'listSource']);
	try {
		const out = await FEATURE.methods.list(p);
		assert.equal(out.text, 'parsed-list');
		assert.equal(out.html, '<p>list</p>');
		assert.deepEqual(out.data, {keys: ['alpha', 'beta']});
		assert.ok(asked.includes('• alpha: one'), 'lists the value keys');
		assert.ok(asked.includes('• beta: two'), 'lists every value key');
		assert.ok(asked.includes(`::end:support:listSource:${p.id.uid}`), 'end tag uses params[1], not the last loop key');
	} finally {
		FEATURE.question = orig;
		delete FEATURE.listSource;
	}
});

test('methods.list routes a question rejection through this.err without hanging', async () => {
	FEATURE.listSource = () => ({value: {alpha: 'one'}});
	const origQuestion = FEATURE.question.bind(FEATURE);
	const origErr = FEATURE.err.bind(FEATURE);
	const calls = [];
	FEATURE.question = async () => {
		throw new Error('list-feecting-fail');
	};
	FEATURE.err = (err, pkt, reject) => {
		calls.push({message: err.message, hasReject: typeof reject === 'function'});
		return origErr(err, pkt, reject);
	};
	const unhandled = [];
	const onUnhandled = err => unhandled.push(err);
	process.on('unhandledRejection', onUnhandled);
	try {
		let timer;
		const outcome = await Promise.race([
			FEATURE.methods.list(packet(FEATURE, 'list', ['list', 'listSource'])).then(
				() => 'resolved',
				err => err
			),
			new Promise((_, reject) => {
				timer = setTimeout(() => reject(new Error('TIMEOUT')), 8000);
			}),
		]).finally(() => clearTimeout(timer));
		assert.ok(outcome instanceof Error, 'list rejects');
		assert.equal(outcome.message, 'list-feecting-fail', 'list rejects with the question error');
		assert.equal(calls.length, 1, 'this.err is called once');
		assert.equal(calls[0].hasReject, true, 'this.err receives the outer reject');
		assert.equal(unhandled.length, 0, 'no unhandled rejection');
	} finally {
		process.off('unhandledRejection', onUnhandled);
		FEATURE.question = origQuestion;
		FEATURE.err = origErr;
		delete FEATURE.listSource;
	}
});

test('methods.list routes a missing item through this.err', async () => {
	const origErr = FEATURE.err.bind(FEATURE);
	const calls = [];
	FEATURE.err = (err, pkt, reject) => {
		calls.push({name: err.name, hasPacket: !!pkt, hasReject: typeof reject === 'function'});
		return origErr(err, pkt, reject);
	};
	try {
		await assert.rejects(
			FEATURE.methods.list(packet(FEATURE, 'list', ['list', 'notAMethod'])),
			err => err instanceof TypeError,
			'list rejects when this[item] is not a function'
		);
		assert.equal(calls.length, 1, 'this.err is called once');
		assert.equal(calls[0].hasPacket, true);
		assert.equal(calls[0].hasReject, true);
	} finally {
		FEATURE.err = origErr;
	}
});

test('methods.status and methods.info return the live Deva status and info', async () => {
	const status = await FEATURE.methods.status(packet(FEATURE));
	assert.equal(typeof status, 'string', 'methods.status returns a string');
	assert.match(status, /^Support Deva active since /, 'methods.status names the Deva and the start time');
	const info = await FEATURE.methods.info(packet(FEATURE));
	assert.equal(info.name, '@indra.ai/deva.support');
	assert.equal(info.version, pkg.version);
	assert.equal(info.id, pkg.id);
	assertTiers(info, 'methods.info()');
});

test('methods.devas returns the parsed menu', async () => {
	const orig = FEATURE.question.bind(FEATURE);
	let asked = '';
	FEATURE.question = async text => {
		asked = String(text);
		return parseAnswer('parsed-devas', '<p>devas</p>', {ok: true});
	};
	const p = packet(FEATURE);
	try {
		const out = await FEATURE.methods.devas(p);
		assert.equal(out.text, 'parsed-devas');
		assert.equal(out.html, '<p>devas</p>');
		assert.ok(asked.includes(`::BEGIN:DEVAS:${p.id.uid}`), 'opens the devas block with the packet uid');
		assert.ok(asked.includes('#bg = {{profile.background}}'), 'hidden block uses profile.background');
		assert.ok(asked.includes(`::END:DEVAS:${p.id.uid}`), 'closes the devas block with the packet uid');
	} finally {
		FEATURE.question = orig;
	}
});

test('methods.devas routes a question rejection through this.err', async () => {
	const origQuestion = FEATURE.question.bind(FEATURE);
	const origErr = FEATURE.err.bind(FEATURE);
	const calls = [];
	FEATURE.question = async () => {
		throw new Error('devas-feecting-fail');
	};
	FEATURE.err = (err, pkt, reject) => {
		calls.push({message: err.message, hasReject: typeof reject === 'function'});
		return origErr(err, pkt, reject);
	};
	try {
		await assert.rejects(
			FEATURE.methods.devas(packet(FEATURE)),
			err => err.message === 'devas-feecting-fail',
			'devas rejects with the question error'
		);
		assert.equal(calls.length, 1, 'this.err is called once');
		assert.equal(calls[0].hasReject, true);
	} finally {
		FEATURE.question = origQuestion;
		FEATURE.err = origErr;
	}
});

test('methods.help returns the parsed help page', async () => {
	const orig = FEATURE.question.bind(FEATURE);
	let asked = '';
	FEATURE.question = async text => {
		asked = String(text);
		return parseAnswer('parsed-help', '<p>help</p>', {ok: true});
	};
	try {
		const out = await FEATURE.methods.help(packet(FEATURE, 'main'));
		assert.equal(out.text, 'parsed-help');
		assert.equal(out.html, '<p>help</p>');
		assert.ok(asked.includes(`${FEATURE.askChr}feecting parse `), 'asks Feecting to parse the help file');
		assert.ok(asked.includes('{{profile.name}}') || asked.includes('{{profile.background}}'), 'the help file is passed to Feecting');
	} finally {
		FEATURE.question = orig;
	}
});

test('methods.help rejects when question fails', async () => {
	const orig = FEATURE.question.bind(FEATURE);
	FEATURE.question = async () => {
		throw new Error('help-feecting-fail');
	};
	try {
		await assert.rejects(
			FEATURE.methods.help(packet(FEATURE, 'main')),
			err => err.message === 'help-feecting-fail',
			'help rejects with the question error'
		);
	} finally {
		FEATURE.question = orig;
	}
});

// the refusal check loads a fresh Support Deva instance from the same file, so it starts from a clean state.
test('support refuses to start with a bad agent VLA', async () => {
	if (FEATURE && FEATURE._active) await FEATURE.stop();
	const {default: REFUSE} = await import('./index.js?refuse');
	const prompts = [];
	REFUSE.listen('devacore:prompt', packet => prompts.push(packet.text));
	const result = await REFUSE.init(client({uid: 'bad'}));
	assert.equal(result, REFUSE._messages.checkVLA, 'init answers with the invalid VLA message');
	assert.ok(prompts.includes(REFUSE._messages.checkVLA), 'core prompts the invalid VLA message');
	assert.equal(REFUSE._active, false, 'the Deva stays offline');
});
