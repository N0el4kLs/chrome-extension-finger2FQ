document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const modelSelect = document.getElementById('modelSelect');
  const showKeyBtn = document.getElementById('showKey');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const status = document.getElementById('status');
  const endpointPreset = document.getElementById('endpointPreset');

  // 添加预设接入点选择事件
  endpointPreset.addEventListener('change', function() {
    const selectedEndpoint = this.value;
    apiEndpointInput.value = selectedEndpoint;
    
    if (!selectedEndpoint) {
      apiEndpointInput.placeholder = '输入自定义API接入点';
      apiEndpointInput.removeAttribute('readonly');
    } else {
      apiEndpointInput.placeholder = '';
      apiEndpointInput.setAttribute('readonly', true);
    }
  });

  // 加载保存的设置
  chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'model'], function(items) {
    if (items.apiKey) apiKeyInput.value = items.apiKey;
    if (items.apiEndpoint) {
      apiEndpointInput.value = items.apiEndpoint;
      // 根据保存的接入点设置预设选项
      const options = Array.from(endpointPreset.options);
      const matchingOption = options.find(option => option.value === items.apiEndpoint);
      if (matchingOption) {
        endpointPreset.value = items.apiEndpoint;
        apiEndpointInput.setAttribute('readonly', true);
      } else {
        endpointPreset.value = '';
        apiEndpointInput.removeAttribute('readonly');
      }
    }
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
      showStatus('请填写完整的 API 配置信息', 'error');
      return;
    }

    testBtn.disabled = true;
    const buttonText = testBtn.querySelector('.button-text');
    const spinner = testBtn.querySelector('.loading-spinner');
    buttonText.textContent = '测试中...';
    spinner.classList.remove('hidden');
    
    try {
      const api = new AIApi(apiKey, apiEndpoint, model);
      const response = await api.testConnection();
      
      if (response.choices && response.choices[0].message.content.includes('pong')) {
        showStatus('连接测试成功！', 'success');
      } else {
        throw new Error('响应格式不正确');
      }
    } catch (error) {
      showStatus(`连接测试失败：${error.message}`, 'error');
    } finally {
      testBtn.disabled = false;
      buttonText.textContent = '测试连接';
      spinner.classList.add('hidden');
    }
  });

  // 保存设置
  saveBtn.addEventListener('click', function() {
    chrome.storage.sync.set({
      apiKey: apiKeyInput.value,
      apiEndpoint: apiEndpointInput.value,
      model: modelSelect.value
    }, function() {
      showStatus('设置已保存', 'success');
    });
  });

  // 显示状态信息
  function showStatus(message, type) {
    const status = document.getElementById('status');
    const statusMessage = status.querySelector('.status-message');

    // 设置消息和状态类
    statusMessage.textContent = message;
    status.classList.remove('success', 'error', 'show');
    status.classList.add(type, 'show');

    // 3秒后隐藏状态信息
    setTimeout(() => {
      status.classList.remove('show');
    }, 3000);
  }
  const successIcon = status.querySelector('.status-icon.success');
  const errorIcon = status.querySelector('.status-icon.error');

  // 重置所有状态
  status.classList.remove('hidden');
  successIcon.classList.add('hidden');
  errorIcon.classList.add('hidden');

  // 设置消息和图标
  statusMessage.textContent = message;
  if (type === 'success') {
    successIcon.classList.remove('hidden');
  } else {
    errorIcon.classList.remove('hidden');
  }

  // 3秒后隐藏状态信息
  setTimeout(() => {
    status.classList.add('hidden');
  }, 3000);
});