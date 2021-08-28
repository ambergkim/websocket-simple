/**
 * Websocket server. Listens to and sends out
 * message events.
 */

const { WebSocketServer, WebSocket } = require('ws')

const wss = new WebSocketServer({ port: 3000, host: '127.0.0.1' })

// TODO Replace with actual check of the server readiness
console.log('server ready')

/**
 * @description Pretend database for storing our message information.
 * The users are the receivers. Each receiver has an array of objects with
 * information of a message and its sender.
 * users = {
 *    adrienne: [ {sender: "ben", message: "hello" } ]
 * }
 */
const users = {}

wss.on('connection', ws => {
  ws.on('message', message => {
    const { type: requestType, from: sender, to: receiver, message: newMessage } = JSON.parse(message)

    switch (requestType) {
      // Register a new user in the "database".
      case "register":
        const newUser = receiver.toLowerCase()
        if (!users[newUser]) users[newUser] = []

        console.log(`User registerd: ${newUser}`)

        console.log(`All registered users:`)
        console.dir(users, { depth: null })
        break

      // When a user sends out a message
      case "send":
        // Save the message to our pretend database
        // Put the post recent message at the beginning of the array
        // in an attempt to keep the messages in order
        console.log(`Received message from ${sender} to ${receiver}: ${newMessage}`)

        // TODO Handle unregistered users instead of "registering" them here.
        if (!users[receiver.toLowerCase()]) users[receiver.toLowerCase()] = []

        users[receiver.toLowerCase()].unshift( {sender, message: newMessage} )

        // Broadcast the message to all clients
        // Except for the server.
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            console.log(`SERVER: sending message ${message} to client`, client)
            client.send(message);
          }
        })
        break

      // When a user requests to retrieve all
      // the messages they have received.
      // Limit 100 most recent messages.
      case "retrieve-all":
        console.log(`Received request to retrieve latest messages from ${receiver}`)

        // TODO Handle unregistered users instead of "registering" them here.
        if (!users[receiver.toLowerCase()]) users[receiver.toLowerCase()] = []

        // Get only the most recent messages for a receiver
        const messages = users[receiver.toLowerCase()].slice(0, 99)

        console.log(`Found latest messages for ${receiver}:`, messages)

        const foundInfo = {
          type: "send-list",
          to: receiver,
          message: messages
        }

        // Send the messages to the requester
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            console.log('SERVER: sending found list to client')
            client.send(JSON.stringify(foundInfo))
          }
        })

        break

      // When a user requests the messages
      //from a specific sender.
      // Limit 100 most recent messages
      case "retrieve-specific":
        // TODO Handle unregistered users instead of "registering" them here.
        if (!users[receiver.toLowerCase()]) users[receiver.toLowerCase()] = []

        // Get only the most recent messages for a receiver from
        // a specific sender
        const filteredMessages = users[receiver.toLowerCase()].filter(message => {
          const { sender: savedMessageSender } = message
          if (savedMessageSender.toLowerCase() === sender.toLowerCase()) return message
        }).slice(0, 99)

        console.log(`Found filtered messages for ${receiver}:`, filteredMessages)

        const filteredInfo = {
          type: "send-list",
          to: receiver,
          from: sender,
          message: filteredMessages
        }

        // Send the messages to the requester
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            console.log('SERVER: sending found filtered list')
            client.send(JSON.stringify(filteredInfo))
          }
        })
        break
      default:
        break
    }

  })
})