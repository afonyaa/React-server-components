import { createServer } from 'http'
import { readFile, readdir } from 'fs/promises'
import escapeHTML from 'escape-html'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** JSX to HTML */
const renderJSXToHTML = async (jsx) => {
    if (typeof jsx === 'string' || typeof jsx === 'number') {
        return escapeHTML(jsx)
    } else if (typeof jsx === 'boolean' || jsx === null) {
        return ''
    } else if (Array.isArray(jsx)) {
        const childHtmls = await Promise.all(
            jsx.map((child) => renderJSXToHTML(child))
        )
        return childHtmls.join('')
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
                    element += await renderJSXToHTML(jsx.props.children)
                    element += `</${jsx.type}>`
                } else {
                    element += '/>'
                }
                return element
            } else if (typeof jsx.type === 'function') {
                const Component = jsx.type
                const returnedJSX = await Component(jsx.props)
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
                    <input />
                    <hr />
                </nav>
                <main>{children}</main>
                <Footer author={author} />
            </body>
        </html>
    )
}

const Footer = async ({ author }) => {
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

const BlogPostPage = ({ postSlug }) => {
    return <Post slug={postSlug} />
}

const BlogIndexPage = async () => {
    const postFiles = await readdir(path.resolve(__dirname, `./posts/`))
    const postSlugs = postFiles.map((file) =>
        file.slice(0, file.lastIndexOf('.'))
    )

    return (
        <section>
            <h1>Welcome to my blog</h1>
            <div>
                {postSlugs.map((postSlug) => (
                    <Post slug={postSlug} key={postSlug} />
                ))}
            </div>
        </section>
    )
}

const Post = async ({ slug }) => {
    const postContent = await readFile(
        path.resolve(__dirname, `./posts/${slug}.txt`),
        'utf-8'
    )

    return (
        <section>
            <h2>
                <a href={'/' + slug}>{slug}</a>
            </h2>
            <article>{postContent}</article>
        </section>
    )
}

const Router = ({ url }) => {
    let page
    if (url.pathname === '/') {
        page = <BlogIndexPage />
    } else {
        const postSlug = url.pathname.slice(1)
        page = <BlogPostPage postSlug={postSlug} />
    }
    return <BlogLayout>{page}</BlogLayout>
}

/** Server */
const server = await createServer(async (req, res) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`)
        if (url.pathname === '/client.js') {
            const script = await readFile(
                path.resolve(__dirname, `./client.js`),
                'utf-8'
            )
            res.setHeader('Content-Type', 'text/javascript')
            res.end(script)
        } else {
            let html = await renderJSXToHTML(<Router url={url} />)
            html += `<script type="module" src="/client.js"></script>`
            res.setHeader('Content-Type', 'text/html')
            res.end(html)
        }
    } catch (err) {
        console.error(err)
        res.statusCode = err.statusCode ?? 500
        res.end()
    }
})

server.listen(8000, () => {
    console.log('Server is listening!')
})
