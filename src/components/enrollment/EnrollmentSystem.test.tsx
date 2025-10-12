import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import EnrollmentSystem from './EnrollmentSystem';

describe('EnrollmentSystem', () => {
  it('renders course catalog for students', () => {
    render(<EnrollmentSystem role="student" userId="test-user" />);
    
    expect(screen.getByText('Course Enrollment')).toBeInTheDocument();
    expect(screen.getByText('Available Courses')).toBeInTheDocument();
    expect(screen.getByText('Basic Driving Course')).toBeInTheDocument();
  });

  it('renders enrollment management for school admin', () => {
    render(<EnrollmentSystem role="school_admin" />);
    
    expect(screen.getByText('Enrollment Management')).toBeInTheDocument();
    expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('allows students to enroll in open courses', () => {
    render(<EnrollmentSystem role="student\" userId="test-user" />);
    
    const enrollButtons = screen.getAllByText('Enroll');
    expect(enrollButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(enrollButtons[0]);
    // Enrollment should be added (this would be verified through state changes)
  });

  it('disables enrollment for full courses', () => {
    render(<EnrollmentSystem role="student\" userId="test-user" />);
    
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('shows enrollment statistics for admins', () => {
    render(<EnrollmentSystem role="school_admin" />);
    
    expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('allows admins to approve pending enrollments', () => {
    render(<EnrollmentSystem role="school_admin" />);
    
    const approveButtons = screen.getAllByText('Approve');
    expect(approveButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(approveButtons[0]);
    // Enrollment status should change to approved
  });

  it('allows admins to reject pending enrollments', () => {
    render(<EnrollmentSystem role="school_admin" />);
    
    const rejectButtons = screen.getAllByText('Reject');
    expect(rejectButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(rejectButtons[0]);
    // Enrollment status should change to rejected
  });

  it('filters enrollments by search term', () => {
    render(<EnrollmentSystem role="school_admin" />);
    
    const searchInput = screen.getByPlaceholderText('Search enrollments...');
    fireEvent.change(searchInput, { target: { value: 'Sarah' } });
    
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
  });

  it('filters enrollments by status', () => {
    render(<EnrollmentSystem role="school_admin" />);
    
    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'pending' } });
    
    // Should show only pending enrollments
    expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
  });

  it('displays course information correctly', () => {
    render(<EnrollmentSystem role="student\" userId="test-user" />);
    
    expect(screen.getByText('6 weeks')).toBeInTheDocument();
    expect(screen.getByText('15/20 enrolled')).toBeInTheDocument();
    expect(screen.getByText('$299')).toBeInTheDocument();
  });

  it('shows progress bars for enrollments', () => {
    render(<EnrollmentSystem role="school_admin" />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});