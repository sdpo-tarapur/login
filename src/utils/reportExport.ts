// Report Export Utility for Excel (.csv/.xls) and Printable PDF reports

export function exportToExcel(filename: string, headers: string[], rows: (string | number | boolean)[][]) {
  // Format CSV with UTF-8 BOM so Excel opens special characters correctly
  const processCell = (cell: string | number | boolean | null | undefined): string => {
    if (cell === null || cell === undefined) return '""';
    const cellStr = String(cell).replace(/"/g, '""');
    return `"${cellStr}"`;
  };

  const csvRows: string[] = [];
  csvRows.push(headers.map(processCell).join(','));

  rows.forEach((row) => {
    csvRows.push(row.map(processCell).join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | boolean)[][],
  summaryBadges?: { label: string; value: string | number }[]
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups for printing/exporting PDF reports.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const badgesHtml = summaryBadges
    ? summaryBadges
        .map(
          (b) => `
      <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 4px; display: inline-block; margin-right: 8px; margin-bottom: 8px;">
        <span style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase;">${b.label}:</span>
        <strong style="font-size: 12px; color: #0f172a; margin-left: 4px;">${b.value}</strong>
      </div>
    `
        )
        .join('')
    : '';

  const tableHeadersHtml = headers
    .map(
      (h) => `<th style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #334155;">${h}</th>`
    )
    .join('');

  const tableRowsHtml = rows
    .map(
      (row, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        ${row
          .map(
            (cell) =>
              `<td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; color: #1e293b;">${
                cell ?? ''
              }</td>`
          )
          .join('')}
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} — SDPO Tarapur Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; color: #0f172a; line-height: 1.4; }
          .header-letterhead { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .header-letterhead h1 { margin: 0; font-size: 18px; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }
          .header-letterhead h2 { margin: 4px 0 0 0; font-size: 14px; font-weight: 600; color: #334155; }
          .header-letterhead p { margin: 2px 0 0 0; font-size: 11px; color: #64748b; }
          .meta-bar { display: flex; justify-content: space-between; font-size: 11px; color: #475569; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer-sign { margin-top: 40px; display: flex; justify-content: space-between; }
          .sign-box { text-align: center; width: 200px; border-top: 1px solid #94a3b8; pt-2; font-size: 11px; font-weight: bold; }
          @media print {
            body { margin: 10mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: right; margin-bottom: 10px;">
          <button onclick="window.print()" style="background: #0f172a; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 12px;">
            🖨️ Print / Save as PDF
          </button>
        </div>

        <div class="header-letterhead">
          <p>OFFICE OF THE SUBDIVISIONAL POLICE OFFICER (SDPO) • TARAPUR</p>
          <h1>BIHAR POLICE — MUNGER DISTRICT</h1>
          <h2>${title}</h2>
          <p>${subtitle}</p>
        </div>

        <div class="meta-bar">
          <div><strong>Generated On:</strong> ${currentDate}</div>
          <div><strong>Subdivision:</strong> Tarapur (Munger)</div>
        </div>

        ${badgesHtml ? `<div style="margin-bottom: 12px;">${badgesHtml}</div>` : ''}

        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer-sign">
          <div class="sign-box" style="margin-top: 50px;">
            Reader / CCTNS In-Charge<br/>SDPO Office Tarapur
          </div>
          <div class="sign-box" style="margin-top: 50px;">
            Subdivisional Police Officer (SDPO)<br/>Tarapur, Munger
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
