import {
  FinancialStats,
  SchoolFinancialStatement,
  DisbursementRecord,
  CategoryValuation,
} from "@/types";
import { FinancialFilterState } from "@/components/financial/FinancialFilters";

export interface FinancialExportPayload {
  stats: FinancialStats;
  schools: SchoolFinancialStatement[];
  disbursements: DisbursementRecord[];
  categories?: CategoryValuation[];
  filters: FinancialFilterState;
  selectedSchoolName?: string;
  generatedDate?: string;
}

function escapeCsvField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function escapeXml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function triggerDownload(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * 1. Export Filtered Data as CSV
 */
export function exportToCsv(payload: FinancialExportPayload): void {
  const dateStr = payload.generatedDate || new Date().toISOString().slice(0, 10);
  const rows: string[] = [];

  // Metadata Header
  rows.push("BALANGODA URBAN COUNCIL - SCHOOL WASTE REWARDS FINANCIAL REPORT");
  rows.push(`Generated Date: ${dateStr}`);
  rows.push(
    `Filter Scope: School=${payload.selectedSchoolName || "All Schools"}, Status=${
      payload.filters.status
    }, StartDate=${payload.filters.start_date || "All"}, EndDate=${
      payload.filters.end_date || "All"
    }, Perspective=${payload.filters.report_type}`
  );
  rows.push("");

  // Section 1: Executive KPI Summary
  rows.push("--- 1. EXECUTIVE FINANCIAL SUMMARY ---");
  rows.push("Metric,Value");
  rows.push(`Total Points Earned (pts),${payload.stats.total_points_earned}`);
  rows.push(`Total Points Redeemed (pts),${payload.stats.total_points_redeemed}`);
  rows.push(`Total Cash Disbursed (LKR),${payload.stats.total_cash_disbursed_lkr}`);
  rows.push(`Completed Payouts Count,${payload.stats.completed_payouts_count}`);
  rows.push(`Total Waste Diverted (kg),${payload.stats.total_collected_kg}`);
  rows.push(`Estimated Avoided Landfill Costs (LKR),${payload.stats.total_collected_kg * 5.0}`);
  rows.push(`Participating Schools Matching Criteria,${payload.schools.length}`);
  rows.push("");

  // Payment Method Breakdown
  if (payload.stats.payment_methods_summary && payload.stats.payment_methods_summary.length > 0) {
    rows.push("--- PAYMENT METHOD BREAKDOWN ---");
    rows.push("Payment Modality,Voucher Count,Total Disbursed (LKR),Share (%)");
    payload.stats.payment_methods_summary.forEach((pm) => {
      rows.push(
        [
          escapeCsvField(pm.method_label),
          pm.count,
          pm.total_amount_lkr,
          pm.percentage.toFixed(1) + "%",
        ].join(",")
      );
    });
    rows.push("");
  }

  // Section 2: School Performance Statements
  rows.push("--- 2. SCHOOL-WISE FINANCIAL STATEMENTS ---");
  rows.push(
    [
      "School Code",
      "School Name",
      "Principal Name",
      "Contact Number",
      "Waste Diverted (kg)",
      "Points Earned",
      "Gross Value (LKR)",
      "Disbursed (LKR)",
      "Pending Balance (LKR)",
      "Settlement Status",
      "Last Collection Date",
    ].join(",")
  );

  payload.schools.forEach((s) => {
    rows.push(
      [
        escapeCsvField(s.school_code),
        escapeCsvField(s.school_name),
        escapeCsvField(s.principal_name),
        escapeCsvField(s.contact_number),
        s.total_collections_kg,
        s.total_points_earned,
        s.total_value_lkr,
        s.total_disbursed_lkr,
        s.pending_balance_lkr,
        escapeCsvField(s.settlement_status),
        escapeCsvField(s.last_collection_date),
      ].join(",")
    );
  });
  rows.push("");

  // Section 3: Payout Voucher Audit Ledger
  rows.push("--- 3. PAYOUT & VOUCHER AUDIT LEDGER ---");
  rows.push(
    [
      "Voucher Reference",
      "School Name",
      "School Code",
      "Points Redeemed",
      "Amount (LKR)",
      "Payment Method",
      "Disbursement Date",
      "Authorized By",
      "Status",
      "Allocation Notes",
    ].join(",")
  );

  payload.disbursements.forEach((d) => {
    rows.push(
      [
        escapeCsvField(d.voucher_reference),
        escapeCsvField(d.school_name),
        escapeCsvField(d.school_code),
        d.points_redeemed,
        d.amount_lkr,
        escapeCsvField(d.payment_method),
        escapeCsvField(d.disbursement_date),
        escapeCsvField(d.authorized_by),
        escapeCsvField(d.status),
        escapeCsvField(d.notes),
      ].join(",")
    );
  });

  const csvContent = rows.join("\n");
  triggerDownload(
    csvContent,
    `USPB_Financial_Report_${dateStr}.csv`,
    "text/csv;charset=utf-8;"
  );
}

/**
 * 2. Export Filtered Data as Excel (XML Spreadsheet 2003)
 */
export function exportToExcel(payload: FinancialExportPayload): void {
  const dateStr = payload.generatedDate || new Date().toISOString().slice(0, 10);

  const xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Balangoda Urban Council Financial Statement</Title>
  <Subject>School Waste Rewards Programme</Subject>
  <Author>Balangoda Urban Council</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1C1917"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Segoe UI" ss:Size="14" ss:Bold="1" ss:Color="#800000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#800000" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#680000"/>
   </Borders>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="#,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Number">
   <NumberFormat ss:Format="#,##0"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Bold">
   <Font ss:Bold="1"/>
  </Style>
 </Styles>

 <!-- Worksheet 1: Executive KPI Overview -->
 <Worksheet ss:Name="Executive Summary">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="250"/>
   <Column ss:Width="160"/>
   <Row ss:Height="24">
    <Cell ss:StyleID="Title"><Data ss:Type="String">BALANGODA URBAN COUNCIL - SCHOOL WASTE REWARDS</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Financial Overview and Settlement Statement (Fiscal Year 2026)</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Export Date: ${escapeXml(dateStr)}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Active Filter: School=${escapeXml(
      payload.selectedSchoolName || "All Schools"
    )}, Status=${escapeXml(payload.filters.status)}</Data></Cell>
   </Row>
   <Row></Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Financial Performance KPI</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Value</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">Total Points Earned (pts)</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${
       payload.stats.total_points_earned
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">Total Points Redeemed (pts)</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${
      payload.stats.total_points_redeemed
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">Total Cash Disbursed (LKR)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${
      payload.stats.total_disbursed_lkr
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">Completed Payouts Count</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${
       payload.stats.completed_payouts_count
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">Total Recyclables Diverted (kg)</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${
      payload.stats.total_collected_kg
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">Estimated Avoided Landfill Costs (LKR)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${
      payload.stats.total_collected_kg * 5.0
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="Bold"><Data ss:Type="String">Participating Schools Matching Criteria</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${
      payload.schools.length
    }</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- Worksheet 2: School Financial Statements -->
 <Worksheet ss:Name="School Statements">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="80"/>
   <Column ss:Width="240"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="100"/>
   <Column ss:Width="90"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Code</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">School Name</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Principal</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Contact</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Waste (kg)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Points</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Value (LKR)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Disbursed (LKR)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Pending (LKR)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Last Date</Data></Cell>
   </Row>
   ${payload.schools
     .map(
       (s) => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(s.school_code)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.school_name)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.principal_name || "")}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.contact_number || "")}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${s.total_collections_kg}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${s.total_points_earned}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${s.total_value_lkr}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${s.total_disbursed_lkr}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${s.pending_balance_lkr}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.settlement_status)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.last_collection_date || "")}</Data></Cell>
   </Row>`
     )
     .join("")}
  </Table>
 </Worksheet>

 <!-- Worksheet 3: Payout Voucher Ledger -->
 <Worksheet ss:Name="Payout Vouchers">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="110"/>
   <Column ss:Width="230"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Column ss:Width="180"/>
   <Column ss:Width="220"/>
   <Row ss:Height="22">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Voucher Ref</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Beneficiary School</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Points Redeemed</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Amount (LKR)</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Payment Method</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Date Issued</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Authorized By</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Notes</Data></Cell>
   </Row>
   ${payload.disbursements
     .map(
       (d) => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(d.voucher_reference)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(d.school_name)}</Data></Cell>
    <Cell ss:StyleID="Number"><Data ss:Type="Number">${d.points_redeemed}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${d.amount_lkr}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(d.payment_method)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(d.disbursement_date)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(d.authorized_by)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(d.notes || "")}</Data></Cell>
   </Row>`
     )
     .join("")}
  </Table>
 </Worksheet>
