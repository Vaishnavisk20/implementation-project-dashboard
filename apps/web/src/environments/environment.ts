const localApiUrl =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:4000/api'
    : '/api';

export const environment = {
  apiUrl: localApiUrl,
  jiraBaseUrl: 'https://aquera.atlassian.net/browse'
};
