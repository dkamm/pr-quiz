class PullRequest {
  constructor(pr, files, comments) {
    this.number = pr.number
    this.title = pr.title
    this.author = pr.user.login
    this.description = pr.body
    this.html_url = pr.html_url
    this.files = files
    this.comments = comments
  }

  getLinesOfCodeChanged() {
    return this.files.reduce((acc, file) => acc + file.changes, 0)
  }

  toXML() {
    return `
<pull_request>
    <number>${this.number}</number>
    <title>${this.escapeXML(this.title)}</title>
    <author>${this.author}</author>
    <description>${this.escapeXML(this.description || '')}</description>

    <comments>
    ${this.comments
      .map(
        (c) => `
        <comment>
            <author>${c.user.login}</author>
            <created_at>${c.created_at}</created_at>
            <body>${this.escapeXML(c.body)}</body>
        </comment>
    `
      )
      .join('\n')}
    </comments>
    
    <files>
    ${this.files
      .map(
        (f) => `
        <file>
            <filename>${f.filename}</filename>
            <status>${f.status}</status>
            <changes>+${f.additions} -${f.deletions}</changes>
            <patch>${this.escapeXML(f.patch || '')}</patch>
        </file>
    `
      )
      .join('\n')}
    </files>
</pull_request>`
  }

  escapeXML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}

export default PullRequest
