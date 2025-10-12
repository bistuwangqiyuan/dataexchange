import { useState } from 'react';
import type { FC, ReactNode } from 'react';

interface TabItemProps {
  title: string;
  id: string;
  children: ReactNode;
}

export const TabItem: FC<TabItemProps> = ({ children }) => {
  return <div>{children}</div>;
};

interface TabsProps {
  children: React.ReactElement<TabItemProps>[];
  defaultTab?: number;
}

export const Tabs: FC<TabsProps> = ({ children, defaultTab = 0 }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="w-full">
      {/* Tab Headers */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {children.map((child, index) => (
            <button
              key={child.props.id}
              onClick={() => setActiveTab(index)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === index
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              {child.props.title}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {children[activeTab]}
      </div>
    </div>
  );
};

export default Tabs;

