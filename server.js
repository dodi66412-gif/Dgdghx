const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const QRCode = require('qrcode')
const { Client, LocalAuth } = require('whatsapp-web.js')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const PORT = 5907

let latestQR = ''
let latestPairCode = ''

function generateSessionId() {

    return (
        'SESSION-' +
        Math.random()
        .toString(36)
        .substring(2, 12)
        .toUpperCase()
    )
}

const sessionId = generateSessionId()

function generateBrowserName() {

    const browsers = [

        {
            name: 'Safari',
            platform: 'Mac OS'
        },

        {
            name: 'Chrome',
            platform: 'Linux'
        },

        {
            name: 'Firefox',
            platform: 'Windows'
        },

        {
            name: 'Edge',
            platform: 'Windows'
        }

    ]

    return browsers[
        Math.floor(Math.random() * browsers.length)
    ]
}

const generatedBrowser = generateBrowserName()

const client = new Client({

    authStrategy: new LocalAuth({
        clientId: sessionId
    }),

    puppeteer: {

        headless: true,

        browser: generatedBrowser,

        args: []
    }
})

client.on('qr', async (qr) => {

    latestQR = await QRCode.toDataURL(qr)

    latestPairCode =
        'PAIR-' +
        Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()

    io.emit('qr', {

        qr: latestQR,

        pairCode: latestPairCode,

        sessionId,

        browser: generatedBrowser.name +
        ' (' +
        generatedBrowser.platform +
        ')'
    })

    console.log('QR GENERATED')
})

client.on('ready', () => {

    console.log('WHATSAPP BOT READY')

    io.emit('ready', {

        sessionId,

        browser:
            generatedBrowser.name +
            ' (' +
            generatedBrowser.platform +
            ')'
    })
})

client.initialize()

const htmlContent = `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8">

<title>
WhatsApp Bot Session Generator
</title>

<style>

body{

    background:#0f172a;
    color:white;
    font-family:Arial;
    text-align:center;
    padding:30px;
}

.container{

    max-width:700px;
    margin:auto;
    background:#111827;
    padding:30px;
    border-radius:20px;
}

.box{

    background:#1f2937;
    margin-top:20px;
    padding:20px;
    border-radius:15px;
}

button{

    background:#22c55e;
    color:white;
    border:none;
    padding:14px 20px;
    border-radius:10px;
    margin:10px;
    cursor:pointer;
    font-size:16px;
}

button:hover{

    background:#16a34a;
}

input{

    width:90%;
    padding:14px;
    border:none;
    border-radius:10px;
    font-size:16px;
}

img{

    width:300px;
    margin-top:20px;
    border-radius:20px;
}

.code{

    font-size:24px;
    color:#22c55e;
    margin-top:10px;
    font-weight:bold;
}

</style>

</head>

<body>

<div class="container">

<h1>
WhatsApp Bot Pair Code Generator
</h1>

<p>
Select a option
</p>

<div class="box">

<h2>
Enter Your WhatsApp Number
</h2>

<input
type="text"
id="phone"
placeholder="Enter WhatsApp number with country code"
/>

<p>
Example: 14155552671
</p>

</div>

<button onclick="generateQR()">

GENERATE WHATSAPP BOT QR CODE

</button>

<button onclick="generatePairCode()">

GENERATE WHATSAPP BOT PAIR CODE

</button>

<div class="box">

<h2>
SESSION ID
</h2>

<div
class="code"
id="sessionId"
>

Loading...

</div>

</div>

<div class="box">

<h2>
GENERATED BROWSER
</h2>

<div
class="code"
id="browserName"
>

Loading...

</div>

</div>

<div
class="box"
id="qrBox"
style="display:none;"
>

<h2>
Your QR Code Generated To WhatsApp Bot
</h2>

<img
id="qrImage"
src=""
/>

</div>

<div
class="box"
id="pairBox"
style="display:none;"
>

<h2>
Your Pair Code Is Generated
</h2>

<div
class="code"
id="pairCode"
>

Loading...

</div>

</div>

<div class="box">

<h2>
SERVER
</h2>

<div class="code">

127.0.0.1:5907

</div>

</div>

</div>

<script src="/socket.io/socket.io.js"></script>

<script>

const socket = io()

socket.on('qr', (data) => {

    document.getElementById(
        'qrImage'
    ).src = data.qr

    document.getElementById(
        'pairCode'
    ).innerText = data.pairCode

    document.getElementById(
        'sessionId'
    ).innerText = data.sessionId

    document.getElementById(
        'browserName'
    ).innerText = data.browser
})

socket.on('ready', (data) => {

    document.getElementById(
        'sessionId'
    ).innerText = data.sessionId

    document.getElementById(
        'browserName'
    ).innerText = data.browser
})

function generateQR(){

    document.getElementById(
        'qrBox'
    ).style.display = 'block'

    document.getElementById(
        'pairBox'
    ).style.display = 'none'
}

function generatePairCode(){

    const phone =
        document.getElementById(
            'phone'
        ).value

    if(!phone){

        alert(
            'Enter WhatsApp number with country code'
        )

        return
    }

    document.getElementById(
        'pairBox'
    ).style.display = 'block'

    document.getElementById(
        'qrBox'
    ).style.display = 'none'

    const generatedCode =

        'PAIR-' +

        phone.substring(0,4) +

        '-' +

        Math.random()
        .toString(36)
        .substring(2,8)
        .toUpperCase()

    document.getElementById(
        'pairCode'
    ).innerText = generatedCode
}

</script>

</body>
</html>
`

app.get('/', (req, res) => {

    res.send(htmlContent)
})

server.listen(PORT, '127.0.0.1', () => {

    console.log(
        'SERVER RUNNING AT http://127.0.0.1:5907'
    )
})
