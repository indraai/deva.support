# Support Deva

Support Deva is the support agent for Indra.ai and Deva.world. Its agent key is `support`. It manages the Support features in Deva.world. The package entry (`index.js`) exports a ready Deva with empty `func`, `methods`, and `listeners`. The support, list, status, info, devas, and help methods live in `feature/methods.js` and are bound at runtime by the feature loader.

## Requirements

- Node.js with npm. Support Deva's `package.json` sets no `engines`. Deva Core 1.67.26 declares `"node": ">=22"` and `"npm": ">=9.5.1"` in its own `package.json`.
- A project with `"type": "module"` in its `package.json`. Support Deva is an ES module.
- `@indra.ai/deva` `^1.67.26` (Deva Core). Support Deva lists it as a `devDependency`. A running app needs Deva Core on the host; this package does not declare a production dependency on it.

## Install

```bash
npm install @indra.ai/deva.support --save
```

```js
import SupportDeva from '@indra.ai/deva.support';
```

## Two licenses

A running Deva carries two separate licenses, and each is checked on its own.

- **The core license** comes through the client data as `client.VLA`. Deva Core checks it against the core package's VLA at the start of `init`.
- **The agent license** comes through the license feature data as `features.license.devas.support`. Deva Core 1.67.26 checks it against the VLA in Support Deva's own `package.json` right after the features load and before the start chain. Support Deva has no `onInit` of its own, so it has no license check of its own to change or remove.

The agent check compares the sha256 of the whole VLA object, so every field has to match exactly.

## Configuration

Support Deva reads two features from the client you pass to `init()`. The feature data loader puts them in the client, and Deva Core loads them into the Deva at startup, so both must be there before `init()` runs.

```json
"features": {
	"license": {
		"concerns": [],
		"global": {},
		"devas": {
			"support": {"uid": "45323842993175615300"}
		}
	},
	"support": {
		"concerns": [],
		"global": {
			"restricted": ["password", "secret", "token", "uri", "machine", "hostname"]
		}
	}
}
```

- `license.devas.support` is the agent VLA. The short form above only shows where it goes. It must be the full `VLA` object from this package's `package.json`, for example:

```js
import pkg from '@indra.ai/deva.support/package.json' with {type:'json'};

const devas = {support: pkg.VLA}; // goes in features.license.devas
```

- `support.concerns` is an array of concern strings. The `support(packet)` feature method returns that array as `data` and lists it in the parsed view. If it is omitted, Deva Core stores the default no-concerns message instead of an array.
- `support.global` is an object of global entries keyed by name. The `support(packet)` feature method walks its properties, skips the `restricted` array, and writes `::begin:global:<key>:<id>` and `::end:global:<key>:<id>` (using `item.id || key`) around each entry. Any field whose lowercase name is listed in `support.global.restricted` has its value masked as `*******`. If `global` is omitted, Deva Core stores the default no-global message instead of an object.
- `support.methods` is how the feature loader binds `feature/methods.js` at init. Import the file and set it here, as shown under Feature methods. If it is omitted, Support Deva still comes online, and `this.methods` stays empty.

## Load it

```js
import SupportDeva from '@indra.ai/deva.support';

const support = await SupportDeva.init(client); // client data provided by your loader
console.log(support.id.uid);
```

When the license checks pass, Support Deva walks start, enter, done and ready. In `onReady` it reads `this.info().VLA` and prompts `✅ Support Deva Ready > VLA:45323842993175615300`.

To shut it down:

```js
await SupportDeva.stop();
```

Support Deva has no `onStop` of its own, so Deva Core runs the default stop chain. A stopped Deva can start again. Call `init()` again with a client that passes the license check.

## When Support Deva refuses to start

If the agent license check fails, Deva Core prompts the message, stops the Deva, and `init()` resolves with that message.

| You see | Why |
| --- | --- |
| `❌ Bad Personal VLA` | `features.license.devas` is there but has no `support` entry. |
| `❌ Invalid VLA Check` | The `support` entry doesn't match this package's VLA, or the license feature has no `devas`. |

## Feature methods

`feature/methods.js` exports `support`, `list`, `status`, `info`, `devas`, and `help`. It does not export `features`, `zones`, `actions`, or `contexts`. The feature loader binds the exported methods at runtime from `client.features.support.methods` onto the Deva's `methods`. `index.js` itself sets `methods: {}`.

```js
import SupportDeva from '@indra.ai/deva.support';
import featureMethods from '@indra.ai/deva.support/feature/methods.js';
import pkg from '@indra.ai/deva.support/package.json' with {type:'json'};
import core from '@indra.ai/deva/package.json' with {type:'json'};

const client = {
	id: '00000000000000000000',
	key: 'client',
	VLA: core.VLA,
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
			global: {},
			devas: {support: pkg.VLA},
		},
		support: {
			concerns: [],
			global: {
				restricted: ['password', 'secret', 'token', 'uri', 'machine', 'hostname'],
			},
			methods: featureMethods,
		},
	},
};

await SupportDeva.init(client);
```

After `init`, call the bound methods on `SupportDeva.methods`.

