document.addEventListener('DOMContentLoaded', function () {
  const keywordsGrid = document.querySelector('.keywords-grid')
  const searchInput = document.getElementById('searchInput')

  const fofaBtn = document.getElementById('fofaBtn')
  const quakeBtn = document.getElementById('quakeBtn')

  const gotoBtn = document.getElementById('gotoBtn')
  const copyBtn = document.getElementById('copyBtn')

  const resultSection = document.querySelector('.result-section')


  const FOFA = 'FOFA'
  const QUAKE = 'QUAKE'
  let currentQueryType = ''
  let rawFaviconContent = ''


  genKeywordsBlocks()

  // FOFA button click event
  fofaBtn.addEventListener('click', function () {
    // reference: https://github.com/zR00t1/iconhash
    currentQueryType = FOFA
    const searchValue = searchInput.value.trim()
    const searchQuery = document.getElementById('searchQuery')

    if (!searchValue) {
      searchInput.placeholder = '输入条件不能为空...'
      setTimeout(() => {
        searchInput.placeholder = '点击上面的关键字，以选择输入条件...'
      }, 1500)
      return
    }

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
    } else if (searchValue.startsWith('domain=')) {
      searchQuery.textContent = searchValue.replace(/^Domain=/, 'domain=')
    } else if (searchValue.startsWith('body=')) {
      // 保持 FOFA 的 body 语法格式
      searchQuery.textContent = searchValue
    } else if (searchValue.startsWith('icp=')) {
      // 转换为 FOFA 的 icp 语法格式
      const icpValue = searchValue.replace('icp="', '').replace('"', '')
      searchQuery.textContent = `icp="${icpValue}"`
    } else {
      searchQuery.textContent = searchValue
    }

    resultSection.classList.remove('hidden')
    resultSection.classList.add('show')  // 修改这里
  })

  // QUAKE button click event
  quakeBtn.addEventListener('click', function () {
    currentQueryType = QUAKE
    const searchValue = searchInput.value.trim()
    const searchQuery = document.getElementById('searchQuery')

    if (!searchValue) {
      searchInput.placeholder = '输入条件不能为空...'
      setTimeout(() => {
        searchInput.placeholder = '点击上面的关键字，以选择输入条件...'
      }, 1500)
      return
    }

    if (searchValue.startsWith('icon=')) {
      const wordArray = CryptoJS.lib.WordArray.create(rawFaviconContent)
      const md5 = CryptoJS.MD5(wordArray).toString()
      searchQuery.textContent = `favicon:"${md5}"`
    } else if (searchValue.startsWith('title=')) {
      // Extract title value and convert to Quake syntax
      const titleValue = searchValue.replace('title="', '').replace('"', '')
      searchQuery.textContent = `title:"${titleValue}"`
    } else if (searchValue.startsWith('domain=')) {
      // Extract domain value and convert to Quake syntax
      const domainValue = searchValue.replace('domain="', '').replace('"', '')
      searchQuery.textContent = `domain:"${domainValue}"`
    } else if (searchValue.startsWith('body=')) {
      // 转换为 Quake 的 body 语法格式
      const bodyValue = searchValue.replace('body="', '').replace('"', '')
      searchQuery.textContent = `body:"${bodyValue}"`
    } else if (searchValue.startsWith('icp=')) {
      // 转换为 Quake 的 icp 语法格式
      const icpValue = searchValue.replace('icp="', '').replace('"', '')
      searchQuery.textContent = `icp:"${icpValue}"`
    } else {
      searchQuery.textContent = searchValue
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

  // Generate keywords blocks
  function genKeywordsBlocks () {
    chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
      const currentTab = tabs[0]
      const url = new URL(currentTab.url)

      await createFaviconBlock(currentTab.favIconUrl || `${url.origin}/favicon.ico`)

      createTitleBlock(currentTab.title)

      createDomainBlock(url.hostname)
    })
  }

  // Create keyword box
  function createKeywordBox(text, keyword) {
    const box = document.createElement('div')
    box.className = 'keyword-box clickable'
    box.textContent = text
    box.setAttribute('data-keyword', keyword || '')
    // 添加完整内容作为 tooltip
    box.title = text
  
    box.addEventListener('click', function() {
      if (this.getAttribute('data-keyword')) {
        searchInput.value = this.getAttribute('data-keyword')
        document.querySelectorAll('.keyword-box').forEach(b => b.classList.remove('active'))
        this.classList.add('active')
      }
    })
  
    keywordsGrid.appendChild(box)
  }

  // Create favicon content
  function createFaviconBlock (faviconUrl) {
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
  }

  // Create title keyword box
  function createTitleBlock (title) {
    createKeywordBox('Title', `title="${title}"`)
  }

  // Create domain keyword box
  function createDomainBlock (hostname) {
    const domainParts = hostname.split('.')
    const domain = domainParts.length >= 2 ?
      domainParts.slice(-2).join('.') :
      hostname
    createKeywordBox('Domain', `domain="${domain}"`)
  }
  const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
  
  // AI 分析按钮点击事件
  aiAnalyzeBtn.addEventListener('click', async function() {
    const button = this;
    const buttonText = button.querySelector('.button-content');
    const spinner = button.querySelector('.loading-spinner');

    try {
      // 更新按钮状态
      button.disabled = true;
      buttonText.textContent = '分析中...';
      spinner.classList.remove('hidden');

      // 获取当前标签页的原始HTML源码
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const [{ result: htmlContent }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: async () => {
          const response = await fetch(window.location.href);
          return await response.text();
        }
      });

      // 获取存储的API设置
      const { apiKey, apiEndpoint, model } = await new Promise(resolve => {
        chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'model'], resolve);
      });

      if (!apiKey || !apiEndpoint) {
        throw new Error('请先在设置页面配置 API 信息');
      }

      // 创建API实例并发送请求
      const api = new AIApi(apiKey, apiEndpoint, model);
      const response = await api.analyzeWebPage(htmlContent);

      if (!response.choices || !response.choices[0].message) {
        throw new Error('AI 响应格式不正确');
      }

      const analysisResult = response.choices[0].message.content;
      try {
        // 从 markdown 格式中提取 JSON 字符串
        const jsonMatch = analysisResult.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
          console.error('无法从响应中提取 JSON 数据: ', analysisResult);
          throw new Error('无法从响应中提取 JSON 数据');
        }

        // 解析 JSON 结果
        const features = JSON.parse(jsonMatch[1]);
        console.log('Parsed features:', features);
        
        // 处理每个特征并生成关键词块
        features.forEach(feature => {
          let keyword = '';
          let text = '';
          
          switch(feature.location) {
            case 'title':
              text = `Title(AI)`;
              keyword = `title="${feature.content}"`;
              break;
            case 'icp':
              text = `ICP(AI)`;
              keyword = `icp="${feature.content}"`;
              break;
            default: // body
              // 截取内容前20个字符，如果超过则添加省略号
              const shortContent = feature.content.length > 20 
                ? feature.content.substring(0, 20) + '...' 
                : feature.content;
              text = `Body(AI): ${shortContent}`;
              keyword = `body="${feature.content}"`;
              break;
          }
          
          // 创建关键词块
          createKeywordBox(text, keyword);
        });

      } catch (error) {
        console.error('解析 AI 分析结果失败:', error);
        throw new Error('AI 返回的结果格式不正确');
      }

    } catch (error) {
      console.error('AI Analysis Error:', error);
      alert(error.message);
    } finally {
      // 恢复按钮状态
      button.disabled = false;
      buttonText.textContent = 'AI 分析';
      spinner.classList.add('hidden');
    }
  });

});