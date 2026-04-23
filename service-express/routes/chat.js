const express = require('express')
const router = express.Router()
const axios = require('axios')
const { callAI } = require('../services/aiService')
const { saveChat } = require('../services/saveChatService')


router.get('/health', (req, res) => {
    res.send('OK')
})

router.post('/', async (req, res) => {
    const { message, consultation_history } = req.body
    if (!message) return res.status(400).send('Message is required!')
    
    const userPrompt = `${message}`.trim()

    const messages = [{
            role: 'system',
            content: `Kamu adalah konsultan renovasi rumah yang ramah dan berpengalaman untuk konteks Indonesia. Jawab pertanyaan user seputar renovasi rumah dengan bahasa yang mudah dipahami dan kontekstual. Jawab HANYA dalam JSON murni tanpa markdown:
            { "reply": "string jawaban kamu" }`
        },
        ...(consultation_history || []),
        { role: 'user', content: userPrompt }
    ]

    try {
        const response = await callAI(messages)
        const result = JSON.parse(response)
        
        try {
            await saveChat({
                user_id: 'anonymous',
                category: 'chat',
                problem: message,
                ai_response: result,
            })
        } catch (error) {
            console.log('Saving error:', error.message)
        }

        return res.status(200).json(result)

    } catch (error) {
        console.log(error.response?.data || error.message)
        return res.status(500).json({ error: 'Gagal mendiagnosis masalah' })
    }
})

module.exports = router
