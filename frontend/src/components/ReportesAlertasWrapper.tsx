import React from 'react';
import { AlertasFilterProvider } from '../contexts/AlertasFilterContext';

interface ReportesAlertasWrapperProps {
  children: React.ReactNode;
}

const ReportesAlertasWrapper: React.FC<ReportesAlertasWrapperProps> = ({ children }) => {
  return (
    <AlertasFilterProvider>
      {children}
    </AlertasFilterProvider>
  );
};

export default ReportesAlertasWrapper;
