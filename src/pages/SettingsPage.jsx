import React, { useState } from 'react';
import AppSettings from '../components/settings/AppSettings';
import ApiSettings from '../components/settings/ApiSettings';
import LMStudioSettings from '../components/settings/LMStudioSettings';
import PerformanceSettings from '../components/settings/PerformanceSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import SettingsHeader from '../components/settings/SettingsHeader';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import { AnimatePresence, ScaleIn } from '../components/Common/LightweightMotion';

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState('api');

  const renderContent = () => {
    switch (activeSection) {
      case 'api':
        return <ApiSettings />;
      case 'app':
        return <AppSettings />;
      case 'performance':
        return <PerformanceSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'lmstudio':
        return <LMStudioSettings />;
      default:
        return <ApiSettings />;
    }
  };

  return (
    <div className="flex min-h-screen">
      <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1">
        <SettingsHeader />
        <div className="p-6">
          <AnimatePresence>
            <ScaleIn>
              {renderContent()}
            </ScaleIn>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
