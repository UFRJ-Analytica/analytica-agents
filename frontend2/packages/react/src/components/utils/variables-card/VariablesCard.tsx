import React, { useRef } from 'react';
import { CardAnalytics } from '../../library/card-analytics/CardAnalytics';
import SelectBox from 'devextreme-react/select-box';
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
          <Item dataField='Procedimento'>
            <SelectBox
              value='CONSULTA EM OFTALMOLOGIA - CIRURGIA DE CATARATA'
              items={['CONSULTA EM OFTALMOLOGIA - CIRURGIA DE CATARATA']}
              stylingMode='filled'
            />
          </Item>
          <Item dataField='ano' editorType='dxTextBox'>
            <Label text='Ano' />
          </Item>
          <Item dataField='Bairro' editorType='dxTextBox'>
            <SelectBox
              value='IPANEMA'
              items={['IPANEMA']}
              stylingMode='filled'
            />
          </Item>
          <Item dataField='Unidades' editorType='dxTextBox'>
            <SelectBox
              value='SMS CMS JORGE SALDANHA BANDEIRA DE MELLO AP 40'
              items={['SMS CMS JORGE SALDANHA BANDEIRA DE MELLO AP 40']}
              stylingMode='filled'
            />
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
