import React from 'react';
import TabPanel, { Item as TabPanelItem } from 'devextreme-react/tab-panel';

import {
  CardMessages,
} from '../..';

export const ContactCards = ({
  messages
}) => {
  return (
    <div className='dx-card details-card'>
      <TabPanel
        showNavButtons
        focusStateEnabled={false}
        deferRendering={false}
      >
        <TabPanelItem>
          <CardMessages items={messages} user='Você' />
        </TabPanelItem>
      </TabPanel>
    </div>
  );
};
