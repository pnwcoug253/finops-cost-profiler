import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid,
  Column,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  NumberInput,
  Select,
  SelectItem,
  Button,
  Stack,
  Tile,
  Tag,
  IconButton,
  InlineNotification,
  RadioButtonGroup,
  RadioButton,
  Toggle
} from '@carbon/react';
import { 
  Add, 
  TrashCan, 
  Save, 
  Rule,
  Information
} from '@carbon/react/icons';
import { v4 as uuidv4 } from 'uuid';

function CreateProfile({ costProfiles, setCostProfiles, editMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Initialize form state
  const [profile, setProfile] = useState({
    id: editMode ? '' : uuidv4(),
    name: '',
    description: '',
    status: 'draft',
    priority: 1,
    costModel: 'simple', // New field for cost model type
    rules: {
      operator: 'AND',
      conditions: [],
      groups: []
    },
    costComponents: [],
    advancedCostComponents: { // New structure for advanced mode
      hardware: [],
      operations: [],
      facilities: [],
      software: []
    }
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Load existing profile in edit mode
  useEffect(() => {
    if (editMode && id) {
      const existingProfile = costProfiles.find(p => p.id === id);
      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        navigate('/cost-profiles');
      }
    }
  }, [editMode, id, costProfiles, navigate]);

  // Field options
  const fieldOptions = [
    { value: 'CPU', label: 'CPU Count' },
    { value: 'MemoryGB', label: 'Memory (GB)' },
    { value: 'StorageGB', label: 'Storage (GB)' },
    { value: 'ResourceName', label: 'Resource Name' },
    { value: 'OwnerID', label: 'Owner' },
    { value: 'RegionName', label: 'Region' },
    { value: 'tags', label: 'Tags (key=value)' }
  ];

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_equal', label: 'Greater or Equal' },
    { value: 'less_equal', label: 'Less or Equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Not Contains' }
  ];

  const componentTypeOptions = [
    { value: 'cpu', label: 'Cost per CPU', category: 'hardware' },
    { value: 'memory', label: 'Cost per GB Memory', category: 'hardware' },
    { value: 'storage', label: 'Cost per GB Storage', category: 'hardware' },
    { value: 'fixed', label: 'Fixed Monthly Cost', category: 'operations' },
    { value: 'one_time', label: 'One-Time Cost', category: 'other' },
    { value: 'software_license', label: 'Software License', category: 'software' },
    { value: 'support', label: 'Support Contract', category: 'operations' }
  ];

  const componentCategories = {
    hardware: 'Hardware',
    operations: 'Operations', 
    software: 'Software',
    other: 'Other'
  };

  // Add a new condition
  const addCondition = () => {
    setProfile({
      ...profile,
      rules: {
        ...profile.rules,
        conditions: [
          ...profile.rules.conditions,
          { field: 'CPU', operator: 'greater_than', value: '' }
        ]
      }
    });
  };

  // Remove a condition
  const removeCondition = (index) => {
    setProfile({
      ...profile,
      rules: {
        ...profile.rules,
        conditions: profile.rules.conditions.filter((_, i) => i !== index)
      }
    });
  };

  // Update a condition
  const updateCondition = (index, field, value) => {
    const newConditions = [...profile.rules.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setProfile({
      ...profile,
      rules: {
        ...profile.rules,
        conditions: newConditions
      }
    });
  };

  // Add a cost component
  const addCostComponent = () => {
    setProfile({
      ...profile,
      costComponents: [
        ...profile.costComponents,
        { 
          id: uuidv4(),
          type: 'cpu', 
          name: '', 
          value: 0, 
          unit: 'per CPU/month',
          category: 'hardware' // Add category
        }
      ]
    });
  };

  // Remove a cost component
  const removeCostComponent = (id) => {
    setProfile({
      ...profile,
      costComponents: profile.costComponents.filter(c => c.id !== id)
    });
  };

  // Update a cost component
  const updateCostComponent = (id, field, value) => {
    setProfile({
      ...profile,
      costComponents: profile.costComponents.map(c =>
        c.id === id ? { ...c, [field]: value } : c
      )
    });
  };

  // Update unit based on type
  const updateComponentType = (id, type) => {
    const unitMap = {
      cpu: 'per CPU/month',
      memory: 'per GB/month',
      storage: 'per GB/month',
      fixed: 'per VM/month',
      one_time: 'one time',
      software_license: 'per VM/month',
      support: 'per month'
    };
    
    const componentType = componentTypeOptions.find(opt => opt.value === type);
    
    setProfile({
      ...profile,
      costComponents: profile.costComponents.map(c =>
        c.id === id ? { ...c, type, unit: unitMap[type], category: componentType?.category } : c
      )
    });
  };

  // Add advanced component
  const addAdvancedComponent = (category) => {
    const newComponent = {
      id: uuidv4(),
      name: '',
      category: category
    };

    if (category === 'hardware') {
      newComponent.subType = 'server';
      newComponent.purchasePrice = 0;
      newComponent.depreciationYears = 5;
      newComponent.allocationType = 'per_vm';
    } else if (category === 'operations') {
      newComponent.subType = 'facilities';
      newComponent.monthlyCost = 0;
      newComponent.allocationType = 'per_vm';
    }

    setProfile({
      ...profile,
      advancedCostComponents: {
        ...profile.advancedCostComponents,
        [category]: [...(profile.advancedCostComponents[category] || []), newComponent]
      }
    });
  };

  // Update advanced component
  const updateAdvancedComponent = (category, id, field, value) => {
    setProfile({
      ...profile,
      advancedCostComponents: {
        ...profile.advancedCostComponents,
        [category]: profile.advancedCostComponents[category].map(comp =>
          comp.id === id ? { ...comp, [field]: value } : comp
        )
      }
    });
  };

  // Remove advanced component
  const removeAdvancedComponent = (category, id) => {
    setProfile({
      ...profile,
      advancedCostComponents: {
        ...profile.advancedCostComponents,
        [category]: profile.advancedCostComponents[category].filter(comp => comp.id !== id)
      }
    });
  };

  // Calculate total monthly CapEx
  const calculateAdvancedCapEx = () => {
    const hardware = profile.advancedCostComponents.hardware || [];
    const total = hardware.reduce((sum, comp) => {
      const monthly = (comp.purchasePrice || 0) / ((comp.depreciationYears || 5) * 12);
      return sum + monthly;
    }, 0);
    return total.toFixed(2);
  };

  // Calculate total monthly OpEx
  const calculateAdvancedOpEx = () => {
    const operations = profile.advancedCostComponents.operations || [];
    const total = operations.reduce((sum, comp) => sum + (comp.monthlyCost || 0), 0);
    return total.toFixed(2);
  };
  const validateForm = () => {
    const newErrors = {};
    
    if (!profile.name.trim()) {
      newErrors.name = 'Profile name is required';
    }
    
    if (!profile.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (profile.rules.conditions.length === 0) {
      newErrors.rules = 'At least one rule condition is required';
    }
    
    if (profile.costComponents.length === 0) {
      newErrors.components = 'At least one cost component is required';
    }
    
    profile.costComponents.forEach((comp, index) => {
      if (!comp.name.trim()) {
        newErrors[`component_name_${index}`] = 'Component name is required';
      }
      if (comp.value <= 0) {
        newErrors[`component_value_${index}`] = 'Value must be greater than 0';
      }
    });
    
    console.log('Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile
  const handleSave = () => {
    console.log('Save clicked');
    console.log('Current profile:', profile);
    
    if (!validateForm()) {
      console.log('Validation failed');
      return;
    }
    
    const now = new Date().toISOString();
    const profileToSave = {
      ...profile,
      modifiedDate: now,
      createdDate: editMode ? profile.createdDate : now
    };
    
    console.log('Saving profile:', profileToSave);
    
    try {
      if (editMode) {
        setCostProfiles(costProfiles.map(p =>
          p.id === profile.id ? profileToSave : p
        ));
      } else {
        setCostProfiles([...costProfiles, profileToSave]);
      }
      
      setShowSuccess(true);
      
      // Use a more compatible navigation approach
      setTimeout(() => {
        // Check if we're in development or production
        if (window.location.hostname === 'localhost') {
          navigate('/cost-profiles');
        } else {
          // For production, use a full page navigation
          window.location.href = `${window.location.origin}/cost-profiles`;
        }
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrors({ save: 'Failed to save profile. Please try again.' });
    }
  };

  return (
    <Grid style={{ padding: '2rem' }}>
      <Column lg={16} md={8} sm={4} style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          {editMode ? 'Edit Cost Profile' : 'Create Cost Profile'}
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#525252' }}>
          Define cost allocation rules and pricing components for your on-premises infrastructure. 
          Rules determine which VMs this profile applies to (first match wins), and cost components 
          define how costs are calculated. <strong>Note: Profiles must be published to apply costs to VMs.</strong>
        </p>
      </Column>

      {showSuccess && (
        <Column lg={16} md={8} sm={4}>
          <InlineNotification
            kind="success"
            title="Success"
            subtitle={`Cost profile "${profile.name}" has been ${editMode ? 'updated' : 'created'} successfully.`}
          />
        </Column>
      )}

      <Column lg={16} md={8} sm={4}>
        <Form>
          {/* Basic Information */}
          <Tile style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Basic Information</h3>
            
            <Stack gap={6}>
              <TextInput
                id="profile-name"
                labelText="Profile Name"
                placeholder="e.g., Production Environment Costs"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                invalid={!!errors.name}
                invalidText={errors.name}
              />
              
              <TextArea
                id="profile-description"
                labelText="Description"
                placeholder="Describe when this profile should be used..."
                rows={3}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                invalid={!!errors.description}
                invalidText={errors.description}
              />
              
              <NumberInput
                id="profile-priority"
                label="Priority"
                helperText="Lower numbers have higher priority (first match wins)"
                min={1}
                max={999}
                value={profile.priority}
                onChange={(e, { value }) => setProfile({ ...profile, priority: value })}
              />
            </Stack>
          </Tile>

          {/* Cost Model Selection */}
          <Tile style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Cost Model</h3>
            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1.5rem' }}>
              Choose how you want to define infrastructure costs. Simple mode is great for quick estimates, 
              while Advanced mode provides detailed CapEx/OpEx tracking with depreciation.
            </p>
            
            <RadioButtonGroup
              legendText="Select Cost Model Type"
              name="cost-model"
              value={profile.costModel}
              onChange={(value) => setProfile({ ...profile, costModel: value })}
            >
              <RadioButton 
                labelText="Simple - Basic cost allocation with categories" 
                value="simple" 
              />
              <RadioButton 
                labelText="Advanced - Detailed CapEx/OpEx with depreciation" 
                value="advanced" 
              />
            </RadioButtonGroup>
          </Tile>

          {/* Rule Configuration */}
          <Tile style={{ marginBottom: '2rem', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Rule Configuration</h3>
              <Tag type="blue" renderIcon={Information}>
                First matching profile wins
              </Tag>
            </div>
            
            {errors.rules && (
              <InlineNotification
                kind="error"
                title={errors.rules}
                hideCloseButton
                style={{ marginBottom: '1rem' }}
              />
            )}
            
            <div style={{ marginBottom: '1.5rem' }}>
              <RadioButtonGroup
                legendText="Rule Logic Operator"
                name="rule-operator"
                defaultSelected={profile.rules.operator}
                onChange={(value) => setProfile({
                  ...profile,
                  rules: { ...profile.rules, operator: value }
                })}
              >
                <RadioButton labelText="Match ALL conditions (AND)" value="AND" />
                <RadioButton labelText="Match ANY condition (OR)" value="OR" />
              </RadioButtonGroup>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Conditions</p>
              <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1rem' }}>
                Define conditions to match VMs. For example: CPU greater than 8, Tags.environment = "production"
              </p>
            </div>
            
            {profile.rules.conditions.map((condition, index) => (
              <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <Select
                  id={`field-${index}`}
                  labelText="Field"
                  value={condition.field}
                  onChange={(e) => updateCondition(index, 'field', e.target.value)}
                >
                  {fieldOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} text={opt.label} />
                  ))}
                </Select>
                
                <Select
                  id={`operator-${index}`}
                  labelText="Operator"
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                >
                  {operatorOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} text={opt.label} />
                  ))}
                </Select>
                
                <TextInput
                  id={`value-${index}`}
                  labelText="Value"
                  placeholder={condition.field === 'tags' ? 'key=value' : 'Enter value'}
                  value={condition.value}
                  onChange={(e) => updateCondition(index, 'value', e.target.value)}
                />
                
                <IconButton
                  label="Remove condition"
                  kind="ghost"
                  size="lg"
                  onClick={() => removeCondition(index)}
                >
                  <TrashCan />
                </IconButton>
              </div>
            ))}
            
            <Button
              kind="tertiary"
              renderIcon={Add}
              onClick={addCondition}
              size="sm"
            >
              Add Condition
            </Button>
          </Tile>

          {/* Cost Components */}
          <Tile style={{ marginBottom: '2rem', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>
              {profile.costModel === 'simple' ? 'Cost Components' : 'Advanced Cost Configuration'}
            </h3>
            
            {errors.components && (
              <InlineNotification
                kind="error"
                title={errors.components}
                hideCloseButton
                style={{ marginBottom: '1rem' }}
              />
            )}
            
            {profile.costModel === 'simple' ? (
              <>
                <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1.5rem' }}>
                  Define how costs are calculated when this profile matches a VM. Components are organized 
                  by category for better cost visibility.
                </p>
                
                {profile.costComponents.map((component, index) => {
                  const componentType = componentTypeOptions.find(opt => opt.value === component.type);
                  const categoryName = componentCategories[componentType?.category || 'other'];
                  
                  return (
                    <div key={component.id} style={{ 
                      padding: '1rem', 
                      backgroundColor: '#f4f4f4', 
                      marginBottom: '1rem',
                      borderLeft: '4px solid #0f62fe'
                    }}>
                      <Tag type="gray" size="sm" style={{ marginBottom: '0.5rem' }}>
                        {categoryName}
                      </Tag>
                      <Stack gap={4}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <TextInput
                            id={`component-name-${index}`}
                            labelText="Component Name"
                            placeholder="e.g., CPU Cost, VMware License"
                            value={component.name}
                            onChange={(e) => updateCostComponent(component.id, 'name', e.target.value)}
                            invalid={!!errors[`component_name_${index}`]}
                            invalidText={errors[`component_name_${index}`]}
                          />
                          
                          <Select
                            id={`component-type-${index}`}
                            labelText="Type"
                            value={component.type}
                            onChange={(e) => updateComponentType(component.id, e.target.value)}
                          >
                            {componentTypeOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} text={opt.label} />
                            ))}
                          </Select>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                          <NumberInput
                            id={`component-value-${index}`}
                            label="Cost Value (AUD)"
                            min={0}
                            step={0.01}
                            value={component.value}
                            onChange={(e, { value }) => updateCostComponent(component.id, 'value', value)}
                            invalid={!!errors[`component_value_${index}`]}
                            invalidText={errors[`component_value_${index}`]}
                          />
                          
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.25rem' }}>Unit</p>
                            <p style={{ padding: '0.75rem', backgroundColor: '#e0e0e0' }}>{component.unit}</p>
                          </div>
                          
                          <IconButton
                            label="Remove component"
                            kind="ghost"
                            size="lg"
                            onClick={() => removeCostComponent(component.id)}
                          >
                            <TrashCan />
                          </IconButton>
                        </div>
                      </Stack>
                    </div>
                  );
                })}
                
                <Button
                  kind="tertiary"
                  renderIcon={Add}
                  onClick={addCostComponent}
                  size="sm"
                >
                  Add Cost Component
                </Button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1.5rem' }}>
                  Configure detailed costs with proper CapEx/OpEx classification and depreciation schedules. 
                  Hardware costs will be depreciated over time, while operational costs are expensed monthly.
                </p>
                
                {/* Hardware Costs (CapEx) */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Hardware Costs (CapEx)
                    <Tag type="blue" size="sm">Depreciated</Tag>
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1rem' }}>
                    Capital expenditures that are depreciated over time. Monthly cost = Purchase Price ÷ (Depreciation Years × 12)
                  </p>
                  
                  {(!profile.advancedCostComponents.hardware || profile.advancedCostComponents.hardware.length === 0) ? (
                    <div style={{ 
                      padding: '2rem', 
                      backgroundColor: '#f4f4f4', 
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      <p style={{ color: '#525252', marginBottom: '1rem' }}>No hardware costs defined</p>
                      <Button
                        kind="tertiary"
                        size="sm"
                        renderIcon={Add}
                        onClick={() => addAdvancedComponent('hardware')}
                      >
                        Add Hardware Cost
                      </Button>
                    </div>
                  ) : (
                    <>
                      {profile.advancedCostComponents.hardware.map((component, index) => (
                        <div key={component.id} style={{ 
                          padding: '1rem', 
                          backgroundColor: '#f4f4f4', 
                          marginBottom: '1rem',
                          borderLeft: '4px solid #0f62fe'
                        }}>
                          <Stack gap={4}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <TextInput
                                id={`hardware-name-${index}`}
                                labelText="Component Name"
                                placeholder="e.g., Server Hardware, Storage Array"
                                value={component.name}
                                onChange={(e) => updateAdvancedComponent('hardware', component.id, 'name', e.target.value)}
                              />
                              
                              <Select
                                id={`hardware-type-${index}`}
                                labelText="Hardware Type"
                                value={component.subType || 'server'}
                                onChange={(e) => updateAdvancedComponent('hardware', component.id, 'subType', e.target.value)}
                              >
                                <SelectItem value="server" text="Servers" />
                                <SelectItem value="storage" text="Storage" />
                                <SelectItem value="network" text="Network Equipment" />
                                <SelectItem value="other" text="Other Hardware" />
                              </Select>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <NumberInput
                                id={`hardware-cost-${index}`}
                                label="Total Purchase Price (AUD)"
                                min={0}
                                step={100}
                                value={component.purchasePrice || 0}
                                onChange={(e, { value }) => updateAdvancedComponent('hardware', component.id, 'purchasePrice', value)}
                              />
                              
                              <NumberInput
                                id={`hardware-depreciation-${index}`}
                                label="Depreciation Period (Years)"
                                min={1}
                                max={10}
                                value={component.depreciationYears || 5}
                                onChange={(e, { value }) => updateAdvancedComponent('hardware', component.id, 'depreciationYears', value)}
                              />
                              
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '0.25rem' }}>Monthly CapEx</p>
                                <p style={{ padding: '0.75rem', backgroundColor: '#e0e0e0', fontWeight: '600' }}>
                                  ${((component.purchasePrice || 0) / ((component.depreciationYears || 5) * 12)).toFixed(2)}/month
                                </p>
                              </div>
                              
                              <IconButton
                                label="Remove component"
                                kind="ghost"
                                size="lg"
                                onClick={() => removeAdvancedComponent('hardware', component.id)}
                                style={{ alignSelf: 'flex-end' }}
                              >
                                <TrashCan />
                              </IconButton>
                            </div>
                            
                            <Select
                              id={`hardware-allocation-${index}`}
                              labelText="Allocation Method"
                              value={component.allocationType || 'per_vm'}
                              onChange={(e) => updateAdvancedComponent('hardware', component.id, 'allocationType', e.target.value)}
                            >
                              <SelectItem value="per_vm" text="Divide equally per VM" />
                              <SelectItem value="per_cpu" text="Allocate per CPU" />
                              <SelectItem value="per_memory" text="Allocate per GB Memory" />
                              <SelectItem value="weighted" text="Weighted by resource usage" />
                            </Select>
                          </Stack>
                        </div>
                      ))}
                      <Button
                        kind="tertiary"
                        size="sm"
                        renderIcon={Add}
                        onClick={() => addAdvancedComponent('hardware')}
                      >
                        Add Hardware Cost
                      </Button>
                    </>
                  )}
                </div>

                {/* Operational Costs (OpEx) */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Operational Costs (OpEx)
                    <Tag type="green" size="sm">Monthly Expense</Tag>
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#525252', marginBottom: '1rem' }}>
                    Operating expenses that are fully expensed each month.
                  </p>
                  
                  {(!profile.advancedCostComponents.operations || profile.advancedCostComponents.operations.length === 0) ? (
                    <div style={{ 
                      padding: '2rem', 
                      backgroundColor: '#f4f4f4', 
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      <p style={{ color: '#525252', marginBottom: '1rem' }}>No operational costs defined</p>
                      <Button
                        kind="tertiary"
                        size="sm"
                        renderIcon={Add}
                        onClick={() => addAdvancedComponent('operations')}
                      >
                        Add Operational Cost
                      </Button>
                    </div>
                  ) : (
                    <>
                      {profile.advancedCostComponents.operations.map((component, index) => (
                        <div key={component.id} style={{ 
                          padding: '1rem', 
                          backgroundColor: '#f4f4f4', 
                          marginBottom: '1rem',
                          borderLeft: '4px solid #24a148'
                        }}>
                          <Stack gap={4}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                              <TextInput
                                id={`operations-name-${index}`}
                                labelText="Component Name"
                                placeholder="e.g., Power & Cooling, Support Contract"
                                value={component.name}
                                onChange={(e) => updateAdvancedComponent('operations', component.id, 'name', e.target.value)}
                              />
                              
                              <Select
                                id={`operations-type-${index}`}
                                labelText="Cost Type"
                                value={component.subType || 'facilities'}
                                onChange={(e) => updateAdvancedComponent('operations', component.id, 'subType', e.target.value)}
                              >
                                <SelectItem value="facilities" text="Facilities (Power, Cooling, Space)" />
                                <SelectItem value="support" text="Support & Maintenance" />
                                <SelectItem value="staff" text="Staff Allocation" />
                                <SelectItem value="software" text="Software Licenses" />
                                <SelectItem value="other" text="Other OpEx" />
                              </Select>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                              <NumberInput
                                id={`operations-cost-${index}`}
                                label="Monthly Cost (AUD)"
                                min={0}
                                step={10}
                                value={component.monthlyCost || 0}
                                onChange={(e, { value }) => updateAdvancedComponent('operations', component.id, 'monthlyCost', value)}
                              />
                              
                              <Select
                                id={`operations-allocation-${index}`}
                                labelText="Allocation Method"
                                value={component.allocationType || 'per_vm'}
                                onChange={(e) => updateAdvancedComponent('operations', component.id, 'allocationType', e.target.value)}
                              >
                                <SelectItem value="per_vm" text="Divide equally per VM" />
                                <SelectItem value="per_cpu" text="Allocate per CPU" />
                                <SelectItem value="per_memory" text="Allocate per GB Memory" />
                                <SelectItem value="weighted" text="Weighted by resource usage" />
                              </Select>
                              
                              <IconButton
                                label="Remove component"
                                kind="ghost"
                                size="lg"
                                onClick={() => removeAdvancedComponent('operations', component.id)}
                              >
                                <TrashCan />
                              </IconButton>
                            </div>
                          </Stack>
                        </div>
                      ))}
                      <Button
                        kind="tertiary"
                        size="sm"
                        renderIcon={Add}
                        onClick={() => addAdvancedComponent('operations')}
                      >
                        Add Operational Cost
                      </Button>
                    </>
                  )}
                </div>

                {/* Cost Summary */}
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: '#e0e5f7', 
                  borderLeft: '4px solid #0f62fe',
                  marginTop: '2rem'
                }}>
                  <h4 style={{ marginBottom: '1rem' }}>Monthly Cost Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#525252' }}>Total CapEx (Monthly)</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#0f62fe' }}>
                        ${calculateAdvancedCapEx()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#525252' }}>Total OpEx (Monthly)</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#24a148' }}>
                        ${calculateAdvancedOpEx()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.875rem', color: '#525252' }}>Total Monthly Cost</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                        ${(parseFloat(calculateAdvancedCapEx()) + parseFloat(calculateAdvancedOpEx())).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Tile>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button
              kind="secondary"
              onClick={() => {
                if (window.location.hostname === 'localhost') {
                  navigate('/cost-profiles');
                } else {
                  window.location.href = `${window.location.origin}/cost-profiles`;
                }
              }}
            >
              Cancel
            </Button>
            <Button
              kind="primary"
              renderIcon={Save}
              onClick={handleSave}
            >
              {editMode ? 'Update Profile' : 'Create Profile'}
            </Button>
          </div>
        </Form>
      </Column>
    </Grid>
  );
}

export default CreateProfile;