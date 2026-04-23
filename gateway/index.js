const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const app = express()
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const port = 3000

app.use(morgan('dev'))

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many requests from this IP, please try again after 15 minutes'
})

app.use('/ai', limiter)
app.use('/ai', createProxyMiddleware({
    target: 'http://localhost:3001',
    changeOrigin: true,
}))

app.use('/templates', createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
}))

app.use((req, res) => {
    res.status(404).send({error: `Route ${req.method} ${req.path} tidak ditemukan`})
})

app.listen(port, () => {
    console.log(`API Gateway berjalan pada port ${port}`)
})