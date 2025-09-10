import { useSidebarLayout } from './useSidebarLayout';

interface UseMainContentLayoutProps {
  showWelcome: boolean;
  activeTab?: string;
}

export const useMainContentLayout = ({ showWelcome, activeTab }: UseMainContentLayoutProps) => {
  const {
    mainSidebarExpanded,
    auxiliarySidebarExpanded,
    hasAuxiliarySidebar,
    handleContentMouseEnter,
    handleContentMouseLeave,
    getMainContentMargin
  } = useSidebarLayout({ showWelcome, activeTab });

  return {
    getMainContentClasses: () => `flex flex-col min-w-0 overflow-hidden w-full`,
    handleContentMouseEnter,
    handleContentMouseLeave
  };
};
