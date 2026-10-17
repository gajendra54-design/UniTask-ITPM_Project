import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateSkillsAnalysisPDF = (dashboardData) => {
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
  doc.text("Skills Analysis Report", 20, yPosition);

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

  // ===== KEY METRICS SECTION =====
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Key Metrics", 20, yPosition);

  yPosition += 8;

  // Metric boxes
  const metrics = [
    { label: "Overall Progress", value: `${dashboardData?.overallProgress || 0}%`, color: [79, 70, 229] },
    { label: "Consistency Level", value: dashboardData?.consistencyLevel || "Low", color: [59, 130, 246] },
    { label: "On-Time Rate", value: `${dashboardData?.onTimeCompletion?.percentage || 0}%`, color: [34, 197, 94] },
    { label: "Tasks Completed", value: dashboardData?.tasksCompleted || 0, color: [168, 85, 247] },
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

  // ===== CHECK PAGE BREAK =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  // ===== BEHAVIOR ANALYSIS SECTION =====
  doc.setFontSize(14);
  doc.setTextColor(51, 51, 51);
  doc.text("Behavior Analysis", 20, yPosition);

  yPosition += 8;

  const behaviorData = [
    [
      "Procrastination Level",
      dashboardData?.procrastinationBehavior || "N/A",
    ],
    [
      "Average Days Late",
      `${dashboardData?.avgDaysLate || 0} days`,
    ],
    [
      "On-Time Submissions",
      `${dashboardData?.onTimeCompletion?.count || 0} (${dashboardData?.onTimeCompletion?.percentage || 0}%)`,
    ],
    [
      "Late Submissions",
      `${dashboardData?.lateSubmissions?.count || 0} (${dashboardData?.lateSubmissions?.percentage || 0}%)`,
    ],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: behaviorData,
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 90, halign: "right" },
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { left: 20, right: 20 },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // ===== CHECK PAGE BREAK =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  // ===== SKILLS IMPROVEMENT SECTION =====
  if (dashboardData?.skillsImprovement && Object.keys(dashboardData.skillsImprovement).length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("Skills Improvement", 20, yPosition);

    yPosition += 8;

    const skillsImprovementData = Object.entries(dashboardData.skillsImprovement).map(
      ([skill, improvement]) => [
        skill,
        `${improvement?.currentLevel || "N/A"}`,
        `${improvement?.targetLevel || "N/A"}`,
        `${improvement?.improvement || 0}%`,
      ]
    );

    autoTable(doc, {
      startY: yPosition,
      head: [["Skill", "Current", "Target", "Improvement"]],
      body: skillsImprovementData,
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 50, halign: "center" },
      },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { left: 20, right: 20 },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ===== CHECK PAGE BREAK =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  // ===== AI SUGGESTIONS SECTION =====
  if (dashboardData?.aiSuggestions && dashboardData.aiSuggestions.length > 0) {
    doc.setFontSize(14);
    doc.setTextColor(51, 51, 51);
    doc.text("AI Recommendations", 20, yPosition);

    yPosition += 8;

    dashboardData.aiSuggestions.slice(0, 5).forEach((suggestion, idx) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Suggestion number
      doc.setFontSize(11);
      doc.setTextColor(51, 51, 51);
      doc.setFont(undefined, "bold");
      doc.text(`${idx + 1}. ${suggestion.title || "Suggestion"}`, 25, yPosition);

      yPosition += 6;

      // Suggestion description
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.setFont(undefined, "normal");
      const wrappedText = doc.splitTextToSize(
        suggestion.description || "N/A",
        pageWidth - 50
      );
      doc.text(wrappedText, 25, yPosition);

      yPosition += wrappedText.length * 4 + 6;
    });
  }

  // ===== FOOTER =====
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  return doc;
};

export const downloadSkillsAnalysisPDF = (dashboardData, progressData, skillsData) => {
  const doc = generateSkillsAnalysisPDF(dashboardData, progressData, skillsData);

  const filename = `Skills-Analysis-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
};
