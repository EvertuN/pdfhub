document.getElementById("pdfFileInput").addEventListener("change", function () {
    let fileInput = document.getElementById("pdfFileInput");
    if (fileInput.files.length === 0) {
        alert("Selecione um arquivo PDF!");
        return;
    }

    let formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetch("/upload-pdf", { method: "POST", body: formData })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mostra o layout principal
                document.getElementById("mainContent").classList.remove("d-none");

                // Titulo desaparece boom
                document.getElementById("primarytitle").classList.add("d-none");

                // Deixa o botão de upload oculto após a seleção
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
            pageDiv.classList.add("page-preview", "selected"); // Adiciona 'selected' por padrão
            pageDiv.dataset.page = i;

            const canvasWrapper = document.createElement("div");
            canvasWrapper.classList.add("canvas-wrapper");
            canvasWrapper.appendChild(canvas);

            const pageNumber = document.createElement("p");
            pageNumber.textContent = `Página ${i}`;

            const selectedIcon = document.createElement("i");
            selectedIcon.classList.add("fas", "fa-check-circle", "selected-icon");

            pageDiv.appendChild(selectedIcon);
            pageDiv.appendChild(canvasWrapper);
            pageDiv.appendChild(pageNumber);
            previewContainer.appendChild(pageDiv);

            // Permite ao usuário alternar a seleção manualmente caso deseje mudar
            pageDiv.addEventListener("click", () => {
                pageDiv.classList.toggle("selected");
            });
        }
    };

    fileReader.readAsArrayBuffer(file);
}

document.getElementById("splitAllBtn").addEventListener("click", function () {
    // Marcar visualmente todas as páginas como selecionadas
    document.querySelectorAll(".page-preview").forEach(el => el.classList.add("selected"));
});

document.getElementById("splitSelectedBtn").addEventListener("click", function () {
    document.querySelectorAll(".page-preview").forEach(el => el.classList.remove("selected"));
});

document.getElementById("confirmSplitBtn").addEventListener("click", async function () {
    let selectedPages = [...document.querySelectorAll(".page-preview.selected")].map(el => el.dataset.page).join(",");
    if (selectedPages.length === 0) {
        alert("Selecione pelo menos uma página!");
        return;
    }

    try {
        const response = await fetch("/process-split", {
            method: "POST",
            body: new URLSearchParams({
                fileName: document.getElementById("pdfFileInput").files[0].name,
                splitOption: "select",
                selectedPages
            }),
        });

        const result = await response.json();
        if (result.success) {
            // Redirecionar para a página de download
            window.location.href = result.redirect_url;
        } else {
            alert(result.message || "Erro ao processar o PDF.");
        }
    } catch (error) {
        console.error("Erro ao dividir o PDF:", error);
        alert("Erro inesperado. Por favor, tente novamente.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const splitAllBtn = document.getElementById("splitAllBtn");
    const splitSelectedBtn = document.getElementById("splitSelectedBtn");

    function toggleActiveButton(selectedButton) {
        splitAllBtn.classList.remove("active");
        splitSelectedBtn.classList.remove("active");
        selectedButton.classList.add("active");
    }

    toggleActiveButton(splitAllBtn);

    splitAllBtn.addEventListener("click", () => {
        toggleActiveButton(splitAllBtn);
    });

    splitSelectedBtn.addEventListener("click", () => {
        toggleActiveButton(splitSelectedBtn);
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const pdfFileInput = document.getElementById("pdfFileInput");
    const uploadCard = pdfFileInput.closest(".card");

    pdfFileInput.addEventListener("change", function () {
        if (pdfFileInput.files.length > 0) {
            uploadCard.style.display = "none";
            document.getElementById("previewContainer").classList.remove("d-none");
            document.getElementById("buttonContainer").classList.remove("d-none");
        } else {
            alert("Nenhum arquivo foi selecionado!");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const splitAllBtn = document.getElementById("splitAllBtn");
    const splitSelectedBtn = document.getElementById("splitSelectedBtn");
    const previewContainer = document.getElementById("previewPages");

    previewContainer.addEventListener("click", function () {
        if (splitAllBtn.classList.contains("active")) {
            splitAllBtn.classList.remove("active");
            splitSelectedBtn.classList.add("active");
        }
    });
});