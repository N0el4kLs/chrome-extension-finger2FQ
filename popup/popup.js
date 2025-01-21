document.addEventListener('DOMContentLoaded', function () {
  const fofaBtn = document.getElementById('fofaBtn')
  const quakeBtn = document.getElementById('quakeBtn')
  const gotoBtn = document.getElementById('gotoBtn')
  const resultSection = document.querySelector('.result-section')
  const searchInput = document.getElementById('searchInput')
  const keywordsGrid = document.querySelector('.keywords-grid')
  const FOFA = 'FOFA'
  const QUAKE = 'QUAKE'
  let currentQueryType = ''
  let rawFaviconContent = ''


  getCurrentTabInfo()

  // FOFA button click event
  fofaBtn.addEventListener('click', function () {
    currentQueryType = FOFA
    const searchValue = searchInput.value.trim()
    const searchQuery = document.getElementById('searchQuery')

    if (searchValue.startsWith('icon=')) {
      if (rawFaviconContent) {
        // Convert ArrayBuffer to base64 and add line breaks
        const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(rawFaviconContent)))
        const base64WithNewlines = base64.replace(/.{76}/g, '$&\n') + '\n'

        // Calculate MurmurHash3
        const hash = MurmurHash3.hashBytes(base64WithNewlines, base64WithNewlines.length, 0)
        searchQuery.textContent = `icon_hash="${hash}"`
      } else {
        searchQuery.textContent = searchValue
      }
    } else if (searchValue.startsWith('title=')) {
      searchQuery.textContent = searchValue.replace(/^Title=/, 'title=')
    }

    resultSection.classList.remove('hidden')
  })

  // QUAKE button click event
  quakeBtn.addEventListener('click', function () {
    currentQueryType = QUAKE
    const wordArray = CryptoJS.lib.WordArray.create(rawFaviconContent)
    const md5 = CryptoJS.MD5(wordArray).toString()

    const searchValue = searchInput.value.trim()
    const searchQuery = document.getElementById('searchQuery')

    if (searchValue.startsWith('icon=')) {
      searchQuery.textContent = `favicon:"${md5}"`
    } else if (searchValue.startsWith('title=')) {
      // Extract title value and convert to Quake syntax
      const titleValue = searchValue.replace('title="', '').replace('"', '')
      searchQuery.textContent = `title:"${titleValue}"`
    }

    resultSection.classList.remove('hidden')
  })

  // GOTO button event handler
  gotoBtn.addEventListener('click', function () {
    const searchQuery = document.getElementById('searchQuery')
    const queryText = searchQuery.textContent

    let gotoURL = ""
    switch (currentQueryType) {
      case FOFA:
        var encoder = new TextEncoder()
        var bytes = encoder.encode(queryText)
        var encodedQuery = btoa(String.fromCharCode.apply(null, bytes))
        gotoURL = `https://fofa.info/result?qbase64=${encodeURIComponent(encodedQuery)}`
        break
      case QUAKE:
        gotoURL = `https://quake.360.net/quake/#/searchResult?searchVal=${encodeURIComponent(queryText)}&selectIndex=quake_service&latest=true`
        break
    }
    chrome.tabs.create({ url: gotoURL })
  })

  // Copy button event handler
  copyBtn.addEventListener('click', function () {
    const searchQuery = document.getElementById('searchQuery')
    navigator.clipboard.writeText(searchQuery.textContent)
      .then(() => {
        copyBtn.textContent = 'Copied'
        setTimeout(() => {
          copyBtn.textContent = 'COPY'
        }, 2000)
      })
      .catch(err => {
        console.error('Copy failed:', err)
      })
  })

  // Get current tab information
  function getCurrentTabInfo () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0]
      const url = new URL(currentTab.url)
      const faviconUrl = currentTab.favIconUrl || `${url.origin}/favicon.ico`
      const title = currentTab.title

      // Get favicon content
      fetch(faviconUrl)
        .then(response => response.blob())
        .then(blob => {
          // Convert blob to ArrayBuffer
          return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsArrayBuffer(blob)
          })
        })
        .then(arrayBuffer => {
          rawFaviconContent = arrayBuffer

          // create favicon keyword box
          createKeywordBox('favicon', `icon="${faviconUrl}"`)
        })
        .catch(error => {
          console.error('Error fetching favicon:', error)
        })

      // create title keyword box
      createKeywordBox('Title', `title="${title}"`)
    })
  }

  // Create keyword box
  function createKeywordBox (text, keyword) {
    const box = document.createElement('div')
    box.className = 'keyword-box clickable'
    box.textContent = text
    box.setAttribute('data-keyword', keyword || '')

    box.addEventListener('click', function () {
      if (this.getAttribute('data-keyword')) {
        searchInput.value = this.getAttribute('data-keyword')
        document.querySelectorAll('.keyword-box').forEach(b => b.classList.remove('active'))
        this.classList.add('active')
      }
    })

    keywordsGrid.appendChild(box)
  }
})