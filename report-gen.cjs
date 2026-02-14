const PDFDocument = require('pdfkit');
const fs = require('fs');
const QuickChart = require('quickchart-js');

async function generateInvestorReport() {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream('Performance_Report_Jan_2026.pdf');
    doc.pipe(stream);

    // 1. Header & Branding
    doc.fontSize(25).fillColor('#D4AF37').text('MAPLE-SHIELD ALGORITHM', { align: 'center' });
    doc.fontSize(12).fillColor('black').text('Performance Audit - January 2026', { align: 'center' });
    doc.moveDown(2);

    // 2. Performance Summary
    doc.fontSize(16).text('Executive Summary', { underline: true });
    doc.fontSize(12).text(`Benchmark Asset: 2026 Canadian Gold Maple Leaf (.9999 Pure)`);
    doc.text(`Current Spot Gold: $4,988.56 (USD)`);
    doc.moveDown();

    // 3. Generate Equity Curve Chart via QuickChart
    const chart = new QuickChart();
    chart.setConfig({
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{ label: 'Algorithm Equity (USD)', data: [5000, 5250, 5100, 5800], borderColor: '#D4AF37', fill: false }]
        },
    });

    const chartUrl = await chart.getShortUrl();
    const response = await fetch(chartUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    doc.image(buffer, { width: 450, align: 'center' });
    doc.moveDown();

    // 4. Strategic Outlook
    doc.fontSize(14).text('Market Commentary:');
    doc.fontSize(10).text('The portfolio is currently hedged for the $5,000 resistance level. High-conviction buy signals are active as geopolitical demand offsets US Dollar strength. Automated News Shielding remains active for the Jan 30th NFP release.');

    doc.end();
    console.log("? PDF Report Generated: Performance_Report_Jan_2026.pdf");
}

generateInvestorReport();
