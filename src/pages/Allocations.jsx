import React, { useState, useMemo } from 'react';
import {
  Grid,
  Column,
  DataTable,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableExpandRow,
  TableExpandedRow,
  TableExpandHeader,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tag,
  Button,
  Toggle,
  InlineNotification,
  Tile
} from '@carbon/react';
import { Download, Warning, Information } from '@carbon/react/icons';
import { calculateVMCosts } from '../utils/costCalculator';

// Remove the destructuring - we'll use the render prop pattern instead

function Allocations({ costProfiles, resources }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyUncosted, setShowOnlyUncosted] = useState(false);

  // Calculate costs for all VMs
  const vmsWithCosts = useMemo(() => {
    return resources.map(vm => ({
      ...vm,
      calculatedCosts: calculateVMCosts(vm, costProfiles)
    }));
  }, [resources, costProfiles]);

  // Prepare data for the table
  const rows = vmsWithCosts.map(vm => ({
    id: vm.ResourceId,
    name: vm.ResourceName,
    owner: vm.OwnerID,
    cpu: vm.CPU,
    memory: vm.MemoryGB,
    storage: vm.StorageGB,
    matchedProfile: vm.calculatedCosts.matchedProfiles.join(', ') || 'None',
    monthlyCost: vm.calculatedCosts.totalMonthlyCost,
    oneTimeCost: vm.calculatedCosts.totalOneTimeCost,
    hasBreakdown: vm.calculatedCosts.breakdowns.length > 0
  }));

  const headers = [
    { key: 'name', header: 'Resource Name' },
    { key: 'owner', header: 'Owner' },
    { key: 'cpu', header: 'CPU' },
    { key: 'memory', header: 'Memory (GB)' },
    { key: 'storage', header: 'Storage (GB)' },
    { key: 'matchedProfile', header: 'Matched Profile' },
    { key: 'monthlyCost', header: 'Monthly Cost (AUD)' },
    { key: 'oneTimeCost', header: 'One-Time Cost (AUD)' }
  ];

  let filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.matchedProfile.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showOnlyUncosted) {
    filteredRows = filteredRows.filter(row => row.monthlyCost === 0 && row.oneTimeCost === 0);
  }

  const exportAllocations = () => {
    // Create detailed CSV with cost breakdowns
    const csvRows = [['VM Name', 'Owner', 'CPU', 'Memory', 'Storage', 'Matched Profile', 'Component', 'Type', 'Cost', 'Unit', 'Total Monthly', 'Total One-Time']];
    
    vmsWithCosts.forEach(vm => {
      if (vm.calculatedCosts.breakdowns.length > 0) {
        vm.calculatedCosts.breakdowns.forEach(breakdown => {
          breakdown.components.forEach((component, index) => {
            csvRows.push([
              vm.ResourceName,
              vm.OwnerID,
              vm.CPU,
              vm.MemoryGB,
              vm.StorageGB,
              breakdown.profileName,
              component.name,
              component.type,
              component.cost.toFixed(2),
              component.unit,
              index === 0 ? vm.calculatedCosts.totalMonthlyCost.toFixed(2) : '',
              index === 0 ? vm.calculatedCosts.totalOneTimeCost.toFixed(2) : ''
            ]);
          });
        });
      } else {
        csvRows.push([
          vm.ResourceName,
          vm.OwnerID,
          vm.CPU,
          vm.MemoryGB,
          vm.StorageGB,
          'None',
          'No cost profile matched',
          '',
          '0',
          '',
          '0',
          '0'
        ]);
      }
    });

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cost-allocations.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderCostCell = (cost, isOneTime = false) => {
    if (cost === 0) {
      return <span style={{ color: '#6f6f6f' }}>-</span>;
    }
    return (
      <span style={{ fontWeight: cost > 0 ? '500' : 'normal' }}>
        ${cost.toFixed(2)}{isOneTime && ' (one-time)'}
      </span>
    );
  };

  const renderExpandedContent = (rowId) => {
    const vm = vmsWithCosts.find(v => v.ResourceId === rowId);
    if (!vm || vm.calculatedCosts.breakdowns.length === 0) {
      return (
        <div style={{ padding: '1rem' }}>
          <p style={{ color: '#6f6f6f' }}>No cost breakdown available</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '1rem' }}>
        <h5 style={{ marginBottom: '1rem' }}>Cost Breakdown</h5>
        {vm.calculatedCosts.breakdowns.map((breakdown, bIndex) => (
          <div key={bIndex} style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
              Profile: {breakdown.profileName}
            </p>
            <table style={{ width: '100%', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Component</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Calculation</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Cost</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.components.map((component, cIndex) => (
                  <tr key={cIndex} style={{ borderBottom: '1px solid #f4f4f4' }}>
                    <td style={{ padding: '0.5rem' }}>{component.name}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <Tag type="gray" size="sm">{component.type}</Tag>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {component.calculation || component.unit}
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '500' }}>
                      ${component.cost.toFixed(2)}
                      {component.isOneTime && ' (one-time)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e0e0e0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '600' }}>Total Monthly Cost:</span>
            <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>
              ${vm.calculatedCosts.totalMonthlyCost.toFixed(2)}
            </span>
          </div>
          {vm.calculatedCosts.totalOneTimeCost > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: '600' }}>Total One-Time Cost:</span>
              <span style={{ fontWeight: '600', fontSize: '1.125rem', color: '#0f62fe' }}>
                ${vm.calculatedCosts.totalOneTimeCost.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalMonthlyCost = vmsWithCosts.reduce((sum, vm) => sum + vm.calculatedCosts.totalMonthlyCost, 0);
  const totalOneTimeCost = vmsWithCosts.reduce((sum, vm) => sum + vm.calculatedCosts.totalOneTimeCost, 0);
  const uncostedVMs = vmsWithCosts.filter(vm => vm.calculatedCosts.totalMonthlyCost === 0 && vm.calculatedCosts.totalOneTimeCost === 0);

  return (
    <Grid style={{ padding: '2rem' }}>
      <Column lg={16} md={8} sm={4} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Cost Allocations</h1>
        <p style={{ fontSize: '1.125rem', color: '#525252' }}>
          View how costs are allocated to each virtual machine based on your cost profiles. 
          This page shows the detailed breakdown of costs and helps identify VMs without 
          cost allocations.
        </p>
      </Column>

      {/* Summary Cards */}
      <Column lg={16} md={8} sm={4} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <Tile style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.5rem' }}>
              Total Monthly Infrastructure Cost
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '600' }}>${totalMonthlyCost.toFixed(2)}</p>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>AUD per month</p>
          </Tile>
          
          <Tile style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.5rem' }}>
              Total One-Time Costs
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '600', color: '#0f62fe' }}>
              ${totalOneTimeCost.toFixed(2)}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>AUD (setup/migration)</p>
          </Tile>
          
          <Tile style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.5rem' }}>
              Cost Coverage
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '600' }}>
              {Math.round(((resources.length - uncostedVMs.length) / resources.length) * 100)}%
            </p>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>
              {resources.length - uncostedVMs.length} of {resources.length} VMs
            </p>
          </Tile>
        </div>
      </Column>

      {uncostedVMs.length > 0 && (
        <Column lg={16} md={8} sm={4} style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="warning"
            title={`${uncostedVMs.length} VMs without cost allocation`}
            subtitle="Create cost profiles with matching rules to allocate costs to these resources."
            lowContrast
          />
        </Column>
      )}

      <Column lg={16} md={8} sm={4}>
        <DataTable
          rows={filteredRows}
          headers={headers}
        >
          {({
            rows,
            headers,
            getTableProps,
            getHeaderProps,
            getRowProps,
            getExpandedRowProps,
            getToolbarProps,
            onInputChange,
            getTableContainerProps
          }) => (
            <TableContainer {...getTableContainerProps()}>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch
                    placeholder="Search allocations..."
                    onChange={(e) => {
                      onInputChange(e);
                      setSearchTerm(e.target.value);
                    }}
                  />
                  <Toggle
                    id="show-uncosted"
                    labelText="Show only uncosted VMs"
                    toggled={showOnlyUncosted}
                    onToggle={setShowOnlyUncosted}
                  />
                  <Button
                    kind="secondary"
                    renderIcon={Download}
                    onClick={exportAllocations}
                  >
                    Export Allocations
                  </Button>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    <TableExpandHeader />
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <React.Fragment key={row.id}>
                      <TableExpandRow {...getRowProps({ row })}>
                        <TableCell>{row.cells[0].value}</TableCell>
                        <TableCell>{row.cells[1].value}</TableCell>
                        <TableCell>{row.cells[2].value}</TableCell>
                        <TableCell>{row.cells[3].value}</TableCell>
                        <TableCell>{row.cells[4].value}</TableCell>
                        <TableCell>
                          {row.cells[5].value === 'None' ? (
                            <Tag type="gray" size="sm">No match</Tag>
                          ) : (
                            <Tag type="green" size="sm">{row.cells[5].value}</Tag>
                          )}
                        </TableCell>
                        <TableCell>{renderCostCell(row.cells[6].value)}</TableCell>
                        <TableCell>{renderCostCell(row.cells[7].value, true)}</TableCell>
                      </TableExpandRow>
                      <TableExpandedRow colSpan={headers.length + 1} {...getExpandedRowProps({ row })}>
                        {renderExpandedContent(row.id)}
                      </TableExpandedRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Column>

      {/* Help Section */}
      <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
        <Tile style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <Information size={20} style={{ marginRight: '0.5rem' }} />
            <h4>Understanding Cost Allocations</h4>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#525252' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>How costs are calculated:</strong> When a VM matches a cost profile's rules, 
              all cost components from that profile are applied. The first matching profile wins - 
              profiles are evaluated in priority order.
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Cost types:</strong> Monthly costs recur each billing period, while one-time 
              costs are applied only once (e.g., setup fees, migration costs).
            </p>
            <p>
              <strong>No match:</strong> VMs showing "No match" need a cost profile with rules that 
              match their attributes. Check CPU, memory, storage, tags, and other properties.
            </p>
          </div>
        </Tile>
      </Column>
    </Grid>
  );
}

export default Allocations;