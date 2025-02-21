// Função para excluir o arquivo
document.getElementById('deleteFileBtn').addEventListener('click', async () => {
    const fileName = document.getElementById('deleteFileBtn').dataset.filename; // Nome do arquivo
    try {
        const response = await fetch('/delete-file', {
            method: 'POST',
            body: JSON.stringify({ filename: fileName }),
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await response.json();
        if (data.success) {
            alert('Arquivo excluído com sucesso!');
            window.location.href = '/merge-pdf'; // Retorna para a página inicial apropriada
        } else {
            alert('Erro ao excluir o arquivo.');
        }
    } catch (error) {
        console.error('Erro ao excluir o arquivo:', error);
        alert('Erro ao excluir o arquivo.');
    }
});