import React, { useState, useEffect, useCallback } from 'react';
import { Item } from 'devextreme-react/toolbar';
import * as mapsData from 'devextreme-dist/js/vectormap-data/usa.js';
import LoadPanel from 'devextreme-react/load-panel';
import ScrollView from 'devextreme-react/scroll-view';
import { formatDate } from 'devextreme/localization';
import TabPanel, { Item as TabPanelItem } from 'devextreme-react/tab-panel';
import { ContactForm, ContactCards } from '../../components';
import { Contact } from '../../types/crm-contact';
import { useSearchParams } from 'react-router-dom';

import { RangeSelectorTypes } from 'devextreme-react/range-selector';
import { getSalesByCategory, getSales, getSalesByOrderDate } from 'dx-template-gallery-data';
import { getSalesByStateAndCity, calcSalesByState } from 'dx-template-gallery-data';

import { ToolbarAnalytics, SalesMapCard, RevenueAnalysisByStatesCard, RevenueSnapshotByStatesCard, SalesPerformanceCard } from '../../components';
import { SaleByStateAndCity, SaleByState, Sale, SaleOrOpportunityByCategory } from '../../types/analytics';
import {
  ANALYTICS_PERIODS,
  DEFAULT_ANALYTICS_PERIOD_KEY,
  CUSTOM_ANALYTICS_PERIOD_KEY
} from '../../shared/constants';

import './analytics-geography.scss';
import { VariablesCard } from '../../components/utils/variables-card/VariablesCard';
import { DropDownButtonTypes } from 'devextreme-react/drop-down-button';

import {
  getContact,
  getContactMessages,
} from 'dx-template-gallery-data';

export const AnalyticsGeography = () => {
  const getSalesByStateMarkers = (salesByState) => ({
    type: 'StateCollection',
    features: salesByState.map((item) => ({
      type: 'State',
      geometry: {
        type: 'Point',
        coordinates: createMapCoords(item.stateCoords),
      },
      properties: {
        text: item.stateName,
        value: item.total,
        tooltip: `<b>${item.stateName}</b>\n${item.total}K`,
      },
    })),
  });
  const groupByPeriods = ['Day', 'Month'];
  const [salesByDateAndCategory, setSalesByDateAndCategory] = useState<Sale[]>([]);
  const formatDateRange = (dateRange: Date[]) => dateRange.map((date) => formatDate(date, 'yyyy-MM-dd'));
  const createMapCoords = (coords: string) => coords.split(', ').map(parseFloat);
  const [groupByPeriod, setGroupByPeriod] = useState(groupByPeriods[1]);
  const onPeriodChanged = useCallback((e: DropDownButtonTypes.SelectionChangedEvent) => {
    setGroupByPeriod(e.item);
  }, []);

  const [dateRange] = useState(ANALYTICS_PERIODS[DEFAULT_ANALYTICS_PERIOD_KEY].period.split('/'));

  const defaultDateRange = ANALYTICS_PERIODS[DEFAULT_ANALYTICS_PERIOD_KEY].period.split('/').map((d) => {
    console.log(new Date(d));
    return new Date(d);
  });

  const customDateRange = ANALYTICS_PERIODS[CUSTOM_ANALYTICS_PERIOD_KEY].period.split('/').map((d) => new Date(d));
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<SaleOrOpportunityByCategory[]>([]);
  const [dateRange2, setDateRange2] = useState(defaultDateRange);
  console.log(sales);
  console.log(salesByCategory);

  const [salesByStateAndCity, setSalesByStateAndCity] = useState<SaleByStateAndCity[]>([]);
  const [salesByState, setSalesByState] = useState<SaleByState[]>([]);
  const [salesByStateMarkers, setSalesByStateMarkers] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const onRangeChanged = useCallback((e: RangeSelectorTypes.ValueChangedEvent) => {
    const [startDate, endDate] = e.value;
    setDateRange2([startDate, endDate] as Date[]);
    setIsLoading(true);
  }, []);

  useEffect(() => {
    onRangeChanged({ value: customDateRange } as RangeSelectorTypes.ValueChangedEvent);
    getSales(...formatDateRange(defaultDateRange))
      .then((data) => setSales(data))
      .catch((error) => console.log(error));
  }, []);

  useEffect(() => {
    getSalesByOrderDate(groupByPeriod.toLowerCase())
      .then((data) => {
        setSalesByDateAndCategory(data);
        setIsLoading(false);
      })
      .catch((error) => console.log(error));
  }, [groupByPeriod]);

  useEffect(() => {
    getSalesByStateAndCity(...dateRange).then((data) => {
      const salesByStateResult = calcSalesByState(data);

      setSalesByStateAndCity(data);
      setSalesByState(salesByStateResult);
      setSalesByStateMarkers(getSalesByStateMarkers(salesByStateResult));
      setIsLoading(false);
    });
  }, [dateRange2]);

  useEffect(() => {
    getSalesByCategory(...formatDateRange(dateRange2))
      .then((data) => {
        setSalesByCategory(data);
        setIsLoading(false);
      })
      .catch((error) => console.log(error));
  }, [dateRange2]);

  const [data, setData] = useState<Contact>();
  const [messages, setMessages] = useState([]);
  const [searchParams] = useSearchParams();
  const id = parseInt(searchParams.get('id') || '', 10);
  const DEFAULT_CONTACT_ID = 12;
  const contactId = id || DEFAULT_CONTACT_ID;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(() => {
    Promise.all([
      getContact(contactId)
        .then((data) => {
          setData(data);
        }),
      getContactMessages(contactId)
        .then((data) => {
          setMessages(data);
        })
    ]).then(() => { setIsLoading(false); }).catch((error) => console.log(error));
  }, [contactId]);

  return (
    <ScrollView className='view-wrapper-scroll'>
      <ToolbarAnalytics
        title='Rio de Janeiro'
      >
        <div className='cards normal'>
          <SalesMapCard
            datasource={salesByStateMarkers}
            mapsData={mapsData}
          />
          <VariablesCard />
        </div>
      </ToolbarAnalytics>
      <div className='cards wide'>
        <ToolbarAnalytics
          title='Rio de Janeiro'
          additionalToolbarContent={
            <Item
              location='before'
            />
          }
        >
          <TabPanel
            showNavButtons
            focusStateEnabled={false}
            deferRendering={false}
          >
            <TabPanelItem title='Historico'>
              <div className='cards normal'>
                <RevenueAnalysisByStatesCard datasource={salesByStateAndCity} />
                <RevenueSnapshotByStatesCard datasource={salesByState} />
              </div>
              <div className='cards wide'>
                <SalesPerformanceCard
                  datasource={salesByDateAndCategory}
                  periods={groupByPeriods}
                  selectedPeriod={groupByPeriod}
                  onPeriodChanged={onPeriodChanged}
                  range={dateRange2}
                />
              </div>
            </TabPanelItem>
            <TabPanelItem title='Susana IA'>
              <div className='view-wrapper view-wrapper-contact-details'>
                <div className='panels'>
                  <div className='left'>
                    <ContactForm
                      data={data}
                      isLoading={isLoading}
                    />
                  </div>
                  <div className='right'>
                    <ContactCards
                      messages={messages} />
                  </div>
                </div>
              </div>
            </TabPanelItem>
          </TabPanel>
        </ToolbarAnalytics>
      </div>
      <LoadPanel container='.content' visible={isLoading} position={{ of: '.layout-body' }} />
    </ScrollView>
  );
};
