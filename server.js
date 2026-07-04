const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações básicas
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ROTA PRINCIPAL: Processa o link do Instagram
app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'A URL é obrigatória.' });
    }

    try {
        // Utilizamos uma API pública e gratuita de extração de mídias (ex: SnapInsta/SaveFrom alternativa)
        // NOTA: Em produção massiva, recomenda-se assinar uma API no RapidAPI (ex: "Instagram Media Downloader")
        const apiUrl = `https://api.rest7.com/v1/instagram_downloader?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Se a API retornar sucesso e encontrar o link do vídeo/imagem
        if (data && data.success !== false) {
            return res.json({
                success: true,
                // Dependendo da API usada, o formato da resposta muda. Adaptado para APIs padrão:
                downloadUrl: data.url || data.download_url || data.links[0].url
            });
        } else {
            return res.status(400).json({ error: 'Não foi possível encontrar a mídia deste link. O perfil pode ser privado.' });
        }

    } catch (error) {
        console.error('Erro no servidor:', error);
        return res.status(500).json({ error: 'Erro interno ao processar o download.' });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
