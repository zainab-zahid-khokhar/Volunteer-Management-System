const axios = require('axios');
const logger = require('../utils/logger');

const summarizeApplication = async (applicationText) => {
  try {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new Error('AI_API_KEY not configured');

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.AI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a volunteer coordinator assistant. Summarize the following volunteer application in 2-3 concise sentences, highlighting the key strengths and motivations of the applicant.',
          },
          { role: 'user', content: applicationText },
        ],
        max_tokens: 150,
        temperature: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const summary = response.data.choices[0]?.message?.content?.trim();
    const modelVersion = response.data.model;
    return { summary, modelVersion };
  } catch (err) {
    logger.warn('AI summarization failed (graceful degradation):', err.message);
    return null; // Graceful degradation
  }
};

module.exports = { summarizeApplication };
