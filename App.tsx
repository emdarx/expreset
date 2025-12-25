import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { Welcome } from './components/Welcome';
import { ServiceSelection } from './components/ServiceSelection';
import { PlanSelection } from './components/PlanSelection';
import { ContactMethod } from './components/ContactMethod';
import { Payment } from './components/Payment';
import { FreeTest } from './components/FreeTest';
import { AppState, Plan, Step, VpnServiceType } from './types';
import { ChevronRight } from 'lucide-react';

function App() {
  const [state, setState] = useState<AppState>({
    currentStep: 'welcome',
    selectedService: null,
    selectedPlan: null,
    contactInfo: '',
    contactType: 'email',
    finalPriceRial: null,
    selectedCardIndex: null,
  });

  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  // Detect Instagram WebView on mount
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (ua && ua.indexOf("Instagram") > -1) {
      setState(prev => ({ ...prev, contactType: 'instagram' }));
    }
  }, []);

  const goBack = () => {
    setDirection('back');
    let prevStep: Step | null = null;
    
    if (state.currentStep === 'payment') prevStep = 'contact-method';
    else if (state.currentStep === 'contact-method') prevStep = 'plan-selection';
    else if (state.currentStep === 'plan-selection') prevStep = 'service-selection';
    else if (state.currentStep === 'service-selection') prevStep = 'welcome';
    else if (state.currentStep === 'free-test') prevStep = 'welcome';

    if (prevStep) {
        setState(prev => ({
            ...prev,
            currentStep: prevStep!,
            selectedPlan: prevStep === 'service-selection' ? null : prev.selectedPlan,
            selectedService: prevStep === 'welcome' ? null : prev.selectedService
        }));
    }
  };

  const goTo = (step: Step) => {
      setDirection('forward');
      setState(prev => ({ ...prev, currentStep: step }));
  };

  const resetApp = () => {
    setDirection('back');
    setState(prev => ({
        currentStep: 'welcome',
        selectedService: null,
        selectedPlan: null,
        contactInfo: '',
        contactType: prev.contactType, // Keep the detected contact type
        finalPriceRial: null,
        selectedCardIndex: null,
    }));
  };

  const renderContent = () => {
    switch (state.currentStep) {
      case 'welcome':
        return (
          <Welcome 
            onStart={() => goTo('service-selection')} 
            onTestStart={() => goTo('free-test')}
          />
        );
      case 'free-test':
        return (
          <FreeTest 
            onBack={resetApp}
          />
        );
      case 'service-selection':
        return (
          <ServiceSelection 
            selected={state.selectedService}
            onSelect={(type) => setState(prev => ({ ...prev, selectedService: type }))}
            onNext={() => goTo('plan-selection')}
          />
        );
      case 'plan-selection':
        return (
          <PlanSelection 
            serviceType={state.selectedService}
            selectedPlan={state.selectedPlan}
            onSelectPlan={(plan) => setState(prev => ({ ...prev, selectedPlan: plan, finalPriceRial: null }))}
            onNext={() => goTo('contact-method')}
          />
        );
      case 'contact-method':
        return (
          <ContactMethod
            contactType={state.contactType}
            contactInfo={state.contactInfo}
            onTypeChange={(type) => setState(prev => ({ ...prev, contactType: type, contactInfo: '' }))}
            onInfoChange={(info) => setState(prev => ({ ...prev, contactInfo: info }))}
            onNext={() => goTo('payment')}
          />
        );
      case 'payment':
        return (
          <Payment 
            plan={state.selectedPlan}
            service={state.selectedService}
            finalPriceRial={state.finalPriceRial}
            setFinalPriceRial={(price) => setState(prev => ({...prev, finalPriceRial: price}))}
            selectedCardIndex={state.selectedCardIndex}
            setSelectedCardIndex={(index) => setState(prev => ({...prev, selectedCardIndex: index}))}
            contactInfo={state.contactInfo}
            contactType={state.contactType}
            onReturnToHome={resetApp}
          />
        )
      default:
        return null;
    }
  };

  return (
    <Layout>
      {/* Header Navigation */}
      <div className="pt-4 px-4 flex items-center justify-between z-50 h-14">
        {state.currentStep !== 'welcome' && state.currentStep !== 'free-test' && (
          <button 
            onClick={goBack}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-md border border-white/5 shadow-lg active:scale-95"
          >
            <ChevronRight size={24} />
          </button>
        )}
        <div className="flex-1"></div> {/* Spacer */}
      </div>

      {/* Progress Timeline - Hide on free-test */}
      {state.currentStep !== 'free-test' && <StepIndicator currentStep={state.currentStep} />}

      {/* Main Content Area with Animation */}
      <div className="flex-1 relative z-20 overflow-hidden">
        <div key={state.currentStep} className={`h-full w-full ${direction === 'forward' ? 'anim-forward' : 'anim-back'}`}>
            {renderContent()}
        </div>
      </div>
    </Layout>
  );
}

export default App;