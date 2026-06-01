const express = require('express');
const mysql = require('mysql2');

const app = express();

app.use(express.json());

const produtosRoutes = require('./routes/produtos'); 

const conexao = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'loja',
    port: 3307
});

conexao.connect((erro) => {
    if (erro) {
        console.log('Erro ao conectar:', erro);
    } else {
        console.log('Conectado ao MySQL!');
    }
});

app.use('/produtos', produtosRoutes(conexao));

app.get('/', (req, res) => {
    res.send('API funcionando!');
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});