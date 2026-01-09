import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UploadWorkout } from '../UploadWorkout';

describe('UploadWorkout', () => {
  it('renders upload area correctly', () => {
    render(<UploadWorkout />);

    expect(screen.getByText(/Subir Captura de Entrenamiento/i)).toBeInTheDocument();
  });

  it('shows file input for image selection', () => {
    render(<UploadWorkout />);

    const input = document.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
    // Check that accept attribute contains image types (order may vary)
    const acceptAttr = input?.getAttribute('accept') || '';
    expect(acceptAttr).toContain('image/jpeg');
    expect(acceptAttr).toContain('image/png');
  });

  it('renders upload instruction text', () => {
    render(<UploadWorkout />);

    // The component shows "Clic para subir captura"
    const uploadArea = screen.getByText(/clic para subir captura/i);
    expect(uploadArea).toBeInTheDocument();
  });

  it('shows supported formats text', () => {
    render(<UploadWorkout />);

    expect(screen.getByText(/soporta/i)).toBeInTheDocument();
  });

  it('renders without onUploadComplete prop', () => {
    // Should not throw when rendered without callback
    expect(() => render(<UploadWorkout />)).not.toThrow();
  });

  it('renders with onUploadComplete prop', () => {
    const onComplete = () => {};
    // Should not throw when rendered with callback
    expect(() => render(<UploadWorkout onUploadComplete={onComplete} />)).not.toThrow();
  });
});
