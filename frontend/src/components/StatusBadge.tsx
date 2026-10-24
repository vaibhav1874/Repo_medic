import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'severity' | 'outcome' | 'confidence' | 'risk';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'severity' }) => {
  const norm = (status || '').toLowerCase();

  let badgeClass = 'badge-neutral';

  if (variant === 'severity' || variant === 'risk') {
    if (norm === 'high') badgeClass = 'badge-high';
    else if (norm === 'medium') badgeClass = 'badge-medium';
    else if (norm === 'low' || norm === 'info') badgeClass = 'badge-low';
  } else if (variant === 'outcome') {
    if (norm === 'success' || norm === 'pass') badgeClass = 'badge-success';
    else if (norm === 'regression' || norm === 'fail' || norm === 'error' || norm === 'still_failing') badgeClass = 'badge-fail';
    else if (norm === 'unavailable') badgeClass = 'badge-warning';
  } else if (variant === 'confidence') {
    if (norm === 'high') badgeClass = 'badge-success';
    else if (norm === 'medium') badgeClass = 'badge-medium';
    else if (norm === 'low') badgeClass = 'badge-low';
  }

  return <span className={`badge ${badgeClass}`}>{status}</span>;
};
