let currentPathName = window.location.pathname

const navigate = async (pathName) => {
    currentPathName = pathName
    const response = await fetch(pathName)
    const receivedHTML = await response.text()

    const bodyStartIndex = receivedHTML.indexOf('<body>') + '<body>'.length
    const bodyEndIndex = receivedHTML.lastIndexOf('</body>')
    document.body.innerHTML = receivedHTML.slice(bodyStartIndex, bodyEndIndex)
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
