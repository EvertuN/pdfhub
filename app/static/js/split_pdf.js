document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const addFileBtn = document.getElementById('addFileBtn');
    const splitForm = document.getElementById('splitForm');
    const extractAll = document.getElementById('extractAll');
    const selectPages = document.getElementById('selectPages');
    const pdfPreview = document.getElementById('pdfPreview');

    let pdfFile = null;
    let selectedPages = new Set();

    addFileBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        pdfFile = file;
        const reader = new FileReader();

        reader.onload = async function () {
            const typedArray = new Uint8Array(this.result);
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            pdfPreview.innerHTML = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const scale = 0.5;
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                const renderTask = page.render({ canvasContext: context, viewport });
                await renderTask.promise;

                const pageContainer = document.createElement('div');
                pageContainer.classList.add('pdf-page', 'm-2', 'border', 'rounded');
                pageContainer.style.cursor = 'pointer';
                pageContainer.dataset.page = i;

                pageContainer.appendChild(canvas);
                pdfPreview.appendChild(pageContainer);

                pageContainer.addEventListener('click', () => {
                    if (selectedPages.has(i)) {
                        selectedPages.delete(i);
                        pageContainer.classList.remove('selected');
                    } else {
                        selectedPages.add(i);
                        pageContainer.classList.add('selected');
                    }
                });
            }
        };

        reader.readAsArrayBuffer(file);
    });

    extractAll.addEventListener('change', () => {
        pdfPreview.classList.add('disabled');
        selectedPages.clear();
        document.querySelectorAll('.pdf-page').forEach(el => el.classList.remove('selected'));
    });

    selectPages.addEventListener('change', () => {
        pdfPreview.classList.remove('disabled');
    });

    splitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pdfFile) {
        alert('Por favor, adicione um arquivo PDF.');
        return;
    }

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('splitOption', extractAll.checked ? 'all' : 'select');

    if (!extractAll.checked) {
        const selectedPages = Array.from(document.querySelectorAll('.pdf-page.selected'))
            .map(el => el.dataset.page);
        if (selectedPages.length === 0) {
            alert('Por favor, selecione pelo menos uma página.');
            return;
        }
        formData.append('selectedPages', selectedPages.join(','));
    }

    try {
        console.log("Enviando requisição para /split-pdf");
        const response = await fetch(splitPdfUrl, { // Use a variável splitPdfUrl
            method: 'POST', // Método POST
            body: formData
        });

        if (!response.ok) {
            throw new Error('Erro ao dividir PDF.');
        }

        // Criar um link para o arquivo PDF e forçar o download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'split.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao dividir PDF.');
    }
});
});
