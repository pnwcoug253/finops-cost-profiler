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

export function evaluateRules(rules, vm) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return false;
  }

  const results = rules.conditions.map(condition => evaluateCondition(vm, condition));

  if (rules.operator === 'AND') {
    return results.every(result => result);
  } else {
    return results.some(result => result);
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

export function calculateVMCosts(vm, profiles = [], allVMs = []) {
  const costs = [];
  let totalCost = 0;
  let monthlyCapEx = 0;
  let monthlyOpEx = 0;
  const appliedProfiles = [];

  // Get published profiles ordered by priority
  const publishedProfiles = profiles
    .filter(p => p.status === 'published')
    .sort((a, b) => a.priority - b.priority);

  for (const profile of publishedProfiles) {
    if (evaluateRules(profile.rules, vm)) {
      appliedProfiles.push(profile.name);
      
      // Check if this is an advanced profile
      if (profile.costModel === 'advanced') {
        // Calculate advanced costs
        const advancedBreakdown = calculateAdvancedCosts(vm, profile, allVMs);
        totalCost += advancedBreakdown.totalCapEx + advancedBreakdown.totalOpEx;
        monthlyCapEx += advancedBreakdown.totalCapEx;
        monthlyOpEx += advancedBreakdown.totalOpEx;
        costs.push(...advancedBreakdown.components);
      } else {
        // Original simple mode calculation
        profile.costComponents.forEach(component => {
          let componentCost = 0;
          const isRecurring = component.frequency !== 'one_time';

          switch (component.type) {
            case 'per_cpu':
              componentCost = component.value * (vm.vcpuCount || 0);
              break;
            case 'per_gb_memory':
              componentCost = component.value * (vm.memoryGb || 0);
              break;
            case 'per_gb_storage':
              componentCost = component.value * (vm.storageGb || 0);
              break;
            case 'fixed_monthly':
              componentCost = component.value;
              break;
            case 'one_time':
              // For one-time costs, amortize over 12 months
              componentCost = component.value / 12;
              break;
            default:
              componentCost = component.value;
          }

          if (isRecurring || component.type === 'one_time') {
            totalCost += componentCost;
            monthlyOpEx += componentCost; // Simple mode costs are considered OpEx
            costs.push({
              name: component.name,
              type: component.type,
              value: componentCost,
              frequency: component.frequency || 'monthly',
              category: component.category || 'other'
            });
          }
        });
      }
      
      // First match wins - don't process more profiles
      break;
    }
  }

  return {
    totalCost,
    costs,
    appliedProfiles,
    monthlyCapEx,
    monthlyOpEx,
    totalMonthlyCost: totalCost,
    totalOneTimeCost: 0 // For compatibility
  };
}

// Calculate costs for advanced mode with allocation methods
function calculateAdvancedCosts(vm, profile, allVMs = []) {
  const breakdown = {
    profileName: profile.name,
    totalCapEx: 0,
    totalOpEx: 0,
    components: []
  };

  // Get all matching VMs for allocation calculations
  const matchingVMs = allVMs.length > 0 
    ? allVMs.filter(v => evaluateRules(profile.rules, v))
    : [vm]; // Fallback to just current VM if no VM list provided

  // Calculate totals for allocation
  const totals = {
    vmCount: matchingVMs.length || 1,
    totalCPU: matchingVMs.reduce((sum, v) => sum + (v.vcpuCount || 0), 0) || 1,
    totalMemory: matchingVMs.reduce((sum, v) => sum + (v.memoryGb || 0), 0) || 1,
    totalStorage: matchingVMs.reduce((sum, v) => sum + (v.storageGb || 0), 0) || 1
  };

  // Calculate weighted total
  totals.totalWeighted = matchingVMs.reduce((sum, v) => {
    // Weighted score: CPU=40%, Memory=40%, Storage=20%
    const cpuScore = (v.vcpuCount || 0) * 0.4;
    const memoryScore = (v.memoryGb || 0) * 0.4;
    const storageScore = ((v.storageGb || 0) / 100) * 0.2;
    return sum + cpuScore + memoryScore + storageScore;
  }, 0) || 1;

  // Calculate VM's share for different allocation methods
  const vmShares = {
    per_vm: 1 / totals.vmCount,
    per_cpu: (vm.vcpuCount || 0) / totals.totalCPU,
    per_memory: (vm.memoryGb || 0) / totals.totalMemory,
    per_storage: (vm.storageGb || 0) / totals.totalStorage,
    weighted: ((vm.vcpuCount || 0) * 0.4 + (vm.memoryGb || 0) * 0.4 + ((vm.storageGb || 0) / 100) * 0.2) / totals.totalWeighted
  };

  // Process hardware costs (CapEx)
  if (profile.advancedCostComponents?.hardware) {
    profile.advancedCostComponents.hardware.forEach(component => {
      const monthlyDepreciation = (component.purchasePrice || 0) / ((component.depreciationYears || 5) * 12);
      const allocation = component.allocation || 'per_vm';
      const vmShare = vmShares[allocation] || vmShares.per_vm;
      const vmCost = monthlyDepreciation * vmShare;
      
      breakdown.totalCapEx += vmCost;
      breakdown.components.push({
        name: component.name,
        type: 'CapEx (Hardware)',
        subType: component.hardwareType,
        category: 'hardware',
        value: vmCost,
        totalCost: monthlyDepreciation,
        vmShare: vmShare,
        calculation: `$${component.purchasePrice} over ${component.depreciationYears} years × ${(vmShare * 100).toFixed(1)}% share`,
        details: {
          purchasePrice: component.purchasePrice,
          depreciationYears: component.depreciationYears,
          allocation: allocation,
          matchingVMs: totals.vmCount
        }
      });
    });
  }

  // Process operational costs (OpEx)
  if (profile.advancedCostComponents?.operations) {
    profile.advancedCostComponents.operations.forEach(component => {
      const allocation = component.allocation || 'per_vm';
      const vmShare = vmShares[allocation] || vmShares.per_vm;
      const vmCost = (component.monthlyCost || 0) * vmShare;
      
      breakdown.totalOpEx += vmCost;
      breakdown.components.push({
        name: component.name,
        type: `OpEx (${component.category})`,
        subType: component.category,
        category: component.category,
        value: vmCost,
        totalCost: component.monthlyCost,
        vmShare: vmShare,
        calculation: `$${component.monthlyCost}/month × ${(vmShare * 100).toFixed(1)}% share`,
        details: {
          allocation: allocation,
          matchingVMs: totals.vmCount
        }
      });
    });
  }

  return breakdown;
}

export function calculateTotalCosts(resources, costProfiles) {
  let totalMonthly = 0;
  let totalOneTime = 0;
  let totalCapEx = 0;
  let totalOpEx = 0;
  let costedVMs = 0;

  resources.forEach(vm => {
    const costs = calculateVMCosts(vm, costProfiles, resources);
    totalMonthly += costs.totalCost;
    totalOneTime += costs.totalOneTimeCost;
    totalCapEx += costs.monthlyCapEx || 0;
    totalOpEx += costs.monthlyOpEx || 0;
    if (costs.totalCost > 0) {
      costedVMs++;
    }
  });

  return {
    totalMonthly,
    totalOneTime,
    totalCapEx,
    totalOpEx,
    costedVMs,
    uncostedVMs: resources.length - costedVMs
  };
}