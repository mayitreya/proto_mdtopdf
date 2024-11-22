document.addEventListener('DOMContentLoaded', function () {
    let editor = ace.edit("editor"); 
    editor.setTheme("ace/theme/cobalt");
    editor.session.setMode("ace/mode/markdown");
    editor.session.setUseWrapMode(true);

    editor.setOptions({
        fontSize: "12pt"
      });

    let debounceTimer; 
    const debounceDelay = 300; 

    const storedContent = localStorage.getItem('markdownContent');
    if (storedContent) {
        editor.setValue(storedContent, -1); 
    }

    editor.session.on('change', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
            const code = editor.getValue();
            localStorage.setItem('markdownContent', code); 
            renderMarkdown(code); 
        }, debounceDelay);
    });


    
    function escapeLatex(latex) {
        return latex.replace(/\$/g, '&#36;').replace(/\$/g, '&#36;'); 
    }

    
    function renderMarkdown(code) {
        const escapedCode = escapeLatex(code); 
        const html = marked(escapedCode); 
        const preview = document.getElementById('preview');
        preview.innerHTML = ''; 

        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html; 

        
        const headings = wrapper.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            heading.classList.add('preview-heading');
        });

        
        const codeBlocks = wrapper.querySelectorAll('pre');
        codeBlocks.forEach(codeBlock => {
            codeBlock.classList.add('preview-code-block');
        });

        preview.appendChild(wrapper); 
        MathJax.Hub.Queue(["Typeset", MathJax.Hub]); 
    }

    document.getElementById('export-html').addEventListener('click', function () {
        $('#htmlModal').modal('show');
    });

    document.getElementById('export-html-confirm').addEventListener('click', function () {
        const filename = document.getElementById('html-filename').value || 'exported-document'; 
        
        if (!filename) {
            alert("Please enter a filename."); 
            return;
        }

        const code = editor.getValue(); 
        const escapedCode = escapeLatex(code); 
        const html = marked(escapedCode); 

        
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <title>Markdown Export</title>
                <style>
                    body { background-color: #1f2937; color: #e5e7eb; font-family: Arial, sans-serif; }
                    pre { background-color: #374151; padding: 1em; border-radius: 0.5em; overflow-x: auto; }
                    .toc { position: fixed; top: 20px; left: 20px; width: 200px; max-height: calc(100vh - 40px); overflow-y: auto; padding: 10px; background: rgba(31, 41, 55, 0.9); border-radius: 0.5em; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5); }
                    .content { margin-left: 240px; padding: 20px; }
                    a { color: #60a5fa; transition: color 0.3s; }
                    a:hover { color: #93c5fd; }
                </style>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-AMS_HTML"></script>
            </head>
            <body>
                <div class="toc">
                    <h5 class="text-lg font-bold mb-2">Table of Contents</h5>
                    <ul class="list-disc pl-5">
        `;

        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html; 
        const mainHeadings = tempDiv.querySelectorAll('h1'); 

        if (mainHeadings.length === 0) {
            
            htmlContent += `<li>No headings available in the document.</li>`;
        } else {
            mainHeadings.forEach((heading) => {
                const headingText = heading.innerText;
                const anchor = headingText.replace(/\s+/g, '-').toLowerCase(); 
                htmlContent += `<li><a href="#${anchor}">${headingText}</a></li>`;
            });
        }

        htmlContent += `
                        </ul>
                    </div>
                    <div class="content">
                        <main>
        `;

        
        mainHeadings.forEach((heading) => {
            const currentHeading = heading.innerHTML; 
            const anchor = currentHeading.replace(/<.*?>/g, '').replace(/\s+/g, '-').toLowerCase(); 

            
            htmlContent += `<div class="bg-gray-800 shadow-md rounded-lg mb-4 p-4 border border-gray-700" id="${anchor}">`;

            
            const headingClass = 'text-2xl font-bold text-blue-400'; 
            htmlContent += `<h5 class="${headingClass}">${currentHeading}</h5>`;

            
            let nextNode = heading.nextElementSibling;
            while (nextNode && !nextNode.matches('h1')) { 
                if (nextNode.nodeType === Node.ELEMENT_NODE) {
                    if (nextNode.matches('h2')) {
                        htmlContent += `<h6 class="text-xl font-semibold text-blue-300">${nextNode.innerHTML}</h6>`; 
                    } else if (nextNode.matches('h3')) {
                        htmlContent += `<h6 class="text-lg font-semibold text-blue-200">${nextNode.innerHTML}</h6>`; 
                    } else if (nextNode.matches('h4')) {
                        htmlContent += `<h6 class="text-base font-semibold text-blue-100">${nextNode.innerHTML}</h6>`; 
                    } else if (nextNode.matches('h5')) {
                        htmlContent += `<h6 class="text-sm font-semibold text-gray-300">${nextNode.innerHTML}</h6>`; 
                    } else if (nextNode.matches('h6')) {
                        htmlContent += `<h6 class="text-xs font-semibold text-gray-400">${nextNode.innerHTML}</h6>`; 
                    } else {
                        htmlContent += `<div class="mb-2">${nextNode.outerHTML}</div>`; 
                    }
                }
                nextNode = nextNode.nextElementSibling; 
            }

            htmlContent += `</div>`; 
        });

        htmlContent += `
                        </main>
                    </div>
                    <script>
                        // Trigger MathJax to process the LaTeX
                        MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
        
                        // Configure MathJax for in-line LaTeX rendering
                        MathJax.Hub.Config({
                            tex2jax: {
                                inlineMath: [['$', '$']],
                                displayMath: [['$$', '$$'], ['\\[', '\\]']]
                            },
                            "HTML-CSS": { availableFonts: ["TeX"] }
                        });
                    </script>
                </body>
                </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.html`; 
        link.click();

        
    });



    
    document.getElementById('export-pdf').addEventListener('click', function () {
        
        $('#pdfModal').modal('show'); 
    });

    
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'submit-pdf') {
            const filename = document.getElementById('pdf-filename').value || 'exported-document'; 
            const engine = document.getElementById('pdf-engine').value;
            const css = document.getElementById('pdf-css').value;
            const markdownContent = editor.getValue(); 

            
            const data = {
                markdown: markdownContent,
            };

            if (css) {
                data.css = css;
            }
            if (engine) {
                data.engine = engine;
            }

            
            fetch('https://md-to-pdf.fly.dev', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(data),
            })
                .then(response => {
                    if (response.ok) {
                        return response.blob(); 
                    }
                    throw new Error('PDF generation failed');
                })
                .then(blob => {
                    
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename + '.pdf';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url); 
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        }
    });

    
    MathJax.Hub.Config({
        tex2jax: {
            inlineMath: [['$', '$']], 
            displayMath: [['$$', '$$']], 
            ignoreClass: "editor-container"
        },
        "HTML-CSS": { availableFonts: ["TeX"] }
    });
});
