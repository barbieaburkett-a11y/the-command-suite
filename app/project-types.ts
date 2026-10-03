export type ProjectTypeProfile = {
  key: string;
  label: string;
  category: string;
  categoryLabel: string;
  automationClass: 'general' | 'remodel' | 'new-construction' | 'trade-specific';
  defaultWorkflow: string;
  defaultComplianceKeys: readonly string[];
  permitRequirements: readonly string[];
  inspectionRequirements: readonly string[];
  closeoutRequirements: readonly string[];
};

const baseCompliance = ['documentation-standards', 'photo-standards', 'sop-index'] as const;
const permitCompliance = [...baseCompliance, 'permit-checklist', 'inspection-checklist', 'permit-packet', 'inspection-packet'] as const;

const definitions: Array<[string, string, string, string, ProjectTypeProfile['automationClass'], string, readonly string[]]> = [
  ['residential','Residential','single-family-home','Single-family home','new-construction','permit',permitCompliance],
  ['residential','Residential','home-addition','Home addition','new-construction','permit',permitCompliance],
  ['residential','Residential','remodel','Remodel','remodel','job-record',permitCompliance],
  ['residential','Residential','kitchen-remodel','Kitchen remodel','remodel','change-order',permitCompliance],
  ['residential','Residential','bathroom-remodel','Bathroom remodel','remodel','change-order',permitCompliance],
  ['residential','Residential','deck','Deck','general','permit',permitCompliance],
  ['residential','Residential','porch','Porch','general','permit',permitCompliance],
  ['residential','Residential','screen-porch','Screen porch','general','permit',permitCompliance],
  ['residential','Residential','garage','Garage','new-construction','permit',permitCompliance],
  ['residential','Residential','basement-finish','Basement finish','remodel','permit',permitCompliance],
  ['residential','Residential','outdoor-living-space','Outdoor living space','general','permit',permitCompliance],
  ['commercial','Commercial','commercial-interior-upfit','Commercial interior upfit','remodel','permit',permitCompliance],
  ['commercial','Commercial','commercial-remodel','Commercial remodel','remodel','permit',permitCompliance],
  ['commercial','Commercial','commercial-new-construction','Commercial new construction','new-construction','permit',permitCompliance],
  ['commercial','Commercial','office-buildout','Office buildout','remodel','permit',permitCompliance],
  ['commercial','Commercial','retail-buildout','Retail buildout','remodel','permit',permitCompliance],
  ['multi-family','Multi-family','apartment-building','Apartment building','new-construction','permit',permitCompliance],
  ['multi-family','Multi-family','townhome-building','Townhome building','new-construction','permit',permitCompliance],
  ['multi-family','Multi-family','condo-renovation','Condo renovation','remodel','permit',permitCompliance],
  ['trades','Trades','electrical','Electrical','trade-specific','permit',permitCompliance],
  ['trades','Trades','plumbing','Plumbing','trade-specific','permit',permitCompliance],
  ['trades','Trades','hvac','HVAC','trade-specific','permit',permitCompliance],
  ['trades','Trades','mechanical','Mechanical','trade-specific','permit',permitCompliance],
  ['trades','Trades','roofing','Roofing','trade-specific','permit',permitCompliance],
  ['exterior','Exterior','siding','Siding','trade-specific','permit',permitCompliance],
  ['exterior','Exterior','windows','Windows','trade-specific','job-record',permitCompliance],
  ['exterior','Exterior','doors','Doors','trade-specific','job-record',permitCompliance],
  ['exterior','Exterior','exterior-structures','Exterior structures','general','permit',permitCompliance],
];

export const projectTypeProfiles: ProjectTypeProfile[] = definitions.map(([category,categoryLabel,key,label,automationClass,defaultWorkflow,defaultComplianceKeys]) => ({
  category, categoryLabel, key, label, automationClass, defaultWorkflow, defaultComplianceKeys,
  permitRequirements: ['Confirm permit scope with the verified jurisdiction', `Review ${label.toLowerCase()} documents and forms`],
  inspectionRequirements: ['Confirm required inspections with the verified jurisdiction', `Prepare ${label.toLowerCase()} verification records`],
  closeoutRequirements: ['Confirm final jurisdiction sign-offs', `Assemble ${label.toLowerCase()} closeout documents and photos`],
}));

export const projectTypeMap = Object.fromEntries(projectTypeProfiles.map(profile => [profile.key, profile])) as Record<string, ProjectTypeProfile>;

export const projectTypeGroups = [...new Set(projectTypeProfiles.map(profile => profile.category))].map(category => ({
  key: category,
  label: projectTypeProfiles.find(profile => profile.category === category)!.categoryLabel,
  options: projectTypeProfiles.filter(profile => profile.category === category),
}));

export function getProjectTypeProfile(value: unknown) {
  return projectTypeMap[String(value || '').trim()] || null;
}

export function projectTypeLabel(value: unknown) {
  return getProjectTypeProfile(value)?.label || 'Needs classification';
}
