// Utility functions for calculating VM costs based on cost profiles

export function evaluateCondition(vm, condition) {
  const { field, operator, value } = condition;
  
  // Get the field value from VM
  let vmValue;
  if (field === 'tags') {
    // Special handling for tags
    const [tagKey, tagValue] = value.split('=');
    vmValue = vm.Tags?.[tagKey];
    return operator === 'equals' ? vmValue === tagValue : vmValue !== tagValue;
  } else if (field.startsWith('Tags.')) {
    // Handle Tags.key format
    const tagKey = field.substring(5);
    vmValue = vm.Tags?.[tagKey];
  } else {
    // Direct field access
    vmValue = vm[field];
  }

  // Perform comparison based on operator
  switch (operator) {
    case 'equals':
      return vmValue == value;
    case 'not_equals':
      return vmValue != value;
    case 'greater_than':
      return Number(vmValue) > Number(value);
    case 'less_than':
      return Number(vmValue) < Number(value);
    case 'greater_equal':
      return Number(vmValue) >= Number(value);
    case 'less_equal':
      return Number(vmValue) <= Number(value);
    case 'contains':
      return String(vmValue).toLowerCase().includes(String(value).toLowerCase());
    case 'not_contains':
      return !String(vmValue).toLowerCase().includes(String(value).toLowerCase());
    default:
      return false;
  }
}

export function evaluateRuleGroup(vm, ruleGroup) {
  const { operator, conditions, groups } = ruleGroup;
  
  // Evaluate all conditions
  const conditionResults = conditions.map(condition => evaluateCondition(vm, condition));
  
  // Evaluate nested groups recursively
  const groupResults = groups ? groups.map(group => evaluateRuleGroup(vm, group)) : [];
  
  // Combine all results
  const allResults = [...conditionResults, ...groupResults];
  
  // Apply logical operator
  if (operator === 'AND') {
    return allResults.every(result => result);
  } else {
    return allResults.some(result => result);
  }
}

export function calculateVMCosts(vm, costProfiles) {
  const result = {
    totalMonthlyCost: 0,
    totalOneTimeCost: 0,
    matchedProfiles: [],
    breakdowns: []
  };

  // Only process published profiles
  const publishedProfiles = costProfiles.filter(profile => profile.status === 'published');

  // Sort profiles by priority (lower number = higher priority)
  const sortedProfiles = [...publishedProfiles].sort((a, b) => (a.priority || 999) - (b.priority || 999));

  // Track which profiles have been applied
  const appliedProfiles = new Set();

  for (const profile of sortedProfiles) {
    // Check if this profile matches the VM
    if (evaluateRuleGroup(vm, profile.rules)) {
      // First match wins - skip if we already have a match
      if (appliedProfiles.size > 0) {
        continue;
      }

      appliedProfiles.add(profile.id);
      result.matchedProfiles.push(profile.name);

      // Calculate costs for each component
      const breakdown = {
        profileName: profile.name,
        components: []
      };

      profile.costComponents.forEach(component => {
        let cost = 0;
        
        if (component.type === 'one_time') {
          // One-time costs are not added to monthly
          result.totalOneTimeCost += component.value;
          breakdown.components.push({
            name: component.name,
            type: component.type,
            cost: component.value,
            unit: component.unit,
            isOneTime: true
          });
        } else {
          switch (component.type) {
            case 'cpu':
              cost = vm.CPU * component.value;
              break;
            case 'memory':
              cost = vm.MemoryGB * component.value;
              break;
            case 'storage':
              cost = vm.StorageGB * component.value;
              break;
            case 'fixed':
              cost = component.value;
              break;
          }

          result.totalMonthlyCost += cost;
          breakdown.components.push({
            name: component.name,
            type: component.type,
            cost: cost,
            unit: component.unit,
            calculation: `${getCalculationDescription(component, vm)} = ${cost.toFixed(2)}`
          });
        }
      });

      result.breakdowns.push(breakdown);
    }
  }

  return result;
}

function getCalculationDescription(component, vm) {
  switch (component.type) {
    case 'cpu':
      return `${vm.CPU} CPUs × $${component.value}`;
    case 'memory':
      return `${vm.MemoryGB} GB × $${component.value}`;
    case 'storage':
      return `${vm.StorageGB} GB × $${component.value}`;
    case 'fixed':
      return `Fixed cost`;
    default:
      return '';
  }
}

export function calculateTotalCosts(resources, costProfiles) {
  let totalMonthly = 0;
  let totalOneTime = 0;
  let costedVMs = 0;

  resources.forEach(vm => {
    const costs = calculateVMCosts(vm, costProfiles);
    totalMonthly += costs.totalMonthlyCost;
    totalOneTime += costs.totalOneTimeCost;
    if (costs.totalMonthlyCost > 0 || costs.totalOneTimeCost > 0) {
      costedVMs++;
    }
  });

  return {
    totalMonthly,
    totalOneTime,
    costedVMs,
    uncostedVMs: resources.length - costedVMs
  };
}