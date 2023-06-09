const express = require('express')
const { Mutex } = require('async-mutex')
const cluster = require('cluster')
const os = require('os')
const app = express()
const port = 3000

const cpus = os.cpus

const numCPUs = cpus().length

const inMemoryStoredWords = {}

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`)
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
  })
} else {
  app.post('/words', (req, res) => {
    const incomingWords = req.body.words.split(',')
    res.send('Hello World!')
  })

  app.listen(port, () => {
    console.log(`Worker ${process.pid} started`)
    console.log(`Example app listening on port ${port}`)
  })
}
