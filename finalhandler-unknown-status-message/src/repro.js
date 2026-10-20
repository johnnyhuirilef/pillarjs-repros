'use strict'

/**
 * In production, finalhandler sends the name of the status code as the body,
 * for example `<pre>Not Found</pre>` for 404. A valid error status that has no
 * name, such as 499 or 460, gives the body `<pre>undefined</pre>`.
 *
 *   npm run repro
 */
const finalhandler = require('finalhandler')
const http = require('node:http')

const CASES = [
  { status: 404, expected: 'Not Found' },
  { status: 499, expected: '499' },
  { status: 460, expected: '460' }
]

function createServer (status) {
  return http.createServer((req, res) => {
    const err = new Error('boom!')
    err.status = status
    finalhandler(req, res, { env: 'production' })(err)
  })
}

function get (port) {
  return new Promise((resolve, reject) => {
    http.get({ port, path: '/' }, (res) => {
      let body = ''
      res.setEncoding('utf8')
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => resolve({ statusCode: res.statusCode, body }))
    }).on('error', reject)
  })
}

async function responseFor ({ status }) {
  const server = createServer(status).listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  try {
    return await get(server.address().port)
  } finally {
    server.close()
  }
}

async function main () {
  const results = await Promise.all(CASES.map(async (testCase) => {
    const { statusCode, body } = await responseFor(testCase)
    const got = (body.match(/<pre>(.*)<\/pre>/) || [])[1]
    return { ...testCase, statusCode, got, ok: got === testCase.expected }
  }))
  const failed = results.filter(({ ok }) => !ok).length

  results.forEach(({ status, statusCode, expected, got }) => {
    console.log(`=== err.status = ${status} (response status ${statusCode}) ===`)
    console.log(`  expected: <pre>${expected}</pre>`)
    console.log(`  got:      <pre>${got}</pre>\n`)
  })
  console.log('=== RESULT ===')
  console.log(failed === 0
    ? '  FIXED: every response body names its status code.'
    : `  BUG: ${failed} of ${CASES.length} responses have no status in the body.`)
  process.exitCode = failed === 0 ? 0 : 1
}

main()
