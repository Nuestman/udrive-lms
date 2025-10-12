import React, { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageLayoutProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  children: ReactNode;
  actions?: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  breadcrumbs = [],
  children,
  actions
}) => {
  return (
    <div className="space-y-6">
      {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} />}
      
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3">
            {actions}
          </div>
        )}
      </div>
      
      <div>{children}</div>
    </div>
  );
};

export default PageLayout;