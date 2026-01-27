/**
 * Web Search Integration Example
 * 
 * This example shows how to integrate web search functionality
 * that bypasses the RAG/FAQ system when explicitly requested.
 */

// Example: Chat interface with web search button
class WebSearchChatInterface {
  constructor(apiBaseUrl = 'http://localhost:5000/api') {
    this.apiBaseUrl = apiBaseUrl;
    this.conversationHistory = [];
  }

  /**
   * Send regular chat message (uses intent classification)
   */
  async sendMessage(message, options = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': options.token ? `Bearer ${options.token}` : undefined
        },
        body: JSON.stringify({
          message,
          conversationHistory: this.conversationHistory,
          language: options.language || 'en',
          sessionId: options.sessionId,
          forceWebSearch: options.forceWebSearch || false
        })
      });

      const data = await response.json();
      
      // Update conversation history
      this.conversationHistory.push(
        { role: 'user', content: message },
        { role: 'bot', content: data.response }
      );

      return data;

    } catch (error) {
      console.error('Chat error:', error);
      throw error;
    }
  }

  /**
   * Force web search (bypasses RAG/FAQ completely)
   */
  async forceWebSearch(message, options = {}) {
    console.log('🔍 Forcing web search for:', message);
    
    return await this.sendMessage(message, {
      ...options,
      forceWebSearch: true
    });
  }

  /**
   * Direct web search API call (returns raw search results)
   */
  async directWebSearch(query, options = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/ai/web-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          maxResults: options.maxResults || 5,
          language: options.language || 'en'
        })
      });

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Direct web search error:', error);
      throw error;
    }
  }

  /**
   * Test different search methods
   */
  async testSearchMethods(query) {
    console.log(`\n--- Testing search methods for: "${query}" ---`);

    // Method 1: Regular chat (may use FAQ if detected)
    console.log('\n1. Regular chat (with intent classification):');
    const regularChat = await this.sendMessage(query);
    console.log('Intent:', regularChat.intentData?.intent);
    console.log('Used FAQ:', regularChat.faqData?.usedFAQ || false);
    console.log('Used Web Search:', regularChat.webSearchData?.usedWebSearch || false);

    // Method 2: Force web search through chat
    console.log('\n2. Forced web search through chat:');
    const forcedSearch = await this.forceWebSearch(query);
    console.log('Intent:', forcedSearch.intentData?.intent);
    console.log('Bypassed RAG:', forcedSearch.webSearchData?.bypassedRAG || false);

    // Method 3: Direct web search API
    console.log('\n3. Direct web search API:');
    const directSearch = await this.directWebSearch(query);
    console.log('Total results:', directSearch.totalResults);
    console.log('Bypassed RAG:', directSearch.bypassedRAG);
    console.log('Has AI summary:', !!directSearch.aiSummary);

    return {
      regularChat,
      forcedSearch,
      directSearch
    };
  }
}

// React Component Example with Web Search Button
const ReactWebSearchComponent = `
import React, { useState } from 'react';

const WebSearchChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const chatInterface = new WebSearchChatInterface();

  // Regular chat message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await chatInterface.sendMessage(inputMessage);
      
      setMessages(prev => [...prev, 
        { role: 'user', content: inputMessage },
        { 
          role: 'bot', 
          content: response.response,
          intent: response.intentData?.intent,
          usedFAQ: response.faqData?.usedFAQ,
          usedWebSearch: response.webSearchData?.usedWebSearch
        }
      ]);
      
      setInputMessage('');
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Force web search
  const forceWebSearch = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await chatInterface.forceWebSearch(inputMessage);
      
      setMessages(prev => [...prev, 
        { role: 'user', content: inputMessage + ' (web search)' },
        { 
          role: 'bot', 
          content: response.response,
          intent: response.intentData?.intent,
          bypassedRAG: response.webSearchData?.bypassedRAG,
          webSearchResults: response.webSearchData?.results
        }
      ]);
      
      setInputMessage('');
      
    } catch (error) {
      console.error('Error with web search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct web search (shows raw results)
  const directWebSearch = async () => {
    if (!inputMessage.trim()) return;

    setIsLoading(true);
    try {
      const results = await chatInterface.directWebSearch(inputMessage);
      setSearchResults(results);
      
    } catch (error) {
      console.error('Error with direct search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={\`message \${msg.role}\`}>
            <div className="content">{msg.content}</div>
            <div className="metadata">
              {msg.intent && <span>Intent: {msg.intent}</span>}
              {msg.usedFAQ && <span className="faq-badge">FAQ</span>}
              {msg.usedWebSearch && <span className="search-badge">Web Search</span>}
              {msg.bypassedRAG && <span className="bypass-badge">Bypassed RAG</span>}
            </div>
          </div>
        ))}
      </div>
      
      {searchResults && (
        <div className="search-results">
          <h3>Web Search Results ({searchResults.totalResults})</h3>
          {searchResults.aiSummary && (
            <div className="ai-summary">
              <h4>AI Summary:</h4>
              <p>{searchResults.aiSummary}</p>
            </div>
          )}
          <div className="results-list">
            {searchResults.results.map((result, index) => (
              <div key={index} className="search-result">
                <h4><a href={result.url} target="_blank">{result.title}</a></h4>
                <p>{result.content}</p>
                <small>{result.domain}</small>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="input-area">
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <div className="button-group">
          <button onClick={sendMessage} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
          <button onClick={forceWebSearch} disabled={isLoading} className="web-search-btn">
            🔍 Web Search
          </button>
          <button onClick={directWebSearch} disabled={isLoading} className="direct-search-btn">
            📊 Raw Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default WebSearchChat;
`;

