// Загружает переменные из .env (если файл есть). Node >= 20.12
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', '.env');
if (fs.existsSync(file)) process.loadEnvFile(file);
