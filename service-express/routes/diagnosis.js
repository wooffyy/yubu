const express = require('express')
const router = express.Router()
const axios = require('axios')
const { callAI } = require('../services/aiService')
const { saveChat } = require('../services/saveChatService')

router.get('/health', (req, res) => {
    res.send('OK')
})

router.post('/', async (req, res) => {
    const { description, room_type, wall_material, area_m2 } = req.body;

    if (!description) return res.status(400).send('Description is required!')

    const userPrompt = `
        Deskripsi masalah: ${description} 
        ${room_type ? `Tipe ruang: ${room_type}` : ''}
        ${wall_material ? `Bahan tembok: ${wall_material}` : ''}
        ${area_m2 ? `Luas ruang: ${area_m2} m2` : ''}
    `.trim()

    const messages = [{
            role: 'system',
            content: `Kamu adalah diagnosis engine renovasi rumah. Analisis masalah yang diberikan dan kembalikan HANYA JSON murni tanpa markdown, tanpa backtick, tanpa penjelasan tambahan, dengan struktur:
            {   
               "problem_type": "string",
               "severity": "rendah | sedang | tinggi",
               "cause": "string",
               "estimated_cost": "string dalam Rupiah",
               "steps": ["array of string langkah penanganan"]
            }`
        },
        { role: 'user', content: userPrompt }
    ]

    try {
        const response = await callAI(messages)
        const result = JSON.parse(response)

        try {
            await saveChat({
                user_id: 'anonymous',
                category: 'diagnosis',
                problem: description,
                ai_response: result,
                metadata: {
                    severity: result.severity,
                    room_type: room_type || null,
                },
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

router.put('/refine', async (req, res) => {
    const { previous_diagnosis, additional_info, correction } = req.body

    if (!previous_diagnosis) return res.status(400).send('previous_diagnosis is required!')
    if (!additional_info) return res.status(400).send('additional_info is required!')

    const safeCorrection = correction?.replace(/"/g, "'") ?? ''
    const safeAdditionalInfo = additional_info.replace(/"/g, "'")

    const userPrompt = `
        Diagnosis sebelumnya: ${JSON.stringify(previous_diagnosis)}
        Informasi tambahan: ${safeAdditionalInfo}
        ${safeCorrection ? `Koreksi dari user: ${safeCorrection}` : ''}
    `.trim()
    
    const messages = [{
            role: 'system',
            content: `Kamu adalah diagnosis engine renovasi rumah. 
            Kamu akan menerima diagnosis sebelumnya beserta informasi tambahan dan koreksi dari user.
            Re-analisis dan kembalikan HANYA JSON murni tanpa markdown, tanpa backtick, tanpa penjelasan tambahan, dengan struktur:
            {
                "refined_diagnosis": {
                    "problem_type": "string",
                    "severity": "rendah | sedang | tinggi",
                    "cause": "string",
                    "estimated_cost": "string dalam Rupiah",
                    "steps": ["array of string"]
                },
                "changes_from_previous": "string penjelasan perubahan dari diagnosis sebelumnya"
            }`
        },
        { role: 'user', content: userPrompt }
    ]

    try {
        const response = await callAI(messages)
        const result = JSON.parse(response)

        try {
            await saveChat({
                user_id: 'anonymous',
                category: 'refinement',
                problem: additional_info,
                ai_response: result,
                metadata: {
                    severity: result.refined_diagnosis.severity,
                    previous_diagnosis: JSON.stringify(previous_diagnosis)
                }
            })
        } catch (error) {
            console.log('Saving error:', error.message)
        }

        return res.status(200).json(result)

    } catch (error) {
        console.log(error.response?.data || error.message)
        return res.status(500).json({ error: 'Gagal memperbaiki diagnosis' })
    }
})

module.exports = router