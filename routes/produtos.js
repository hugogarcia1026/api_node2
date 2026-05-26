const express = require('express');
const router = express.Router();

module.exports = (conexao) => {

    router.get('/', (req, res) => {

        const sql = 'SELECT * FROM produtos';

        conexao.query(sql, (erro, resultado) => {

            if (erro) {
                console.log(erro);
                res.status(500).send('Erro ao listar produtos');
            } else {
                res.json(resultado);
            }

        });

    });

    router.post('/', (req, res) => {

        const { nome, quantidade, valor, categoria } = req.body;

        if (!nome) {
            return res.status(400).json({
                erro: 'O nome é obrigatório'
            });
        }

        if (quantidade <= 0) {
            return res.status(400).json({
                erro: 'A quantidade deve ser maior que 0'
            });
        }

        if (valor <= 0) {
            return res.status(400).json({
                erro: 'O valor deve ser maior que 0'
            });
        }

        if (!categoria) {
            return res.status(400).json({
                erro: 'A categoria é obrigatória'
            });
        }

        const sql = `
            INSERT INTO produtos (nome, quantidade, valor, categoria)
            VALUES (?, ?, ?, ?)
        `;

        conexao.query(
            sql,
            [nome, quantidade, valor, categoria],
            (erro, resultado) => {

                if (erro) {
                    console.log(erro);
                    res.status(500).send('Erro ao cadastrar produto');
                } else {
                    res.status(201).json({
                        mensagem: 'Produto cadastrado com sucesso'
                    });
                }

            }
        );

    });

router.get('/categorias/total', (req, res) => {

    const sql = `
        SELECT
            categoria,
            SUM(quantidade * valor) AS valor_total
        FROM produtos
        GROUP BY categoria
    `;

    conexao.query(sql, (erro, resultado) => {

        if (erro) {
            console.log(erro);
            res.status(500).send('Erro ao calcular total por categoria');
        } else {
            res.json(resultado);
        }

    });

});

    return router;

};