const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const multer = require('multer');
require('./database');

// Configuração do multer
const storage = multer.memoryStorage(); // Armazenar arquivos em memória
const upload = multer({ storage: storage });

// MIDDLEWARES
app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

// Rotas
app.use('/servico', upload.any(), require('./src/routes/servico.routes')); // middleware para arquivos em /servico
app.use('/barbearia', require('./src/routes/barbearia.routes'));
app.use('/horario', require('./src/routes/horario.routes'));
app.use('/colaborador', require('./src/routes/colaborador.routes'));
app.use('/cliente', require('./src/routes/cliente.routes'));
app.use('/agendamento', require('./src/routes/agendamento.routes'));

// VARIABLES
app.set('port', 8000);

// START SERVER
app.listen(app.get('port'), function () {
    console.log('WS escutando porta ' + app.get('port'));
});
