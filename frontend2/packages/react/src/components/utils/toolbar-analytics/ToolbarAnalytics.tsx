import React, { ReactNode } from 'react';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import './ToolbarAnalytics.scss';

type ToolbarAnalyticsProps = {
  title: string;
  additionalToolbarContent?: ReactNode;
};

export const ToolbarAnalytics = ({
  title,
  additionalToolbarContent,
  children,
}: React.PropsWithChildren<ToolbarAnalyticsProps>) => {
  return (
    <div className='view-wrapper view-wrapper-dashboard'>
      <Toolbar className='theme-dependent'>
        <Item location='before'>
          <span className='toolbar-header'>{title}</span>
        </Item>
        {additionalToolbarContent}
      </Toolbar>
      {children}
    </div>
  );
};
