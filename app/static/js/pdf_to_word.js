// Evento de mudança no input de arquivo
document.getElementById("pdfFileInput").addEventListener("change", function () {
    const fileInput = document.getElementById("pdfFileInput");
    if (fileInput.files.length === 0) {
        alert("Selecione um arquivo PDF!");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    // Envia o arquivo para o servidor
    fetch("/upload-pdf-to-word", { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mostra o layout principal
                document.getElementById("mainContent").classList.remove("d-none");

                // Oculta o título inicial
                document.getElementById("primarytitle").classList.add("d-none");

                // Oculta o botão de upload após a seleção
                document.getElementById("uploadBtn").style.display = "none";

                // Renderiza a pré-visualização do PDF
                renderPreview(fileInput.files[0], data.numPages);
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error("Erro ao enviar o arquivo:", error);
            alert("Erro ao enviar o arquivo. Por favor, tente novamente.");
        });
});

// Função para renderizar a pré-visualização do PDF
function renderPreview(file, numPages) {
    const previewContainer = document.getElementById("previewPages");
    previewContainer.innerHTML = "";

    const fileReader = new FileReader();
    fileReader.onload = async function () {
        const typedArray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedArray).promise;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);

            const viewport = page.getViewport({ scale: 1 });
            const scale = 150 / viewport.width;
            const scaledViewport = page.getViewport({ scale });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;

            const renderTask = page.render({ canvasContext: context, viewport: scaledViewport });
            await renderTask.promise;

            const pageDiv = document.createElement("div");
            pageDiv.classList.add("page-preview");
            pageDiv.dataset.page = i;

            const canvasWrapper = document.createElement("div");
            canvasWrapper.classList.add("canvas-wrapper");
            canvasWrapper.appendChild(canvas);

            const pageNumber = document.createElement("p");
            pageNumber.textContent = `Página ${i}`;

            pageDiv.appendChild(canvasWrapper);
            pageDiv.appendChild(pageNumber);
            previewContainer.appendChild(pageDiv);
        }
    };

    fileReader.readAsArrayBuffer(file);
}

// Evento de clique no botão de conversão
document.getElementById("convertBtn").addEventListener("click", async function () {
    const fileInput = document.getElementById("pdfFileInput");
    if (fileInput.files.length === 0) {
        alert("Selecione um arquivo PDF!");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
        const response = await fetch("/convert-pdf-to-word", {
            method: "POST",
            body: formData
        });

        // Verificar o tipo de resposta
        const contentType = response.headers.get("content-type");

        if (contentType.includes("application/json")) {
            // Se for JSON, processar normalmente
            const data = await response.json();
            if (data.success) {
                window.location.href = data.redirectUrl;
            } else {
                alert("Erro ao converter o PDF: " + data.message);
            }
        } else if (contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
            // Se for um arquivo DOCX, fazer o download
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = fileInput.files[0].name.replace(".pdf", ".docx");
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert("Resposta inesperada do servidor.");
        }
    } catch (error) {
        console.error("Erro ao enviar o arquivo:", error);
        alert("Erro ao enviar o arquivo. Por favor, tente novamente.");
    }
});
