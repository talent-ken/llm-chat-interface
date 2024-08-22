import { ChangeEventHandler, KeyboardEventHandler, useCallback, useState } from 'react';
import { LoaderCircle, ArrowUpIcon } from 'lucide-react';

import { classnames } from '../../lib/utils';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

const ChatPanel = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMessage = useCallback(
    async (message: string) => {
      setIsLoading(true);
      setError(null);
      setMessages([...messages, { sender: 'user', text: message }]);

      try {
        const url = 'http://localhost:3001/api/chat';
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message })
        });

        if (!response.ok) {
          throw new Error('Network response was not okay.');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        let done = false;
        let botMessage = ''; // Accumulate the full bot message

        while (!done) {
          const { value, done: doneReading } = await reader?.read()!;
          done = doneReading;

          const chunkValue = decoder.decode(value, { stream: true });
          botMessage += chunkValue;
        }

        // Once the full response is received, update the state with the complete bot message
        setMessages((prev) => [...prev, { sender: 'bot', text: botMessage }]);

        console.log('Complete bot response:', botMessage);
      } catch (err) {
        console.error('Error during streaming:', err);
        setError(
          'An error occured while communicating with the server. Please try again.'
        );
      } finally {
        setIsLoading(false);
        setInput('');
      }
    },
    [messages]
  );

  const handleSend = useCallback(() => {
    if (input.trim() === '') return;
    handleMessage(input);
  }, [handleMessage, input]);

  const handleEnterDown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const key = e.key;

      if (key === 'Enter') {
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePromptChange: ChangeEventHandler<HTMLInputElement> = useCallback((e) => {
    const value = e.target.value;
    setInput(value);
  }, []);

  return (
    <section className="h-full max-w-3xl w-full px-10 pt-10 pb-6 flex flex-col">
      <h2 className="text-center text-gray-500 font-semibold">
        This is the beginning of your chat history with the LLM
      </h2>
      <span className="font-medium text-sm text-center text-gray-400 pb-2">
        {new Date().toLocaleDateString('us-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })}
      </span>
      <div className="rounded-xl flex flex-col py-6 px-4 overflow-y-auto gap-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className="w-full border border-gray-200 px-4 py-2 rounded-lg shadow-sm flex flex-col gap-y-1"
          >
            <div className="flex">
              <div className="font-semibold text-gray-800 text-sm">
                {msg.sender === 'bot' ? 'Large Language Model' : 'User Name'}
              </div>
            </div>
            <div className="text-sm text-gray-600">{msg.text}</div>
          </div>
        ))}
      </div>
      <div className="pt-2 w-full flex flex-col px-4">
        {Boolean(error) && (
          <div className="text-red-500 text-xs text-center font-medium">{error}</div>
        )}
        <div className="w-full flex flex-col border-gray-200 shadow-sm border rounded-lg overflow-hidden">
          <input
            type="text"
            name="user-prompt"
            id="user-prompt"
            className="px-3 py-2 w-full outline-none text-sm"
            placeholder="Type your message..."
            onChange={handlePromptChange}
            onKeyDown={handleEnterDown}
            value={input}
            disabled={isLoading}
          />
          <div className="flex justify-end items-center px-3 pt-1 pb-2">
            <button
              className="bg-blue-500 text-white p-1 text-sm rounded-full border border-blue-400 shadow shadow-blue-400"
              onClick={handleSend}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle size={20} className="animate-spin" />
              ) : (
                <ArrowUpIcon size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ChatPanel;
