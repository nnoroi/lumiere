function generatePDF() {
    const element = document.getElementById('hidden-pdf-template');
    element.style.display = 'block';
    
    const options = {
        margin:       15,
        filename:     'Lumiere-Cinema-Ticket.pdf',
        image:        { type: 'jpeg', quality: 1.0 },
        html2canvas:  { scale: 3, logging: false },
        jsPDF:        { unit: 'mm', format: 'a5', orientation: 'portrait' }
    };
    
    html2pdf().set(options).from(element).save().then(() => {
        element.style.display = 'none';
    });
}