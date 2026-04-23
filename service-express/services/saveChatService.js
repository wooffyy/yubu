const axios = require('axios')

async function saveChat(payload) {
    try {
        await axios.post(`${process.env.SERVICE2_URL}/consultations`, payload)
        console.log('Berhasil mengirim ke service 2')
    } catch (err) {
        console.log('Service 2 error:', err.message)
    }
}

module.exports = { saveChat }