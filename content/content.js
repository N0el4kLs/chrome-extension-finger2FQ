const script = document.createElement('script')
script.src = chrome.runtime.getURL('content/injected.js');
(document.head || document.documentElement).appendChild(script)
script.onload = function () {
    script.remove()
}


// listen for messages from the popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'get_isVue') {
        if (window.isVue) {
            sendResponse(window.isVue);
        }
    }
});

// 监听来自页面注入脚本的消息
window.addEventListener('message', (event) => {
    if (event.source === window && event.data.type === 'FROM_PAGE_SCRIPT') {
        // console.log('Content script received message from page:', event.data.payload);
        window.isVue = event.data.data;
    }
}, false);

console.log('Content script loaded and listening for messages.');