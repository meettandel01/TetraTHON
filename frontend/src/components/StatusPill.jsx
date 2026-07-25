import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function StatusPill({ status, auto = false }) {
  if (status === 'Pending') {
    return (
      <div className="flex gap-2 items-center">
        {auto && (
          <span className="badge-hard flex items-center gap-1">
            <AlertCircle size={12} /> Auto (Low Conf.)
          </span>
        )}
        <span className="status-pill status-pending">Pending</span>
      </div>
    );
  }
  
  if (status === 'Claimed') {
    return <span className="status-pill status-claimed">Claimed</span>;
  }
  
  if (status === 'Resolved') {
    return <span className="status-pill status-resolved">Resolved</span>;
  }
  
  return null;
}
