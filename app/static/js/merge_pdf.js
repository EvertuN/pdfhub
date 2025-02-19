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

        // Botão para excluir o PDF
        clone.querySelector('.delete-pdf').addEventListener('click', (event) => {
            const card = event.target.closest('.pdf-item'); // Encontra o elemento .pdf-item pai
            if (card) {
                card.remove(); // Remove o card do DOM
                pdfFiles = pdfFiles.filter(f => f.name !== file.name); // Remove o arquivo do array
            }
        });

// Botão para girar o PDF
clone.querySelector('.rotate-pdf').addEventListener('click', async () => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('angle', 90); // Girar 90 graus

    // Obter a URL do formulário
    const rotateUrl = document.querySelector('#mergeForm').dataset.rotateUrl;

    try {
        const response = await fetch(rotateUrl, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        if (data.success) {
            // Atualizar o preview com o PDF girado
            const blob = await fetch(data.downloadUrl).then(res => res.blob());
            const newFile = new File([blob], file.name, { type: 'application/pdf' });
            renderPDFPreview(newFile, canvas);
        } else {
            alert('Erro ao girar PDF.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao girar PDF.');
    }
});

        pdfPreview.appendChild(clone.querySelector('.pdf-item'));
        pdfFiles.push(file);
    }
}
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
                    page.render({ canvasContext: context, viewport });
                });
            });
        };
        fileReader.readAsArrayBuffer(file);
    }

    // Evento de clique para abrir seletor de arquivos
    addFilesBtn.addEventListener('click', () => fileInput.click());

    // Evento de mudança no input de arquivos
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
    e.preventDefault(); // Evitar o envio padrão do formulário

    // Verificar se há PDFs selecionados
    if (pdfFiles.length === 0) {
        alert('Por favor, adicione pelo menos um PDF.');
        return;
    }

    // Criar um FormData para enviar os arquivos
    const formData = new FormData();
    pdfFiles.forEach((file) => {
        formData.append('files', file);
    });

    // Obter a URL do formulário
    const url = document.querySelector('#mergeForm').dataset.url;

    try {
        // Enviar os arquivos via AJAX
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        if (data.success) {
            // Redirecionar para a página de download
            window.location.href = data.redirectUrl;
        } else {
            alert('Erro ao mesclar PDFs.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao mesclar PDFs.');
    }
});


    // Ativar reordenamento com Sortable.js
    new Sortable(pdfPreview, {
        animation: 150,
        onEnd: function (evt) {
            const item = pdfFiles.splice(evt.oldIndex, 1)[0];
            pdfFiles.splice(evt.newIndex, 0, item);
        },
    });
});