</Workbook>`;

  triggerDownload(
    xmlContent,
    `USPB_Financial_Report_${dateStr}.xls`,
    "application/vnd.ms-excel"
  );
}

/**
 * 3. Export Filtered Data as Official Printable PDF
 */
export function exportToPdf(payload: FinancialExportPayload): void {
  const dateStr = payload.generatedDate || new Date().toISOString().slice(0, 10);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the printable PDF document.");
    return;
  }

  const formatLKRStr = (val: number) =>
    `LKR ${val.toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>USPB - Financial Statement (${dateStr})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #1c1917;
      margin: 0;
      padding: 10px;
      font-size: 11px;
      line-height: 1.4;
    }
    .header {
      border-bottom: 2px solid #800000;
      padding-bottom: 10px;
      margin-bottom: 15px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .council-title {
      font-size: 16px;
      font-weight: bold;
      color: #800000;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sub-title {
      font-size: 12px;
      font-weight: 600;
      color: #44403c;
      margin-top: 2px;
    }
    .report-meta {
      font-size: 10px;
      color: #78716c;
      text-align: right;
    }
    .meta-badge {
      display: inline-block;
      background: #f5f5f4;
      border: 1px solid #d6d3d1;
      border-radius: 4px;
      padding: 3px 8px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 4px;
    }
    .section-title {
      font-size: 12px;
      font-weight: bold;
      color: #800000;
      border-bottom: 1px solid #e7e5e4;
      padding-bottom: 4px;
      margin: 15px 0 8px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 15px;
    }
    .kpi-box {
      border: 1px solid #e7e5e4;
      background: #fafaf9;
      border-radius: 6px;
      padding: 8px;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: #78716c;
    }
    .kpi-val {
      font-size: 13px;
      font-weight: bold;
      color: #1c1917;
      margin-top: 3px;
      font-family: monospace;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10px;
    }
    th {
      background: #800000;
      color: #ffffff;
      padding: 6px 8px;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      font-weight: bold;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #f5f5f4;
    }
    tr:nth-child(even) td {
      background: #fafaf9;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: monospace; }
    .status-settled { color: #047857; font-weight: bold; }
    .status-partial { color: #b45309; font-weight: bold; }
    .status-pending { color: #e11d48; font-weight: bold; }
    .signoff-section {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sign-box {
      width: 30%;
      border-top: 1px dashed #78716c;
      padding-top: 5px;
      text-align: center;
      font-size: 10px;
      color: #44403c;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="council-title">Balangoda Urban Council</div>
      <div class="sub-title">School Recyclable Waste Rewards Financial & Payout Statement</div>
      <div style="font-size: 10px; color: #57534e; margin-top: 2px;">
        Municipal Services Division • Sabaragamuwa Province
      </div>
    </div>
    <div class="report-meta">
      <div><strong>Date:</strong> ${escapeXml(dateStr)}</div>
      <div><strong>Fiscal Year:</strong> 2026</div>
      <div class="meta-badge">Official Audit Statement</div>
    </div>
  </div>

  <div style="margin-bottom: 12px; font-size: 10px; background: #f5f5f4; padding: 6px 10px; border-radius: 4px;">
    <strong>Applied Filter Scope:</strong> School: <em>${escapeXml(
      payload.selectedSchoolName || "All Balangoda Schools"
    )}</em> | Payout Status: <em>${escapeXml(
    payload.filters.status.toUpperCase()
  )}</em> | Perspective: <em>${escapeXml(
    payload.filters.report_type
  )}</em> | Matching: <em>${payload.schools.length} School(s)</em>
  </div>

  <!-- KPI Grid -->
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="kpi-label">Total Points Earned</div>
      <div class="kpi-val">${payload.stats.total_points_earned.toLocaleString("en-LK")} pts</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Total Points Redeemed</div>
      <div class="kpi-val" style="color: #b45309;">${payload.stats.total_points_redeemed.toLocaleString("en-LK")} pts</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Total Cash Disbursed</div>
      <div class="kpi-val" style="color: #047857;">${formatLKRStr(payload.stats.total_cash_disbursed_lkr)}</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-label">Completed Payouts</div>
      <div class="kpi-val">${payload.stats.completed_payouts_count} Vouchers</div>
    </div>
  </div>

  ${
    payload.stats.payment_methods_summary && payload.stats.payment_methods_summary.length > 0
      ? `
  <div class="section-title">Payment Method Distribution</div>
  <table>
    <thead>
      <tr>
        <th>Payment Modality</th>
        <th class="text-center">Vouchers Count</th>
        <th class="text-right">Total Disbursed (LKR)</th>
        <th class="text-right">Percentage Share</th>
      </tr>
    </thead>
    <tbody>
      ${payload.stats.payment_methods_summary
        .map(
          (pm) => `
      <tr>
        <td><strong>${escapeXml(pm.method_label)}</strong></td>
        <td class="text-center">${pm.count}</td>
        <td class="text-right font-mono" style="color: #047857; font-weight: bold;">${formatLKRStr(
          pm.total_amount_lkr
        )}</td>
        <td class="text-right font-mono">${pm.percentage.toFixed(1)}%</td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>`
      : ""
  }

  <!-- Section 1: School Statements -->
  <div class="section-title">1. School-wise Financial Performance Statements</div>
  <table>
    <thead>
      <tr>
        <th>Code</th>
        <th>School Institution</th>
        <th class="text-right">Waste (kg)</th>
        <th class="text-right">Points</th>
        <th class="text-right">Gross Value</th>
        <th class="text-right">Disbursed</th>
        <th class="text-right">Pending</th>
        <th class="text-center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${payload.schools
        .map(
          (s) => `
      <tr>
        <td class="font-mono"><strong>${escapeXml(s.school_code)}</strong></td>
        <td><strong>${escapeXml(s.school_name)}</strong></td>
        <td class="text-right font-mono">${s.total_collections_kg.toLocaleString(
          "en-LK"
        )} kg</td>
        <td class="text-right font-mono">${s.total_points_earned.toLocaleString(
          "en-LK"
        )}</td>
        <td class="text-right font-mono">${formatLKRStr(s.total_value_lkr)}</td>
        <td class="text-right font-mono" style="color: #047857;">${formatLKRStr(
          s.total_disbursed_lkr
        )}</td>
        <td class="text-right font-mono" style="color: #b45309;">${formatLKRStr(
          s.pending_balance_lkr
        )}</td>
        <td class="text-center">
          <span class="status-${s.settlement_status}">${s.settlement_status.toUpperCase()}</span>
        </td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <!-- Section 2: Payout Vouchers -->
  <div class="section-title">2. Payout Summary & Voucher Audit Ledger</div>
  <table>
    <thead>
      <tr>
        <th>Voucher Ref</th>
        <th>Beneficiary School</th>
        <th class="text-right">Points Redeemed</th>
        <th class="text-right">Disbursed Amount</th>
        <th class="text-center">Payment Method</th>
        <th class="text-center">Date Issued</th>
        <th>Authorized By</th>
      </tr>
    </thead>
    <tbody>
      ${
        payload.disbursements.length === 0
          ? `<tr><td colspan="7" class="text-center" style="padding: 15px; color: #78716c;">No vouchers issued for current filter criteria.</td></tr>`
          : payload.disbursements
              .map(
                (d) => `
      <tr>
        <td class="font-mono"><strong>${escapeXml(d.voucher_reference)}</strong></td>
        <td>${escapeXml(d.school_name)}</td>
        <td class="text-right font-mono">${d.points_redeemed.toLocaleString(
          "en-LK"
        )}</td>
        <td class="text-right font-mono" style="font-weight: bold; color: #047857;">${formatLKRStr(
          d.amount_lkr
        )}</td>
        <td class="text-center">${escapeXml(d.payment_method.toUpperCase())}</td>
        <td class="text-center font-mono">${escapeXml(d.disbursement_date)}</td>
        <td class="font-mono">${escapeXml(d.authorized_by)}</td>
      </tr>`
              )
              .join("")
      }
    </tbody>
  </table>

  <!-- Sign-off Block -->
  <div class="signoff-section">
    <div class="sign-box">
      <strong>Prepared By</strong><br/>
      Environmental & Rewards Officer<br/>
      Balangoda Urban Council
    </div>
    <div class="sign-box">
      <strong>Checked & Verified By</strong><br/>
      Chief Financial Accountant<br/>
      Balangoda Urban Council
    </div>
    <div class="sign-box">
      <strong>Approved By</strong><br/>
      Municipal Commissioner / Chairman<br/>
      Balangoda Urban Council
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
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
