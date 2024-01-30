let currentPathName = window.location.pathname

const parseJSX = (key, value) => {
    if (value === '$RE') {
        return Symbol.for('react.element')
    } else if (typeof value === 'string' && value.startsWith('$$')) {
        return value.slice(1)
    } else {
        return value
    }
}
const getInitialClientJSX = () => {
    return JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, parseJSX)
}

console.log(getInitialClientJSX())

const root = ReactDOM.hydrateRoot(document, getInitialClientJSX())

const fetchClientJSX = async (pathname) => {
    const response = await fetch(pathname + '?jsx')
    const clientJsxString = await response.text()
    return JSON.parse(clientJsxString, parseJSX)
}

const navigate = async (pathName) => {
    currentPathName = pathName
    const clientJsx = await fetchClientJSX(pathName)
    if (pathName === currentPathName) {
        root.render(clientJsx)
    }
}

window.addEventListener(
    'click',
    (e) => {
        if (e.target.tagName !== 'A') {
            return
        }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
            return
        }
        const href = e.target.getAttribute('href')
        if (!href.startsWith('/')) {
            return
        }
        e.preventDefault()
        window.history.pushState(null, null, href)
        navigate(href)
    },
    true
)

window.addEventListener('popstate', () => {
    navigate(window.location.pathname)
})
