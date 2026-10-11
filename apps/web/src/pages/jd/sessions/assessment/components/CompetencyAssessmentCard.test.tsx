import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CompetencyAssessment } from '@interview-forge/shared';
import { CompetencyAssessmentCard } from './CompetencyAssessmentCard';

describe('CompetencyAssessmentCard', () => {
  it('should render competency name, strengths, and concerns', () => {
    // Arrange
    const competency: CompetencyAssessment = {
      competencyId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'System Design',
      strengths: 'Excellent understanding of scalability patterns',
      concerns: 'Limited experience with distributed consensus',
      conflictsIdentified: [],
    };

    // Act
    render(<CompetencyAssessmentCard competency={competency} />);

    // Assert
    expect(screen.getByTestId('competency-assessment-card')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();
    expect(screen.getByText('Excellent understanding of scalability patterns')).toBeInTheDocument();
    expect(screen.getByText('Limited experience with distributed consensus')).toBeInTheDocument();
  });

  it('should not display conflicts section when no conflicts exist', () => {
    // Arrange
    const competency: CompetencyAssessment = {
      competencyId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Communication',
      strengths: 'Clear articulation',
      concerns: 'None',
      conflictsIdentified: [],
    };

    // Act
    render(<CompetencyAssessmentCard competency={competency} />);

    // Assert
    expect(screen.queryByText('Identified Conflicts')).not.toBeInTheDocument();
  });

  it('should display conflicts when conflicts exist', () => {
    // Arrange
    const competency: CompetencyAssessment = {
      competencyId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Problem Solving',
      strengths: 'Methodical approach',
      concerns: 'Occasionally rushes',
      conflictsIdentified: ['Interviewer A praised strong approach', 'Interviewer B noted rushing tendency'],
    };

    // Act
    render(<CompetencyAssessmentCard competency={competency} />);

    // Assert
    expect(screen.getByText('Identified Conflicts')).toBeInTheDocument();
    expect(screen.getByText(/Interviewer A praised strong approach/)).toBeInTheDocument();
    expect(screen.getByText(/Interviewer B noted rushing tendency/)).toBeInTheDocument();
  });

  it('should use custom test ID when provided', () => {
    // Arrange
    const competency: CompetencyAssessment = {
      competencyId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Competency',
      strengths: 'Strengths',
      concerns: 'Concerns',
      conflictsIdentified: [],
    };

    // Act
    render(<CompetencyAssessmentCard competency={competency} testId="custom-card" />);

    // Assert
    expect(screen.getByTestId('custom-card')).toBeInTheDocument();
  });
});
