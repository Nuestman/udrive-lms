import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import CertificateGenerator from './CertificateGenerator';

describe('CertificateGenerator', () => {
  const mockData = {
    studentName: "John Doe",
    courseName: "Basic Driving Course",
    completionDate: "March 15, 2024",
    certificateId: "CERT-2024-0001",
    schoolName: "Test Driving School",
    instructorName: "Jane Smith"
  };

  it('renders with initial state', () => {
    render(<CertificateGenerator data={mockData} />);
    
    expect(screen.getByText('Certificate Preview')).toBeInTheDocument();
    expect(screen.getByText('Click "Generate" to preview the certificate')).toBeInTheDocument();
    expect(screen.getByText(mockData.studentName)).toBeInTheDocument();
    expect(screen.getByText(mockData.courseName)).toBeInTheDocument();
  });

  it('generates certificate when button is clicked', async () => {
    const onGenerate = vi.fn();
    render(<CertificateGenerator data={mockData} onGenerate={onGenerate} />);
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      expect(onGenerate).toHaveBeenCalled();
    });
  });

  it('shows download button after generation', async () => {
    render(<CertificateGenerator data={mockData} />);
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });
  });

  it('displays correct certificate metadata', () => {
    render(<CertificateGenerator data={mockData} />);
    
    expect(screen.getByText(`Student:`)).toBeInTheDocument();
    expect(screen.getByText(`Course:`)).toBeInTheDocument();
    expect(screen.getByText(`Completion Date:`)).toBeInTheDocument();
    expect(screen.getByText(`School:`)).toBeInTheDocument();
    expect(screen.getByText(`Instructor:`)).toBeInTheDocument();
    expect(screen.getByText(`Certificate ID:`)).toBeInTheDocument();
  });

  it('handles generation errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockError = new Error('Generation failed');
    
    // Mock QRCode.toDataURL to throw an error
    vi.mock('qrcode', () => ({
      default: {
        toDataURL: () => Promise.reject(mockError)
      }
    }));

    render(<CertificateGenerator data={mockData} />);
    
    const generateButton = screen.getByText('Generate');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error generating QR code:', mockError);
      expect(screen.getByText('Generate')).toBeEnabled();
    });

    consoleSpy.mockRestore();
  });
});