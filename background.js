let currentProxy = null;

function loadSavedState() {
  chrome.storage.local.get('currentProxy', (result) => {
    if (result.currentProxy) {
      currentProxy = result.currentProxy;
      setProxyConfig(currentProxy);
    }
  });
}

function setProxyConfig(proxy) {
  const config = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: 'http',
        host: proxy.split(':')[0],
        port: parseInt(proxy.split(':')[1])
      }
    }
  };

  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    console.log('Proxy set to:', proxy);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request);

  if (request.action === 'setProxy') {
    setProxyConfig(request.proxy);
    currentProxy = request.proxy;
    sendResponse({ success: true });
  } else if (request.action === 'clearProxy') {
    clearProxyConfig(() => {
      currentProxy = null;
      console.log('Proxy cleared');
      sendResponse({ success: true });
    });
  } else if (request.action === 'getProxyStatus') {
    sendResponse({ proxy: currentProxy });
  }

  return true;
});


function setProxyConfig(proxy) {
  const config = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: {
        scheme: 'http',
        host: proxy.split(':')[0],
        port: parseInt(proxy.split(':')[1])
      }
    }
  };

  chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
    console.log('Proxy set to:', proxy);
  });
}

function clearProxyConfig(callback) {
  chrome.proxy.settings.clear({ scope: 'regular' }, callback);
}

chrome.proxy.onProxyError.addListener((details) => {
  console.error('Proxy error:', details);
  if (currentProxy) {
    chrome.runtime.sendMessage({ 
      action: 'proxyError', 
      error: 'ERR_TUNNEL_CONNECTION_FAILED' 
    });
  }
});

chrome.storage.local.get('currentProxy', (result) => {
  if (result.currentProxy) {
    currentProxy = result.currentProxy;
    setProxyConfig(currentProxy);
  }
});