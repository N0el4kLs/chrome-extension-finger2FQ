document.addEventListener('DOMContentLoaded', function() {
  const fofaBtn = document.getElementById('fofaBtn');
  const quakeBtn = document.getElementById('quakeBtn');
  const resultSection = document.querySelector('.result-section');
  const keywordBoxes = document.querySelectorAll('.keyword-box');
  const searchInput = document.getElementById('searchInput');
  let currentQueryType = ''; 
  let rawFaviconContent = '';


  // Add click event for each keyword box
  keywordBoxes.forEach(box => {
    box.addEventListener('click', function() {
      const keyword = this.getAttribute('data-keyword');
      if (keyword) {
        searchInput.value = keyword;
        
        // Remove active class from other keyword boxes
        keywordBoxes.forEach(b => b.classList.remove('active'));
        // Add active class to current keyword box
        this.classList.add('active');
      }
    });
  });

  // Auto get information when plugin opens
  getCurrentTabInfo();

  // FOFA button click event
  fofaBtn.addEventListener('click', function() {
    currentQueryType = 'fofa';
    const searchValue = searchInput.value.trim();
    const searchQuery = document.getElementById('searchQuery');
    
    if (searchValue.startsWith('icon=')) {
      if (rawFaviconContent) {
        // Convert ArrayBuffer to base64 and add line breaks
        const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(rawFaviconContent)));
        const base64WithNewlines = base64.replace(/.{76}/g, '$&\n') + '\n';
        
        // Calculate MurmurHash3
        const hash = MurmurHash3.hashBytes(base64WithNewlines, base64WithNewlines.length, 0);
        searchQuery.textContent = `icon_hash="${hash}"`;
      } else {
        searchQuery.textContent = searchValue;
      }
    } else if (searchValue.startsWith('title=')) {
      searchQuery.textContent = searchValue.replace(/^Title=/, 'title=');
    }

    resultSection.classList.remove('hidden');
  });

  // QUAKE button click event
  quakeBtn.addEventListener('click', function() {
    currentQueryType = 'quake';
    // Convert ArrayBuffer to WordArray
    const wordArray = CryptoJS.lib.WordArray.create(rawFaviconContent);
    // Calculate MD5 using CryptoJS
    const md5 = CryptoJS.MD5(wordArray).toString();

    const searchValue = searchInput.value.trim();
    const searchQuery = document.getElementById('searchQuery');
    
    if (searchValue.startsWith('icon=')) {
      searchQuery.textContent = `favicon:"${md5}"`;
    } else if (searchValue.startsWith('title=')) {
      // Extract title value and convert to Quake syntax
      const titleValue = searchValue.replace('title="', '').replace('"', '');
      searchQuery.textContent = `title:"${titleValue}"`;
    }

    resultSection.classList.remove('hidden');
  });

  // GOTO button event handler
  const gotoBtn = document.getElementById('gotoBtn');
  gotoBtn.addEventListener('click', function() {
    const searchQuery = document.getElementById('searchQuery');
    const queryText = searchQuery.textContent;

    if (currentQueryType === 'fofa') {
      var encoder = new TextEncoder();
      var bytes = encoder.encode(queryText);
      var encodedQuery = btoa(String.fromCharCode.apply(null, bytes));
      const fofaUrl = `https://fofa.info/result?qbase64=${encodedQuery}`;
      chrome.tabs.create({ url: fofaUrl });
    } else if (currentQueryType === 'quake') {
      // 这里可以添加 Quake 的跳转逻辑
      const quakeUrl = `https://quake.360.net/quake/#/searchResult?searchVal=${encodeURIComponent(queryText)}&selectIndex=quake_service&latest=true`;
      chrome.tabs.create({ url: quakeUrl });
    }
  });

  // Copy button event handler
  copyBtn.addEventListener('click', function() {
    const searchQuery = document.getElementById('searchQuery');
    navigator.clipboard.writeText(searchQuery.textContent)
      .then(() => {
        copyBtn.textContent = 'Copied';
        setTimeout(() => {
          copyBtn.textContent = 'COPY';
        }, 2000);
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  });

  // Get current tab information
  function getCurrentTabInfo() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const url = new URL(currentTab.url);
      const faviconUrl = currentTab.favIconUrl || `${url.origin}/favicon.ico`;
      const title = currentTab.title;

      // Get favicon content
      fetch(faviconUrl)
        .then(response => response.blob())
        .then(blob => {
          // Convert blob to ArrayBuffer
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
          });
        })
        
        .then(arrayBuffer => {
           rawFaviconContent = arrayBuffer;

          const faviconBox = keywordBoxes[0];
          faviconBox.textContent = 'favicon';
          faviconBox.setAttribute('data-keyword', `icon="${faviconUrl}"`);
        })
        .catch(error => {
          alert('Error: ' + error.message);
          const faviconBox = keywordBoxes[0];
          faviconBox.textContent = 'No favicon found';
          faviconBox.setAttribute('data-keyword', '');
        });
      
      // Update title keyword
      const titleBox = keywordBoxes[1];
      titleBox.textContent = `Title: ${title}`;
      titleBox.setAttribute('data-keyword', `title="${title}"`);
    });
  }
});