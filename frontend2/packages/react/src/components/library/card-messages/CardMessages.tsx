import React, { useState, useCallback, useEffect } from 'react';

import TextArea from 'devextreme-react/text-area';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import Button from 'devextreme-react/button';
import ValidationGroup from 'devextreme-react/validation-group';

import { formatDate } from 'devextreme/localization';

import { Message, Messages } from '../../../types/card-messages';

import './CardMessages.scss';

const getText = (data: Message, user: string, manager: string) => {
  return data.text.replace('{username}', data.manager !== manager ? manager : user);
};

const Card = ({ data, user, manager }: { data: Message; user: string, manager: string }) => (
  <div className='message-container'>
    <div className='message dx-card'>
      <div className='message-title'>
        <div>
          <div>
            {formatDate(new Date(data.date), 'MM/dd/yyyy')} - {data.manager}
          </div>
        </div>
        <div>
          <Button icon='overflow' stylingMode='text' />
        </div>
      </div>
      <div className='message-text'>{getText(data, user, manager)}</div>
    </div>
  </div>
);

export const CardMessages = ({ items, user }: {
  items?: Messages; user?: string;
}) => {
  const [messages, setMessages] = useState(items);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessages(items);
  }, [items]);

  const send = useCallback((e) => {
    if (!e.validationGroup.validate().isValid || !messages || !user) {
      return;
    }
    setMessages([...messages, { manager: user, date: new Date(), text: message }]);
    e.validationGroup.reset();
  }, [message, messages, user]);

  const onMessageChanged = useCallback((value) => {
    setMessage(value);
  }, []);

  return (
    <ValidationGroup>
      <div className='messages'>
        <div className='messages-content'>
          <div className='message-list'>
            {user && messages?.map((message, index) => (
              <Card key={index} data={message} user={messages[1].manager} manager={messages[0].manager} />
            ))}
          </div>
        </div>
        <div className='input-messages'>
          <TextArea height={150} stylingMode='filled' value={message} valueChangeEvent='keyup' onValueChange={onMessageChanged} />
          <Toolbar>
            <Item
              location='after'
              widget='dxButton'
              options={{
                text: 'Send',
                stylingMode: 'contained',
                type: 'default',
                onClick: send,
              }}
            />
          </Toolbar>
        </div>
      </div>
    </ValidationGroup>
  );
};
