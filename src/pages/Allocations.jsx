import React, { useState, useMemo, useEffect } from 'react';
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
import { sampleVMs } from '../data/sampleData';

function Allocations() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyUncosted, setShowOnlyUncosted] = useState(false);
  const [costProfiles, setCostProfiles] = useState([]);
  const resources = sampleVMs;

  // Load cost profiles from localStorage
  useEffect(() => {
    const savedProfiles = localStorage.getItem('costProfiles');
    if (savedProfiles) {
      setCostProfiles(JSON.parse(savedProfiles));
    }
  }, []);

  // Calculate costs for all VMs
  const vmsWithCosts = useMemo(() => {
    return resources.map(vm => ({
      ...vm,
      calculatedCosts: calculateVMCosts(vm, costProfiles, resources)
    }));
  }, [resources, costProfiles]);

  // Prepare data for the table
  const rows = vmsWithCosts.map(vm => ({
    id: vm.ResourceId,
    name: vm.ResourceName,
    owner: vm.OwnerID,
    cpu: vm.vcpuCount,
    memory: vm.memoryGb,
    storage: vm.storageGb,
    matchedProfile: vm.calculatedCosts.appliedProfiles?.join(', ') || 'None',
    monthlyCost: vm.calculatedCosts.totalCost || 0,
    monthlyCapEx: vm.calculatedCosts.monthlyCapEx || 0,
    monthlyOpEx: vm.calculatedCosts.monthlyOpEx || 0,
    oneTimeCost: vm.calculatedCosts.totalOneTimeCost || 0,
    hasBreakdown: vm.calculatedCosts.costs?.length > 0
  }));

  const headers = [
    { key: 'name', header: 'Resource Name' },
    { key: 'owner', header: 'Owner' },
    { key: 'cpu', header: 'vCPUs' },
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
    const csvRows = [['VM Name', 'Owner', 'CPU', 'Memory', 'Storage', 'Matched Profile', 'Component', 'Type', 'Cost', 'Category', 'Total Monthly', 'Total One-Time']];
    
    vmsWithCosts.forEach(vm => {
      if (vm.calculatedCosts.costs && vm.calculatedCosts.costs.length > 0) {
        vm.calculatedCosts.costs.forEach((component, index) => {
          csvRows.push([
            vm.ResourceName,
            vm.OwnerID,
            vm.vcpuCount,
            vm.memoryGb,
            vm.storageGb,
            vm.calculatedCosts.appliedProfiles?.join('; ') || 'None',
            component.name,
            component.type,
            (component.value || 0).toFixed(2),
            component.category || '',
            index === 0 ? (vm.calculatedCosts.totalCost || 0).toFixed(2) : '',
            index === 0 ? (vm.calculatedCosts.totalOneTimeCost || 0).toFixed(2) : ''
          ]);
        });
      } else {
        csvRows.push([
          vm.ResourceName,
          vm.OwnerID,
          vm.vcpuCount,
          vm.memoryGb,
          vm.storageGb,
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
    if (!vm || !vm.calculatedCosts.costs || vm.calculatedCosts.costs.length === 0) {
      return (
        <div style={{ padding: '1rem' }}>
          <p style={{ color: '#6f6f6f' }}>No cost breakdown available</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '1rem' }}>
        <h5 style={{ marginBottom: '1rem' }}>Cost Breakdown</h5>
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>
            Profile: {vm.calculatedCosts.appliedProfiles?.join(', ') || 'None'}
          </p>
          <table style={{ width: '100%', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Component</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Category</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {vm.calculatedCosts.costs.map((component, cIndex) => (
                <tr key={cIndex} style={{ borderBottom: '1px solid #f4f4f4' }}>
                  <td style={{ padding: '0.5rem' }}>{component.name}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <Tag type="gray" size="sm">{component.type}</Tag>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Tag type={
                      component.category === 'hardware' ? 'blue' :
                      component.category === 'operations' ? 'green' :
                      component.category === 'software' ? 'purple' :
                      'gray'
                    } size="sm">
                      {component.category || 'other'}
                    </Tag>
                  </td>
                  <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '500' }}>
                    ${(component.value || 0).toFixed(2)}
                    {component.frequency === 'one_time' && ' (one-time)'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '2px solid #e0e0e0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '600' }}>Total Monthly Cost:</span>
            <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>
              ${(vm.calculatedCosts.totalCost || 0).toFixed(2)}
            </span>
          </div>
          {vm.calculatedCosts.monthlyCapEx > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span>CapEx (Monthly):</span>
              <span style={{ color: '#0f62fe' }}>${(vm.calculatedCosts.monthlyCapEx || 0).toFixed(2)}</span>
            </div>
          )}
          {vm.calculatedCosts.monthlyOpEx > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span>OpEx (Monthly):</span>
              <span style={{ color: '#198038' }}>${(vm.calculatedCosts.monthlyOpEx || 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalMonthlyCost = vmsWithCosts.reduce((sum, vm) => sum + (vm.calculatedCosts.totalCost || 0), 0);
  const totalMonthlyCapEx = vmsWithCosts.reduce((sum, vm) => sum + (vm.calculatedCosts.monthlyCapEx || 0), 0);
  const totalMonthlyOpEx = vmsWithCosts.reduce((sum, vm) => sum + (vm.calculatedCosts.monthlyOpEx || 0), 0);
  const totalOneTimeCost = vmsWithCosts.reduce((sum, vm) => sum + (vm.calculatedCosts.totalOneTimeCost || 0), 0);
  const uncostedVMs = vmsWithCosts.filter(vm => (vm.calculatedCosts.totalCost || 0) === 0 && (vm.calculatedCosts.totalOneTimeCost || 0) === 0);

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <Tile style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.5rem' }}>
              Total Monthly Cost
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '600' }}>${totalMonthlyCost.toFixed(2)}</p>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>AUD per month</p>
          </Tile>

          <Tile style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.5rem' }}>
              Monthly CapEx
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '600', color: '#0f62fe' }}>
              ${totalMonthlyCapEx.toFixed(2)}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>Depreciated hardware</p>
          </Tile>

          <Tile style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.5rem' }}>
              Monthly OpEx
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '600', color: '#198038' }}>
              ${totalMonthlyOpEx.toFixed(2)}
            </p>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>Operational costs</p>
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
          isSortable
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
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
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
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>CapEx vs OpEx:</strong> Capital expenditures (CapEx) represent depreciated hardware 
              costs, while operational expenditures (OpEx) are ongoing monthly costs like power, 
              cooling, and support.
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