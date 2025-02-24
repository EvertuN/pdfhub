document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const addFilesBtn = document.getElementById('addFilesBtn');
    const sortByNameBtn = document.getElementById('sortByNameBtn');
    const pdfPreview = document.getElementById('pdfPreview');
    const pdfTemplate = document.getElementById('pdfTemplate').content;

let pdfFiles = [];

function addFiles(files) {
    for (const file of files) {
        const clone = document.importNode(pdfTemplate, true);
        const uniqueId = Date.now();
        const uniqueName = `${uniqueId}_${file.name}`; // Nome único para o arquivo

        clone.querySelector('.pdf-name').textContent = file.name; // Exibe o nome original
        file.uniqueName = uniqueName; // Armazena o nome único no objeto do arquivo

        const canvas = clone.querySelector('.pdf-preview');
        renderPDFPreview(file, canvas);

        clone.querySelector('.delete-pdf').addEventListener('click', (event) => {
            const card = event.target.closest('.pdf-item'); // Encontra o elemento .pdf-item pai
            if (card) {
                card.remove(); // Remove o card do DOM
                pdfFiles = pdfFiles.filter(f => f.uniqueName !== file.uniqueName); // Remove o arquivo do array usando o nome único
            }
        });

        pdfPreview.appendChild(clone.querySelector('.pdf-item'));
        pdfFiles.push(file);
    }
}

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

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

        clone.querySelector('.delete-pdf').addEventListener('click', (event) => {
            const card = event.target.closest('.pdf-item');
            if (card) {
                card.remove();
                pdfFiles = pdfFiles.filter(f => f.uniqueName !== file.uniqueName);
            }
        });

        pdfPreview.appendChild(clone);
    });
});


document.querySelector('#mergeForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (pdfFiles.length === 0) {
        alert('Por favor, adicione pelo menos um PDF.');
        return;
    }

    const formData = new FormData();
    pdfFiles.forEach(file => formData.append('files', file)); // Adiciona os arquivos ao formulário

    try {
        const response = await fetch(this.getAttribute('data-url'), { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            window.location.href = result.redirectUrl; // Agora redireciona para a URL específica do merge
        } else {
            alert(result.message || 'Erro ao mesclar PDFs.');
        }
    } catch (error) {
        console.error('Erro ao mesclar PDFs:', error);
        alert('Erro inesperado. Por favor, tente novamente.');
    }
});


    new Sortable(pdfPreview, {
        animation: 150,
        onEnd: function (evt) {
            const item = pdfFiles.splice(evt.oldIndex, 1)[0];
            pdfFiles.splice(evt.newIndex, 0, item);
        },
    });

    async function rotatePDF(file, canvas) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('angle', 90); // Girar 90 graus

    try {
        const response = await fetch(rotatePdfUrl, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Erro ao girar PDF.');
        }

        // Obter o blob do PDF girado
        const blob = await response.blob();
        const newFile = new File([blob], file.name, { type: 'application/pdf' });

        // Atualizar o preview com o PDF girado
        renderPDFPreview(newFile, canvas);

        // Atualizar o arquivo no array pdfFiles
        const index = pdfFiles.findIndex(f => f.uniqueName === file.uniqueName);
        if (index !== -1) {
            pdfFiles[index] = newFile;
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao girar PDF.');
    }
}

// Adicionar evento de clique ao botão de girar
pdfPreview.addEventListener('click', (e) => {
    if (e.target.classList.contains('rotate-pdf')) {
        const pdfItem = e.target.closest('.pdf-item');
        const canvas = pdfItem.querySelector('.pdf-preview');
        const fileName = pdfItem.querySelector('.pdf-name').textContent;
        const file = pdfFiles.find(f => f.name === fileName);
        rotatePDF(file, canvas);
    }
});


});