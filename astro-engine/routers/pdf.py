from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from io import BytesIO
from typing import Dict
from pydantic import BaseModel

router = APIRouter(prefix="/pdf", tags=["pdf"])


class ReportRequest(BaseModel):
    """Request model for PDF report generation"""
    title: str
    content: str  # Markdown or plain text content
    author: str = "JyotishAI"
    subject: str = "Vedic Astrology Report"


def create_pdf_report(report_data: ReportRequest) -> BytesIO:
    """
    Generate a styled PDF report using ReportLab

    Args:
        report_data: Report content and metadata

    Returns:
        BytesIO buffer with PDF data
    """
    buffer = BytesIO()

    # Create PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    # Define styles
    styles = getSampleStyleSheet()

    # Custom title style (deep navy + gold theme)
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#c9a227'),  # Gold
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )

    # Custom heading style
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#1e2d4a'),  # Navy
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )

    # Custom body style
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=11,
        textColor=colors.HexColor('#0f1729'),
        spaceAfter=12,
        alignment=TA_JUSTIFY,
        leading=16
    )

    # Build story (content)
    story = []

    # Title
    story.append(Paragraph(report_data.title, title_style))
    story.append(Spacer(1, 0.2 * inch))

    # Parse content (simple markdown parsing)
    lines = report_data.content.split('\n')

    for line in lines:
        line = line.strip()

        if not line:
            story.append(Spacer(1, 0.1 * inch))
            continue

        # Heading (## or #)
        if line.startswith('## '):
            heading_text = line[3:].strip()
            story.append(Paragraph(heading_text, heading_style))

        elif line.startswith('# '):
            heading_text = line[2:].strip()
            title_para = ParagraphStyle(
                'SectionTitle',
                parent=heading_style,
                fontSize=18
            )
            story.append(Paragraph(heading_text, title_para))

        # List item
        elif line.startswith('- ') or line.startswith('* '):
            list_text = line[2:].strip()
            bullet_style = ParagraphStyle(
                'Bullet',
                parent=body_style,
                leftIndent=20,
                bulletIndent=10
            )
            story.append(Paragraph(f"• {list_text}", bullet_style))

        # Bold text **text**
        elif '**' in line:
            line = line.replace('**', '<b>').replace('**', '</b>')
            story.append(Paragraph(line, body_style))

        # Italic text *text*
        elif '*' in line and not line.startswith('*'):
            line = line.replace('*', '<i>').replace('*', '</i>')
            story.append(Paragraph(line, body_style))

        # Regular paragraph
        else:
            story.append(Paragraph(line, body_style))

    # Build PDF
    doc.build(story)

    buffer.seek(0)
    return buffer


@router.post("/report")
async def generate_pdf_report(report_data: ReportRequest):
    """
    Generate a PDF report from text content

    Args:
        report_data: Report title, content, and metadata

    Returns:
        PDF file as StreamingResponse
    """
    try:
        pdf_buffer = create_pdf_report(report_data)

        headers = {
            'Content-Disposition': f'attachment; filename="{report_data.title.replace(" ", "_")}.pdf"'
        }

        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers=headers
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")


@router.post("/report/preview")
async def preview_pdf_report(report_data: ReportRequest):
    """
    Generate a PDF report for inline preview (not download)

    Args:
        report_data: Report title, content, and metadata

    Returns:
        PDF file as StreamingResponse for inline viewing
    """
    try:
        pdf_buffer = create_pdf_report(report_data)

        headers = {
            'Content-Disposition': f'inline; filename="{report_data.title.replace(" ", "_")}.pdf"'
        }

        return StreamingResponse(
            pdf_buffer,
            media_type='application/pdf',
            headers=headers
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF preview error: {str(e)}")
