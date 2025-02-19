document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const addFilesBtn = document.getElementById('addFilesBtn');
    const sortByNameBtn = document.getElementById('sortByNameBtn');
    const pdfPreview = document.getElementById('pdfPreview');
    const pdfTemplate = document.getElementById('pdfTemplate').content;

    let pdfFiles = [];

    // Função para adicionar arquivos ao preview
// Função para adicionar arquivos ao preview
function addFiles(files) {
    for (const file of files) {
        const clone = document.importNode(pdfTemplate, true);
        clone.querySelector('.pdf-name').textContent = file.name;

        // Renderizar a primeira página do PDF
        const canvas = clone.querySelector('.pdf-preview');
        renderPDFPreview(file, canvas);

        clone.querySelector('.delete-pdf').addEventListener('click', (event) => {
            const card = event.target.closest('.pdf-item'); // Encontra o elemento .pdf-item pai
            if (card) {
                card.remove(); // Remove o card do DOM
                pdfFiles = pdfFiles.filter(f => f.name !== file.name); // Remove o arquivo do array
            }
        });

        pdfPreview.appendChild(clone.querySelector('.pdf-item'));
        pdfFiles.push(file);
    }
}
// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

// Função para renderizar a primeira página do PDF
function renderPDFPreview(file, canvas) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        const typedArray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
            pdf.getPage(1).then(page => {
                const viewport = page.getViewport({ scale: 0.5 });
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };
                page.render(renderContext);
            });
        }).catch(error => {
            console.error('Erro ao carregar o PDF:', error);
            alert('Erro ao carregar o PDF. Certifique-se de que o arquivo é válido.');
        });
    };
    fileReader.readAsArrayBuffer(file);
}

    addFilesBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        addFiles(e.target.files);
        fileInput.value = '';
    });

    sortByNameBtn.addEventListener('click', () => {
        pdfFiles.sort((a, b) => a.name.localeCompare(b.name));

        pdfPreview.innerHTML = '';

        pdfFiles.forEach(file => {
            const clone = document.importNode(pdfTemplate, true);
            clone.querySelector('.pdf-name').textContent = file.name;

            const canvas = clone.querySelector('.pdf-preview');
            renderPDFPreview(file, canvas);

            clone.querySelector('.delete-pdf').addEventListener('click', () => {
                pdfPreview.removeChild(clone.querySelector('.pdf-item'));
                pdfFiles = pdfFiles.filter(f => f.name !== file.name);
            });

            pdfPreview.appendChild(clone.querySelector('.pdf-item'));
        });
    });

document.querySelector('#mergeForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (pdfFiles.length === 0) {
        alert('Por favor, adicione pelo menos um PDF.');
        return;
    }

    const formData = new FormData();
    pdfFiles.forEach((file) => {
        formData.append('files', file);
    });

    const url = document.querySelector('#mergeForm').dataset.url;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        if (data.success) {
            window.location.href = data.redirectUrl;
        } else {
            alert('Erro ao mesclar PDFs.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao mesclar PDFs.');
    }
});


    new Sortable(pdfPreview, {
        animation: 150,
        onEnd: function (evt) {
            const item = pdfFiles.splice(evt.oldIndex, 1)[0];
            pdfFiles.splice(evt.newIndex, 0, item);
        },
    });
});
