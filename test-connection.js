require('dotenv').config()
const { Client } = require('pg')

console.log('Using connection string host:', new URL(process.env.DATABASE_URL).host)

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
    console.error('FAILED:', err.message)
  })