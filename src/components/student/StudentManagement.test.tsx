import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import StudentManagement from './StudentManagement';

describe('StudentManagement', () => {
  it('renders student management interface for school admin', () => {
    render(<StudentManagement role="school_admin" />);
    
    expect(screen.getByText('Student Management')).toBeInTheDocument();
    expect(screen.getByText('Add Student')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search students...')).toBeInTheDocument();
  });

  it('renders student management interface for instructor', () => {
    render(<StudentManagement role="instructor" />);
    
    expect(screen.getByText('Student Management')).toBeInTheDocument();
    expect(screen.queryByText('Add Student')).not.toBeInTheDocument();
  });

  it('displays student statistics correctly', () => {
    render(<StudentManagement role="school_admin" />);
    
    expect(screen.getByText('Total Students')).toBeInTheDocument();
    expect(screen.getByText('Active Students')).toBeInTheDocument();
    expect(screen.getByText('Avg. Progress')).toBeInTheDocument();
    expect(screen.getByText('Completions')).toBeInTheDocument();
  });

  it('filters students by search term', () => {
    render(<StudentManagement role="school_admin" />);
    
    const searchInput = screen.getByPlaceholderText('Search students...');
    fireEvent.change(searchInput, { target: { value: 'Sarah' } });
    
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Michael Chen')).not.toBeInTheDocument();
  });

  it('filters students by status', () => {
    render(<StudentManagement role="school_admin" />);
    
    const statusFilter = screen.getByDisplayValue('All Status');
    fireEvent.change(statusFilter, { target: { value: 'inactive' } });
    
    expect(screen.getByText('Emily Rodriguez')).toBeInTheDocument();
    expect(screen.queryByText('Sarah Johnson')).not.toBeInTheDocument();
  });

  it('shows action buttons for school admin', () => {
    render(<StudentManagement role="school_admin" />);
    
    expect(screen.getAllByText('Edit')).toHaveLength(3);
    expect(screen.getAllByText('Delete')).toHaveLength(3);
    expect(screen.getAllByText('View')).toHaveLength(3);
  });

  it('hides edit and delete buttons for instructor', () => {
    render(<StudentManagement role="instructor" />);
    
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    expect(screen.getAllByText('View')).toHaveLength(3);
  });

  it('handles delete student action', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<StudentManagement role="school_admin" />);
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this student?');
    confirmSpy.mockRestore();
  });

  it('displays progress bars correctly', () => {
    render(<StudentManagement role="school_admin" />);
    
    // Check that progress percentages are displayed
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows empty state when no students match filters', () => {
    render(<StudentManagement role="school_admin" />);
    
    const searchInput = screen.getByPlaceholderText('Search students...');
    fireEvent.change(searchInput, { target: { value: 'NonexistentStudent' } });
    
    expect(screen.getByText('No students found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument();
  });
});