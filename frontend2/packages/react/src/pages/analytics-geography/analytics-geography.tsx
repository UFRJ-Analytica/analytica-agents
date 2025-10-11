import React, { useState, useEffect, useCallback } from 'react';
import { Item } from 'devextreme-react/toolbar';
import Tabs from 'devextreme-react/tabs';
import * as mapsData from 'devextreme-dist/js/vectormap-data/usa.js';
import LoadPanel from 'devextreme-react/load-panel';
import ScrollView from 'devextreme-react/scroll-view';
import { TABS } from '../../shared/constants';
import { formatDate } from 'devextreme/localization';

import { RangeSelectorTypes } from 'devextreme-react/range-selector';
import { DropDownButtonTypes } from 'devextreme-react/drop-down-button';
import { getSalesByCategory, getSales, getSalesByOrderDate } from 'dx-template-gallery-data';
import { getSalesByStateAndCity, calcSalesByState } from 'dx-template-gallery-data';

import { ToolbarAnalytics, SalesMapCard, RevenueAnalysisByStatesCard, RevenueSnapshotByStatesCard, SalesPerformanceCard } from '../../components';
import { SaleByStateAndCity, SaleByState, Sale, SaleOrOpportunityByCategory } from '../../types/analytics';
import { useScreenSize } from '../../utils/media-query';
import {
  ANALYTICS_PERIODS,
  DEFAULT_ANALYTICS_PERIOD_KEY,
  CUSTOM_ANALYTICS_PERIOD_KEY
} from '../../shared/constants';

import './analytics-geography.scss';
import { VariablesCard } from '../../components/utils/variables-card/VariablesCard';

const formatDateRange = (dateRange: Date[]) => dateRange.map((date) => formatDate(date, 'yyyy-MM-dd'));
const createMapCoords = (coords: string) => coords.split(', ').map(parseFloat);

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

export const AnalyticsGeography = () => {
  const onTab2Click = useCallback((e) => {
    const { index } = TABS[e.addedItems[0]];
    setTabIndex2(index);
  }, []);

  useEffect(() => {
    setTabsWidth2(isXSmall ? 150 : 'auto');
  }, []);
  const [tabsWidth2, setTabsWidth2] = useState<number | string>('auto');
  const [tabIndex2, setTabIndex2] = useState(TABS['Historico'].index);

  const defaultDateRange = ANALYTICS_PERIODS[DEFAULT_ANALYTICS_PERIOD_KEY].period.split('/').map((d) => new Date(d));
  const customDateRange = ANALYTICS_PERIODS[CUSTOM_ANALYTICS_PERIOD_KEY].period.split('/').map((d) => new Date(d));
  const groupByPeriods = ['Day', 'Month'];
  const items2 = Object.keys(TABS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesByCategory, setSalesByCategory] = useState<SaleOrOpportunityByCategory[]>([]);
  const [salesByDateAndCategory, setSalesByDateAndCategory] = useState<Sale[]>([]);
  const [dateRange2, setDateRange2] = useState(defaultDateRange);
  const [groupByPeriod, setGroupByPeriod] = useState(groupByPeriods[1]);
  console.log(sales);
  console.log(salesByCategory);

  const [salesByStateAndCity, setSalesByStateAndCity] = useState<SaleByStateAndCity[]>([]);
  const [salesByState, setSalesByState] = useState<SaleByState[]>([]);
  const [salesByStateMarkers, setSalesByStateMarkers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isXSmall } = useScreenSize();

  const onPeriodChanged = useCallback((e: DropDownButtonTypes.SelectionChangedEvent) => {
    setGroupByPeriod(e.item);
    setIsLoading(true);
  }, []);

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
    getSalesByStateAndCity(...dateRange2).then((data) => {
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
            >
              <Tabs
                width={tabsWidth2}
                scrollByContent
                showNavButtons={false}
                dataSource={items2}
                selectedIndex={tabIndex2}
                onSelectionChanged={onTab2Click}
              />
            </Item>
          }
        >
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
        </ToolbarAnalytics>
      </div>
      <LoadPanel container='.content' visible={isLoading} position={{ of: '.layout-body' }} />
    </ScrollView>
  );
};
