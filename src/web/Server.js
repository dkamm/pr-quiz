import ngrok from '@ngrok/ngrok'

class Server {
  constructor({ port = 3000, createApp, ngrokAuthToken }) {
    this.port = port
    this.connections = new Set()
    this.server = null
    this.listener = null
    this.ngrokUrl = null
    this.createApp = createApp
    this.ngrokAuthToken = ngrokAuthToken
    this.shouldLog = process.env.GITHUB_ACTIONS !== 'true'
  }

  log(message) {
    if (this.shouldLog) {
      console.log(message)
    }
  }

  async start() {
    const app = this.createApp(this.shutdown.bind(this))

    this.server = app.listen(this.port, () => {
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
      this.ngrokUrl = this.listener.url()
      this.log(`Ngrok URL: ${this.ngrokUrl}`)
    }
  }

  getUrl() {
    return this.ngrokUrl
  }

  async shutdown() {
    this.log('Shutting down...')
    this.connections.forEach((socket) => socket.destroy())
    this.server.close(async () => {
      await this.listener.close()
      process.exit(0)
    })
    setTimeout(() => process.exit(1), 5000)
  }
}

export default Server
