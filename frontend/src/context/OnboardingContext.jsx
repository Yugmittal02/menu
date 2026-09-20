import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TOUR_MODULES, WORKFLOW_DEMO_SCENARIOS } from '../components/onboarding/tourStepsConfig';
import { getMyOnboarding, updateMyOnboarding } from '../services/api';

const OnboardingContext = createContext(null);

export const OnboardingProvider = ({
  children,
  cafe,
  activeTab,
  onTabChange,
  activeStaff,
  menu = [],
  orders = [],
  sessions = [],
  inventoryData = {},
  staff = [],
  coupons = [],
  stats = {},
  onRefreshData
}) => {
  // Phase: 'idle' | 'welcome' | 'essential_setup' | 'guided_tour' | 'workflow_demo' | 'final_review' | 'completed' | 'skipped'
  const [phase, setPhase] = useState('idle');
  const [tourMode, setTourMode] = useState('deep'); // 'deep' | 'overview'
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [completedModules, setCompletedModules] = useState([]);
  const [skippedModules, setSkippedModules] = useState([]);
  const [completedSetupSteps, setCompletedSetupSteps] = useState([]);
  const [skippedSetupSteps, setSkippedSetupSteps] = useState([]);
  const [isWelcomeBannerOpen, setIsWelcomeBannerOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCustomerPreviewOpen, setIsCustomerPreviewOpen] = useState(false);
  const [activeDemoScenario, setActiveDemoScenario] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [targetElement, setTargetElement] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [skipConfirmationOpen, setSkipConfirmationOpen] = useState(false);

  const saveTimeoutRef = useRef(null);

  // Compute active role from activeStaff or default to 'owner'
  const currentRole = useMemo(() => {
    if (activeStaff?.role) {
      return String(activeStaff.role).toLowerCase();
    }
    return 'owner';
  }, [activeStaff]);

  // Filter tour modules based on role authorization
  const authorizedModules = useMemo(() => {
    return TOUR_MODULES.filter((mod) => {
      if (!mod.roles || mod.roles.length === 0) return true;
      if (currentRole === 'owner') return true;
      return mod.roles.includes(currentRole);
    });
  }, [currentRole]);

  const currentModule = authorizedModules[currentModuleIndex] || authorizedModules[0];

  // Server sync helper (debounced)
  const persistOnboarding = useCallback((updates) => {
    if (!cafe?._id && !cafe?.cafeId) return;
    const cafeKey = cafe.cafeId || cafe._id;

    // Cache immediately in localStorage
    try {
      const cached = localStorage.getItem(`onboarding_${cafeKey}`);
      const parsed = cached ? JSON.parse(cached) : {};
      localStorage.setItem(`onboarding_${cafeKey}`, JSON.stringify({ ...parsed, ...updates }));
    } catch (e) {
      console.warn('Storage sync warn:', e);
    }

    // Debounce server call
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateMyOnboarding(updates);
      } catch (err) {
        console.warn('Backend onboarding persist fallback:', err?.message);
      }
    }, 400);
  }, [cafe]);

  // Initialize onboarding state on cafe load
  useEffect(() => {
    if (!cafe || isInitialized) return;

    const init = async () => {
      try {
        let serverOnboarding = cafe.onboarding;
        if (!serverOnboarding) {
          try {
            const res = await getMyOnboarding();
            serverOnboarding = res.data?.onboarding;
          } catch (e) {
            // fallback
          }
        }

        const cafeKey = cafe.cafeId || cafe._id;
        let localData = {};
        try {
          const raw = localStorage.getItem(`onboarding_${cafeKey}`);
          if (raw) localData = JSON.parse(raw);
        } catch (e) {}

        const ob = {
          ...(serverOnboarding || {}),
          ...localData
        };

        const isDone = ob.onboarding_completed || ob.tour_completed;
        const isSkipped = ob.onboarding_skipped;
        const bannerSeen = ob.welcome_banner_seen;

        if (ob.completed_tour_modules) setCompletedModules(ob.completed_tour_modules);
        if (ob.skipped_tour_modules) setSkippedModules(ob.skipped_tour_modules);
        if (ob.completed_setup_steps) setCompletedSetupSteps(ob.completed_setup_steps);
        if (ob.skipped_setup_steps) setSkippedSetupSteps(ob.skipped_setup_steps);

        // First-time trigger condition:
        // Trigger if onboarding not completed and not skipped
        if (!isDone && !isSkipped) {
          // If was already in middle of tour, resume from current_tour_module
          if (ob.onboarding_started && ob.current_tour_module) {
            const modIdx = authorizedModules.findIndex(m => m.id === ob.current_tour_module);
            setCurrentModuleIndex(modIdx >= 0 ? modIdx : 0);
            setPhase(ob.current_setup_step !== undefined && ob.current_setup_step < 6 ? 'essential_setup' : 'guided_tour');
          } else {
            // Fresh user: Show Phase 1 Welcome Modal
            setPhase('welcome');
          }
        } else {
          setPhase('idle');
          if (isDone && !bannerSeen) {
            setIsWelcomeBannerOpen(true);
          }
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('Onboarding init error:', err);
        setIsInitialized(true);
      }
    };

    init();
  }, [cafe, isInitialized, authorizedModules]);

  // Phase transitions
  const startGuidedTour = useCallback(() => {
    setPhase('essential_setup');
    persistOnboarding({
      onboarding_started: true,
      current_setup_step: 0
    });
  }, [persistOnboarding]);

  const finishEssentialSetup = useCallback(() => {
    setPhase('guided_tour');
    setCurrentModuleIndex(0);
    persistOnboarding({
      current_tour_module: authorizedModules[0]?.id || 'overview',
      current_tour_step: 0
    });
  }, [authorizedModules, persistOnboarding]);

  const skipTour = useCallback((confirmed = false) => {
    if (!confirmed) {
      setSkipConfirmationOpen(true);
      return;
    }
    setSkipConfirmationOpen(false);
    setPhase('idle');
    setIsWelcomeBannerOpen(true);
    persistOnboarding({
      onboarding_skipped: true,
      onboarding_started: true
    });
  }, [persistOnboarding]);

  const nextStep = useCallback(() => {
    if (currentModuleIndex < authorizedModules.length - 1) {
      const nextIdx = currentModuleIndex + 1;
      const nextMod = authorizedModules[nextIdx];
      setCurrentModuleIndex(nextIdx);
      setCompletedModules((prev) => {
        const set = new Set([...prev, currentModule.id]);
        const updated = Array.from(set);
        persistOnboarding({
          current_tour_module: nextMod.id,
          current_tour_step: nextIdx,
          completed_tour_modules: updated
        });
        return updated;
      });
    } else {
      // Completed all 24 modules -> go to Workflow Demonstrations
      setPhase('workflow_demo');
      setActiveDemoScenario('endToEnd');
      persistOnboarding({
        completed_tour_modules: Array.from(new Set([...completedModules, currentModule.id])),
        tour_completed: true
      });
    }
  }, [currentModuleIndex, authorizedModules, currentModule, completedModules, persistOnboarding]);

  const prevStep = useCallback(() => {
    if (currentModuleIndex > 0) {
      const prevIdx = currentModuleIndex - 1;
      setCurrentModuleIndex(prevIdx);
      persistOnboarding({
        current_tour_module: authorizedModules[prevIdx].id,
        current_tour_step: prevIdx
      });
    }
  }, [currentModuleIndex, authorizedModules, persistOnboarding]);

  const skipModule = useCallback(() => {
    setSkippedModules((prev) => {
      const updated = Array.from(new Set([...prev, currentModule.id]));
      persistOnboarding({ skipped_tour_modules: updated });
      return updated;
    });
    nextStep();
  }, [currentModule, nextStep, persistOnboarding]);

  const startModuleTour = useCallback((moduleId) => {
    const idx = authorizedModules.findIndex((m) => m.id === moduleId);
    if (idx !== -1) {
      setCurrentModuleIndex(idx);
      setPhase('guided_tour');
      setIsHelpModalOpen(false);
    }
  }, [authorizedModules]);

  const restartFullTour = useCallback(() => {
    setCurrentModuleIndex(0);
    setPhase('welcome');
    setIsHelpModalOpen(false);
    persistOnboarding({
      onboarding_completed: false,
      onboarding_skipped: false,
      onboarding_started: true,
      current_tour_module: authorizedModules[0]?.id || 'overview',
      current_tour_step: 0
    });
  }, [authorizedModules, persistOnboarding]);

  const openWorkflowDemo = useCallback((scenarioKey = 'endToEnd') => {
    setActiveDemoScenario(scenarioKey);
    setPhase('workflow_demo');
    setIsHelpModalOpen(false);
  }, []);

  const closeWorkflowDemo = useCallback(() => {
    setActiveDemoScenario(null);
    setPhase('final_review');
  }, []);

  const completeFinalReview = useCallback(() => {
    setPhase('idle');
    setIsWelcomeBannerOpen(true);
    persistOnboarding({
      onboarding_completed: true,
      tour_completed: true,
      welcome_banner_seen: false
    });
  }, [persistOnboarding]);

  const dismissWelcomeBanner = useCallback(() => {
    setIsWelcomeBannerOpen(false);
    persistOnboarding({
      welcome_banner_seen: true,
      welcome_banner_dismissed_at: new Date().toISOString()
    });
  }, [persistOnboarding]);

  // Spotlight element targeting & bounding rect tracking
  useEffect(() => {
    if (phase !== 'guided_tour' || !currentModule) {
      setTargetRect(null);
      setTargetElement(null);
      return;
    }

    // Auto-switch dashboard tab if needed
    if (currentModule.tab && activeTab !== currentModule.tab && onTabChange) {
      onTabChange(currentModule.tab);
    }

    let isMounted = true;

    const measureTarget = () => {
      if (!isMounted) return;
      const targetSelector = currentModule.target;
      const fallbackSelector = currentModule.fallbackTarget;

      let el = document.querySelector(targetSelector);
      if (!el && fallbackSelector) {
        el = document.querySelector(fallbackSelector);
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        // Only update if visible
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height,
            viewportTop: rect.top,
            viewportLeft: rect.left
          });
          setTargetElement(el);

          // Smoothly scroll into view if offscreen
          if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }
      }

      // Fallback if element not found in DOM yet
      setTargetRect(null);
      setTargetElement(null);
    };

    // Run measurement with slight delay to allow tab DOM rendering
    const timer1 = setTimeout(measureTarget, 80);
    const timer2 = setTimeout(measureTarget, 300);

    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget);

    return () => {
      isMounted = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget);
    };
  }, [phase, currentModule, activeTab, onTabChange]);

  // Keyboard navigation
  useEffect(() => {
    if (phase !== 'guided_tour') return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStep();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        skipTour();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, nextStep, prevStep, skipTour]);

  // Evaluate smart context for current step
  const currentSmartState = useMemo(() => {
    if (!currentModule || !currentModule.smartCheck) return { configured: false };
    try {
      return currentModule.smartCheck({
        cafe,
        menu,
        orders,
        sessions,
        inventoryData,
        staff,
        coupons,
        stats
      });
    } catch {
      return { configured: false };
    }
  }, [currentModule, cafe, menu, orders, sessions, inventoryData, staff, coupons, stats]);

  const value = {
    phase,
    setPhase,
    tourMode,
    setTourMode,
    currentModule,
    currentModuleIndex,
    totalModules: authorizedModules.length,
    authorizedModules,
    completedModules,
    skippedModules,
    completedSetupSteps,
    setCompletedSetupSteps,
    skippedSetupSteps,
    setSkippedSetupSteps,
    targetRect,
    targetElement,
    currentSmartState,
    isWelcomeBannerOpen,
    isHelpModalOpen,
    setIsHelpModalOpen,
    isCustomerPreviewOpen,
    setIsCustomerPreviewOpen,
    activeDemoScenario,
    skipConfirmationOpen,
    setSkipConfirmationOpen,
    // Actions
    startGuidedTour,
    finishEssentialSetup,
    skipTour,
    nextStep,
    prevStep,
    skipModule,
    startModuleTour,
    restartFullTour,
    openWorkflowDemo,
    closeWorkflowDemo,
    completeFinalReview,
    dismissWelcomeBanner,
    persistOnboarding
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
