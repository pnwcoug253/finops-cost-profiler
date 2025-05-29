import React from 'react';
import {
  Grid,
  Column,
  Tile,
  ClickableTile,
  Tag
} from '@carbon/react';
import { 
  Dashboard as DashboardIcon, 
  Currency, 
  VirtualMachine,
  ChartLine,
  Warning,
  Information
} from '@carbon/icons-react';
import { AreaChart, DonutChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';
import { calculateVMCosts } from '../utils/costCalculator';

function Dashboard({ costProfiles, resources }) {
  // Calculate costs for all VMs
  const vmsWithCosts = resources.map(vm => ({
    ...vm,
    calculatedCosts: calculateVMCosts(vm, costProfiles)
  }));

  // Calculate summary metrics
  const totalMonthlyCost = vmsWithCosts.reduce((sum, vm) => 
    sum + vm.calculatedCosts.totalMonthlyCost, 0
  );

  const publishedProfiles = costProfiles.filter(p => p.status === 'published').length;
  const draftProfiles = costProfiles.filter(p => p.status === 'draft').length;
  const vmsWithCostCount = vmsWithCosts.filter(vm => vm.calculatedCosts.totalMonthlyCost > 0).length;
  const vmsWithoutCosts = resources.length - vmsWithCostCount;

  // Prepare data for charts
  const costByCategoryData = [];
  const costCategories = new Map();

  vmsWithCosts.forEach(vm => {
    vm.calculatedCosts.breakdowns.forEach(breakdown => {
      breakdown.components.forEach(component => {
        const key = component.name;
        costCategories.set(key, (costCategories.get(key) || 0) + component.cost);
      });
    });
  });

  costCategories.forEach((value, key) => {
    costByCategoryData.push({
      group: key,
      value: Math.round(value * 100) / 100
    });
  });

  // Top 5 most expensive VMs
  const topExpensiveVMs = [...vmsWithCosts]
    .sort((a, b) => b.calculatedCosts.totalMonthlyCost - a.calculatedCosts.totalMonthlyCost)
    .slice(0, 5);

  // Monthly trend data (mock for now)
  const monthlyTrendData = [
    { group: 'Total Cost', date: '2024-10', value: totalMonthlyCost * 0.85 },
    { group: 'Total Cost', date: '2024-11', value: totalMonthlyCost * 0.92 },
    { group: 'Total Cost', date: '2024-12', value: totalMonthlyCost * 0.95 },
    { group: 'Total Cost', date: '2025-01', value: totalMonthlyCost }
  ];

  return (
    <Grid className="dashboard-page" style={{ padding: '2rem' }}>
      <Column lg={16} md={8} sm={4} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          FinOps Cost Profile Dashboard
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#525252' }}>
          Monitor and manage your on-premises infrastructure costs. This dashboard provides a comprehensive 
          view of your cost profiles, resource allocations, and spending trends.
        </p>
      </Column>

      {/* Help notification for draft profiles */}
      {draftProfiles > 0 && publishedProfiles === 0 && (
        <Column lg={16} md={8} sm={4} style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="info"
            title="No published cost profiles"
            subtitle="You have draft profiles that aren't applying costs yet. Go to Cost Profiles and publish them to see cost calculations."
            lowContrast
            actionButtonLabel="Go to Cost Profiles"
            onActionButtonClick={() => window.location.href = '/cost-profiles'}
          />
        </Column>
      )}

      {/* Summary Tiles */}
      <Column lg={4} md={4} sm={4}>
        <Tile style={{ minHeight: '160px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#525252', marginBottom: '0.5rem' }}>Total Monthly Cost</p>
              <p style={{ fontSize: '2.25rem', fontWeight: '600' }}>
                ${totalMonthlyCost.toFixed(2)}
              </p>
              <p style={{ color: '#525252', marginTop: '0.5rem' }}>AUD</p>
            </div>
            <Currency size={32} />
          </div>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <Tile style={{ minHeight: '160px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#525252', marginBottom: '0.5rem' }}>Active Cost Profiles</p>
              <p style={{ fontSize: '2.25rem', fontWeight: '600' }}>{publishedProfiles}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <Tag type="green" size="sm">{publishedProfiles} Published</Tag>
                <Tag type="gray" size="sm" style={{ marginLeft: '0.5rem' }}>{draftProfiles} Draft</Tag>
              </div>
            </div>
            <DashboardIcon size={32} />
          </div>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <Tile style={{ minHeight: '160px', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#525252', marginBottom: '0.5rem' }}>Total VMs</p>
              <p style={{ fontSize: '2.25rem', fontWeight: '600' }}>{resources.length}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <Tag type="blue" size="sm">{vmsWithCostCount} Costed</Tag>
                {vmsWithoutCosts > 0 && (
                  <Tag type="red" size="sm" style={{ marginLeft: '0.5rem' }}>
                    {vmsWithoutCosts} Uncosted
                  </Tag>
                )}
              </div>
            </div>
            <VirtualMachine size={32} />
          </div>
        </Tile>
      </Column>

      <Column lg={4} md={4} sm={4}>
        <ClickableTile 
          href="/cost-profiles/create"
          style={{ minHeight: '160px', padding: '1.5rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: '#525252', marginBottom: '0.5rem' }}>Quick Actions</p>
              <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>Create Cost Profile</p>
              <p style={{ color: '#525252', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Define new cost allocation rules
              </p>
            </div>
            <ChartLine size={32} />
          </div>
        </ClickableTile>
      </Column>

      {/* Charts Section */}
      <Column lg={8} md={8} sm={4} style={{ marginTop: '2rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Cost Breakdown by Category</h3>
          <p style={{ color: '#525252', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Distribution of costs across different infrastructure components
          </p>
          {costByCategoryData.length > 0 ? (
            <DonutChart
              data={costByCategoryData}
              options={{
                height: '300px',
                donut: {
                  center: {
                    label: 'Total Cost',
                    number: `$${totalMonthlyCost.toFixed(0)}`
                  }
                },
                legend: {
                  alignment: 'center',
                  position: 'bottom'
                }
              }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#525252' }}>
              <Warning size={48} style={{ marginBottom: '1rem' }} />
              <p>No cost data available. Create and publish cost profiles to see breakdown.</p>
            </div>
          )}
        </Tile>
      </Column>

      <Column lg={8} md={8} sm={4} style={{ marginTop: '2rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Monthly Cost Trend</h3>
          <p style={{ color: '#525252', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Infrastructure costs over the last 4 months
          </p>
          <AreaChart
            data={monthlyTrendData}
            options={{
              height: '300px',
              axes: {
                bottom: {
                  title: 'Month',
                  mapsTo: 'date',
                  scaleType: 'labels'
                },
                left: {
                  title: 'Cost (AUD)',
                  mapsTo: 'value',
                  scaleType: 'linear'
                }
              },
              curve: 'curveMonotoneX',
              legend: {
                enabled: false
              }
            }}
          />
        </Tile>
      </Column>

      {/* Top Expensive VMs */}
      <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Top 5 Most Expensive VMs</h3>
          <p style={{ color: '#525252', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            Virtual machines with the highest monthly costs based on current cost profiles
          </p>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {topExpensiveVMs.map((vm, index) => (
              <div 
                key={vm.ResourceId}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  backgroundColor: '#f4f4f4',
                  borderLeft: '4px solid #0f62fe'
                }}
              >
                <div>
                  <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                    {index + 1}. {vm.ResourceName}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#525252' }}>
                    {vm.CPU} vCPU • {vm.MemoryGB} GB RAM • {vm.StorageGB} GB Storage
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    {vm.calculatedCosts.matchedProfiles.map(profile => (
                      <Tag key={profile} type="blue" size="sm" style={{ marginRight: '0.5rem' }}>
                        {profile}
                      </Tag>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                    ${vm.calculatedCosts.totalMonthlyCost.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '0.875rem', color: '#525252' }}>per month</p>
                </div>
              </div>
            ))}
          </div>
        </Tile>
      </Column>
    </Grid>
  );
}

export default Dashboard;