// Usage examples
async function demonstrateWebSearch() {
  const chatInterface = new WebSearchChatInterface();

  console.log('🔍 Web Search Integration Demo\n');

  // Test queries
  const testQueries = [
    "What is diabetes?", // Should use FAQ
    "Search for latest diabetes research", // Should use web search
    "Tell me about COVID-19 symptoms", // May use FAQ
    "Find recent news about COVID-19 vaccines" // Should use web search
  ];

  for (const query of testQueries) {
    await chatInterface.testSearchMethods(query);
    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Demonstrate direct API calls
  console.log('📡 Direct API Examples:\n');

  // Force web search through chat API
  console.log('1. Chat API with forceWebSearch=true:');
  const forcedResult = await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What is machine learning?",
      forceWebSearch: true
    })
  });
  const forcedData = await forcedResult.json();
  console.log('Intent:', forcedData.intentData?.intent);
  console.log('Bypassed RAG:', forcedData.webSearchData?.bypassedRAG);

  // Direct web search API
  console.log('\n2. Direct web search API:');
  const directResult = await fetch('http://localhost:5000/api/ai/web-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: "Latest AI developments 2024",
      maxResults: 3
    })
  });
  const directData = await directResult.json();
  console.log('Results count:', directData.totalResults);
  console.log('Has AI summary:', !!directData.aiSummary);
}

// CSS for the React component
const componentCSS = `
.chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.messages {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  padding: 10px;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
}

.message.user {
  background-color: #e3f2fd;
  margin-left: 20%;
}

.message.bot {
  background-color: #f5f5f5;
  margin-right: 20%;
}

.metadata {
  font-size: 12px;
  margin-top: 5px;
  display: flex;
  gap: 10px;
}

.faq-badge {
  background-color: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.search-badge {
  background-color: #2196f3;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.bypass-badge {
  background-color: #ff9800;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
}

.input-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.input-area input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.button-group {
  display: flex;
  gap: 10px;
}

.button-group button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.button-group button:first-child {
  background-color: #4caf50;
  color: white;
  flex: 1;
}

.web-search-btn {
  background-color: #2196f3;
  color: white;
}

.direct-search-btn {
  background-color: #ff9800;
  color: white;
}

.search-results {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fafafa;
}

.ai-summary {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #e8f5e8;
  border-radius: 4px;
}

.search-result {
  margin-bottom: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border-left: 3px solid #2196f3;
}

.search-result h4 {
  margin: 0 0 5px 0;
}

.search-result a {
  color: #1976d2;
  text-decoration: none;
}

.search-result a:hover {
  text-decoration: underline;
}

.search-result p {
  margin: 5px 0;
  color: #666;
}

.search-result small {
  color: #999;
}
`;

console.log('React Component CSS:');
console.log(componentCSS);

// Export for use
module.exports = {
  WebSearchChatInterface,
  demonstrateWebSearch,
  ReactWebSearchComponent: ReactWebSearchComponent,
  componentCSS
};

// Run demo if executed directly
if (require.main === module) {
  demonstrateWebSearch().catch(console.error);
}