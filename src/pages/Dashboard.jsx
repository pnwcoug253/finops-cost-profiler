import React, { useState, useEffect } from 'react';
import {
  Grid,
  Column,
  Tile,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Tag,
  Button,
  InlineNotification
} from '@carbon/react';
import { Dashboard as DashboardIcon, ChartLine, VirtualMachine, Information } from '@carbon/icons-react';
import { SimpleBarChart } from '@carbon/charts-react';
import '@carbon/charts/styles.css';
import { useNavigate } from 'react-router-dom';
import { calculateTotalCosts } from '../utils/costCalculator';
import { sampleVMs } from '../data/sampleData';

function Dashboard() {
  const navigate = useNavigate();
  const [resources] = useState(sampleVMs);
  const [costProfiles, setCostProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Load cost profiles from localStorage
      const savedProfiles = localStorage.getItem('costProfiles');
      if (savedProfiles) {
        const profiles = JSON.parse(savedProfiles);
        setCostProfiles(profiles);
      }
    } catch (error) {
      console.error('Error loading cost profiles:', error);
      setCostProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate costs
  let totalCosts = {
    totalMonthly: 0,
    totalCapEx: 0,
    totalOpEx: 0,
    costedVMs: 0,
    uncostedVMs: resources.length
  };

  try {
    if (costProfiles && costProfiles.length > 0 && resources && resources.length > 0) {
      totalCosts = calculateTotalCosts(resources, costProfiles);
    }
  } catch (error) {
    console.error('Error calculating costs:', error);
  }

  // Get profile statistics
  const publishedProfiles = costProfiles.filter(p => p.status === 'published').length;
  const draftProfiles = costProfiles.filter(p => p.status === 'draft').length;

  // Prepare chart data
  const chartData = [
    { group: 'CapEx', value: totalCosts.totalCapEx || 0 },
    { group: 'OpEx', value: totalCosts.totalOpEx || 0 }
  ];

  const chartOptions = {
    title: 'Cost Breakdown by Category',
    axes: {
      left: {
        mapsTo: 'value'
      },
      bottom: {
        mapsTo: 'group',
        scaleType: 'labels'
      }
    },
    height: '300px'
  };

  // Get top expensive VMs
  const vmsWithCosts = resources.map(vm => {
    try {
      const costs = require('../utils/costCalculator').calculateVMCosts(vm, costProfiles, resources);
      return {
        ...vm,
        totalCost: costs.totalCost || 0
      };
    } catch (error) {
      return {
        ...vm,
        totalCost: 0
      };
    }
  }).sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);

  const topVMsRows = vmsWithCosts.map((vm, index) => ({
    id: `${index}`,
    name: vm.ResourceName || 'Unknown',
    cost: `$${vm.totalCost.toFixed(2)}`,
    cpu: vm.vcpuCount || 0,
    memory: `${vm.memoryGb || 0} GB`
  }));

  const topVMsHeaders = [
    { key: 'name', header: 'VM Name' },
    { key: 'cpu', header: 'CPUs' },
    { key: 'memory', header: 'Memory' },
    { key: 'cost', header: 'Monthly Cost' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>FinOps Cost Profile Dashboard</h1>
        <p style={{ marginTop: '0.5rem', color: '#525252' }}>
          Monitor and manage your on-premises infrastructure costs. This dashboard provides a comprehensive view of your cost profiles, resource allocations, and spending trends.
        </p>
      </div>

      {draftProfiles > 0 && (
        <InlineNotification
          kind="info"
          title="Unpublished profiles"
          subtitle={`You have ${draftProfiles} draft profile${draftProfiles > 1 ? 's' : ''}. Published profiles will apply costs to VMs.`}
          lowContrast
          style={{ marginBottom: '2rem', maxWidth: 'none' }}
        />
      )}

      <Grid fullWidth>
        {/* First Row - Metrics */}
        <Column lg={5} md={4} sm={4} style={{ marginBottom: '1rem' }}>
          <Tile style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#525252', marginBottom: '0.5rem' }}>Total Monthly Cost</p>
                <h2 style={{ fontSize: '2rem', fontWeight: '400', margin: '0.5rem 0' }}>${totalCosts.totalMonthly.toFixed(2)}</h2>
                <p style={{ color: '#525252', fontSize: '0.875rem' }}>AUD</p>
              </div>
              <DashboardIcon size={32} />
            </div>
          </Tile>
        </Column>

        <Column lg={5} md={4} sm={4} style={{ marginBottom: '1rem' }}>
          <Tile style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#525252', marginBottom: '0.5rem' }}>Active Cost Profiles</p>
                <h2 style={{ fontSize: '2rem', fontWeight: '400', margin: '0.5rem 0' }}>{publishedProfiles}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Tag type="green" size="sm">{publishedProfiles} Published</Tag>
                  {draftProfiles > 0 && (
                    <Tag type="gray" size="sm">{draftProfiles} Draft</Tag>
                  )}
                </div>
              </div>
              <ChartLine size={32} />
            </div>
          </Tile>
        </Column>

        <Column lg={6} md={4} sm={4} style={{ marginBottom: '1rem' }}>
          <Tile style={{ height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <p style={{ color: '#525252', marginBottom: '0.5rem' }}>Total VMs</p>
                <h2 style={{ fontSize: '2rem', fontWeight: '400', margin: '0.5rem 0' }}>{resources.length}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Tag type="blue" size="sm">{totalCosts.costedVMs} Costed</Tag>
                  <Tag type="red" size="sm">{totalCosts.uncostedVMs} Uncosted</Tag>
                </div>
              </div>
              <VirtualMachine size={32} />
            </div>
          </Tile>
        </Column>

        {/* Second Row - Charts */}
        <Column lg={8} md={8} sm={4} style={{ marginBottom: '1rem' }}>
          <Tile>
            <h3 style={{ marginBottom: '1rem' }}>Cost Breakdown by Category</h3>
            <p style={{ color: '#525252', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Distribution of costs across different infrastructure components
            </p>
            {totalCosts.totalMonthly > 0 ? (
              <SimpleBarChart data={chartData} options={chartOptions} />
            ) : (
              <div style={{ 
                height: '300px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexDirection: 'column',
                color: '#525252'
              }}>
                <Information size={48} style={{ marginBottom: '1rem' }} />
                <p>No cost data available. Create and publish cost profiles to see breakdown.</p>
              </div>
            )}
          </Tile>
        </Column>

        <Column lg={8} md={8} sm={4} style={{ marginBottom: '1rem' }}>
          <Tile>
            <h3 style={{ marginBottom: '1rem' }}>Monthly Cost Trend</h3>
            <p style={{ color: '#525252', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Infrastructure costs over the last 4 months
            </p>
            <div style={{ 
              height: '300px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#525252'
            }}>
              <p>Historical data will be available after tracking costs for multiple months</p>
            </div>
          </Tile>
        </Column>

        {/* Third Row - Table and Actions */}
        <Column lg={12} md={8} sm={4} style={{ marginBottom: '1rem' }}>
          <Tile>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3>Top Expensive VMs</h3>
                <p style={{ color: '#525252', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  Virtual machines with highest monthly costs
                </p>
              </div>
              <Button kind="ghost" size="sm" onClick={() => navigate('/allocations')}>
                View All
              </Button>
            </div>
            {topVMsRows.length > 0 ? (
              <DataTable rows={topVMsRows} headers={topVMsHeaders} size="sm">
                {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                  <TableContainer>
                    <Table {...getTableProps()}>
                      <TableHead>
                        <TableRow>
                          {headers.map(header => (
                            <TableHeader {...getHeaderProps({ header })} key={header.key}>
                              {header.header}
                            </TableHeader>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {rows.map(row => (
                          <TableRow {...getRowProps({ row })} key={row.id}>
                            {row.cells.map(cell => (
                              <TableCell key={cell.id}>{cell.value}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </DataTable>
            ) : (
              <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                color: '#525252'
              }}>
                <p>No VM costs calculated yet. Create and publish cost profiles to see expensive VMs.</p>
              </div>
            )}
          </Tile>
        </Column>

        <Column lg={4} md={4} sm={4} style={{ marginBottom: '1rem' }}>
          <Tile>
            <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Button kind="primary" onClick={() => navigate('/cost-profiles/create')} style={{ width: '100%' }}>
                Create Cost Profile
              </Button>
              <p style={{ color: '#525252', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                Define new cost allocation rules
              </p>
            </div>
          </Tile>
        </Column>
      </Grid>
    </div>
  );
}

export default Dashboard;