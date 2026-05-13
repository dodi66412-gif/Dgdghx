const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5900; // Для Render 10000, локально 5900

// Встроенный HTML (без внешних файлов)
const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WA Pairing Bot</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #e5ddd5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; width: 100%; max-width: 400px; }
        h2 { color: #075e54; margin-bottom: 10px; }
        p { color: #666; margin-bottom: 25px; font-size: 14px; }
        input { width: 100%; padding: 15px; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 10px; box-sizing: border-box; font-size: 16px; outline: none; transition: 0.3s; }
        input:focus { border-color: #25d366; }
        button { width: 100%; padding: 15px; background-color: #25d366; color: white; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 16px; transition: 0.3s; }
        button:hover { background-color: #128c7e; }
        #pairCodeContainer { margin-top: 30px; padding: 15px; background: #f0f2f5; border-radius: 10px; display: none; }
        .label { font-size: 12px; color: #888; text-transform: uppercase; margin-bottom: 5px; }
        #pairCode { font-size: 32px; font-weight: bold; color: #075e54; letter-spacing: 5px; }
        .loader { color: #128c7e; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h2>WhatsApp Bot</h2>
        <p>Введите номер телефона с кодом страны</p>
        <input type="text" id="phone" placeholder="Например: 79991234567">
        <button id="btn" onclick="generateCode()">Генерировать код</button>
        
        <div id="pairCodeContainer">
            <div class="label">Ваш код сопряжения:</div>
            <div id="pairCode"></div>
        </div>
    </div>

    <script>
        async function generateCode() {
            const num = document.getElementById('phone').value.replace(/[^0-9]/g, '');
            const btn = document.getElementById('btn');
            const container = document.getElementById('pairCodeContainer');
            const display = document.getElementById('pairCode');

            if (!num) return alert('Введите корректный номер!');

            btn.disabled = true;
            btn.innerText = 'Генерация...';
            container.style.display = 'none';

            try {
                const res = await fetch('/get-code?number=' + num);
                const data = await res.json();
                
                if (data.code) {
                    display.innerText = data.code;
                    container.style.display = 'block';
                } else {
                    alert('Ошибка: ' + (data.error || 'Попробуйте позже'));
                }
            } catch (err) {
                alert('Ошибка соединения с сервером');
            } finally {
                btn.disabled = false;
                btn.innerText = 'Генерировать код';
            }
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(htmlContent));

app.get('/get-code', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.status(400).json({ error: "Номер не указан" });

    try {
        const { state, saveCreds } = await useMultiFileAuthState('session_auth');
        const sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
            },
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["Chrome (Linux)", "", ""]
        });

        if (!sock.authState.creds.registered) {
            await delay(2000);
            const code = await sock.requestPairingCode(num);
            res.json({ code: code });
        } else {
            res.json({ error: "Устройство уже привязано" });
        }

        sock.ev.on('creds.update', saveCreds);
        
        sock.ev.on('connection.update', (update) => {
            const { connection } = update;
            if (connection === 'open') console.log('✅ Бот успешно подключен!');
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Сервер запущен!
🌍 Локально: http://127.0.0.1:5900 (если PORT=5900)
☁️ Render: Порт ${PORT}
    `);
});
