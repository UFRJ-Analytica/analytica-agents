import React, { useRef } from 'react';
import { CardAnalytics } from '../../library/card-analytics/CardAnalytics';
import Form, { Item, Label, ButtonItem, ButtonOptions } from 'devextreme-react/form';
export const VariablesCard = () => {
  const formData = useRef({ ano: '', unidade: '' });

  return (
    <CardAnalytics
      title='Variáveis por região'
      contentClass='sales-by-state'
    >
      <form className='create-account-form'>
        <Form formData={formData.current} labelLocation='top'>
          <Item dataField='ano' editorType='dxTextBox'>
            <Label text='Ano' />
          </Item>
          <Item dataField='unidades' editorType='dxTextBox'>
            <Label text='Unidades da Região' />
          </Item>
          <ButtonItem>
            <ButtonOptions width='100%' type='default' useSubmitBehavior>
              <span className='dx-button-text'>Confirmar</span>
            </ButtonOptions>
          </ButtonItem>
        </Form>
      </form>
    </CardAnalytics>
  );
};
