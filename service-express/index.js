require('dotenv').config()
const express = require('express')
const app = express()

const port = process.env.PORT || 3001

app.use(express.json())

app.get('/health', (req, res) => { res.send('OK') })
app.use('/diagnose', require('./routes/diagnosis'))
app.use('/chat', require('./routes/chat'))
app.use('/consult-with-template', require('./routes/withTemplate'))

app.listen(port, () => {
    console.log(`Server berjalan di ${port}`)
})