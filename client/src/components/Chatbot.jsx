import { useState, useRef, useEffect } from 'react';

export default function Chatbot({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I am the ArenaLink AI Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const webhookUrl = import.meta.env.VITE_N8N_CHATBOT_WEBHOOK || 'https://sudhanshu777.app.n8n.cloud/webhook/arenalink-chat';
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: user?.id || 'anonymous',
          chatInput: userMessage
        })
      });

      const textResponse = await response.text();
      let data;
      try {
        data = textResponse ? JSON.parse(textResponse) : {};
      } catch (e) {
        data = textResponse;
      }
      
      // Handle various n8n response structures (output, reply, text, etc.)
      let botReply = "Sorry, I couldn't understand that.";
      if (typeof data === 'string' && data.trim() !== '') botReply = data;
      else if (data.output) botReply = data.output;
      else if (data.reply) botReply = data.reply;
      else if (data.text) botReply = data.text;
      else if (data.response) botReply = data.response;
      else if (data.message) botReply = data.message;
      else if (data.answer) botReply = data.answer;
      else if (data[0] && data[0].output) botReply = data[0].output;
      else if (data[0] && data[0].text) botReply = data[0].text;
      else if (typeof data === 'object' && Object.keys(data).length > 0) {
        botReply = "Debug output: " + JSON.stringify(data);
      }

      setMessages((prev) => [...prev, { role: 'bot', text: botReply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to the server right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-[100] bottom-24 md:bottom-8 right-4 md:right-8 w-14 h-14 rounded-full bg-tertiary text-on-tertiary shadow-lg flex items-center justify-center transition-transform hover:scale-105 ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
      >
        <span className="material-symbols-outlined text-3xl">chat</span>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed z-[100] bottom-24 md:bottom-8 right-4 md:right-8 w-[90vw] md:w-[380px] h-[500px] max-h-[70vh] bg-surface-card rounded-2xl shadow-2xl border border-outline-variant flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-50 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="bg-surface-low p-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-tertiary">smart_toy</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface">ArenaLink AI</h3>
              <p className="text-xs text-on-surface-variant flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> Online
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-tertiary text-on-tertiary rounded-tr-sm' 
                    : 'bg-surface-container-high text-on-surface rounded-tl-sm shadow-sm border border-outline-variant/30'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-container-high rounded-2xl rounded-tl-sm p-4 shadow-sm border border-outline-variant/30">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-surface-low border-t border-outline-variant flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about tournaments..."
            className="flex-1 bg-surface-container rounded-full px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-tertiary/50"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">send</span>
          </button>
        </form>
      </div>
    </>
  );
}
