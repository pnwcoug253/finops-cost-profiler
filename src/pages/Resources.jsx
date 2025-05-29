import React, { useState } from 'react';
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
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tag,
  Button,
  Modal,
  FileUploader,
  InlineNotification
} from '@carbon/react';
import { Upload, Download } from '@carbon/react/icons';

// Remove the destructuring - we'll use the render prop pattern instead

function Resources({ resources }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);

  // Prepare data for the table
  const rows = resources.map(vm => ({
    id: vm.ResourceId,
    name: vm.ResourceName,
    type: vm.ResourceType,
    region: vm.RegionName,
    owner: vm.OwnerID,
    cpu: vm.CPU,
    memory: vm.MemoryGB,
    storage: vm.StorageGB,
    tags: vm.Tags
  }));

  const headers = [
    { key: 'name', header: 'Resource Name' },
    { key: 'type', header: 'Type' },
    { key: 'region', header: 'Region' },
    { key: 'owner', header: 'Owner' },
    { key: 'cpu', header: 'CPU' },
    { key: 'memory', header: 'Memory (GB)' },
    { key: 'storage', header: 'Storage (GB)' },
    { key: 'tags', header: 'Tags' }
  ];

  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileUpload = (event) => {
    // In a real implementation, this would parse the FOCUS format file
    console.log('Files uploaded:', event.target.files);
    setShowUploadSuccess(true);
    setTimeout(() => {
      setUploadModalOpen(false);
      setShowUploadSuccess(false);
    }, 2000);
  };

  const exportData = () => {
    // Create CSV content
    const csvContent = [
      // Headers
      ['ResourceId', 'ResourceName', 'ResourceType', 'RegionName', 'OwnerID', 'CPU', 'MemoryGB', 'StorageGB', 'Tags'],
      // Data rows
      ...resources.map(vm => [
        vm.ResourceId,
        vm.ResourceName,
        vm.ResourceType,
        vm.RegionName,
        vm.OwnerID,
        vm.CPU,
        vm.MemoryGB,
        vm.StorageGB,
        JSON.stringify(vm.Tags)
      ])
    ].map(row => row.join(',')).join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vm-resources.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderTags = (tags) => {
    if (!tags || Object.keys(tags).length === 0) {
      return <span style={{ color: '#6f6f6f' }}>No tags</span>;
    }
    
    return (
      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
        {Object.entries(tags).map(([key, value]) => (
          <Tag key={key} type="blue" size="sm">
            {key}={value}
          </Tag>
        ))}
      </div>
    );
  };

  return (
    <Grid style={{ padding: '2rem' }}>
      <Column lg={16} md={8} sm={4} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Resources</h1>
        <p style={{ fontSize: '1.125rem', color: '#525252' }}>
          View and manage your on-premises virtual machines. This data is imported from your 
          VMware environment in FOCUS format. Cost profiles are applied to these resources 
          to calculate infrastructure costs.
        </p>
      </Column>

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
            getToolbarProps,
            onInputChange,
            getTableContainerProps
          }) => (
            <TableContainer {...getTableContainerProps()}>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch
                    placeholder="Search resources..."
                    onChange={(e) => {
                      onInputChange(e);
                      setSearchTerm(e.target.value);
                    }}
                  />
                  <Button
                    kind="secondary"
                    renderIcon={Upload}
                    onClick={() => setUploadModalOpen(true)}
                  >
                    Upload FOCUS Data
                  </Button>
                  <Button
                    kind="secondary"
                    renderIcon={Download}
                    onClick={exportData}
                  >
                    Export
                  </Button>
                </TableToolbarContent>
              </TableToolbar>
              <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => {
                    const resource = resources.find(r => r.ResourceId === row.id);
                    return (
                      <TableRow {...getRowProps({ row })}>
                        <TableCell>{row.cells[0].value}</TableCell>
                        <TableCell>{row.cells[1].value}</TableCell>
                        <TableCell>{row.cells[2].value}</TableCell>
                        <TableCell>{row.cells[3].value}</TableCell>
                        <TableCell>{row.cells[4].value}</TableCell>
                        <TableCell>{row.cells[5].value}</TableCell>
                        <TableCell>{row.cells[6].value}</TableCell>
                        <TableCell>{renderTags(resource.Tags)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTable>
      </Column>

      {/* Summary Statistics */}
      <Column lg={16} md={8} sm={4} style={{ marginTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f4f4f4', borderLeft: '4px solid #0f62fe' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>Total VMs</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>{resources.length}</p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f4f4f4', borderLeft: '4px solid #0f62fe' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>Total CPUs</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {resources.reduce((sum, vm) => sum + vm.CPU, 0)}
            </p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f4f4f4', borderLeft: '4px solid #0f62fe' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>Total Memory</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {resources.reduce((sum, vm) => sum + vm.MemoryGB, 0)} GB
            </p>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#f4f4f4', borderLeft: '4px solid #0f62fe' }}>
            <p style={{ fontSize: '0.875rem', color: '#525252' }}>Total Storage</p>
            <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
              {(resources.reduce((sum, vm) => sum + vm.StorageGB, 0) / 1000).toFixed(1)} TB
            </p>
          </div>
        </div>
      </Column>

      {/* Upload Modal */}
      <Modal
        open={uploadModalOpen}
        onRequestClose={() => {
          setUploadModalOpen(false);
          setShowUploadSuccess(false);
        }}
        modalHeading="Upload FOCUS Data"
        primaryButtonText="Upload"
        secondaryButtonText="Cancel"
        primaryButtonDisabled={!showUploadSuccess}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ marginBottom: '1rem' }}>
            Upload your VMware resource data in FOCUS format. The file should be a CSV 
            containing your virtual machine inventory with the required FOCUS columns.
          </p>
          
          {showUploadSuccess && (
            <InlineNotification
              kind="success"
              title="Success"
              subtitle="File uploaded successfully. Resources will be updated."
              style={{ marginBottom: '1rem' }}
            />
          )}
          
          <FileUploader
            accept={['.csv']}
            buttonLabel="Select file"
            filenameStatus="edit"
            labelDescription="Only CSV files in FOCUS format are accepted"
            labelTitle="Upload file"
            multiple={false}
            onChange={handleFileUpload}
          />
          
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f4f4f4' }}>
            <p style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Required FOCUS columns:</p>
            <ul style={{ marginLeft: '1.5rem', fontSize: '0.875rem' }}>
              <li>ResourceId</li>
              <li>ResourceName</li>
              <li>ResourceType</li>
              <li>ServiceCategory</li>
              <li>ServiceName</li>
              <li>RegionName</li>
              <li>Tags (optional)</li>
            </ul>
          </div>
        </div>
      </Modal>
    </Grid>
  );
}

export default Resources;