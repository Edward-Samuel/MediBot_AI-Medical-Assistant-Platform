// Script to clear frontend localStorage cache for web search
console.log('🧹 Clearing frontend localStorage cache...\n');

const cacheKeys = [
  'webSearchStatus',
  'webSearchStatusTime'
];

console.log('Cache keys to clear:');
cacheKeys.forEach(key => {
  console.log(`- ${key}`);
});

console.log('\n📋 INSTRUCTIONS:');
console.log('1. Open your browser developer tools (F12)');
console.log('2. Go to the Console tab');
console.log('3. Run the following commands:');
console.log('');
console.log('localStorage.removeItem("webSearchStatus");');
console.log('localStorage.removeItem("webSearchStatusTime");');
console.log('localStorage.clear(); // Optional: clear all cache');
console.log('');
console.log('4. Refresh the page (F5 or Ctrl+R)');
console.log('5. The web search status should now be rechecked');
console.log('');
console.log('✅ Frontend should now connect to backend at http://localhost:3002');
console.log('✅ Web search should show as available');