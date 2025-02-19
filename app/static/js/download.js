// Função para excluir o arquivo
document.getElementById('deleteFileBtn').addEventListener('click', async () => {
    try {
        const response = await fetch("{{ url_for('merge_pdf.delete_file') }}", {
            method: 'POST',
        });
        const data = await response.json();

        if (data.success) {
            alert('Arquivo excluído com sucesso!');
            window.location.href = "{{ url_for('merge_pdf.merge_pdf') }}";
        } else {
            alert('Erro ao excluir o arquivo.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao excluir o arquivo.');
    }
});