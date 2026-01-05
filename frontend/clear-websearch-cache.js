// Simple script to clear web search cache
console.log('Clearing web search cache...');

// Clear localStorage items
localStorage.removeItem('webSearchStatus');
localStorage.removeItem('webSearchStatusTime');

console.log('Cache cleared! Refresh the page to see updated web search status.');