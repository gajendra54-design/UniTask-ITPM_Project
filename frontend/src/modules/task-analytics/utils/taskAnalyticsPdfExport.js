import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateTaskAnalyticsPDF = (stats) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ===== HEADER =====
  doc.setFontSize(24);
  doc.setTextColor(51, 51, 51);
  doc.text("Task Analytics Report", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${generatedDate}`, 20, yPosition);

  yPosition += 15;

  // ===== KEY STATS SECTION =====
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Key Productivity Metrics", 20, yPosition);

  yPosition += 8;

  const efficiency = stats.totalTasks > 0 
    ? Math.round((stats.completionRate.completed / stats.totalTasks) * 100) 
    : 0;

  const metrics = [
    { label: "Total Tasks", value: stats.totalTasks, color: [99, 102, 241] },
    { label: "Completed", value: stats.completionRate.completed, color: [16, 185, 129] },
    { label: "Efficiency Rate", value: `${efficiency}%`, color: [59, 130, 246] },
    { label: "Pending Tasks", value: stats.completionRate.pending, color: [244, 63, 94] },
  ];

  const boxWidth = (pageWidth - 40) / 2 - 2;
  metrics.forEach((metric, idx) => {
    const row = Math.floor(idx / 2);
    const col = idx % 2;
    const xPos = 20 + col * (boxWidth + 3);
    const yPos = yPosition + row * 25;

    // Background
    doc.setFillColor(...metric.color);
    doc.rect(xPos, yPos, boxWidth, 20, "F");

    // Value
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, "bold");
    doc.text(String(metric.value), xPos + boxWidth / 2, yPos + 7, { align: "center" });

    // Label
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(metric.label, xPos + boxWidth / 2, yPos + 15, { align: "center" });
  });

  yPosition += 55;

  // ===== BREAKDOWN BY TYPE =====
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Task Breakdown by Category", 20, yPosition);

  yPosition += 8;

  const typeData = Object.entries(stats.typeBreakdown)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => [
      type.charAt(0).toUpperCase() + type.slice(1),
      count,
      `${Math.round((count / stats.totalTasks) * 100)}%`
    ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Category", "Task Count", "Percentage"]],
    body: typeData,
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    margin: { left: 20, right: 20 },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // ===== CHECK PAGE BREAK =====
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // ===== SUBJECT DISTRIBUTION =====
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Subject Distribution", 20, yPosition);

  yPosition += 8;

  const courseData = Object.entries(stats.courseBreakdown).map(([course, count]) => [
    course,
    count
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["Subject", "Assignment Count"]],
    body: courseData.length > 0 ? courseData : [["No subject data available", "0"]],
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    margin: { left: 20, right: 20 },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // ===== RECENT ACTIVITY =====
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Recent Activity Summary", 20, yPosition);

  yPosition += 8;

  const recentData = [
    ["Last 7 Days", stats.thisWeek.total, stats.thisWeek.completed, `${stats.thisWeek.total > 0 ? Math.round((stats.thisWeek.completed/stats.thisWeek.total)*100) : 0}%`],
    ["Last 30 Days", stats.thisMonth.total, stats.thisMonth.completed, `${stats.thisMonth.total > 0 ? Math.round((stats.thisMonth.completed/stats.thisMonth.total)*100) : 0}%`],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Period", "Total Items", "Completed", "Success Rate"]],
    body: recentData,
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    margin: { left: 20, right: 20 },
  });

  // ===== FOOTER =====
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | UniTask Productivity Insights`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
};

export const downloadTaskAnalyticsPDF = (stats) => {
  const doc = generateTaskAnalyticsPDF(stats);
  const filename = `Task-Analytics-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
