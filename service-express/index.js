require('dotenv').config()
const express = require('express')
const app = express()

const port = process.env.PORT || 3001

app.use(express.json())

app.get('/health', (req, res) => { res.send('OK') })
app.use('/ai/diagnose', require('./routes/diagnose'))
app.use('/ai/chat', require('./routes/chat'))
app.use('/ai/consult-with-template', require('./routes/withTemplate'))

app.listen(port, () => {
    console.log(`Server berjalan di ${port}`)
})