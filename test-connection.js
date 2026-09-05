require('dotenv').config()
const { Client } = require('pg')

const urlObj = new URL(process.env.DATABASE_URL)
console.log('Using connection string host:', urlObj.host)
console.log('Using username:', urlObj.username)
console.log('Password length:', urlObj.password.length, '| first 3 chars:', urlObj.password.slice(0, 3), '| last 3 chars:', urlObj.password.slice(-3))

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

client.connect()
  .then(() => {
    console.log('CONNECTED')
    return client.query('SELECT NOW()')
  })
  .then((res) => {
    console.log(res.rows)
    return client.end()
  })
  .catch((err) => {
    console.error('FAILED - full error object:')
    console.error(err)
    console.error('---')
    console.error('code:', err.code)
    console.error('message:', JSON.stringify(err.message))
  })

setTimeout(() => {
  console.error('TIMEOUT: connection attempt did not resolve within 10 seconds')
  process.exit(1)
}, 10000)