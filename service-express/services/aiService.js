const axios = require('axios')

async function callAI(messages) {
    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            model: 'openai/gpt-oss-20b:free',
            messages
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    )
    const raw = response.data.choices[0].message.content
    return raw.replace(/```json/g, '').replace(/```/g, '').trim()
}

module.exports = { callAI }