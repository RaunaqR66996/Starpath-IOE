// Export service for load optimization results
import { OptimizeResult, PlacedItem, TrailerSpec } from '@/lib/types/trailer';

export interface ExportData {
  result: OptimizeResult;
  trailer: TrailerSpec;
  timestamp: string;
  algorithm: string;
  constraints: Record<string, boolean>;
}

export class ExportService {
  /**
   * Generate CSV data for load optimization results
   */
  static generateCSV(data: ExportData): string {
    const { result, trailer, timestamp, algorithm } = data;
    
    const headers = [
      'Item ID',
      'X Position (ft)',
      'Y Position (ft)', 
      'Z Position (ft)',
      'Length (ft)',
      'Width (ft)',
      'Height (ft)',
      'Weight (lbs)',
      'Status',
      'Color'
    ];
    
    const rows = result.placed.map(item => [
      item.id,
      item.x.toFixed(2),
      item.y.toFixed(2),
      item.z.toFixed(2),
      item.l.toFixed(2),
      item.w.toFixed(2),
      item.h.toFixed(2),
      '1000', // Default weight
      'Placed',
      item.color || '#3B82F6'
    ]);
    
    // Add unplaced items
    result.unplaced.forEach(id => {
      rows.push([
        id,
        '0',
        '0',
        '0',
        '0',
        '0',
        '0',
        '0',
        'Unplaced',
        '#EF4444'
      ]);
    });
    
    // Add summary row
    rows.push([
      'SUMMARY',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      `Utilization: ${result.utilization_pct.toFixed(1)}%`,
      ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
  
  /**
   * Generate JSON data for API integration
   */
  static generateJSON(data: ExportData): string {
    const exportData = {
      metadata: {
        timestamp: data.timestamp,
        algorithm: data.algorithm,
        trailer: {
          type: data.trailer.name || '53ft Dry Van',
          dimensions: {
            length: data.trailer.length_ft,
            width: data.trailer.width_ft,
            height: data.trailer.height_ft
          }
        },
        constraints: data.constraints
      },
      optimization: {
        utilization: data.result.utilization_pct,
        centerOfGravity: data.result.cog,
        axleLoads: data.result.axle_loads,
        placedItems: data.result.placed.length,
        unplacedItems: data.result.unplaced.length
      },
      cargo: {
        placed: data.result.placed,
        unplaced: data.result.unplaced
      }
    };
    
    return JSON.stringify(exportData, null, 2);
  }
  
  /**
   * Generate HTML report for email sharing
   */
  static generateHTML(data: ExportData): string {
    const { result, trailer, timestamp, algorithm } = data;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Load Optimization Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric-card { background: white; border: 1px solid #dee2e6; padding: 15px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; font-size: 14px; }
        .cargo-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .cargo-table th, .cargo-table td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
        .cargo-table th { background: #f8f9fa; }
        .placed { background: #d4edda; }
        .unplaced { background: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Load Optimization Report</h1>
        <p><strong>Generated:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>Algorithm:</strong> ${algorithm}</p>
        <p><strong>Trailer:</strong> ${trailer.name || '53ft Dry Van'} (${trailer.length_ft}ft × ${trailer.width_ft}ft × ${trailer.height_ft}ft)</p>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-value">${result.utilization_pct.toFixed(1)}%</div>
            <div class="metric-label">Volume Utilization</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${result.placed.length}</div>
            <div class="metric-label">Items Placed</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${result.unplaced.length}</div>
            <div class="metric-label">Items Unplaced</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${result.cog[0].toFixed(1)}ft</div>
            <div class="metric-label">Center of Gravity X</div>
        </div>
    </div>
    
    <h2>Cargo Details</h2>
    <table class="cargo-table">
        <thead>
            <tr>
                <th>Item ID</th>
                <th>Position (X, Y, Z)</th>
                <th>Dimensions (L × W × H)</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${result.placed.map(item => `
                <tr class="placed">
                    <td>${item.id}</td>
                    <td>(${item.x.toFixed(1)}, ${item.y.toFixed(1)}, ${item.z.toFixed(1)})</td>
                    <td>${item.l} × ${item.w} × ${item.h}</td>
                    <td>Placed</td>
                </tr>
            `).join('')}
            ${result.unplaced.map(id => `
                <tr class="unplaced">
                    <td>${id}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>Unplaced</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <h2>Axle Load Analysis</h2>
    <table class="cargo-table">
        <thead>
            <tr>
                <th>Axle</th>
                <th>Load (lbs)</th>
                <th>Limit (lbs)</th>
                <th>Percentage</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${result.axle_loads.map((axle, index) => `
                <tr class="${axle.percentage > 100 ? 'unplaced' : axle.percentage > 80 ? 'warning' : 'placed'}">
                    <td>Axle ${index + 1}</td>
                    <td>${axle.load_lbs.toFixed(0)}</td>
                    <td>${axle.limit_lbs.toFixed(0)}</td>
                    <td>${axle.percentage.toFixed(1)}%</td>
                    <td>${axle.percentage > 100 ? 'Overloaded' : axle.percentage > 80 ? 'Warning' : 'OK'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
  }
  
  /**
   * Download file with given content and filename
   */
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Export as CSV
   */
  static exportCSV(data: ExportData) {
    const csv = this.generateCSV(data);
    this.downloadFile(csv, `load-optimization-${Date.now()}.csv`, 'text/csv');
  }
  
  /**
   * Export as JSON
   */
  static exportJSON(data: ExportData) {
    const json = this.generateJSON(data);
    this.downloadFile(json, `load-optimization-${Date.now()}.json`, 'application/json');
  }
  
  /**
   * Export as HTML
   */
  static exportHTML(data: ExportData) {
    const html = this.generateHTML(data);
    this.downloadFile(html, `load-optimization-${Date.now()}.html`, 'text/html');
  }
}




