// Especialidades oficiais dos barbeiros — fonte única de verdade
// Usada pelo Select de especialidade para evitar texto livre e duplicatas.

export const SPECIALTIES = [
  { value: 'corte_masculino', label: 'Corte Masculino' },
  { value: 'barba', label: 'Barba' },
  { value: 'corte_e_barba', label: 'Corte e Barba' },
  { value: 'sobrancelha', label: 'Sobrancelha' },
  { value: 'corte_infantil', label: 'Corte Infantil' },
  { value: 'coloracao', label: 'Coloração' },
  { value: 'alisamento', label: 'Alisamento' },
  { value: 'tratamento_capilar', label: 'Tratamento Capilar' },
  { value: 'design_barba', label: 'Design de Barba' },
  { value: 'corte_feminino', label: 'Corte Feminino' },
] as const;

export const getSpecialtyLabel = (value: string) => {
  return SPECIALTIES.find(s => s.value === value)?.label || value;
};
