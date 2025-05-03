function findVueRoot (root) {
    const queue = [root]
    while (queue.length > 0) {
        const currentNode = queue.shift()

        if (currentNode.__vue__ || currentNode.__vue_app__ || currentNode._vnode) {
            // console.log("vue detected on root element:", currentNode)
            return true
        }

        for (let i = 0; i < currentNode.childNodes.length; i++) {
            queue.push(currentNode.childNodes[i])
        }
    }

    return false
}
// console.log("vue detection started")

const hasVueRoot = findVueRoot(document.body);

window.postMessage({ type: 'FROM_PAGE_SCRIPT', data: { isVue: hasVueRoot } }, '*');