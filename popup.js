document.addEventListener('DOMContentLoaded', () => {
  const proxyList = document.getElementById('proxyList');
  const refreshButton = document.getElementById('refreshButton');
  const notificationArea = document.getElementById('notificationArea');
  let currentProxy = null;

  function showNotification(message, type = 'info') {
    notificationArea.textContent = message;
    notificationArea.className = `notification-area show ${type}`;
    setTimeout(() => {
      notificationArea.className = 'notification-area';
    }, 3000);
  }

  function fetchProxies() {
    fetch('https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&proxy_format=ipport&format=text&timeout=50') //timeout 50ms
      .then(response => response.text())
      .then(data => {
        const proxies = data.trim().split('\n');
        chrome.storage.local.set({ proxyList: proxies }, () => {
          renderProxyList(proxies);
          showNotification('Proxy list refreshed', 'success');
        });
      })
      .catch(error => {
        console.error('Error fetching proxies:', error);
        showNotification('Failed to fetch proxies', 'error');
      });
  }

  function renderProxyList(proxies) {
    proxyList.innerHTML = '';
    proxies.forEach(proxy => {
      const li = document.createElement('li');
      li.textContent = proxy;
      const actionButton = document.createElement('button');
      actionButton.classList.add('mdc-button', 'mdc-button--outlined');
      actionButton.dataset.proxy = proxy;
      updateButtonState(actionButton);
      li.appendChild(actionButton);
      proxyList.appendChild(li);
    });
  }

  function updateButtonState(button) {
    const proxy = button.dataset.proxy;
    if (currentProxy === proxy) {
      button.textContent = 'Disconnect';
      button.onclick = () => disconnectProxy(proxy);
    } else {
      button.textContent = 'Connect';
      button.onclick = () => connectProxy(proxy);
    }
  }

  function connectProxy(proxy) {
    chrome.runtime.sendMessage({ action: 'setProxy', proxy: proxy }, (response) => {
      if (response && response.success) {
        currentProxy = proxy;
        chrome.storage.local.set({ currentProxy: currentProxy }, () => {
          showNotification(`Connected to proxy: ${proxy}`, 'success');
          updateAllButtons();
        });
      } else {
        showNotification('Failed to connect to proxy', 'error');
      }
    });
  }

  function disconnectProxy(proxy) {
    chrome.runtime.sendMessage({ action: 'clearProxy' }, (response) => {
      if (response && response.success) {
        currentProxy = null;
        chrome.storage.local.set({ currentProxy: null }, () => {
          showNotification(`Disconnected from proxy: ${proxy}`, 'success');
          updateAllButtons();
        });
      } else {
        showNotification('Failed to disconnect from proxy', 'error');
      }
    });
  }

  function updateAllButtons() {
    const buttons = proxyList.querySelectorAll('button');
    buttons.forEach(updateButtonState);
  }

  refreshButton.addEventListener('click', fetchProxies);

  chrome.storage.local.get(['currentProxy', 'proxyList'], (result) => {
    currentProxy = result.currentProxy || null;
    if (result.proxyList && result.proxyList.length > 0) {
      renderProxyList(result.proxyList);
    } else {
      fetchProxies();
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'proxyError') {
      showNotification(`Proxy error: ${request.error}`, 'error');
      disconnectProxy(currentProxy);
    }
  });
});