document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const modelSelect = document.getElementById('modelSelect');
  const showKeyBtn = document.getElementById('showKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const status = document.getElementById('status');

  // 加载保存的设置
  chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'model'], function(items) {
    if (items.apiKey) apiKeyInput.value = items.apiKey;
    if (items.apiEndpoint) apiEndpointInput.value = items.apiEndpoint;
    if (items.model) modelSelect.value = items.model;
  });

  // 显示/隐藏 API Key
  showKeyBtn.addEventListener('click', function() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      showKeyBtn.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      showKeyBtn.textContent = '👁️';
    }
  });

  // 测试连接
  testBtn.addEventListener('click', async function() {
    const apiKey = apiKeyInput.value.trim();
    const apiEndpoint = apiEndpointInput.value.trim();
    const model = modelSelect.value;

    if (!apiKey || !apiEndpoint) {
      status.textContent = '请填写完整的 API 配置信息';
      status.className = 'status error';
      return;
    }

    testBtn.disabled = true;
    testBtn.textContent = '测试中...';
    
    try {
      const api = new AIApi(apiKey, apiEndpoint, model);
      const response = await api.testConnection();
      
      if (response.choices && response.choices[0].message.content.includes('pong')) {
        status.textContent = '连接测试成功！';
        status.className = 'status success';
      } else {
        throw new Error('响应格式不正确');
      }
    } catch (error) {
      status.textContent = `连接测试失败：${error.message}`;
      status.className = 'status error';
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = '测试连接';
      setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
      }, 3000);
    }
  });

  // 保存设置
  saveBtn.addEventListener('click', function() {
    chrome.storage.sync.set({
      apiKey: apiKeyInput.value,
      apiEndpoint: apiEndpointInput.value,
      model: modelSelect.value
    }, function() {
      status.textContent = '设置已保存';
      status.className = 'status success';
      setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
      }, 2000);
    });
  });
});