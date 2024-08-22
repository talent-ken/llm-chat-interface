import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import OpenAi from 'openai';

const server = express();
const port = process.env.PORT || 3001;

const aiClient = new OpenAi({
  apiKey: process.env.GPT_API_KEY
});

server.use(cors());
server.use(express.json());

server.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const stream = await aiClient.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Reply to user message with proper answer.' },
        { role: 'user', content: userMessage }
      ],
      stream: true
    });
    res.setHeader('Content-Type', 'text/plain');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      res.write(content);
    }

    res.end();
  } catch (err) {
    console.error('Error streaming response:', JSON.stringify(err));

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to retrieve a response from the LLM. Please try again later.'
      });
    } else {
      res.write('\n[ERROR]: Something went wrong. Please try again later.');
      res.end();
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
