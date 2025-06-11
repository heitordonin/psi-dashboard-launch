
import type { WizardFormData } from './types';

const STEP_TITLES = [
  'Tipo de Cobrança',
  'Tipo de Pagamento',
  'Detalhes do Pagamento', 
  'Juros e Multa',
  'Dados do Pagador',
  'Resumo e Confirmação'
];

export function getTotalSteps() {
  // Always return 6 for consistent internal step calculation
  return 6;
}

export function getNextStep(currentStep: number, formData: WizardFormData) {
  const maxStep = 5; // 0-based indexing, so step 5 is the last step
  
  if (currentStep < maxStep) {
    let nextStepNumber = currentStep + 1;
    
    // Skip step 3 (Fees and Interest) for manual charges
    if (formData.chargeType === 'manual' && nextStepNumber === 3) {
      nextStepNumber = 4;
    }
    
    return nextStepNumber;
  }
  
  return currentStep;
}

export function getPreviousStep(currentStep: number, formData: WizardFormData, isEditMode: boolean) {
  const minStep = isEditMode ? 1 : 0; // In edit mode, can't go below step 1
  
  if (currentStep > minStep) {
    let prevStepNumber = currentStep - 1;
    
    // Skip step 3 (Fees and Interest) when going back for manual charges
    if (formData.chargeType === 'manual' && prevStepNumber === 3) {
      prevStepNumber = 2;
    }
    
    return prevStepNumber;
  }
  
  return currentStep;
}

export function getCurrentStepTitle(currentStep: number, formData: WizardFormData, isEditMode: boolean) {
  if (isEditMode) {
    // For edit mode, map steps to skip the charge type step
    const editStepTitles = [
      'Tipo de Pagamento',     // Step 1 (was Step 1)
      'Detalhes do Pagamento', // Step 2 (was Step 2)
      'Juros e Multa',         // Step 3 (was Step 3)
      'Dados do Pagador',      // Step 4 (was Step 4)
      'Resumo e Confirmação'   // Step 5 (was Step 5)
    ];
    
    if (formData.chargeType === 'manual') {
      // For manual charges in edit mode, also map around the skipped fees step
      const manualEditStepTitles = [
        'Tipo de Pagamento',     // Step 1
        'Detalhes do Pagamento', // Step 2
        'Dados do Pagador',      // Step 4 (mapped)
        'Resumo e Confirmação'   // Step 5 (mapped)
      ];
      
      if (currentStep === 1) return manualEditStepTitles[0];
      if (currentStep === 2) return manualEditStepTitles[1];
      if (currentStep === 4) return manualEditStepTitles[2];
      if (currentStep === 5) return manualEditStepTitles[3];
    }
    
    return editStepTitles[currentStep - 1] || 'Etapa';
  }
  
  // For create mode, use the original logic
  if (formData.chargeType === 'manual') {
    // For manual charges, map the actual step numbers to appropriate titles
    const manualStepTitles = [
      'Tipo de Cobrança',      // Step 0
      'Tipo de Pagamento',     // Step 1
      'Detalhes do Pagamento', // Step 2
      'Dados do Pagador',      // Step 4 (mapped)
      'Resumo e Confirmação'   // Step 5 (mapped)
    ];
    
    if (currentStep === 0) return manualStepTitles[0];
    if (currentStep === 1) return manualStepTitles[1];
    if (currentStep === 2) return manualStepTitles[2];
    if (currentStep === 4) return manualStepTitles[3];
    if (currentStep === 5) return manualStepTitles[4];
  }
  
  return STEP_TITLES[currentStep] || 'Etapa';
}

export function getDisplayStepNumber(currentStep: number, formData: WizardFormData, isEditMode: boolean) {
  if (isEditMode) {
    // In edit mode, show steps as 1-5 instead of 1-6
    if (formData.chargeType === 'manual') {
      // For manual charges, adjust for skipped fees step
      if (currentStep === 1) return 1;
      if (currentStep === 2) return 2;
      if (currentStep === 4) return 3;
      if (currentStep === 5) return 4;
    }
    return currentStep; // For link charges, just use the current step
  }
  
  // For create mode, use the original logic
  return currentStep + 1;
}

export function getDisplayTotalSteps(formData: WizardFormData, isEditMode: boolean) {
  if (isEditMode) {
    if (formData.chargeType === 'manual') {
      return 4; // Manual charges skip the fees step in edit mode
    }
    return 5; // Edit mode skips the charge type step
  }
  
  if (formData.chargeType === 'manual') {
    return 5; // Manual charges skip the fees step
  }
  
  return 6; // All steps for link charges in create mode
}
