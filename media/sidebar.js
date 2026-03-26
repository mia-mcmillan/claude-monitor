const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');

  // Listen for messages from the extension
  window.addEventListener('message', (event) => {
    const message = event.data;

    if (message.type === 'updateSidebar') {
      renderSidebar(root, message.data);
    } else if (message.type === 'error') {
      renderError(root, message.message);
    }
  });

  // Request initial data
  vscode.postMessage({ command: 'getSidebarData' });
});

function renderSidebar(container, data) {
  if (!data) {
    container.innerHTML = '<div class="empty-state">No session data available</div>';
    return;
  }

  let html = '';

  // Context section
  html += renderContextSection(data);

  // Git section
  if (data.git) {
    html += renderGitSection(data.git);
  }

  // Session info section
  html += renderSessionInfoSection(data.session);

  container.innerHTML = html;

  // Add event listeners for collapsible sections
  document.querySelectorAll('.section-title').forEach((title) => {
    title.addEventListener('click', (e) => {
      e.currentTarget.closest('.section').classList.toggle('collapsed');
    });
  });
}

function renderContextSection(data) {
  const percentage = Math.round((data.context.used / data.context.limit) * 100);
  let fillColor = '#22c55e';
  if (percentage > 80) fillColor = '#ef4444';
  else if (percentage > 50) fillColor = '#eab308';

  return `
    <div class="section">
      <div class="section-title">
        <span>📊 Context Usage</span>
        <span class="timestamp">now</span>
      </div>
      <div class="section-content">
        <div class="row">
          <span class="label">Used</span>
          <span class="value">${data.context.used.toLocaleString()} / ${data.context.limit.toLocaleString()}</span>
        </div>
        <div class="context-bar">
          <div class="context-fill" style="width: ${percentage}%; background-color: ${fillColor}"></div>
        </div>
        <div class="row">
          <span class="label">Percentage</span>
          <span class="value">${percentage}%</span>
        </div>
      </div>
    </div>
  `;
}

function renderGitSection(git) {
  if (!git) return '';

  const dirtyIndicator = git.isDirty ? `<span class="git-dirty">[+${git.modifiedCount}]</span>` : '';

  return `
    <div class="section">
      <div class="section-title">
        <span>🌿 Git Status</span>
        <span class="timestamp">now</span>
      </div>
      <div class="section-content">
        <div class="git-status">
          <span class="git-branch">↳ ${git.branch}</span>
          ${dirtyIndicator}
        </div>
      </div>
    </div>
  `;
}

function renderSessionInfoSection(session) {
  if (!session) return '';

  return `
    <div class="section">
      <div class="section-title">
        <span>⚙️ Session Info</span>
        <span class="timestamp">now</span>
      </div>
      <div class="section-content">
        <div class="row">
          <span class="label">Model</span>
          <span class="value">${session.model}</span>
        </div>
        <div class="row">
          <span class="label">Provider</span>
          <span class="value">${session.authProvider}</span>
        </div>
        <div class="row">
          <span class="label">Duration</span>
          <span class="value">${session.duration}</span>
        </div>
      </div>
    </div>
  `;
}

function renderError(container, message) {
  container.innerHTML = `<div class="error-state">⚠️ ${message}</div>`;
}