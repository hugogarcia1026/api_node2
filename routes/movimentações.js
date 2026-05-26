const express = require('express');
const router = express.Router();

module.exports = (conexao) => {

    router.get('/', (req, res) => {

        const sql = 'SELECT * FROM movimentacoes';

        conexao.query(sql, (erro, resultado) => {

            if (erro) {
                console.log(erro);
                res.status(500).send('Erro ao listar movimentações');
            } else {
                res.json(resultado);
            }

        });

    });

    router.post('/entrada', (req, res) => {

        const { produto_id, tipo, quantidade } = req.body;

        if (!produto_id) {
            return res.status(400).json({
                erro: 'Produto obrigatório'
            });
        }

        if (quantidade <= 0) {
            return res.status(400).json({
                erro: 'Quantidade deve ser maior que 0'
            });
        }

        const sqlUpdate = `
            UPDATE produtos
            SET quantidade = quantidade + ?
            WHERE id = ?
        `;

        conexao.query(
            sqlUpdate,
            [quantidade, produto_id],
            (erro, resultado) => {

                if (erro) {
                    console.log(erro);
                    return res.status(500).send('Erro ao atualizar estoque');
                }

                const sqlInsert = `
                    INSERT INTO movimentacoes
                    (produto_id, data, tipo, quantidade)
                    VALUES (?, NOW(), ?, ?)
                `;

                conexao.query(
                    sqlInsert,
                    [produto_id, tipo, quantidade],
                    (erro2, resultado2) => {

                        if (erro2) {
                            console.log(erro2);
                            return res.status(500).send('Erro ao salvar movimentação');
                        }

                        res.status(201).json({
                            mensagem: 'Entrada registrada com sucesso'
                        });

                    }
                );

            }
        );

    });

    return router;

};