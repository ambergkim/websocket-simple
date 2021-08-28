'use strict'

const test = require('tape')
const { WebSocket } = require('ws')
const { spawn } = require('child_process')

let child
let ws

const startServer = async () => {
  const createProcess = (resolve, reject) => {
    child = spawn('node', ['server.js'])

    console.info(`Starting Server. PID: ${child.pid}`)

    child.stdout.on('data', data => {
      console.info('Getting Data', data.toString())
      if (data.includes('server ready')) resolve()
    })

    child.stderr.on('data', err => {
      console.error(`Server Error: ${err}`)
    })
  }

  return new Promise(createProcess)
}

const stopServer = async () => {
  child.kill()
  console.info('Offline process stopped')
}

/**
 * This test is not working. There is a
 * disconnect where the new websocket cannot 
 * connect to the server.
 */
test('Test sending messages to the server', async t => {
  await startServer()
  const ws = new WebSocket('ws://127.0.0.1:3000')

  ws.on('message', message => {
    console.log('TEST MESSAGE RECEIVED', message)
    t.equals(message, "Hello")
  })

  ws.send("Hello")

  await stopServer()
})