require('dotenv').config()
const express = require('express')
const axios = require('axios')
const app = express()
const router = require('./routes/chat') 

const port = process.env.PORT || 3001

app.use(express.json())

app.use('/ai', router)

app.listen(port, () => {
    console.log(`Server berjalan di ${port}`)
})