const express = require('express')
const { Mutex } = require('async-mutex')
const cluster = require('cluster')
const os = require('os')
const app = express()
const port = 3000
const cpus = os.cpus
const numCPUs = cpus().length
const forkedWorkers = []
const workerResponds = []

const inMemoryStoredWords = {}

// use multi-processing
if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`)
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork()
    worker.on('message', (wordsObject) => {
      workerResponds.push(wordsObject)
    })
    forkedWorkers.push(worker)
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`)
  })

  app.post('/words', (req, res) => {
    const incomingWords = req.body.words.split(',')
    res.send('Words were integrated')
  })

  app.post('/stats', async (req, res) => {
    const statsCollection = await new Promise((resolve, reject) => {
      forkedWorkers.forEach((workerObj) => {
        workerObj.send('SEND_STATS')
      })

      while (workerResponds.length < forkedWorkers.length) {}
      resolve([...workerResponds])
    })

    res.send(stats)
  })
} else {
  process.on('message', (message) => {
    if (message === 'SEND_STATS') {
      process.send(inMemoryStoredWords)
    }
  })

  app.post('/words', (req, res) => {
    const incomingWords = req.body.words.split(',')
    res.send('Words were integrated')
  })

  app.listen(port, () => {
    console.log(`Worker ${process.pid} started`)
    console.log(`Example app listening on port ${port}`)
  })
}
