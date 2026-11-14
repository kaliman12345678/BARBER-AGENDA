const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('Error: Debes definir GEMINI_API_KEY en tu archivo .env');
  process.exit(1);
}

function createWavHeader(dataLength, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

const texto = `Hola. Si administras una barbería, salón de belleza, spa o centro de estética en Colombia, sabes lo difícil que es perder clientes los días flojos y terminar los fines de semana sumando papelitos para pagar comisiones. Con EXAKTA tus clientes agendan solos por WhatsApp las 24 horas, eliminas las inasistencias y liquidas a todo tu equipo en un solo clic con comprobante oficial. Toma el control exacto de tu negocio hoy mismo con EXAKTA.`;

const postData = JSON.stringify({
  contents: [{ parts: [{ text: texto }] }],
  generationConfig: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Puck' }
      }
    }
  }
});

const req = https.request('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=' + key, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    try {
      const body = Buffer.concat(chunks).toString('utf-8');
      const json = JSON.parse(body);
      const audioPart = json.candidates?.[0]?.content?.parts?.[0];
      if (audioPart?.inlineData?.data) {
        const rawPcm = Buffer.from(audioPart.inlineData.data, 'base64');
        const header = createWavHeader(rawPcm.length, 24000, 1, 16);
        const wavFile = Buffer.concat([header, rawPcm]);
        const outPath = path.resolve(__dirname, '../client/public/audio/exakta_presentacion.wav');
        fs.writeFileSync(outPath, wavFile);
        console.log('EXITO: Audio WAV generado en:', outPath, 'Bytes:', wavFile.length);
      } else {
        console.error('No se encontro audio en la respuesta:', json);
      }
    } catch(e) {
      console.error('Error parseando respuesta:', e.message);
    }
  });
});

req.on('error', err => console.error('Error de peticion:', err.message));
req.write(postData);
req.end();
