const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/download', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ success: false, error: 'A URL é obrigatória.' });
    }

    // Seus dados reais obtidos no RapidAPI
    const apiKey = '49aafa0ec5msh8b5ed03cf50a7c6p1485f0jsnca1dd508102c'; 
    const apiHost = 'instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com'; 
    
    // Endpoint correto desta API para buscar postagens/reels/stories através da URL
    const apiUrl = `https://${apiHost}/post?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost
            },
            signal: AbortSignal.timeout(12000) // 12 segundos de tolerância
        });

        if (!response.ok) {
            throw new Error(`RapidAPI respondeu com status ${response.status}`);
        }

        const data = await response.json();

        // Esta API específica costuma retornar a estrutura dentro de um array de mídias ou direto no objeto.
        // O código abaixo mapeia as formas mais comuns que ela entrega o link do vídeo/imagem:
        let finalUrl = '';

        if (data && data.media_urls && data.media_urls.length > 0) {
            // Se for um carrossel ou vídeo único, pega o primeiro link direto de download
            finalUrl = data.media_urls[0];
        } else if (data && data.download_url) {
            finalUrl = data.download_url;
        } else if (data && data.url) {
            finalUrl = data.url;
        }

        if (finalUrl) {
            return res.json({ success: true, downloadUrl: finalUrl });
        }
        
        return res.status(400).json({ 
            success: false, 
            error: 'Não encontramos nenhuma mídia para este link. Certifique-se de que o perfil não é privado.' 
        });

    } catch (error) {
        console.error('Erro ao conectar com a API:', error.message);
        return res.status(200).json({ 
            success: false, 
            error: 'Ocorreu um problema ao extrair o vídeo. Tente novamente em instantes.' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});
