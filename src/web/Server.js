import ngrok from '@ngrok/ngrok'

class Server {
  constructor({ app, port = 3000, ngrokAuthToken }) {
    this.app = app
    this.port = port
    this.connections = new Set()
    this.server = null
    this.listener = null
    this.ngrokUrl = null
    this.ngrokAuthToken = ngrokAuthToken
    this.shouldLog = process.env.GITHUB_ACTIONS !== 'true'
  }

  log(message) {
    if (this.shouldLog) {
      console.log(message)
    }
  }

  async start() {
    this.server = this.app.listen(this.port, () => {
      this.log(`Server running on port ${this.port}`)
    })

    this.server.on('connection', (socket) => {
      this.connections.add(socket)
      socket.on('close', () => this.connections.delete(socket))
    })

    if (this.ngrokAuthToken) {
      this.listener = await ngrok.connect({
        addr: this.port,
        authtoken: this.ngrokAuthToken,
        onStatusChange: (status) => {
          this.log(`Ngrok status: ${status}`)
        }
      })
    }
  }

  getUrl() {
    if (this.listener) {
      return this.listener.url()
    } else {
      return `http://localhost:${this.port}`
    }
  }

  async shutdown() {
    this.log('Shutting down...')
    this.connections.forEach((socket) => socket.destroy())
    this.server.close(async () => {
      if (this.listener) {
        await this.listener.close()
      }
    })
  }
}

export default Server
