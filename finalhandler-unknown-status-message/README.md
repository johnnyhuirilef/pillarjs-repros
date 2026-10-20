# finalhandler sends `undefined` for a status code that has no name

In production, `finalhandler` sends the name of the status code as the body,
for example `<pre>Not Found</pre>` for 404. Some valid error status codes have
no name in the `statuses` package, for example 499 (used by nginx) and 460
(used by the AWS Application Load Balancer). For those codes, `finalhandler` 2.1.1 sends
`<pre>undefined</pre>`:

```js
const err = new Error('boom!')
err.status = 499
finalhandler(req, res, { env: 'production' })(err)

// 404 -> <pre>Not Found</pre>
// 499 -> <pre>undefined</pre>
// 460 -> <pre>undefined</pre>
```

Not affected: the response status code is correct, and outside production the
body shows the stack of the error.

## Run it

No network is needed. The script starts one server for each case and prints the
`<pre>` content of the response body.

```bash
npm install
npm run repro
```

## What you should see

Output of `npm run repro` on 2.1.1:

```
=== err.status = 404 (response status 404) ===
  expected: <pre>Not Found</pre>
  got:      <pre>Not Found</pre>

=== err.status = 499 (response status 499) ===
  expected: <pre>499</pre>
  got:      <pre>undefined</pre>

=== err.status = 460 (response status 460) ===
  expected: <pre>460</pre>
  got:      <pre>undefined</pre>

=== RESULT ===
  BUG: 2 of 3 responses have no status in the body.
```

The exit code of `npm run repro` is 1.

## Why it happens

In production, `getErrorMessage()` in `index.js` (line 170 on 2.1.1) falls
back to the name of the status code:

```js
return msg || statuses.message[status]
```

`statuses.message[499]` is `undefined`, and `createHtmlDocument()` escapes it
to the string `undefined`. Express uses the status code itself when it has no
name: `res.sendStatus()` sends `statuses.message[statusCode] || String(statusCode)`.

## Verifying a fix

With the fix, the last lines are:

```
=== RESULT ===
  FIXED: every response body names its status code.
```

The exit code is 0. To test a local build, install it with
`npm install ./path/to/finalhandler` and run `npm run repro`.

## Versions

`finalhandler` 2.1.1 · Node 24.21.0 · macOS.
