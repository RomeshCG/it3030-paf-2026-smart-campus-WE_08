export const ResourceTypes = {
  LAB: 'LAB',
  HALL: 'HALL',
  EQUIPMENT: 'EQUIPMENT',
  STUDIO: 'STUDIO',
  OFFICE: 'OFFICE',
  CAFE: 'CAFE',
  STUDY_ZONE: 'STUDY_ZONE'
};

export const ResourceStatuses = {
  ACTIVE: 'ACTIVE',
  OUT_OF_SERVICE: 'OUT_OF_SERVICE'
};

export const formatResourceTypeLabel = (type) =>
  String(type || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const getResourceCapacity = (resource) => Number(resource?.maxCapacity ?? resource?.capacity ?? 0);
