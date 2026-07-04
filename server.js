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

    // Dados extraídos do seu painel do RapidAPI
    const apiKey = '49aafa0ec5msh8b5ed03cf50a7c6p1485f0jsnca1dd508102c'; 
    const apiHost = 'instagram-downloader-scraper-reels-igtv-posts-stories.p.rapidapi.com'; 
    
    // ROTA CORRETA: Alterado para /scraper conforme a documentação obtida
    const apiUrl = `https://${apiHost}/scraper?url=${encodeURIComponent(url)}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': apiKey,
                'x-rapidapi-host': apiHost,
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(15000) // 15 segundos de tolerância para download de vídeos longos
        });

        const data = await response.json();

        // Tratamento de erros específicos retornados pela própria API (ex: link privado ou inválido)
        if (response.status === 400 || data.error === 'Bad Request') {
            return res.status(200).json({ 
                success: false, 
                error: data.message || 'Link inválido ou o perfil do Instagram é privado.' 
            });
        }

        if (!response.ok) {
            throw new Error(`Erro na resposta do servidor da API: ${response.status}`);
        }

        // Mapeamento baseado no formato oficial fornecido: data -> [ { media: "url" } ]
        if (data && data.data && data.data.length > 0) {
            const finalUrl = data.data[0].media; // Pega o link de mídia do primeiro item encontrado
            
            if (finalUrl) {
                return res.json({ success: true, downloadUrl: finalUrl });
            }
        }
        
        return res.status(200).json({ 
            success: false, 
            error: 'Nenhuma mídia encontrada. Certifique-se de que o link pertence a um post ou Reels público.' 
        });

    } catch (error) {
        console.error('Erro interno:', error.message);
        return res.status(200).json({ 
            success: false, 
            error: 'O servidor de extração demorou para responder. Tente novamente em alguns segundos.' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT}`);
});
