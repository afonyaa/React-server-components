import { createServer } from 'http'
import { readFile } from 'fs/promises'
import escapeHTML from 'escape-html'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const server = await createServer(async (req, res) => {
    const author = 'Evgeny Afanasyev'
    const postContent = await readFile(
        path.resolve(__dirname, './posts/hello-world.txt'),
        'utf-8'
    )
    res.setHeader('Content-Type', 'text/html')

    const htmlFragment = (
        <html lang="en">
            <head>
                <title>My blog</title>
            </head>
            <body>
                <nav>
                    <a href="/">Home</a>
                    <hr />
                </nav>
                <article>${escapeHTML(postContent)}</article>
                <footer>
                    <hr />
                    <p>
                        <i>
                            (c) ${escapeHTML(author)}, $
                            {new Date().getFullYear()}
                        </i>
                    </p>
                </footer>
            </body>
        </html>
    )

    res.end(htmlFragment)
})

server.listen(8000, () => {
    console.log('Server is listening!')
})
