import React from 'react';

import classNames from 'classnames';

import From, { Item as ItemForm, GroupItem, ColCountByScreen } from 'devextreme-react/form';

import { FormPhoto } from '../../utils/form-photo/FormPhoto';
import { FormTextbox } from '../../utils/form-textbox/FormTextbox';

import { Contact } from '../../../types/crm-contact';

const PHOTO_SIZE = 184;

export const ContactFromDetails = ({ data, editing, updateField }: {
  data: Contact, editing: boolean, updateField: (field: string | number) => (value: string | number) => void
}) => {
  return (
    <From
      className={classNames({ 'plain-styled-form': true, 'view-mode': !editing })}
      labelMode='floating'
    >
      <GroupItem colCount={1}>
        <ColCountByScreen xs={1} />
        <ItemForm>
          <FormPhoto link={data.image} size={PHOTO_SIZE} />
        </ItemForm>
      </GroupItem>

      <GroupItem colCount={1} caption='Susana IA'>
        <ColCountByScreen xs={2} />
        <ItemForm colSpan={2}>
          <FormTextbox
            label='Descrição'
            value='Pergunte a Susana informações sobre demandas e ofertas.'
            isEditing={false}
            onValueChange={updateField('city')}
          />
        </ItemForm>
      </GroupItem>
    </From>
  );
};
