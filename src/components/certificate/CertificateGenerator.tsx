import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Download, RefreshCw, Check } from 'lucide-react';

interface CertificateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  certificateId: string;
  schoolName: string;
  instructorName: string;
}

interface CertificateGeneratorProps {
  data: CertificateData;
  onGenerate?: (certificateUrl: string) => void;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  data,
  onGenerate
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      return await QRCode.toDataURL(text, {
        width: 128,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
      throw err;
    }
  };

  const generateCertificate = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Set background color
      doc.setFillColor(252, 252, 252);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

      // Add border
      doc.setDrawColor(0, 82, 186); // Primary blue
      doc.setLineWidth(2);
      doc.rect(10, 10, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 20);

      // Add decorative corners
      const cornerSize = 20;
      doc.setLineWidth(1);
      // Top left
      doc.line(10, 20, 30, 20);
      doc.line(20, 10, 20, 30);
      // Top right
      doc.line(doc.internal.pageSize.getWidth() - 30, 20, doc.internal.pageSize.getWidth() - 10, 20);
      doc.line(doc.internal.pageSize.getWidth() - 20, 10, doc.internal.pageSize.getWidth() - 20, 30);
      // Bottom left
      doc.line(10, doc.internal.pageSize.getHeight() - 20, 30, doc.internal.pageSize.getHeight() - 20);
      doc.line(20, doc.internal.pageSize.getHeight() - 30, 20, doc.internal.pageSize.getHeight() - 10);
      // Bottom right
      doc.line(doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 20, doc.internal.pageSize.getWidth() - 10, doc.internal.pageSize.getHeight() - 20);
      doc.line(doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 30, doc.internal.pageSize.getWidth() - 20, doc.internal.pageSize.getHeight() - 10);

      // Add certificate title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.setTextColor(0, 82, 186); // Primary blue
      doc.text('Certificate of Completion', doc.internal.pageSize.getWidth() / 2, 50, { align: 'center' });

      // Add school name
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text(data.schoolName, doc.internal.pageSize.getWidth() / 2, 70, { align: 'center' });

      // Add certificate text
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text('This is to certify that', doc.internal.pageSize.getWidth() / 2, 90, { align: 'center' });

      // Add student name
      doc.setFontSize(32);
      doc.setFont('helvetica', 'bold');
      doc.text(data.studentName, doc.internal.pageSize.getWidth() / 2, 105, { align: 'center' });

      // Add completion text
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `has successfully completed the course`,
        doc.internal.pageSize.getWidth() / 2,
        120,
        { align: 'center' }
      );

      // Add course name
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(data.courseName, doc.internal.pageSize.getWidth() / 2, 135, { align: 'center' });

      // Add completion date
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Completed on ${data.completionDate}`,
        doc.internal.pageSize.getWidth() / 2,
        150,
        { align: 'center' }
      );

      // Generate and add QR code
      const verificationUrl = `https://udrive.com/verify/${data.certificateId}`;
      const qrCodeDataUrl = await generateQRCode(verificationUrl);
      doc.addImage(
        qrCodeDataUrl,
        'PNG',
        20,
        doc.internal.pageSize.getHeight() - 50,
        30,
        30
      );

      // Add verification text
      doc.setFontSize(10);
      doc.text(
        'Scan to verify certificate authenticity',
        35,
        doc.internal.pageSize.getHeight() - 35,
        { align: 'center' }
      );

      // Add certificate ID
      doc.setFontSize(12);
      doc.text(
        `Certificate ID: ${data.certificateId}`,
        doc.internal.pageSize.getWidth() - 40,
        doc.internal.pageSize.getHeight() - 40,
        { align: 'right' }
      );

      // Add instructor signature
      doc.setFont('helvetica', 'bold');
      doc.text(
        data.instructorName,
        doc.internal.pageSize.getWidth() - 60,
        doc.internal.pageSize.getHeight() - 60,
        { align: 'center' }
      );
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(
        'Instructor',
        doc.internal.pageSize.getWidth() - 60,
        doc.internal.pageSize.getHeight() - 55,
        { align: 'center' }
      );

      // Generate the PDF
      const pdfDataUri = doc.output('dataurlstring');
      setPreviewUrl(pdfDataUri);
      onGenerate?.(pdfDataUri);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadCertificate = () => {
    const filename = `${data.studentName.replace(/\s+/g, '_')}_${data.courseName.replace(/\s+/g, '_')}_Certificate.pdf`;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Certificate Preview</h2>
        <div className="flex gap-3">
          <button
            onClick={generateCertificate}
            disabled={isGenerating}
            className={`flex items-center px-4 py-2 rounded-md text-white ${
              isGenerating ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Generate
              </>
            )}
          </button>
          {previewUrl && (
            <button
              onClick={downloadCertificate}
              className="flex items-center px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-md"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </button>
          )}
        </div>
      </div>

      {previewUrl ? (
        <div className="relative w-full aspect-[1.414] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={previewUrl}
            className="absolute inset-0 w-full h-full"
            title="Certificate Preview"
          />
        </div>
      ) : (
        <div className="w-full aspect-[1.414] bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">
            Click "Generate" to preview the certificate
          </p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <p><strong>Student:</strong> {data.studentName}</p>
          <p><strong>Course:</strong> {data.courseName}</p>
          <p><strong>Completion Date:</strong> {data.completionDate}</p>
        </div>
        <div>
          <p><strong>School:</strong> {data.schoolName}</p>
          <p><strong>Instructor:</strong> {data.instructorName}</p>
          <p><strong>Certificate ID:</strong> {data.certificateId}</p>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;