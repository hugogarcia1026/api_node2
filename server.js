const express = require('express');
const mysql = require('mysql2');

const app = express();

app.use(express.json());

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

app.get('/', (req, res) => {
    res.send('API funcionando!');
});

app.get('/produtos', (req, res) => {

    const sql = 'SELECT * FROM vw_produtos';

    conexao.query(sql, (erro, resultado) => {

        if (erro) {
            res.status(500).send('Erro no banco');
        } else {
            res.json(resultado);
        }

    });

});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});

