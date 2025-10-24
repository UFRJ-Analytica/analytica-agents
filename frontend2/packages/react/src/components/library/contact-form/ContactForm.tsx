import React, { useState, useEffect } from 'react';

import { ContactFromDetails } from './ContactFormDetails';

import { withLoadPanel } from '../../../utils/withLoadPanel';

import { Contact } from '../../../types/crm-contact';

import ValidationGroup from 'devextreme-react/validation-group';

import './ContactForm.scss';

const ContactFromDetailsWithLoadPanel = withLoadPanel(ContactFromDetails);

export const ContactForm = ({ data, isLoading = false }: { data?: Contact, isLoading: boolean }) => {
  const [formData, setFormData] = useState(data);

  useEffect(() => {
    setFormData(data);
  }, [data]);

  const updateField = (field: string | number) => (value: string | number) => {
    if(!formData) return;
    if(field === 'state') {
      setFormData({ ...formData, ...{ [field]: { stateShort: value.toString() } } });
    } else {
      setFormData({ ...formData, ...{ [field]: value } });
    }
  };

  return (
    <div className='contact-form'>
      <ValidationGroup>
        <ContactFromDetailsWithLoadPanel
          loading={isLoading}
          hasData={!!formData}
          data={formData}
          editing={false}
          updateField={updateField}
          panelProps={{
            container: '.contact-form',
            position: { of: '.contact-form' },
          }}
        />
      </ValidationGroup>
    </div>
  );
};
