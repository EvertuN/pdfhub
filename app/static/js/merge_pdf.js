document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const addFilesBtn = document.getElementById('addFilesBtn');
    const sortByNameBtn = document.getElementById('sortByNameBtn');
    const pdfPreview = document.getElementById('pdfPreview');
    const pdfTemplate = document.getElementById('pdfTemplate').content;

let pdfFiles = [];
let isRendering = false; // Controlador global para evitar múltiplos cliques

function addFiles(files) {
    for (const file of files) {
        const clone = document.importNode(pdfTemplate, true);
        const uniqueId = Date.now();
        const uniqueName = `${uniqueId}_${file.name}`;
        file.uniqueName = uniqueName;

        clone.querySelector('.pdf-name').textContent = file.name;

        const canvas = clone.querySelector('.pdf-preview');

        renderPDFPreview(file, canvas);

        // Botão de girar
        const rotateButton = clone.querySelector('.rotate-pdf');
// Dentro do evento de click para rotação:
rotateButton.addEventListener('click', async function () {
    if (isRendering) {
        console.log("O preview está sendo atualizado, por favor, aguarde...");
        return;
    }

    isRendering = true; // Bloqueia cliques adicionais

    try {
        // Incrementar rotação no objeto associado ao arquivo
        file.rotation = (file.rotation || 0) + 90;
        if (file.rotation >= 360) file.rotation = 0; // Reseta ao atingir 360 graus

        console.log(`Rotação atualizada para ${file.rotation} graus.`);

        // Atualização apenas do preview:
        await renderPDFPreview(file, canvas);
    } catch (error) {
        console.error("Erro ao girar o PDF:", error);
    } finally {
        isRendering = false; // Libera novamente o recurso
    }
});

        // Delete do preview
// Remove o card e mantém o array consistente
clone.querySelector('.delete-pdf').addEventListener('click', (event) => {
    const card = event.target.closest('.pdf-item');
    if (card) {
        card.remove(); // Remove do DOM
        pdfFiles = pdfFiles.filter(f => f.uniqueName !== file.uniqueName); // Atualiza lista
        console.log("Arquivo removido:", file.name);
    }
});

        pdfPreview.appendChild(clone.querySelector('.pdf-item'));
        pdfFiles.push(file);
    }
}

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

async function renderPDFPreview(file, canvas) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        const typedArray = new Uint8Array(this.result);

        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
            pdf.getPage(1).then(page => {
                const viewport = page.getViewport({ scale: 0.5, rotation: file.rotation || 0 }); // Usa a rotação do objeto file
                const context = canvas.getContext('2d');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                page.render(renderContext).promise.then(() => {
                    console.log(`PDF "${file.name}" renderizado no preview.`);
                }).catch(error => {
                    console.error('Erro ao renderizar o preview do PDF', error);
                });
            });
        }).catch(error => {
            console.error('Erro ao carregar o PDF:', error);
            alert('Erro ao carregar o PDF. Certifique-se de que o arquivo é válido.');
        });
    };

    fileReader.readAsArrayBuffer(file); // Trabalha com arquivo local no navegador
}

    addFilesBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        addFiles(e.target.files);
        fileInput.value = '';
    });

sortByNameBtn.addEventListener('click', () => {
    pdfFiles.sort((a, b) => a.name.localeCompare(b.name));

    pdfPreview.innerHTML = ''; // Limpa o preview atual para evitar duplicação

    pdfFiles.forEach(file => {
        const clone = document.importNode(pdfTemplate, true);
        clone.querySelector('.pdf-name').textContent = file.name;

        const canvas = clone.querySelector('.pdf-preview');
        renderPDFPreview(file, canvas);

        clone.querySelector('.rotate-pdf').addEventListener('click', () => {
            if (isRendering) return;

            isRendering = true;

            file.rotation = (file.rotation || 0) + 90;
            if (file.rotation >= 360) file.rotation = 0;

            renderPDFPreview(file, canvas).finally(() => isRendering = false);
        });

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

    // Inclua tanto o arquivo quanto o ângulo de rotação no envio
    pdfFiles.forEach(file => {
        formData.append('files', file);
        formData.append('rotations', file.rotation || 0); // Adiciona rotação acumulada de cada arquivo
    });

    try {
        const response = await fetch('/merge-pdf', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Erro ao combinar PDFs.');
        }

        const result = await response.json();
        if (result.success) {
            window.location.href = result.redirectUrl; // Redireciona para o download do arquivo combinado
        } else {
            alert('Erro ao processar o merge dos PDFs.');
        }
    } catch (error) {
        console.error('Erro no merge dos PDFs:', error);
    }
});

    new Sortable(pdfPreview, {
        animation: 150,
        onEnd: function (evt) {
            const item = pdfFiles.splice(evt.oldIndex, 1)[0];
            pdfFiles.splice(evt.newIndex, 0, item);
        },
    });

async function rotatePDF(file, rotation) {
    const formData = new FormData();
    formData.append("file_name", file.uniqueName); // Nome único do arquivo
    formData.append("rotation", rotation); // Rotação a ser aplicada

    try {
        const response = await fetch(rotatePdfUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            throw new Error("Erro ao comunicar com o servidor.");
        }

        const data = await response.json();
        if (data.status !== "success") {
            throw new Error(data.message || "Erro ao processar rotação no servidor.");
        }

        console.log(`Arquivo ${data.file_name} rotacionado com sucesso no servidor.`);
        // Atualize o nome do arquivo caso ele mude
        file.uniqueName = data.file_name;

    } catch (error) {
        console.error("Erro ao fazer rotação via API:", error);
//        alert("Não foi possível girar o PDF. Tente novamente.");
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