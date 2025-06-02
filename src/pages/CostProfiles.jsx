import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button,
  Tag,
  OverflowMenu,
  OverflowMenuItem,
  Modal,
  InlineNotification
} from '@carbon/react';
import { Add, Edit, TrashCan, View, CheckmarkFilled } from '@carbon/react/icons';

// Remove the destructuring - we'll use the render prop pattern instead

function CostProfiles({ costProfiles, setCostProfiles }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);

  // Calculate profile counts
  const publishedProfiles = costProfiles.filter(p => p.status === 'published').length;
  const draftProfiles = costProfiles.filter(p => p.status === 'draft').length;

  // Prepare data for the table
  const rows = costProfiles.map(profile => {
    // Calculate component count based on cost model type
    let componentCount = 0;
    if (profile.costModel === 'advanced' && profile.advancedCostComponents) {
      // Count all advanced components
      componentCount = 
        (profile.advancedCostComponents.hardware?.length || 0) +
        (profile.advancedCostComponents.operations?.length || 0) +
        (profile.advancedCostComponents.facilities?.length || 0) +
        (profile.advancedCostComponents.software?.length || 0);
    } else {
      // Simple mode
      componentCount = profile.costComponents?.length || 0;
    }

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      status: profile.status,
      priority: profile.priority || 999,
      componentCount: componentCount,
      costModel: profile.costModel || 'simple',
      createdDate: new Date(profile.createdDate).toLocaleDateString(),
      modifiedDate: new Date(profile.modifiedDate).toLocaleDateString()
    };
  });

  const headers = [
    { key: 'name', header: 'Profile Name' },
    { key: 'description', header: 'Description' },
    { key: 'status', header: 'Status' },
    { key: 'costModel', header: 'Model' },
    { key: 'priority', header: 'Priority' },
    { key: 'componentCount', header: 'Cost Components' },
    { key: 'modifiedDate', header: 'Last Modified' },
    { key: 'actions', header: 'Actions' }
  ];

  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    const profile = costProfiles.find(p => p.id === id);
    setProfileToDelete(profile);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    setCostProfiles(costProfiles.filter(p => p.id !== profileToDelete.id));
    setDeleteModalOpen(false);
    setProfileToDelete(null);
  };

  const handleStatusChange = (id, newStatus) => {
    setCostProfiles(costProfiles.map(profile =>
      profile.id === id
        ? { ...profile, status: newStatus, modifiedDate: new Date().toISOString() }
        : profile
    ));
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'published':
        return <Tag type="green" size="sm">Published</Tag>;
      case 'draft':
        return <Tag type="gray" size="sm">Draft</Tag>;
      case 'in_review':
        return <Tag type="blue" size="sm">In Review</Tag>;
      default:
        return <Tag type="gray" size="sm">{status}</Tag>;
    }
  };

  return (
    <Grid style={{ padding: '2rem' }}>
      <Column lg={16} md={8} sm={4} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Cost Profiles</h1>
        <p style={{ fontSize: '1.125rem', color: '#525252' }}>
          Manage cost allocation profiles for your on-premises infrastructure. Cost profiles define 
          how infrastructure costs are calculated and assigned to virtual machines based on their 
          attributes and tags. <strong>Important: Only published profiles will apply costs to VMs.</strong>
        </p>
      </Column>

      {/* Add help banner if there are unpublished profiles */}
      {draftProfiles > 0 && (
        <Column lg={16} md={8} sm={4} style={{ marginBottom: '1rem' }}>
          <InlineNotification
            kind="info"
            title={`You have ${draftProfiles} draft profile${draftProfiles > 1 ? 's' : ''}`}
            subtitle="Draft profiles don't apply costs to VMs. Use the menu to publish profiles when ready."
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
            getToolbarProps,
            onInputChange,
            getTableContainerProps
          }) => (
            <TableContainer {...getTableContainerProps()}>
              <TableToolbar {...getToolbarProps()}>
                <TableToolbarContent>
                  <TableToolbarSearch
                    placeholder="Search cost profiles..."
                    onChange={(e) => {
                      onInputChange(e);
                      setSearchTerm(e.target.value);
                    }}
                  />
                  <Button
                    kind="primary"
                    renderIcon={Add}
                    onClick={() => navigate('/cost-profiles/create')}
                  >
                    Create Profile
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
                    const profile = costProfiles.find(p => p.id === row.id);
                    return (
                      <TableRow {...getRowProps({ row })}>
                        <TableCell>{row.cells[0].value}</TableCell>
                        <TableCell>{row.cells[1].value}</TableCell>
                        <TableCell>{getStatusTag(row.cells[2].value)}</TableCell>
                        <TableCell>
                          <Tag type={row.cells[3].value === 'advanced' ? 'purple' : 'gray'} size="sm">
                            {row.cells[3].value === 'advanced' ? 'Advanced' : 'Simple'}
                          </Tag>
                        </TableCell>
                        <TableCell>{row.cells[4].value}</TableCell>
                        <TableCell>{row.cells[5].value}</TableCell>
                        <TableCell>{row.cells[6].value}</TableCell>
                        <TableCell>
                          <OverflowMenu flipped>
                            <OverflowMenuItem
                              itemText="View"
                              onClick={() => navigate(`/cost-profiles/edit/${row.id}`)}
                            />
                            <OverflowMenuItem
                              itemText="Edit"
                              onClick={() => navigate(`/cost-profiles/edit/${row.id}`)}
                            />
                            {profile.status === 'draft' && (
                              <OverflowMenuItem
                                itemText="Submit for Review"
                                onClick={() => handleStatusChange(row.id, 'in_review')}
                              />
                            )}
                            {profile.status === 'in_review' && (
                              <OverflowMenuItem
                                itemText="Publish"
                                onClick={() => handleStatusChange(row.id, 'published')}
                              />
                            )}
                            {profile.status === 'published' && (
                              <OverflowMenuItem
                                itemText="Unpublish"
                                onClick={() => handleStatusChange(row.id, 'draft')}
                              />
                            )}
                            <OverflowMenuItem
                              itemText="Delete"
                              isDelete
                              onClick={() => handleDelete(row.id)}
                            />
                          </OverflowMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredRows.length === 0 && (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
                    No cost profiles found
                  </p>
                  <Button
                    kind="primary"
                    renderIcon={Add}
                    onClick={() => navigate('/cost-profiles/create')}
                  >
                    Create Your First Profile
                  </Button>
                </div>
              )}
            </TableContainer>
          )}
        </DataTable>
      </Column>

      <Modal
        open={deleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        onRequestSubmit={confirmDelete}
        modalHeading="Delete Cost Profile"
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        danger
      >
        <p>
          Are you sure you want to delete the cost profile "{profileToDelete?.name}"? 
          This action cannot be undone.
        </p>
      </Modal>
    </Grid>
  );
}

export default CostProfiles;