| Method | What it does |
| --- | --- |
| `support(packet)` | Sets the feature context, reads `this.support()`, and builds a Feecting view of the client, the concerns list, and each entry in the `support.global` object (skipping `restricted`). Global begin and end tags use the property `key` and `item.id || key`, and any field listed in `support.global.restricted` is masked as `*******`. The client end tag uses `support.client_id`. It then asks Feecting to parse that view (`#feecting parse`) and returns `{text, html, data}`, where `data` is `support.concerns`. If the Feecting parse fails, it returns `this.err(err, packet, reject)`. |
| `list(packet)` | Reads `packet.q.meta.params[1]` against the allowlist (`contexts`, `features`, `zones`, `actions`, `states`, `intents`, `beliefs`). For a non-allowlisted item it resolves `{text: 'Invalid list item: <item>', html: '<p>Invalid list item: <item></p>', data: false}` (using `(none)` when omitted). For an allowlisted item it calls `this[item]()`, lists the keys of the returned `value` object, asks Feecting to parse the listing with `::begin`/`::end:<agent.key>:<params[1]>:<packet.id.uid>`, and returns `{text, html, data}`. If the Feecting parse fails, it returns `this.err(err, packet, reject)`. |
| `status(packet)` | Sets the support zone, then the status feature, action, state, and context, and returns `Promise.resolve(this.status())`. `this.status()` is the string `Support Deva active since <date>`. |
| `info(packet)` | Sets the support zone, then the info feature, action, state, and context, and returns `Promise.resolve({text: 'See data', html: '<p>See data</p>', data: this.info()})`. |
| `devas(packet)` | Builds a Feecting menu of `this.devas`, with a hidden block for `{{profile.color}}`, `{{profile.bgcolor}}`, `{{profile.background}}`, and `{{profile.copyright}}`. It asks Feecting to parse that view and returns `{text, html, data}`. If the Feecting parse fails, it returns `this.err(err, packet, reject)`. |
| `help(packet)` | Calls `this.help(packet.q.text, this.info().dir)` to load the help file, asks Feecting to parse it, and returns `{text, html, data}`. If the help load or the Feecting parse fails, it returns `this.err(err, packet, reject)`. |


The success paths for `support`, `list`, `devas`, and `help` need Feecting.

## Help

Help lives in Feecting files. `help/main.feecting` is the main help page, with the heading `{{profile.name}}`, a hidden block that sets `#bg` from `{{profile.background}}`, and the license block. `help/corpus.feecting` is the help corpus, with the heading `{{profile.name}}`. The tests check that those headings are there and that the license page carries this package's VLA uid and hash tiers.

## Inside Support Deva

| Name | Kind | What it does |
| --- | --- | --- |
| `support`, `list`, `status`, `info`, `devas`, `help` | feature methods | The methods in `feature/methods.js`, bound at runtime from `client.features.support.methods`. |
| `translate`, `parse`, `process` | utils | Each returns its input trimmed. |
| `onReady` | lifecycle | Reads `this.info().VLA` and prompts `✅ Support Deva Ready > VLA:45323842993175615300`. |
| `onError` | lifecycle | Prompts `💣 ERROR!`, logs the error, and returns `reject(err)` or `Promise.reject(err)`. |

The `vars` in `package.json` hold the prompt `messages`, an empty `ask.history` array, and an empty `context` object. `func`, `methods`, and `listeners` in `index.js` start as empty objects. Support Deva has no `onInit` or `onStop` of its own.

`uid()`, `info()`, `agent()`, and `status()` are Deva Core methods. `uid()` returns an id with `md5`, `sha256`, and `sha512` hash tiers, and a `fingerprint` that is the sha256 of `license`, `client`, `agent`, `machine`, and `core_hash`. `info()` returns the package info. `agent()` returns the Support Deva agent, whose key is `support`. `status()` returns the `Support Deva active since <date>` string.

## Testing

Run:

```bash
npm test
```

The package.json `test` script is `node --test`, so `npm test` and `node --test` run the same file.

The tests build a stub client in code from the core VLA in `@indra.ai/deva/package.json` and the VLA in this package's `package.json`, so no client file is needed. They cover:

- support builds as a Deva and waits offline before init
- support data has no placeholders left
- `func`, `methods`, and `listeners` start empty, and `onReady` and `onError` exist
- support comes online and walks to ready
- support info matches the package
- support agent matches the package
- support uid carries hash tiers and a fingerprint of its contents
- support status returns the active-since string
- support utils answer with trimmed text
- support help pages match the files and carry the package license
- `feature/methods.js` exports only `support`, `list`, `status`, `info`, `devas`, and `help`
- feature methods from `feature/methods.js` load at runtime
- `methods.support` returns the parsed concerns, id end tags, and masks restricted global fields as `*******`
- `methods.support` routes a question rejection through `this.err`
- `methods.list` returns the parsed listing and keeps `params[1]` in the end tag
- `methods.list` routes a question rejection through `this.err` without hanging
- `methods.list` resolves an invalid item message for non-allowlisted items
- `methods.status` returns the live Deva status and `methods.info` returns `{text, html, data}` with `this.info()`
- `methods.devas` returns the parsed menu
- `methods.devas` routes a question rejection through `this.err`
- `methods.help` returns the parsed help page
- `methods.help` routes a question rejection through `this.err`
- support stops through the full chain
- support refuses to start with a bad agent VLA

## Files

| File | What it holds |
| --- | --- |
| `index.js` | The Support Deva: utils, empty `func`, `methods`, and `listeners`, and the `onReady` and `onError` hooks. |
| `package.json` | Package info, the package VLA, and the agent and vars data under `data`. |
| `feature/methods.js` | The `support`, `list`, `status`, `info`, `devas`, and `help` feature methods that the feature loader binds at runtime. |
| `help/main.feecting` | The main help page and the license block. |
| `help/corpus.feecting` | The help corpus. |
| `index.test.js` | The tests. |
| `assets/` | The emoji, avatar, background and main images. |
| `LICENSE.md` | The license. |

Copyright ©2000-2026 Quinn Michaels; All rights reserved.  
Owner Signature Required For Lawful Use.  
Distributed under VLA:45323842993175615300 LICENSE.md  
Thursday, November 26, 2026 - 10:15:20 AM PST
