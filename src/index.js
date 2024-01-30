import { createServer } from 'http'
import { readFile } from 'fs/promises'
import escapeHTML from 'escape-html'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** JSX to HTML */
const renderJSXToHTML = (jsx) => {
    if (typeof jsx === 'string' || typeof jsx === 'number') {
        return escapeHTML(jsx)
    } else if (typeof jsx === 'boolean' || jsx === null) {
        return ''
    } else if (Array.isArray(jsx)) {
        return jsx.map((child) => renderJSXToHTML(child)).join('')
    } else if (typeof jsx === 'object') {
        if (jsx.$$typeof === Symbol.for('react.element')) {
            if (typeof jsx.type === 'string') {
                let element = `<${jsx.type}`
                for (const propName in jsx.props) {
                    if (
                        jsx.hasOwnProperty(propName) &&
                        propName !== 'children'
                    ) {
                        element += ' '
                        element += propName
                        element += '='
                        element += escapeHTML(jsx.props[propName])
                    }
                }
                if (jsx.props.children) {
                    element += '>'
                    element += renderJSXToHTML(jsx.props.children)
                    element += `</${jsx.type}>`
                } else {
                    element += '/>'
                }
                return element
            } else if (typeof jsx.type === 'function') {
                const Component = jsx.type
                const returnedJSX = Component(jsx.props)
                return renderJSXToHTML(returnedJSX)
            }
        } else throw new Error('Cannot render an object.')
    } else {
        throw new Error('Not implemented.')
    }
}

/** Components */

const Footer = ({ author }) => {
    return (
        <footer>
            <hr />
            <p>
                <i>
                    (c){author}, {new Date().getFullYear()}
                </i>
            </p>
        </footer>
    )
}

const BlogPostPage = ({ postContent, author }) => {
    return (
        <html lang="en">
            <head>
                <title>My blog</title>
            </head>
            <body>
                <nav>
                    <a href="/">Home</a>
                    <hr />
                </nav>
                <article>{postContent}</article>
                <Footer author={author} />
            </body>
        </html>
    )
}

/** Server */
const server = await createServer(async (req, res) => {
    const author = 'Evgeny Afanasyev'
    const postContent = await readFile(
        path.resolve(__dirname, './posts/hello-world.txt'),
        'utf-8'
    )
    res.setHeader('Content-Type', 'text/html')

    res.end(
        renderJSXToHTML(
            <BlogPostPage author={author} postContent={postContent} />
        )
    )
})

server.listen(8000, () => {
    console.log('Server is listening!')
})
