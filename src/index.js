import { createServer } from 'http'
import { readFile, readdir } from 'fs/promises'
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
                        jsx.props.hasOwnProperty(propName) &&
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
const BlogLayout = ({ children }) => {
    const author = 'Evgeny Afanasyev'
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
                <main>{children}</main>
                <Footer author={author} />
            </body>
        </html>
    )
}

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

const BlogPostPage = ({ postContent, postSlug }) => {
    return (
        <section>
            <h2>
                <a href={'/' + postSlug}>{postSlug}</a>
            </h2>
            <article>{postContent}</article>
        </section>
    )
}

const BlogPostIndexPage = ({ postContents, postSlugs }) => {
    return (
        <section>
            <h1>Welcome to my blog</h1>
            <div>
                {postSlugs.map((postSlug, index) => (
                    <section>
                        <h2>
                            <a href={'/' + postSlug}>{postSlug}</a>
                        </h2>
                        <article>{postContents[index]}</article>
                    </section>
                ))}
            </div>
        </section>
    )
}

const matchRoute = async (url) => {
    if (url.pathname === '/') {
        const postFiles = await readdir(path.resolve(__dirname, `./posts/`))
        const postSlugs = postFiles.map((file) =>
            file.slice(0, file.lastIndexOf('.'))
        )
        const postContents = await Promise.all(
            postSlugs.map((postSlug) => {
                readFile(
                    path.resolve(__dirname, `./posts/${postSlug}.txt`),
                    'utf-8'
                )
            })
        )
        return (
            <BlogPostIndexPage
                postSlugs={postSlugs}
                postContents={postContents}
            />
        )
    } else {
        const postSlug = url.pathname.slice(1)
        try {
            const postContent = await readFile(
                path.resolve(__dirname, `./posts/${postSlug}.txt`),
                'utf-8'
            )
            return (
                <BlogPostPage postSlug={postSlug} postContent={postContent} />
            )
        } catch (cause) {
            const notFound = new Error(cause)
            notFound.statusCode = 404
            throw notFound
        }
    }
}

/** Server */
const server = await createServer(async (req, res) => {
    res.setHeader('Content-Type', 'text/html')
    try {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const page = await matchRoute(url)
        res.end(renderJSXToHTML(<BlogLayout>{page}</BlogLayout>))
    } catch (e) {
        console.error(e)
        res.statusCode = e.statusCode ?? 500
        res.end()
    }
})

server.listen(8000, () => {
    console.log('Server is listening!')
})
