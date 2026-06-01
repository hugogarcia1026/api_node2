const express = require('express');
const router = express.Router();

module.exports = (conexao) => {

    // ROTA GET - LISTA TODOS OS PRODUTOS
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

    // ROTA POST - CADASTRA UM NOVO PRODUTO
    router.post('/', (req, res) => {
        const { nome, quantidade, valor, categoria } = req.body;

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


    router.post('/produtos/:id/movimentacoes', async (req, res) => {
        const { id } = req.params;
        const { quantidade } = req.body;
    
        if (quantidade === undefined || Number(quantidade) <= 0) {
            return res.status(400).json({ erro: 'A quantidade deve ser maior que zero.' });
        }
    
        try {
            const [produtoExistente] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);
    
            if (produtoExistente.length === 0) {
                return res.status(404).json({ erro: 'Produto não encontrado.' });
            }
    
            const sql = 'UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?';
            await db.query(sql, [Number(quantidade), id]);
    
            const [produtoAtualizado] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);
    
            res.status(200).json({
                mensagem: 'Movimentação registrada com sucesso!',
                produto: produtoAtualizado[0]
            });
        } catch (erro) {
            console.error('Erro ao registrar movimentação:', erro);
            res.status(500).json({ erro: 'Erro interno ao registrar movimentação.' });
        }
    });


    router.put('/produtos/:id/entrada', async (req, res) => {
        const { id } = req.params;
        const { quantidade } = req.body;
    
        if (quantidade === undefined || Number(quantidade) <= 0) {
            return res.status(400).json({ erro: 'A quantidade de entrada deve ser um número maior que zero.' });
        }
    
        try {
            const [produtoExistente] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);
    
            if (produtoExistente.length === 0) {
                return res.status(404).json({ erro: 'Produto não encontrado no sistema.' });
            }
    
            const sql = 'UPDATE produtos SET quantidade = quantidade + ? WHERE id = ?';
            await db.query(sql, [Number(quantidade), id]);
    
            const [produtoAtualizado] = await db.query('SELECT * FROM produtos WHERE id = ?', [id]);
    
            res.status(200).json({
                mensagem: 'Entrada de estoque registrada com sucesso!',
                produto: produtoAtualizado[0]
            });
        } catch (erro) {
            console.error('Erro ao registrar entrada:', erro);
            res.status(500).json({ erro: 'Erro interno ao atualizar o estoque.' });
        }
    });

   
    // ROTA GET - CALCULA O VALOR TOTAL POR CATEGORIA
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

    // ROTA GET - LISTA AS MOVIMENTAÇÕES DE SAÍDA
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

    //  ROTA GET - ALERTAS DE ESTOQUE CRÍTICO
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


        router.get('/movimentacoes/relatorio', async (req, res) => {
            try {
                const sql = `
                    SELECT 
                        p.nome AS produto,
                        SUM(CASE WHEN m.dt_entrada IS NOT NULL THEN m.quantidade ELSE 0 END) AS total_entradas,
                        SUM(CASE WHEN m.dt_saida IS NOT NULL THEN m.quantidade ELSE 0 END) AS total_saidas
                    FROM movimentacoes m
                    JOIN produtos p ON p.id = m.id_produto
                    GROUP BY p.nome
                    ORDER BY p.nome
                `;
        
                const [linhas] = await db.query(sql);
                res.status(200).json(linhas);
        
            } catch (erro) {
                console.error('Erro ao gerar relatório:', erro);
                res.status(500).json({ erro: 'Erro interno ao gerar relatório.' });
            }
        });

        router.get('/produtos/volume', async (req, res) => {
            try {
                const sql = `
                    SELECT
                    p.nome,
                    m.dt_entrada,
                    m.dt_saida
                    FROM movimentacoes m 
                    INNER JOIN produtos p ON p.id = m.id_produto
                    `;
                    const [linhas] = await db.query(sql);
                    res.status(200).json(linhas);
        
            } catch (erro) {
                console.error('Erro', erro);
                res.status(200).status.json({erro: err.message})
            }
        });
        
        router.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    });

    return router;
};