const express = require('express');
const router = express.Router();

module.exports = (conexao) => {

    // 1. ROTA GET - LISTA TODOS OS PRODUTOS
    router.get('/', (req, res) => {
        const sql = 'SELECT * FROM produtos';

        conexao.query(sql, (erro, resultado) => {
            if (erro) {
                console.log(erro);
                return res.status(500).send('Erro ao listar produtos');
            }
            res.json(resultado);
        });
    });

    // 2. ROTA POST - CADASTRA UM NOVO PRODUTO
    router.post('/', (req, res) => {
        const { nome, quantidade, valor, categoria } = req.body;

        // Validações de entrada
        if (!nome) {
            return res.status(400).json({ erro: 'O nome é obrigatório' });
        }
        if (quantidade <= 0) {
            return res.status(400).json({ erro: 'A quantidade deve ser maior que 0' });
        }
        if (valor <= 0) {
            return res.status(400).json({ erro: 'O valor deve ser maior que 0' });
        }
        if (!categoria) {
            return res.status(400).json({ erro: 'A categoria é obrigatória' });
        }

        const sql = `
            INSERT INTO produtos (nome, quantidade, valor, categoria)
            VALUES (?, ?, ?, ?)
        `;

        conexao.query(sql, [nome, quantidade, valor, categoria], (erro, resultado) => {
            if (erro) {
                console.log(erro);
                return res.status(500).send('Erro ao cadastrar produto');
            }
            res.status(201).json({ mensagem: 'Produto cadastrado com sucesso' });
        });
    });

    // 3. ROTA GET - CALCULA O VALOR TOTAL POR CATEGORIA
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
                return res.status(500).send('Erro ao calcular total por categoria');
            }
            res.json(resultado);
        });
    });

    // 4. ROTA GET - LISTA AS MOVIMENTAÇÕES DE SAÍDA
    router.get('/movimentacoes/saidas', (req, res) => {
        const sql = `
            SELECT 
                m.id,
                p.nome AS produto,
                m.quantidade,
                m.dt_saida
            FROM movimentacoes m
            JOIN produtos p ON p.id = m.id_produto
            WHERE m.dt_saida IS NOT NULL
            ORDER BY m.dt_saida DESC
        `;

        conexao.query(sql, (erro, linhas) => {
            if (erro) {
                console.error('Erro ao buscar saídas:', erro);
                return res.status(500).json({ erro: 'Erro interno ao buscar saídas.' });
            }
            res.status(200).json(linhas);
        });
    });

    // 5. ROTA GET - ALERTAS DE ESTOQUE CRÍTICO
    router.get('/alertas/criticos', (req, res) => {
        const sql = `
            SELECT id, nome, quantidade,
            CASE 
                WHEN quantidade = 0 THEN 'MÍNIMO'
                WHEN quantidade >= 100 THEN 'MÁXIMO'
            END AS status_estoque,
            ROUND((quantidade / 100) * 100, 2) AS percentual_nivel
            FROM produtos
            WHERE quantidade = 0 OR quantidade >= 100;
        `;

        conexao.query(sql, (erro, linhas) => {
            if (erro) {
                console.error("Erro ao buscar alertas:", erro);
                return res.status(500).json({ erro: "Erro interno" });
            }

            if (linhas.length === 0) {
                return res.status(200).json({
                    mensagem: "Nenhum produto em estado crítico."
                });
            }

            res.status(200).json({
                total_alertas: linhas.length,
                produtos: linhas
            });
        });
    });

    return router;
};