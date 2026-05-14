const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const QRCode = require('qrcode')
const { Client, LocalAuth } = require('whatsapp-web.js')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const PORT = 5907

let latestQR = null
let latestPairCode = null
let sessionId = null

function generateSessionId() {
    return 'SESSION-' + Math.random().toString(36).substring(2, 12).toUpperCase()
}

sessionId = generateSessionId()

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: sessionId
    }),
    puppeteer: {
        headless: true,
        browser: ['Chrome (Linux)', '', ''],
        args: []
    }
})

client.on('qr', async (qr) => {
    latestQR = await QRCode.toDataURL(qr)

    latestPairCode = Math.random().toString(36).substring(2, 10).toUpperCase()

    io.emit('qr', {
        qr: latestQR,
        pairCode: latestPairCode,
        sessionId
    })

    console.log('QR Generated')
})

client.on('authenticated', () => {
    console.log('Authenticated')
})

client.on('ready', () => {
    console.log('WhatsApp Bot Ready')

    io.emit('ready', {
        message: 'WhatsApp bot connected successfully',
        sessionId
    })
})

client.initialize()

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>WhatsApp Bot Session Generator</title>
<style>
body {
    background: #0f172a;
    color: white;
    font-family: Arial;
    text-align: center;
    padding: 30px;
}

.container {
    max-width: 700px;
    margin: auto;
    background: #111827;
    padding: 30px;
    border-radius: 20px;
}

button {
    background: #22c55e;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    cursor: pointer;
    margin: 10px;
    font-size: 16px;
}

button:hover {
    background: #16a34a;
}

img {
    margin-top: 20px;
    width: 300px;
    border-radius: 20px;
}

.box {
    margin-top: 20px;
    background: #1f2937;
    padding: 20px;
    border-radius: 15px;
}

.code {
    font-size: 24px;
    color: #22c55e;
    margin-top: 10px;
    font-weight: bold;
}
</style>
</head>
<body>

<div class="container">
    <h1>WhatsApp Bot Pair Code Generator</h1>

    <p>Select a login option</p>

    <div class="box">
        <h2>Enter Your WhatsApp Number</h2>
        <input
            type="text"
            id="phoneNumber"
            placeholder="Enter WhatsApp number with country code"
            style="width:90%;padding:14px;border-radius:10px;border:none;font-size:16px;"
        >
        <p style="margin-top:10px;color:#94a3b8;">
            Example: 14155552671
        </p>
    </div>

    <button onclick="showQR()">Generate QR Code</button>
    <button onclick="showPair()">Generate Pair Code</button>

    <div class="box">
        <h2>Session ID</h2>
        <div id="sessionId" class="code">Loading...</div>
    </div>

    <div class="box" id="qrBox" style="display:none;">
        <h2>Your QR Code Generated</h2>
        <img id="qrImage" src="">
    </div>

    <div class="box" id="pairBox" style="display:none;">
        <h2>Your Pair Code Is Generated</h2>
        <div id="pairCode" class="code">Loading...</div>
    </div>

    <div class="box">
        <h2>Server</h2>
        <div class="code">127.0.0.1:5907</div>
    </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io()

socket.on('qr', (data) => {
    document.getElementById('qrImage').src = data.qr
    document.getElementById('pairCode').innerText = data.pairCode
    document.getElementById('sessionId').innerText = data.sessionId
})

socket.on('ready', (data) => {
    document.getElementById('sessionId').innerText = data.sessionId
})

function showQR() {
    document.getElementById('qrBox').style.display = 'block'
    document.getElementById('pairBox').style.display = 'none'
}

function showPair() {
    const number = document.getElementById('phoneNumber').value

    if (!number) {
        alert('Enter WhatsApp number with country code')
        return
    }

    document.getElementById('pairBox').style.display = 'block'
    document.getElementById('qrBox').style.display = 'none'

    document.getElementById('pairCode').innerText =
        'PAIR-' + number.substring(0, 4) + '-' + Math.random().toString(36).substring(2, 8).toUpperCase()
}
</script>

</body>
</html>
`

app.get('/', (req, res) => {
    res.send(htmlContent)
})

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}`)
})
