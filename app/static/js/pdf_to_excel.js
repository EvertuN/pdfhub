document.getElementById("pdfFileInput").addEventListener("change", function () {
    let fileInput = document.getElementById("pdfFileInput");
    if (fileInput.files.length === 0) {
        alert("Selecione um arquivo PDF!");
        return;
    }

    let formData = new FormData();
    formData.append("file", fileInput.files[0]);

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
        });
});

function renderPreview(file, numPages) {
    let previewContainer = document.getElementById("previewPages");
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
            body: formData,
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "converted.docx"; // Nome do arquivo baixado
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
                        try {
                const result = await response.json();
                alert(result.message || "Erro ao converter o PDF.");
            } catch (e) {
                alert("Erro inesperado no servidor. Verifique o console para detalhes.");
                console.error("Erro no servidor:", await response.text());
            }
        }
    } catch (error) {
        console.error("Erro ao converter o PDF:", error);
        alert("Erro inesperado. Por favor, tente novamente.");
    }
});