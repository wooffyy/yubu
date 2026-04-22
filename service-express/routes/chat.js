require('dotenv').config()
const express = require('express')
const router = express.Router()
const axios = require('axios')
const app = express()

app.use(express.json())

router.get('/health', (req, res) => {
    res.send('OK')
})

router.post('/diagnose', async (req, res) => {
    const { description, room_type, wall_material, area_m2 } = req.body;

    if (!description) return res.status(400).send('Description is required!')

    const userPrompt = `
        Deskripsi masalah: ${description} 
        ${room_type ? `Tipe ruang: ${room_type}` : ''}
        ${wall_material ? `Bahan tembok: ${wall_material}` : ''}
        ${area_m2 ? `Luas ruang: ${area_m2} m2` : ''}
    `.trim()

    try {
        const aiResponse = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions', 
            {
                model: 'openai/gpt-oss-20b:free',
                messages: [
                    {
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
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )
    
        const raw = aiResponse.data.choices[0].message.content
        const cleaned = raw
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const diagnosis = JSON.parse(cleaned)

        try {
            await axios.post(`${process.env.SERVICE2_URL}/consultations`, {
                user_id: 'anonymous',
                category: 'diagnosis',
                problem: description,
                ai_response: cleaned,
                metadata: {
                    severity: diagnosis.severity,
                    room_type: room_type || null,
                },
            })
            console.log('Berhasil mengirim ke service 2')
        } catch (err) {
            console.log('Service 2 error:', err.message)
        }

        return res.status(200).json(diagnosis)

    } catch (error) {
        console.log(error.response?.data || error.message)
        return res.status(500).json({ error: 'Gagal mendiagnosis masalah' })
    }
})

router.post('/chat', async (req, res) => {
    const { message, consultation_history } = req.body
    if (!message) return res.status(400).send('Message is required!')
    
    const userPrompt = `${message}`.trim()
    try {
        const aiResponse = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions', 
            {
                model: 'openai/gpt-oss-20b:free',
                messages: [
                    {
                        role: 'system',
                        content: `Kamu adalah konsultan renovasi rumah yang ramah dan berpengalaman untuk konteks Indonesia. Jawab pertanyaan user seputar renovasi rumah dengan bahasa yang mudah dipahami dan kontekstual. Jawab HANYA dalam JSON murni tanpa markdown:
                        { "reply": "string jawaban kamu" }`
                    },
                    ...(consultation_history || []),
                    { role: 'user', content: userPrompt }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )
    
        const raw = aiResponse.data?.choices?.[0]?.message?.content
        if (!raw) {
            console.log('Empty response:', JSON.stringify(aiResponse.data, null, 2))
            return res.status(500).json({ error: 'Model tidak mengembalikan response' })
        }

        const cleaned = raw
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const reply = JSON.parse(cleaned)

        try {
            await axios.post(`${process.env.SERVICE2_URL}/consultations`, {
                user_id: 'anonymous',
                category: 'chat',
                problem: message,
                ai_response: raw,
                metadata: {}
            })
        } catch (err) {
            console.log('Service 2 error:', err.message)
        }

        return res.status(200).json(reply)

    } catch (error) {
        console.log(error.response?.data || error.message)
        return res.status(500).json({ error: 'Gagal mendiagnosis masalah' })
    }
})

router.post('/consult-with-template', async (req, res) => {
    const { template_id, variables } = req.body
    if (!template_id) return res.status(400).send('Template ID is required!')

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

    
    try {
        const aiResponse = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions', 
            {
                model: 'openai/gpt-oss-20b:free',
                messages: [
                    {
                        role: 'system',
                        content: guardedSystemPrompt
                    },
                    { role: 'user', content: userPrompt }
                ]
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )
    
        const raw = aiResponse.data.choices[0].message.content
        const cleaned = raw
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const diagnosis = JSON.parse(cleaned)

        try {
            await axios.post(`${process.env.SERVICE2_URL}/consultations`, {
                user_id: 'anonymous',
                category: 'consult-with-template',
                problem: userPrompt,
                ai_response: cleaned,
                problem: userPrompt,
                metadata: {
                    severity: diagnosis.severity,
                    template_id: template_id,
                },
            })
            console.log('Berhasil mengirim ke service 2')
        } catch (err) {
            console.log('Service 2 error:', err.message)
        }

        return res.status(200).json({ consultation_result: diagnosis, template_used: template.data.name, saved_consultation_id: null })

    } catch (error) {
        console.log(error.response?.data || error.message)
        return res.status(500).json({ error: 'Gagal mendiagnosis masalah' })
    }
})

router.put('/diagnose/refine', async (req, res) => {
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
    

    try {
        const aiResponse = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'openai/gpt-oss-20b:free',
                messages: [
                    {
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
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        )

        const raw = aiResponse.data.choices[0].message.content
        const cleaned = raw
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim()
        const result = JSON.parse(cleaned)

        try {
            await axios.post(`${process.env.SERVICE2_URL}/consultations`, {
                user_id: 'anonymous',
                category: 'refinement',
                problem: additional_info,
                ai_response: cleaned,
                metadata: {
                    severity: result.refined_diagnosis.severity,
                    previous_diagnosis: JSON.stringify(previous_diagnosis)
                }
            })
            console.log('Berhasil mengirim ke service 2')
        } catch (err) {
            console.log('Service 2 error:', err.message)
        }

        return res.status(200).json(result)

    } catch (error) {
        console.log(error.response?.data || error.message)
        return res.status(500).json({ error: 'Gagal memperbaiki diagnosis' })
    }
})

module.exports = router
