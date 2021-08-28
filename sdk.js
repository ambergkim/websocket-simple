const { WebSocket } = require('ws')


/**
 * @description Pretend SDK that will connect
 * to the WebSocket server as a user
 * @param {string} username 
 * @returns {object} generator object that includes
 * methods for sdk use. Currently not working.
 */
module.exports = (username) => {
  const generator = {
    ws: new WebSocket('ws://localhost:3000')
  }

  generator.ws.on('message', message => {
    const { type: requestType, from: sender, to: receiver, message: newMessage } = JSON.parse(message)

    console.log(`Received Message. Message Type: ${requestType}. Message Details:`, message.toString())

    switch (requestType) {
      case 'send':
        if (receiver.toLowerCase() === username.toLowerCase()) {
          console.log(`Received new message for ${receiver}:`, newMessage)
        }
        break
      case 'send-list':
        if (receiver.toLowerCase() === username.toLowerCase()) {
          console.log(`Received list of messages ${newMessage}`)
        }
      default:
        break
    }
  })

  generator.sendMessage = (toUsername, message) => {
      const reqInfo = {
        type: 'send',
        from: username,
        to: toUsername,
        message: message
      }
      console.log(`About to send message from ${username} to ${toUsername}: ${message}`)
      generator.ws.send(JSON.stringify(reqInfo))
  }
  
  generator.retrieveLatest = () => {
      const reqInfo = {
        type: 'retrieve-all',
        to: username
      }
      console.log(`About to request latest for ${username}`)
      generator.ws.send(JSON.stringify(reqInfo))
  }

  generator.retrieveSender = (sender) => {
      const reqInfo = {
        type: 'retrieve-specific',
        to: username,
        from: sender
      }
      console.log(`About to request filtered for ${username}`)
      generator.ws.send(JSON.stringify(reqInfo))
  }

  generator.ws.on('open', async () => {
    console.log('Successfully opened connection')
    const registrationData = {
        type: 'register',
        to: username.toLowerCase()
    }
    generator.ws.send(JSON.stringify(registrationData))

    // TODO REMOVE. ONLY FOR HACKED TESTING
    // Load a dummy message message
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    generator.sendMessage(
      'Santa',
      'Did you bring my present?'
    )

    generator.retrieveLatest()

    await new Promise(resolve => setTimeout(resolve, 5000))

    generator.retrieveSender('Santa')
    // END TODO REMOVE.
  })

  // Returns available methods for a client side application to use
  return generator
}