import { useSidebar } from '../contexts/SidebarContext';

interface UseMainContentLayoutProps {
  showWelcome: boolean;
  activeTab?: string;
}

export const useMainContentLayout = ({ showWelcome, activeTab }: UseMainContentLayoutProps) => {
  const { handleContentMouseEnter, handleContentMouseLeave } = useSidebar();

  return {
    getMainContentClasses: () => `flex flex-col min-w-0 overflow-hidden w-full`,
    handleContentMouseEnter,
    handleContentMouseLeave
  };
};
