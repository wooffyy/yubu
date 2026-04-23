const express = require('express')
const router = express.Router()
const axios = require('axios')
const { callAI } = require('../services/aiService')
const { saveChat } = require('../services/saveChatService')

router.get('/health', (req, res) => {
    res.send('OK')
})

router.post('/', async (req, res) => {
    const { template_id, variables } = req.body
    if (!template_id) return res.status(400).send('Template ID is required!')
    if (!variables) return res.status(400).send('Variables is required!')

    let template 
    try {
        template = await axios.get(`${process.env.SERVICE2_URL}/templates/${template_id}`)
    } catch (err) {
        console.log('Service 2 error:', err.message)
        console.log('Service 2 response:', err.response?.status, err.response?.data)
        return res.status(503).json({ error: 'Gagal menghubungi Service 2' })
    }

    if (!template?.data) return res.status(404).send('Template not found!')        
    const { name, system_prompt, user_prompt_template } = template.data
    
    const guardedSystemPrompt = `${system_prompt}
    PENTING: Jawab HANYA dalam format JSON murni tanpa markdown, tanpa backtick, tanpa teks tambahan. Berikan jawaban yang singkat dan padat dengan maksimal 3 kalimat per field string, array steps maksimal 5 item.`

    let userPrompt = user_prompt_template
    Object.entries(variables).forEach(([key, value]) => {
        userPrompt = userPrompt.replace(`{${key}}`, value)
    })

    const messages = [
        { role: 'system', content: guardedSystemPrompt },
        { role: 'user', content: userPrompt }
    ]

    try {
        const response = await callAI(messages)
        const result = JSON.parse(response)

        try {
            await saveChat({
                user_id: 'anonymous',
                category: 'consult-with-template',
                problem: userPrompt,
                ai_response: result,
                metadata: {
                    severity: result?.severity ?? null,
                    template_id: template_id,
                },
            })
        } catch (error) {
            console.log('Saving error:', error.message)
        }

        return res.status(200).json({ consultation_result: result, template_used: template.data.name, saved_consultation_id: null })

    } catch (error) {
        console.log(error.response?.data || error.message)
        return res.status(500).json({ error: 'Gagal mendiagnosis masalah' })
    }
})

module.exports = router