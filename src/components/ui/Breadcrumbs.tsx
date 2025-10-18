import React from 'react';
import { ChevronRight, Home, MoreHorizontal } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  // On mobile, show only the last 2 items (current page and one parent)
  // On desktop, show all items
  const getVisibleItems = () => {
    if (items.length <= 2) return items;
    
    // For mobile, show only the last 2 items
    const mobileItems = items.slice(-2);
    return mobileItems;
  };

  const visibleItems = getVisibleItems();
  const hasHiddenItems = items.length > 2;

  return (
    <nav className="flex mb-4 sm:mb-6 overflow-x-auto sm:overflow-x-visible" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 sm:space-x-2 md:space-x-3 min-w-0 flex-wrap">
        <li className="inline-flex items-center flex-shrink-0">
          <a
            href="/"
            className="inline-flex items-center text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </a>
        </li>
        
        {/* Show ellipsis on mobile if there are hidden items */}
        {hasHiddenItems && (
          <li className="hidden sm:inline-flex items-center">
            <div className="flex items-center">
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
              <MoreHorizontal className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </div>
          </li>
        )}
        
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isFirst = index === 0;
          const showEllipsis = hasHiddenItems && isFirst;
          
          return (
            <li key={index} className="inline-flex items-center flex-shrink-0">
              <div className="flex items-center">
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                {item.href && !isLast ? (
                  <a
                    href={item.href}
                    className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-primary-600 truncate max-w-[120px] sm:max-w-none"
                    title={item.label}
                  >
                    {showEllipsis && <span className="hidden sm:inline">...</span>}
                    {item.label}
                  </a>
                ) : (
                  <span 
                    className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-gray-500 truncate max-w-[120px] sm:max-w-none"
                    title={item.label}
                  >
                    {showEllipsis && <span className="hidden sm:inline">...</span>}
                    {item.label}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;